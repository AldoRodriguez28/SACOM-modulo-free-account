import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { take, timeout } from 'rxjs';
import { Business, BusinessAddress, BusinessStatus } from '../../../../domain/business/business.entity';
import { BusinessStore, StatusTransitionResult } from '../../business/business.store';
import { Metrics } from '../../../../core/models/metrics.model';
import { BcmEmbedService, BcmBusinessRegisteredPayload, RegisterBusinessRequest } from '../../../../core/services/bcm-embed.service';
import { environment } from '../../../../../environments/environment';

export type DrawerMode = 'detail' | 'edit' | 'add';

type ConfirmAction = 'unpublish' | 'publish' | 'delete' | null;

@Component({
  selector: 'app-business-drawer',
  standalone: false,
  templateUrl: './business-drawer.html',
  styleUrl: './business-drawer.scss'
})
export class BusinessDrawer implements OnChanges, OnInit, OnDestroy {
  private readonly bcmEditFallbackUrl =
    'https://bcm-test.seccionamarilla.com/alta-negocio/4605D59C34344365E060220A55074374';
  private readonly bcmRequestTimeoutMs = 15000;
  private readonly bcmAllowedHostnames = environment.BCM_ALLOWED_HOSTNAMES;
  private bcmRequestId = 0;
  private readonly destroyRef = inject(DestroyRef);
  private readonly bcmEmbedService = inject(BcmEmbedService);
  private bcmMessageHandler: ((event: MessageEvent) => void) | null = null;

  @Input() mode: DrawerMode = 'detail';
  @Input() business: Business | null = null;
  @Input() metrics: Metrics | null = null;
  @Output() closed   = new EventEmitter<void>();
  @Output() saved    = new EventEmitter<Business>();
  @Output() deleted  = new EventEmitter<string>();
  @Output() statusChanged = new EventEmitter<Business>();
  @Output() bcmBusinessRegistered = new EventEmitter<Business>();

  internalMode: DrawerMode = 'detail';
  form!: FormGroup;
  logoPreview = '';
  currentStep = 1;
  closing = false;

  // Confirmaciones
  confirmAction: ConfirmAction = null;
  confirmMessage = '';

  // Feedback de acciones
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  bcmIframeUrl: SafeResourceUrl | null = null;
  bcmIframeRawUrl: string | null = null;
  bcmIframeLoading = false;
  bcmIframeError = '';

  // Mapa
  mapCenter: google.maps.LatLngLiteral = { lat: 19.4195, lng: -99.1674 };
  markerPosition: google.maps.LatLngLiteral = { lat: 19.4195, lng: -99.1674 };
  zoom = 14;
  mapOptions: google.maps.MapOptions = { clickableIcons: false };

  private readonly stepFields: Record<number, string[]> = {
    1: ['contactName', 'contactEmail', 'contactPhone', 'category'],
    2: ['businessName', 'publicPhone', 'products'],
    3: []
  };

  // ─── Getters ──────────────────────────────────────────────────────────────

  get currentStatus(): BusinessStatus | null {
    return this.business?.status ?? null;
  }

  get hasDraft(): boolean {
    return !!this.business?.draft;
  }

  get totalClicks(): number {
    return this.metrics?.last30Days.reduce((s, d) => s + d.clicks, 0) ?? 0;
  }

  get totalImpressions(): number {
    return this.metrics?.last30Days.reduce((s, d) => s + d.impressions, 0) ?? 0;
  }

  get ctr(): string {
    const t = this.totalImpressions;
    return t ? ((this.totalClicks / t) * 100).toFixed(1) + '%' : '0%';
  }

  get currentStepInvalid(): boolean {
    if (!this.form) return false;
    return this.stepFields[this.currentStep]?.some(f => this.form.get(f)?.invalid) ?? false;
  }

  get statusLabel(): string {
    const map: Record<BusinessStatus, string> = {
      published: 'Publicado', unpublished: 'No publicado', in_progress: 'En progreso'
    };
    return this.currentStatus ? map[this.currentStatus] : '';
  }

