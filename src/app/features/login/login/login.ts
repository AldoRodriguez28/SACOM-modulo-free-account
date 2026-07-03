import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthMockService, DEMO_USER } from '../../../core/services/auth.mock.service';
import { AUTH_API, AuthApi } from '../../../core/services/auth-api';

/** Clave de sessionStorage donde se guarda el leadid recibido en el token */
export const LEAD_ID_KEY = 'sa_leadid';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  form!: FormGroup;
  loading = false;

  readonly demoEmail = DEMO_USER.email;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthMockService,
    @Inject(AUTH_API) private authApi: AuthApi
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.validarToken(token);
    }
  }

  /**
   * Valida el token recibido en /validacion/:token contra el API (mock mientras
   * la API real no esté disponible). Con la respuesta coloca el email en el input
   * y guarda el leadid en sessionStorage.
   */
  private validarToken(token: string): void {
    this.loading = true;
    this.authApi.loginByToken(token).subscribe({
      next: (res) => {
        this.loading = false;
        const email = res.systemInfo?.email ?? res.user?.email;
        if (email) {
          this.form.patchValue({ email });
        }
        if (res.leadId) {
          sessionStorage.setItem(LEAD_ID_KEY, res.leadId);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get email() { return this.form.get('email')!; }

  fillDemo(): void {
    this.form.setValue({ email: DEMO_USER.email });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.loginOtp(this.email.value).subscribe(() => {
      this.loading = false;
      this.router.navigate(['/dashboard/metricas']);
    });
  }
}