  get statusClass(): string {
    const map: Record<BusinessStatus, string> = {
      published: 'status--published', unpublished: 'status--unpublished', in_progress: 'status--progress'
    };
    return this.currentStatus ? map[this.currentStatus] : '';
  }

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessStore,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.bcmMessageHandler = (event: MessageEvent) => this.handleBcmMessage(event);
    window.addEventListener('message', this.bcmMessageHandler);
  }

  ngOnDestroy(): void {
    if (this.bcmMessageHandler) {
      window.removeEventListener('message', this.bcmMessageHandler);
      this.bcmMessageHandler = null;
    }
  }

  private handleBcmMessage(event: MessageEvent): void {
    const data = event.data;

    // BCM puede enviar el payload directamente o envuelto en { payload: {...} }
    const payload: BcmBusinessRegisteredPayload | undefined =
      data?.type === 'bcm:business-registered' ? data :
      data?.payload?.type === 'bcm:business-registered' ? data.payload :
      undefined;

    if (!payload) return;

    console.log('[BCM] PostMessage recibido:', payload);

    const request: RegisterBusinessRequest = {
      businessName: payload.commercialName,
      categoryName: payload.categoryName ?? '',
      population: payload.townName ?? '',
      publicUrl: '',
      bcmBusinessId: payload.businessId,
      bcmBusinessVersionNumber: payload.versionNumber
    };

    this.ngZone.run(() => {
      this.bcmEmbedService.registerBusiness(request).pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response) => {
          console.log('[BCM] Negocio registrado en backend:', response);
          this.cdr.markForCheck();
          this.bcmBusinessRegistered.emit(response as unknown as Business);
        },
        error: (err) => {
          console.error('[BCM] Error al registrar negocio en backend:', err);
          this.showToast('Error al registrar el negocio. Intenta nuevamente.', 'error');
          this.cdr.markForCheck();
        }
      });
    });
  }

  ngOnChanges(changes?: SimpleChanges): void {
    console.log('[BCM] ngOnChanges', {
      mode: this.mode,
      changedInputs: Object.keys(changes ?? {})
    });

    // Ignore metrics-only updates to avoid re-triggering BCM token generation.
    const shouldReinitialize = !changes || !!changes['mode'] || !!changes['business'];
    if (!shouldReinitialize) {
      console.log('[BCM] Ignorando cambio sin mode/business.');
      return;
    }

    this.internalMode = this.mode;
    this.closing = false;
    this.confirmAction = null;
    this.toastMessage = '';
    this.bcmIframeUrl = null;
    this.bcmIframeRawUrl = null;
    this.bcmIframeError = '';
    this.bcmIframeLoading = false;
    this.bcmRequestId++;
    this.cdr.markForCheck();

    if (this.mode === 'edit' && this.business) {
      this.buildForm();
      // Si hay draft, editar desde el draft para no perder avance
      const src = this.business.draft ?? this.business;
      this.logoPreview = src.logoUrl;
      this.mapCenter = { lat: src.address.lat, lng: src.address.lng };
      this.markerPosition = { ...this.mapCenter };
    }
    if (this.mode === 'add') {
      this.buildForm();
      this.currentStep = 1;
      this.logoPreview = '';
    }

    if (this.mode === 'add') {
      this.loadBcmIframeForAdd();
    }

    if (this.mode === 'edit') {
      this.setBcmIframeUrl(this.bcmEditFallbackUrl);
    }
  }

  private loadBcmIframeForAdd(): void {
    const requestId = ++this.bcmRequestId;
    this.bcmIframeLoading = true;
    this.bcmIframeError = '';
    this.bcmIframeUrl = null;
    this.bcmIframeRawUrl = null;
    this.cdr.markForCheck();
    console.log('[BCM] Solicitando token ADD...');

    this.bcmEmbedService.generateAddToken().pipe(
      take(1),
      timeout(this.bcmRequestTimeoutMs),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        this.ngZone.run(() => {
          if (!this.isCurrentAddRequest(requestId)) {
            return;
          }

          console.log('[BCM] Respuesta ADD token:', response);
          const embedUrl = response?.embedUrl
            ?? (response as unknown as { data?: { embedUrl?: string } })?.data?.embedUrl
            ?? (response as unknown as { result?: { embedUrl?: string } })?.result?.embedUrl;

          if (!embedUrl || !this.isAllowedBcmUrl(embedUrl)) {
            this.bcmIframeError = 'BCM no devolvio una URL valida para el iframe.';
            this.bcmIframeLoading = false;
            this.showToast(this.bcmIframeError, 'error');
            this.cdr.markForCheck();
            return;
          }

          this.setBcmIframeUrl(embedUrl);
          this.bcmIframeLoading = false;
          this.cdr.markForCheck();
          console.log('[BCM] Fin de solicitud ADD. loading=false');
        });
      },
      error: err => {
        this.ngZone.run(() => {
          if (!this.isCurrentAddRequest(requestId)) {
            return;
          }

          console.error('[BCM] Error generando token ADD:', err);
          const isTimeout = err?.name === 'TimeoutError';
          this.bcmIframeError = isTimeout
            ? 'Tiempo de espera agotado al generar acceso BCM. Intenta nuevamente.'
            : 'No fue posible generar el acceso BCM para alta de negocio.';
          this.bcmIframeLoading = false;
          this.showToast(this.bcmIframeError, 'error');
          this.cdr.markForCheck();
          console.log('[BCM] Fin de solicitud ADD. loading=false');
        });
      }
    });
  }

  private setBcmIframeUrl(url: string): void {
    console.log('[BCM] Asignando iframe URL:', url);
    this.bcmIframeRawUrl = url;
    this.bcmIframeError = '';
    this.bcmIframeLoading = false;
    this.bcmIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.cdr.markForCheck();
  }

  onBcmIframeLoad(): void {
    this.bcmIframeError = '';
    this.cdr.markForCheck();
    console.log('[BCM] Iframe cargo correctamente.');
  }

  onBcmIframeError(event: Event): void {
    this.bcmIframeError = 'No se pudo cargar BCM dentro del panel. Intenta abrirlo en una nueva pestaña.';
    this.cdr.markForCheck();
    console.error('[BCM] Error al cargar iframe:', event);
  }

  openBcmInNewTab(): void {
    if (!this.bcmIframeRawUrl) return;
    window.open(this.bcmIframeRawUrl, '_blank', 'noopener,noreferrer');
  }

  private isCurrentAddRequest(requestId: number): boolean {
    return this.mode === 'add' && this.internalMode === 'add' && requestId === this.bcmRequestId;
  }

  private isAllowedBcmUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      return this.bcmAllowedHostnames.includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  private buildForm(): void {
    // Para negocios publicados, editar desde draft si existe
    const b = (this.business?.draft && this.internalMode === 'edit')
      ? { ...this.business, ...this.business.draft }
      : this.business;

    this.form = this.fb.group({
      contactName:    [b?.contactName           ?? '', Validators.required],
      contactEmail:   [b?.contactEmail          ?? '', [Validators.required, Validators.email]],
      contactPhone:   [b?.contactPhone          ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      businessName:   [b?.businessName          ?? '', Validators.required],
      category:       [b?.category              ?? '', Validators.required],
      website:        [b?.website               ?? ''],
      publicPhone:    [b?.publicPhone           ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      products:       [b?.products              ?? '', Validators.required],
      fullAddress:    [b?.address?.fullAddress  ?? ''],
      street:         [b?.address?.street       ?? ''],
      exteriorNumber: [b?.address?.exteriorNumber ?? ''],
      colony:         [b?.address?.colony       ?? ''],
      postalCode:     [b?.address?.postalCode   ?? ''],
      city:           [b?.address?.city         ?? ''],
      state:          [b?.address?.state        ?? ''],
      lat:            [b?.address?.lat          ?? 19.4195],
      lng:            [b?.address?.lng          ?? -99.1674],
      allDay:         [b?.hours?.allDay         ?? false],
      wdOpen:         [b?.hours?.weekdays?.open ?? ''],
      wdClose:        [b?.hours?.weekdays?.close ?? ''],
      satOpen:        [b?.hours?.saturday?.open ?? ''],
      satClose:       [b?.hours?.saturday?.close ?? ''],
      sunOpen:        [b?.hours?.sunday?.open   ?? ''],
      sunClose:       [b?.hours?.sunday?.close  ?? '']
    });
  }

  // ─── Cierre con animación ─────────────────────────────────────────────────

  requestClose(): void {
    if (this.confirmAction) { this.confirmAction = null; return; }
    this.closing = true;
    setTimeout(() => this.closed.emit(), 220);
  }

  // ─── Navegación de modo ───────────────────────────────────────────────────

  switchToEdit(): void {
    this.internalMode = 'edit';
    this.buildForm();
    if (this.business) {
      const src = this.business.draft ?? this.business;
      this.logoPreview = src.logoUrl;
      this.mapCenter = { lat: src.address.lat, lng: src.address.lng };
      this.markerPosition = { ...this.mapCenter };
    }
  }

  switchToDetail(): void { this.internalMode = 'detail'; }

  // ─── Guardar avance ───────────────────────────────────────────────────────

  onSaveProgress(): void {
    if (!this.business || !this.form) return;
    const data = this.buildDataFromForm();
    this.businessService.saveProgress(this.business.id, data).subscribe(b => {
      this.showToast('Tu avance fue guardado. Puedes continuar editando desde Mis Negocios.', 'success');
      this.statusChanged.emit(b);
    });
  }

  // ─── Finalizar ────────────────────────────────────────────────────────────

  onFinalize(): void {
    if (!this.business || !this.form) return;
    // Primero guardar los datos actuales del form
    const data = this.buildDataFromForm();
    this.businessService.saveProgress(this.business.id, data).subscribe(() => {
      this.businessService.finalize(this.business!.id).subscribe((result: StatusTransitionResult) => {
        if (result.success) {
          this.showToast(result.message, result.status === 'unpublished' ? 'warning' : 'success');
          // Recargar negocio actualizado
          const updated = this.businessService.getBusinessById(this.business!.id);
          if (updated) {
            this.saved.emit(updated);
          }
        } else {
          this.showToast(result.message, 'error');
        }
      });
    });
  }

  // ─── Acciones desde modo ADD ──────────────────────────────────────────────

  onSave(): void {
    if (!this.form || this.form.invalid) return;
    const v = this.form.value;
    const data = this.buildDataFromForm();

    if (this.internalMode === 'edit' && this.business) {
      this.businessService.updateBusiness(this.business.id, data).subscribe(b => this.saved.emit(b));
    } else {
      this.businessService.addBusiness({
        contactName: v.contactName, contactEmail: v.contactEmail, contactPhone: v.contactPhone,
        businessName: v.businessName, category: v.category, website: v.website,
        publicPhone: v.publicPhone, products: v.products, logoUrl: this.logoPreview,
        categoryCode: this.business?.categoryCode ?? 0,
        address: {
          fullAddress: v.fullAddress, street: v.street, exteriorNumber: v.exteriorNumber,
          colony: v.colony, postalCode: v.postalCode, city: v.city, state: v.state,
          lat: v.lat, lng: v.lng
        },
        hours: {
          allDay: v.allDay,
          weekdays: v.allDay ? null : { open: v.wdOpen, close: v.wdClose },
          saturday: v.allDay ? null : { open: v.satOpen, close: v.satClose },
          sunday:   v.allDay ? null : { open: v.sunOpen, close: v.sunClose }
        }
      }).subscribe(b => this.saved.emit(b));
    }
  }

  private buildDataFromForm() {
    const v = this.form.value;
    return {
      contactName: v.contactName, contactEmail: v.contactEmail, contactPhone: v.contactPhone,
      businessName: v.businessName, category: v.category, website: v.website,
      publicPhone: v.publicPhone, products: v.products, logoUrl: this.logoPreview,
      categoryCode: this.business?.categoryCode ?? 0,
      address: {
        fullAddress: v.fullAddress, street: v.street, exteriorNumber: v.exteriorNumber,
        colony: v.colony, postalCode: v.postalCode, city: v.city, state: v.state,
        lat: v.lat, lng: v.lng
      },
      hours: {
        allDay: v.allDay,
        weekdays: v.allDay ? null : { open: v.wdOpen, close: v.wdClose },
        saturday: v.allDay ? null : { open: v.satOpen, close: v.satClose },
        sunday:   v.allDay ? null : { open: v.sunOpen, close: v.sunClose }
      }
    };
  }

  // ─── Confirmaciones ───────────────────────────────────────────────────────

  requestUnpublish(): void {
    this.confirmAction = 'unpublish';
    this.confirmMessage = 'Este negocio dejará de estar visible públicamente y liberará un espacio de publicación gratuita. ¿Deseas continuar?';
  }

  requestPublish(): void {
    if (!this.businessService.hasPublishSlot()) {
      this.showToast('No es posible publicar porque ya tienes 3 negocios publicados. Cambia uno a No publicado primero.', 'error');
      return;
    }
    this.confirmAction = 'publish';
    this.confirmMessage = 'Este negocio será visible en seccionamarilla.com y ocupará uno de tus espacios gratuitos disponibles. ¿Deseas continuar?';
  }

  requestDelete(): void {
    if (this.business?.status === 'published') {
      this.showToast('No puedes eliminar un negocio publicado. Primero cámbialo a No publicado.', 'error');
      return;
    }
    this.confirmAction = 'delete';
    this.confirmMessage = 'Este negocio será eliminado de Mis Negocios y no podrás recuperarlo desde esta sección. ¿Deseas continuar?';
  }

  confirmDo(): void {
    if (!this.business) return;
    switch (this.confirmAction) {
      case 'unpublish':
        this.businessService.unpublish(this.business.id).subscribe(b => {
          this.confirmAction = null;
          this.showToast('Tu negocio ahora está No publicado y ya no será visible en seccionamarilla.com.', 'success');
          this.statusChanged.emit(b);
          // Refrescar business local
          const updated = this.businessService.getBusinessById(b.id);
          if (updated) (this as any).business = updated;
        });
        break;
      case 'publish':
        this.businessService.publish(this.business.id).subscribe((result: StatusTransitionResult) => {
          this.confirmAction = null;
          if (result.success) {
            this.showToast(result.message, 'success');
            const updated = this.businessService.getBusinessById(this.business!.id);
            if (updated) {
              (this as any).business = updated;
              this.statusChanged.emit(updated);
            }
          } else {
            this.showToast(result.message, 'error');
          }
        });
        break;
      case 'delete':
        this.businessService.softDelete(this.business.id).subscribe((result: StatusTransitionResult) => {
          this.confirmAction = null;
          if (result.success) {
            this.deleted.emit(this.business!.id);
          } else {
            this.showToast(result.message, 'error');
          }
        });
        break;
    }
  }

  cancelConfirm(): void { this.confirmAction = null; }

  // ─── Toast ────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error' | 'warning'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 4000);
  }

  // ─── Logo y mapa ──────────────────────────────────────────────────────────

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.businessService.uploadLogo(file).subscribe(url => this.logoPreview = url);
  }

  onAddressChange(addr: BusinessAddress): void {
    this.form.patchValue({ ...addr });
    this.markerPosition = { lat: addr.lat, lng: addr.lng };
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;
    const lat = event.latLng.lat(), lng = event.latLng.lng();
    this.markerPosition = { lat, lng };
    this.geocode(lat, lng);
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;
    this.geocode(event.latLng.lat(), event.latLng.lng());
  }

  private geocode(lat: number, lng: number): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      this.ngZone.run(() => {
        if (status !== 'OK' || !results?.[0]) return;
        const r = results[0];
        const get = (type: string) => r.address_components.find(c => c.types.includes(type))?.long_name ?? '';
        this.onAddressChange({
          fullAddress: r.formatted_address, street: get('route'),
          exteriorNumber: get('street_number'),
          colony: get('sublocality_level_1') || get('neighborhood'),
          postalCode: get('postal_code'),
          city: get('locality') || get('administrative_area_level_1'),
          state: get('administrative_area_level_1'), lat, lng
        });
      });
    });
  }

  // ─── Pasos (modo ADD) ─────────────────────────────────────────────────────

  nextStep(): void {
    if (this.currentStepInvalid) {
      this.stepFields[this.currentStep]?.forEach(f => this.form.get(f)?.markAsTouched());
      return;
    }
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep(): void { if (this.currentStep > 1) this.currentStep--; }
}
