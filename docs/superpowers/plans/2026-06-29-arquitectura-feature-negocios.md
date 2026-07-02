# Arquitectura por capas — Feature de Negocios (piloto) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extraer las reglas de negocio de `business.mock.service.ts` a una capa de dominio pura y aislar la fuente de datos tras un puerto, dejando la feature de negocios como referencia de la arquitectura objetivo.

**Architecture:** Cuatro capas con dependencias en una sola dirección (`Presentation → Application → Domain ← Data`). El dominio es TS puro (sin Angular). La capa de datos expone un puerto (interfaz + `InjectionToken`) con implementación mock hoy y HTTP mañana. Un `BusinessStore` (signals) orquesta dominio + repositorio y conserva la superficie pública del servicio actual para minimizar cambios en componentes.

**Tech Stack:** Angular 22, TypeScript 6 (strict), RxJS 7, signals, Jasmine + Karma (ChromeHeadless).

## Global Constraints

- Angular `^22.0.1`; TypeScript strict (`strict`, `strictTemplates`, `strictInjectionParameters`).
- Todo artefacto Angular (`@Injectable`: store y repositorios) se genera con `ng generate`. Los archivos de dominio puro (`domain/`) son TS plano (sin CLI).
- Prefijo de selector `app`; estilos SCSS.
- Una única fuente de verdad para `MAX_PUBLISHED` (en `domain/business/business.policies.ts`).
- El dominio NO importa nada de `@angular/*` ni de `rxjs`.
- La superficie pública de `BusinessStore` debe igualar la de `BusinessMockService` consumida hoy: `businesses()`, `publishedCount()`, `hasPublishSlot()`, `getBusinessById()`, `addBusiness()`, `saveProgress()`, `finalize()`, `updateBusiness()`, `publish()`, `unpublish()`, `softDelete()`, `uploadLogo()`.
- Comando de test: `npx ng test --watch=false --browsers=ChromeHeadless`.

---

## File Structure

```
src/app/
├── domain/business/
│   ├── business.entity.ts          # Crear — tipos canónicos (movidos de core/models)
│   ├── business.policies.ts        # Crear — MAX_PUBLISHED, publishedCount, hasPublishSlot, canPublish
│   ├── business.policies.spec.ts   # Crear
│   ├── business.validation.ts      # Crear — requiredFieldsForPublish
│   ├── business.validation.spec.ts # Crear
│   ├── business.state-machine.ts   # Crear — mergeDraft, applyProgressEdit, nextStatusOnFinalize, canDelete, canUnpublish
│   └── business.state-machine.spec.ts # Crear
├── data/business/
│   ├── business.repository.ts      # Crear — interfaz BusinessRepository + BUSINESS_REPOSITORY token
│   ├── business.mock.repository.ts # Crear — impl sessionStorage + seed + migración + IDs/fechas + uploadLogo
│   ├── business.mock.repository.spec.ts # Crear
│   ├── business.http.repository.ts # Crear — stub (lanza NotImplemented)
│   └── business.mapper.ts          # Crear — placeholder DTO↔dominio
├── features/dashboard/business/
│   ├── business.store.ts           # Crear — application layer (reemplaza al mock service)
│   └── business.store.spec.ts      # Crear
├── core/models/business.model.ts   # Modificar → re-export shim, luego eliminar
└── core/services/business.mock.service.ts # Eliminar (Task 11)
```

---

## Task 1: Dominio — entidades (mover modelo)

**Files:**
- Create: `src/app/domain/business/business.entity.ts`
- Modify: `src/app/core/models/business.model.ts` (convertir en re-export shim)

**Interfaces:**
- Produces: tipos `Business`, `BusinessStatus`, `BusinessDraft`, `BusinessAddress`, `BusinessHours`, `BusinessHoursSchedule` desde `domain/business/business.entity.ts`.

- [ ] **Step 1: Crear el archivo de entidad con el contenido actual del modelo**

Copiar el contenido completo de `src/app/core/models/business.model.ts` a `src/app/domain/business/business.entity.ts` (mismas interfaces y tipos, sin cambios):

```typescript
export type BusinessStatus = 'in_progress' | 'published' | 'unpublished';

export interface BusinessHours { open: string; close: string; }

export interface BusinessAddress {
  fullAddress: string; street: string; exteriorNumber: string; colony: string;
  postalCode: string; city: string; state: string; lat: number; lng: number;
}

export interface BusinessHoursSchedule {
  allDay: boolean;
  weekdays: BusinessHours | null;
  saturday: BusinessHours | null;
  sunday: BusinessHours | null;
}

export type BusinessDraft = Omit<Business, 'id' | 'userId' | 'status' | 'draft' | 'createdAt'>;

export interface Business {
  id: string; userId: string; status: BusinessStatus;
  businessName: string; contactName: string; contactEmail: string; contactPhone: string;
  categoryCode: number; category: string; website: string; publicPhone: string;
  products: string; logoUrl: string;
  address: BusinessAddress; hours: BusinessHoursSchedule; createdAt: string;
  draft?: BusinessDraft | null;
}
```

- [ ] **Step 2: Convertir el modelo viejo en re-export shim**

Reemplazar TODO el contenido de `src/app/core/models/business.model.ts` por:

```typescript
// Shim retrocompatible — la fuente canónica vive en el dominio.
// Eliminar tras migrar todos los imports (Task 11).
export * from '../../domain/business/business.entity';
```

- [ ] **Step 3: Verificar compilación**

Run: `npx ng build --configuration development`
Expected: build exitoso (los imports existentes siguen resolviendo vía el shim).

- [ ] **Step 4: Commit**

```bash
git add src/app/domain/business/business.entity.ts src/app/core/models/business.model.ts
git commit -m "refactor: mover modelo de negocio a capa de dominio con shim retrocompatible"
```

---

## Task 2: Dominio — políticas de publicación

**Files:**
- Create: `src/app/domain/business/business.policies.ts`
- Test: `src/app/domain/business/business.policies.spec.ts`

**Interfaces:**
- Consumes: `Business` de `./business.entity`.
- Produces:
  - `MAX_PUBLISHED: number` (= 3)
  - `publishedCount(businesses: Business[]): number`
  - `hasPublishSlot(businesses: Business[]): boolean`
  - `canPublish(businesses: Business[]): boolean` (alias semántico de `hasPublishSlot`)

- [ ] **Step 1: Escribir el test que falla**

`src/app/domain/business/business.policies.spec.ts`:

```typescript
import { Business } from './business.entity';
import { MAX_PUBLISHED, publishedCount, hasPublishSlot, canPublish } from './business.policies';

function biz(status: Business['status']): Business {
  return {
    id: crypto.randomUUID(), userId: 'u', status,
    businessName: '', contactName: '', contactEmail: '', contactPhone: '',
    categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
    address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    hours: { allDay: true, weekdays: null, saturday: null, sunday: null },
    createdAt: '2026-01-01', draft: null
  };
}

describe('business.policies', () => {
  it('MAX_PUBLISHED es 3', () => {
    expect(MAX_PUBLISHED).toBe(3);
  });

  it('publishedCount cuenta solo los publicados', () => {
    const list = [biz('published'), biz('published'), biz('in_progress'), biz('unpublished')];
    expect(publishedCount(list)).toBe(2);
  });

  it('hasPublishSlot es true con menos de 3 publicados', () => {
    expect(hasPublishSlot([biz('published'), biz('published')])).toBe(true);
  });

  it('hasPublishSlot es false con exactamente 3 publicados', () => {
    expect(hasPublishSlot([biz('published'), biz('published'), biz('published')])).toBe(false);
  });

  it('canPublish refleja hasPublishSlot', () => {
    expect(canPublish([biz('published'), biz('published'), biz('published')])).toBe(false);
    expect(canPublish([])).toBe(true);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no se puede resolver `./business.policies`.

- [ ] **Step 3: Implementación mínima**

`src/app/domain/business/business.policies.ts`:

```typescript
import { Business } from './business.entity';

/** Máximo de negocios publicados simultáneamente (plan free). Fuente única de verdad. */
export const MAX_PUBLISHED = 3;

export function publishedCount(businesses: Business[]): number {
  return businesses.filter(b => b.status === 'published').length;
}

export function hasPublishSlot(businesses: Business[]): boolean {
  return publishedCount(businesses) < MAX_PUBLISHED;
}

/** Alias semántico: ¿se puede publicar uno más? */
export function canPublish(businesses: Business[]): boolean {
  return hasPublishSlot(businesses);
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/domain/business/business.policies.ts src/app/domain/business/business.policies.spec.ts
git commit -m "feat: políticas de dominio de publicación de negocios"
```

---

## Task 3: Dominio — validación de campos mínimos

**Files:**
- Create: `src/app/domain/business/business.validation.ts`
- Test: `src/app/domain/business/business.validation.spec.ts`

**Interfaces:**
- Consumes: `Business` de `./business.entity`.
- Produces: `requiredFieldsForPublish(data: Pick<Business, 'businessName' | 'category' | 'address' | 'publicPhone'>): string[]` — devuelve etiquetas de campos faltantes (vacío = válido).

- [ ] **Step 1: Escribir el test que falla**

`src/app/domain/business/business.validation.spec.ts`:

```typescript
import { Business } from './business.entity';
import { requiredFieldsForPublish } from './business.validation';

type Data = Pick<Business, 'businessName' | 'category' | 'address' | 'publicPhone'>;

function data(overrides: Partial<Data> = {}): Data {
  return {
    businessName: 'Mi Negocio', category: 'Restaurantes', publicPhone: '5512345678',
    address: { fullAddress: 'Calle 1', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    ...overrides
  };
}

describe('requiredFieldsForPublish', () => {
  it('no devuelve faltantes cuando todo está completo', () => {
    expect(requiredFieldsForPublish(data())).toEqual([]);
  });

  it('detecta nombre faltante', () => {
    expect(requiredFieldsForPublish(data({ businessName: '   ' }))).toContain('nombre del negocio');
  });

  it('detecta categoría faltante', () => {
    expect(requiredFieldsForPublish(data({ category: '' }))).toContain('categoría o giro');
  });

  it('detecta teléfono faltante', () => {
    expect(requiredFieldsForPublish(data({ publicPhone: '' }))).toContain('teléfono');
  });

  it('acepta dirección por street si no hay fullAddress', () => {
    const d = data({ address: { fullAddress: '', street: 'Av. Siempre Viva', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 } });
    expect(requiredFieldsForPublish(d)).not.toContain('dirección');
  });

  it('detecta dirección faltante cuando no hay fullAddress ni street', () => {
    const d = data({ address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 } });
    expect(requiredFieldsForPublish(d)).toContain('dirección');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no se resuelve `./business.validation`.

- [ ] **Step 3: Implementación mínima**

`src/app/domain/business/business.validation.ts`:

```typescript
import { Business } from './business.entity';

type PublishableFields = Pick<Business, 'businessName' | 'category' | 'address' | 'publicPhone'>;

/** Devuelve las etiquetas de los campos mínimos faltantes para publicar. Vacío = válido. */
export function requiredFieldsForPublish(data: PublishableFields): string[] {
  const missing: string[] = [];
  if (!data.businessName?.trim()) missing.push('nombre del negocio');
  if (!data.category?.trim()) missing.push('categoría o giro');
  if (!data.address?.fullAddress?.trim() && !data.address?.street?.trim()) missing.push('dirección');
  if (!data.publicPhone?.trim()) missing.push('teléfono');
  return missing;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/domain/business/business.validation.ts src/app/domain/business/business.validation.spec.ts
git commit -m "feat: validación de dominio de campos mínimos para publicar"
```

---

## Task 4: Dominio — máquina de estados y draft

**Files:**
- Create: `src/app/domain/business/business.state-machine.ts`
- Test: `src/app/domain/business/business.state-machine.spec.ts`

**Interfaces:**
- Consumes: `Business`, `BusinessStatus`, `BusinessDraft` de `./business.entity`.
- Produces:
  - `mergeDraft(business: Business): Business` — devuelve el negocio con su draft aplicado (sin mutar).
  - `applyProgressEdit(business: Business, data: Partial<BusinessDraft>): Business` — para `published` guarda en `draft`; para el resto aplica directo.
  - `nextStatusOnFinalize(business: Business, hasSlot: boolean): BusinessStatus` — estado destino al finalizar.
  - `canDelete(business: Business): boolean`
  - `canUnpublish(business: Business): boolean`

- [ ] **Step 1: Escribir el test que falla**

`src/app/domain/business/business.state-machine.spec.ts`:

```typescript
import { Business } from './business.entity';
import { mergeDraft, applyProgressEdit, nextStatusOnFinalize, canDelete, canUnpublish } from './business.state-machine';

function biz(over: Partial<Business> = {}): Business {
  return {
    id: 'b1', userId: 'u', status: 'in_progress',
    businessName: 'N', contactName: '', contactEmail: '', contactPhone: '',
    categoryCode: 0, category: 'Cat', website: '', publicPhone: '555', products: '', logoUrl: '',
    address: { fullAddress: 'Dir', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    hours: { allDay: true, weekdays: null, saturday: null, sunday: null },
    createdAt: '2026-01-01', draft: null, ...over
  };
}

describe('business.state-machine', () => {
  describe('mergeDraft', () => {
    it('sin draft devuelve el negocio igual', () => {
      const b = biz();
      expect(mergeDraft(b).businessName).toBe('N');
    });
    it('con draft aplica los campos del draft', () => {
      const b = biz({ status: 'published', draft: { ...biz(), businessName: 'Nuevo' } as any });
      expect(mergeDraft(b).businessName).toBe('Nuevo');
    });
  });

  describe('applyProgressEdit', () => {
    it('para in_progress aplica directo', () => {
      const b = biz({ status: 'in_progress' });
      const out = applyProgressEdit(b, { businessName: 'Editado' });
      expect(out.businessName).toBe('Editado');
      expect(out.draft).toBeNull();
    });
    it('para published guarda en draft sin tocar la versión pública', () => {
      const b = biz({ status: 'published', businessName: 'Publico' });
      const out = applyProgressEdit(b, { businessName: 'Borrador' });
      expect(out.businessName).toBe('Publico');
      expect(out.draft?.businessName).toBe('Borrador');
    });
  });

  describe('nextStatusOnFinalize', () => {
    it('published permanece published', () => {
      expect(nextStatusOnFinalize(biz({ status: 'published' }), true)).toBe('published');
    });
    it('in_progress con slot pasa a published', () => {
      expect(nextStatusOnFinalize(biz({ status: 'in_progress' }), true)).toBe('published');
    });
    it('in_progress sin slot pasa a unpublished', () => {
      expect(nextStatusOnFinalize(biz({ status: 'in_progress' }), false)).toBe('unpublished');
    });
  });

  describe('permisos', () => {
    it('no se puede eliminar un publicado', () => {
      expect(canDelete(biz({ status: 'published' }))).toBe(false);
      expect(canDelete(biz({ status: 'in_progress' }))).toBe(true);
    });
    it('solo se puede despublicar un publicado', () => {
      expect(canUnpublish(biz({ status: 'published' }))).toBe(true);
      expect(canUnpublish(biz({ status: 'unpublished' }))).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no se resuelve `./business.state-machine`.

- [ ] **Step 3: Implementación mínima**

`src/app/domain/business/business.state-machine.ts`:

```typescript
import { Business, BusinessDraft, BusinessStatus } from './business.entity';

/** Snapshot de los campos editables de un negocio (base para crear un draft). */
function snapshot(b: Business): BusinessDraft {
  return {
    businessName: b.businessName, contactName: b.contactName,
    contactEmail: b.contactEmail, contactPhone: b.contactPhone,
    categoryCode: b.categoryCode, category: b.category,
    website: b.website, publicPhone: b.publicPhone,
    products: b.products, logoUrl: b.logoUrl,
    address: b.address, hours: b.hours
  };
}

/** Devuelve el negocio con su draft aplicado (sin mutar el original). */
export function mergeDraft(business: Business): Business {
  return business.draft ? { ...business, ...business.draft } : business;
}

/**
 * Aplica una edición de "guardar avance":
 * - published: la edición va al draft (la versión pública no cambia).
 * - resto: la edición se aplica directo.
 */
export function applyProgressEdit(business: Business, data: Partial<BusinessDraft>): Business {
  if (business.status === 'published') {
    const base = business.draft ?? snapshot(business);
    return { ...business, draft: { ...base, ...data } };
  }
  return { ...business, ...data };
}

/** Estado destino al finalizar, dados los datos válidos y si hay slot disponible. */
export function nextStatusOnFinalize(business: Business, hasSlot: boolean): BusinessStatus {
  if (business.status === 'published') return 'published';
  return hasSlot ? 'published' : 'unpublished';
}

export function canDelete(business: Business): boolean {
  return business.status !== 'published';
}

export function canUnpublish(business: Business): boolean {
  return business.status === 'published';
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/domain/business/business.state-machine.ts src/app/domain/business/business.state-machine.spec.ts
git commit -m "feat: máquina de estados y lógica de draft de negocios en el dominio"
```

---

## Task 5: Capa de datos — puerto y repositorio mock

**Files:**
- Create: `src/app/data/business/business.repository.ts`
- Create: `src/app/data/business/business.mock.repository.ts`
- Test: `src/app/data/business/business.mock.repository.spec.ts`

**Interfaces:**
- Consumes: `Business`, `BusinessDraft`, `BusinessStatus` de dominio.
- Produces:
  - Interfaz `BusinessRepository` con: `getAll(): Observable<Business[]>`, `create(data): Observable<Business>`, `update(id, data: Partial<Business>): Observable<Business>`, `remove(id): Observable<void>`, `uploadLogo(file: File): Observable<string>`.
  - `BUSINESS_REPOSITORY: InjectionToken<BusinessRepository>`.
  - `BusinessMockRepository` (impl con sessionStorage + seed + migración + generación de `id`/`createdAt`/`userId`).

> Nota CLI: generar la clase con `ng generate service data/business/business-mock-repository --flat=false` y luego renombrar/ajustar al nombre `business.mock.repository.ts`, o crear el archivo conforme a la convención del proyecto. La interfaz y el token (`business.repository.ts`) son TS plano.

- [ ] **Step 1: Crear el puerto (interfaz + token)**

`src/app/data/business/business.repository.ts`:

```typescript
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Business } from '../../domain/business/business.entity';

export type CreateBusinessData = Omit<Business, 'id' | 'userId' | 'status' | 'createdAt' | 'draft'>;

export interface BusinessRepository {
  getAll(): Observable<Business[]>;
  create(data: CreateBusinessData): Observable<Business>;
  update(id: string, data: Partial<Business>): Observable<Business>;
  remove(id: string): Observable<void>;
  uploadLogo(file: File): Observable<string>;
}

export const BUSINESS_REPOSITORY = new InjectionToken<BusinessRepository>('BUSINESS_REPOSITORY');
```

- [ ] **Step 2: Escribir el test que falla (repositorio mock)**

`src/app/data/business/business.mock.repository.spec.ts`:

```typescript
import { BusinessMockRepository } from './business.mock.repository';
import { firstValueFrom } from 'rxjs';

describe('BusinessMockRepository', () => {
  let repo: BusinessMockRepository;

  beforeEach(() => {
    sessionStorage.clear();
    repo = new BusinessMockRepository();
  });

  it('getAll devuelve la semilla cuando no hay datos guardados', async () => {
    const list = await firstValueFrom(repo.getAll());
    expect(Array.isArray(list)).toBe(true);
  });

  it('create asigna id, status in_progress y createdAt', async () => {
    const created = await firstValueFrom(repo.create({
      businessName: 'Test', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('in_progress');
    expect(created.createdAt).toBeTruthy();
  });

  it('update persiste cambios y los devuelve', async () => {
    const created = await firstValueFrom(repo.create({
      businessName: 'A', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
    const updated = await firstValueFrom(repo.update(created.id, { businessName: 'B' }));
    expect(updated.businessName).toBe('B');
    const all = await firstValueFrom(repo.getAll());
    expect(all.find(b => b.id === created.id)?.businessName).toBe('B');
  });

  it('remove elimina por id', async () => {
    const created = await firstValueFrom(repo.create({
      businessName: 'A', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
    await firstValueFrom(repo.remove(created.id));
    const all = await firstValueFrom(repo.getAll());
    expect(all.find(b => b.id === created.id)).toBeUndefined();
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no se resuelve `./business.mock.repository`.

- [ ] **Step 4: Implementar el repositorio mock**

`src/app/data/business/business.mock.repository.ts`:

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Business, BusinessStatus } from '../../domain/business/business.entity';
import { BusinessRepository, CreateBusinessData } from './business.repository';
import mockData from '../../../assets/mock-data.json';

@Injectable({ providedIn: 'root' })
export class BusinessMockRepository implements BusinessRepository {
  private readonly KEY = 'sa_businesses';

  getAll(): Observable<Business[]> {
    return of(this.load());
  }

  create(data: CreateBusinessData): Observable<Business> {
    const newBiz: Business = {
      ...data,
      id: crypto.randomUUID(),
      userId: 'usr-001',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      draft: null
    };
    this.persist([...this.load(), newBiz]);
    return of(newBiz);
  }

  update(id: string, data: Partial<Business>): Observable<Business> {
    const list = this.load().map(b => (b.id === id ? { ...b, ...data } : b));
    this.persist(list);
    return of(list.find(b => b.id === id)!);
  }

  remove(id: string): Observable<void> {
    this.persist(this.load().filter(b => b.id !== id));
    return of(void 0);
  }

  uploadLogo(file: File): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();
      reader.onload = () => { observer.next(reader.result as string); observer.complete(); };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private load(): Business[] {
    const raw = sessionStorage.getItem(this.KEY);
    if (raw) {
      const parsed: Business[] = JSON.parse(raw);
      // Migración retrocompatible: completar campos ausentes.
      return parsed.map(b => ({
        ...b,
        status: b.status ?? ('published' as BusinessStatus),
        createdAt: b.createdAt ?? new Date().toISOString(),
        draft: b.draft ?? null
      }));
    }
    return mockData.businesses as unknown as Business[];
  }

  private persist(list: Business[]): void {
    sessionStorage.setItem(this.KEY, JSON.stringify(list));
  }
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/data/business/business.repository.ts src/app/data/business/business.mock.repository.ts src/app/data/business/business.mock.repository.spec.ts
git commit -m "feat: puerto de repositorio de negocios e implementación mock"
```

---

## Task 6: Capa de datos — stub HTTP y mapper

**Files:**
- Create: `src/app/data/business/business.http.repository.ts`
- Create: `src/app/data/business/business.mapper.ts`

**Interfaces:**
- Consumes: `BusinessRepository`, `CreateBusinessData` del puerto; `Business` del dominio.
- Produces: `BusinessHttpRepository implements BusinessRepository` (stub) y `business.mapper.ts` (placeholder DTO↔dominio).

- [ ] **Step 1: Crear el mapper placeholder**

`src/app/data/business/business.mapper.ts`:

```typescript
import { Business } from '../../domain/business/business.entity';

/**
 * Mapeo DTO de API ↔ entidad de dominio.
 * Placeholder: se completará cuando exista el contrato real de la API.
 */
export const businessMapper = {
  toDomain(dto: unknown): Business {
    return dto as Business;
  },
  toDto(business: Business): unknown {
    return business;
  }
};
```

- [ ] **Step 2: Crear el stub HTTP**

`src/app/data/business/business.http.repository.ts`:

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Business } from '../../domain/business/business.entity';
import { BusinessRepository, CreateBusinessData } from './business.repository';

/**
 * Implementación HTTP del repositorio de negocios.
 * Stub: la estructura está lista; los métodos se implementarán al definir la API real.
 * Cambiar el provider de BUSINESS_REPOSITORY a esta clase activará el backend real.
 */
@Injectable({ providedIn: 'root' })
export class BusinessHttpRepository implements BusinessRepository {
  private notImplemented(method: string): never {
    throw new Error(`BusinessHttpRepository.${method} aún no implementado (pendiente API real).`);
  }

  getAll(): Observable<Business[]> { return this.notImplemented('getAll'); }
  create(_data: CreateBusinessData): Observable<Business> { return this.notImplemented('create'); }
  update(_id: string, _data: Partial<Business>): Observable<Business> { return this.notImplemented('update'); }
  remove(_id: string): Observable<void> { return this.notImplemented('remove'); }
  uploadLogo(_file: File): Observable<string> { return this.notImplemented('uploadLogo'); }
}
```

- [ ] **Step 3: Verificar compilación**

Run: `npx ng build --configuration development`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add src/app/data/business/business.http.repository.ts src/app/data/business/business.mapper.ts
git commit -m "feat: stub de repositorio HTTP y mapper de negocios"
```

---

## Task 7: Capa de aplicación — BusinessStore

**Files:**
- Create: `src/app/features/dashboard/business/business.store.ts`
- Test: `src/app/features/dashboard/business/business.store.spec.ts`

**Interfaces:**
- Consumes: dominio (`policies`, `validation`, `state-machine`, `entity`) y `BUSINESS_REPOSITORY` / `BusinessRepository` / `CreateBusinessData`.
- Produces: `BusinessStore` con la superficie pública del servicio actual:
  - signals: `businesses()`; computed: `publishedCount()`, `hasPublishSlot()`
  - `getBusinessById(id): Business | undefined`
  - `addBusiness(data: CreateBusinessData): Observable<Business>`
  - `saveProgress(id, data: Partial<BusinessDraft>): Observable<Business>`
  - `finalize(id): Observable<StatusTransitionResult>`
  - `updateBusiness(id, data: Partial<Business>): Observable<Business>`
  - `publish(id): Observable<StatusTransitionResult>`
  - `unpublish(id): Observable<Business>`
  - `softDelete(id): Observable<StatusTransitionResult>`
  - `uploadLogo(file): Observable<string>`
  - tipo `StatusTransitionResult { success: boolean; status?: BusinessStatus; message: string }`

- [ ] **Step 1: Escribir el test que falla**

`src/app/features/dashboard/business/business.store.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BusinessStore } from './business.store';
import { BUSINESS_REPOSITORY } from '../../../data/business/business.repository';
import { BusinessMockRepository } from '../../../data/business/business.mock.repository';

describe('BusinessStore', () => {
  let store: BusinessStore;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        BusinessStore,
        { provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository }
      ]
    });
    store = TestBed.inject(BusinessStore);
  });

  async function addBiz(over: Partial<{ businessName: string; category: string; publicPhone: string; fullAddress: string }> = {}) {
    return firstValueFrom(store.addBusiness({
      businessName: over.businessName ?? 'Negocio', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: over.category ?? 'Cat', website: '', publicPhone: over.publicPhone ?? '555', products: '', logoUrl: '',
      address: { fullAddress: over.fullAddress ?? 'Dir', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
  }

  it('addBusiness agrega un negocio in_progress al signal', async () => {
    await addBiz();
    expect(store.businesses().length).toBe(1);
    expect(store.businesses()[0].status).toBe('in_progress');
  });

  it('finalize con campos completos y slot publica', async () => {
    const b = await addBiz();
    const res = await firstValueFrom(store.finalize(b.id));
    expect(res.success).toBe(true);
    expect(res.status).toBe('published');
    expect(store.getBusinessById(b.id)?.status).toBe('published');
  });

  it('finalize con campos faltantes falla', async () => {
    const b = await addBiz({ businessName: '' });
    const res = await firstValueFrom(store.finalize(b.id));
    expect(res.success).toBe(false);
    expect(res.message).toContain('nombre del negocio');
  });

  it('finalize sin slot deja el negocio unpublished', async () => {
    const a = await addBiz(); await firstValueFrom(store.finalize(a.id));
    const b = await addBiz(); await firstValueFrom(store.finalize(b.id));
    const c = await addBiz(); await firstValueFrom(store.finalize(c.id));
    expect(store.publishedCount()).toBe(3);
    const d = await addBiz();
    const res = await firstValueFrom(store.finalize(d.id));
    expect(res.success).toBe(true);
    expect(res.status).toBe('unpublished');
  });

  it('softDelete rechaza eliminar un publicado', async () => {
    const b = await addBiz();
    await firstValueFrom(store.finalize(b.id));
    const res = await firstValueFrom(store.softDelete(b.id));
    expect(res.success).toBe(false);
  });

  it('publish falla sin slot', async () => {
    for (let i = 0; i < 3; i++) { const x = await addBiz(); await firstValueFrom(store.finalize(x.id)); }
    const u = await addBiz(); await firstValueFrom(store.finalize(u.id)); // queda unpublished
    const res = await firstValueFrom(store.publish(u.id));
    expect(res.success).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no se resuelve `./business.store`.

- [ ] **Step 3: Implementar el store**

`src/app/features/dashboard/business/business.store.ts`:

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, switchMap, tap } from 'rxjs';
import { Business, BusinessDraft, BusinessStatus } from '../../../domain/business/business.entity';
import { hasPublishSlot, publishedCount } from '../../../domain/business/business.policies';
import { requiredFieldsForPublish } from '../../../domain/business/business.validation';
import {
  applyProgressEdit, canDelete, mergeDraft, nextStatusOnFinalize
} from '../../../domain/business/business.state-machine';
import {
  BUSINESS_REPOSITORY, BusinessRepository, CreateBusinessData
} from '../../../data/business/business.repository';

export interface StatusTransitionResult {
  success: boolean;
  status?: BusinessStatus;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessStore {
  private readonly repo = inject<BusinessRepository>(BUSINESS_REPOSITORY);

  private readonly _businesses = signal<Business[]>([]);
  readonly businesses = this._businesses.asReadonly();
  readonly publishedCount = computed(() => publishedCount(this._businesses()));
  readonly hasPublishSlot = computed(() => hasPublishSlot(this._businesses()));

  constructor() {
    this.repo.getAll().subscribe(list => this._businesses.set(list));
  }

  getBusinessById(id: string): Business | undefined {
    return this._businesses().find(b => b.id === id);
  }

  addBusiness(data: CreateBusinessData): Observable<Business> {
    return this.repo.create(data).pipe(
      tap(b => this._businesses.set([...this._businesses(), b]))
    );
  }

  saveProgress(id: string, data: Partial<BusinessDraft>): Observable<Business> {
    const current = this.getBusinessById(id);
    if (!current) return of(undefined as unknown as Business);
    const edited = applyProgressEdit(current, data);
    return this.repo.update(id, edited).pipe(tap(b => this.replace(b)));
  }

  finalize(id: string): Observable<StatusTransitionResult> {
    const current = this.getBusinessById(id);
    if (!current) return of({ success: false, message: 'Negocio no encontrado.' });

    const data = mergeDraft(current);
    const missing = requiredFieldsForPublish(data);
    if (missing.length) {
      return of({ success: false, message: `Para finalizar, completa la información requerida: ${missing.join(', ')}.` });
    }

    const target = nextStatusOnFinalize(current, this.hasPublishSlot());
    const updated: Partial<Business> = { ...data, status: target, draft: null };

    return this.repo.update(id, updated).pipe(
      tap(b => this.replace(b)),
      map(() => this.messageForFinalize(current.status, target))
    );
  }

  updateBusiness(id: string, data: Partial<Business>): Observable<Business> {
    return this.repo.update(id, data).pipe(tap(b => this.replace(b)));
  }

  publish(id: string): Observable<StatusTransitionResult> {
    if (!this.hasPublishSlot()) {
      return of({ success: false, message: 'No es posible publicar este negocio porque ya tienes 3 negocios publicados. Para publicar otro, cambia alguno de los publicados a No publicado.' });
    }
    return this.repo.update(id, { status: 'published' }).pipe(
      tap(b => this.replace(b)),
      map(() => ({ success: true, status: 'published' as BusinessStatus, message: 'Tu negocio fue publicado correctamente.' }))
    );
  }

  unpublish(id: string): Observable<Business> {
    return this.repo.update(id, { status: 'unpublished', draft: null }).pipe(tap(b => this.replace(b)));
  }

  softDelete(id: string): Observable<StatusTransitionResult> {
    const current = this.getBusinessById(id);
    if (!current) return of({ success: false, message: 'Negocio no encontrado.' });
    if (!canDelete(current)) {
      return of({ success: false, message: 'No puedes eliminar un negocio publicado. Primero cámbialo a No publicado.' });
    }
    return this.repo.remove(id).pipe(
      tap(() => this._businesses.set(this._businesses().filter(b => b.id !== id))),
      map(() => ({ success: true, message: 'El negocio fue eliminado.' }))
    );
  }

  uploadLogo(file: File): Observable<string> {
    return this.repo.uploadLogo(file);
  }

  private replace(b: Business): void {
    this._businesses.set(this._businesses().map(x => (x.id === b.id ? b : x)));
  }

  private messageForFinalize(prev: BusinessStatus, target: BusinessStatus): StatusTransitionResult {
    if (prev === 'published') {
      return { success: true, status: 'published', message: 'Los cambios fueron publicados correctamente.' };
    }
    if (target === 'published') {
      return { success: true, status: 'published', message: 'Tu negocio fue publicado correctamente.' };
    }
    return {
      success: true, status: 'unpublished',
      message: 'Ya tienes 3 negocios publicados. Tu negocio fue guardado como No publicado. Para publicarlo, cambia uno de tus negocios publicados a No publicado.'
    };
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/dashboard/business/business.store.ts src/app/features/dashboard/business/business.store.spec.ts
git commit -m "feat: BusinessStore (capa de aplicación) sobre dominio y repositorio"
```

---

## Task 8: Registrar el provider del repositorio

**Files:**
- Modify: `src/app/app.module.ts`

**Interfaces:**
- Consumes: `BUSINESS_REPOSITORY`, `BusinessMockRepository`.

- [ ] **Step 1: Registrar el binding del puerto a la implementación mock**

En `src/app/app.module.ts`, agregar el provider dentro de `providers: []`:

```typescript
import { BUSINESS_REPOSITORY } from './data/business/business.repository';
import { BusinessMockRepository } from './data/business/business.mock.repository';

// ...dentro de @NgModule:
  providers: [
    { provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository }
  ],
```

> Para activar el backend real en el futuro: cambiar `useClass: BusinessMockRepository` por `useClass: BusinessHttpRepository`.

- [ ] **Step 2: Verificar compilación**

Run: `npx ng build --configuration development`
Expected: build exitoso.

- [ ] **Step 3: Commit**

```bash
git add src/app/app.module.ts
git commit -m "chore: registrar BUSINESS_REPOSITORY con implementación mock"
```

---

## Task 9: Migrar consumidores al BusinessStore

**Files:**
- Modify: `src/app/features/dashboard/components/business-drawer/business-drawer.ts`
- Modify: `src/app/features/dashboard/metricas/metricas/metricas.ts`

**Interfaces:**
- Consumes: `BusinessStore`, `StatusTransitionResult` de `features/dashboard/business/business.store`.

- [ ] **Step 1: Migrar business-drawer.ts**

En `src/app/features/dashboard/components/business-drawer/business-drawer.ts`:

Reemplazar el import del servicio:
```typescript
// ANTES
import { BusinessMockService, StatusTransitionResult } from '../../../../core/services/business.mock.service';
// DESPUÉS
import { BusinessStore, StatusTransitionResult } from '../../business/business.store';
```

Reemplazar la inyección en el constructor (de `private businessService: BusinessMockService` a `private businessService: BusinessStore`). Mantener el nombre del campo `businessService` para no tocar el resto del archivo. Verificar que estos llamados siguen existiendo en `BusinessStore` (sí, misma firma): `saveProgress`, `finalize`, `getBusinessById`, `updateBusiness`, `addBusiness`, `unpublish`, `publish`, `softDelete`, `uploadLogo`, `hasPublishSlot`.

- [ ] **Step 2: Migrar metricas.ts**

En `src/app/features/dashboard/metricas/metricas/metricas.ts`:

```typescript
// ANTES
import { BusinessMockService } from '../../../../core/services/business.mock.service';
// DESPUÉS
import { BusinessStore } from '../../business/business.store';
```

Cambiar el tipo en el constructor: `private businessService: BusinessMockService` → `private businessService: BusinessStore`. Los usos (`this.businessService.businesses()`, `.publishedCount()`, `.getBusinessById()`) son idénticos.

- [ ] **Step 3: Verificar compilación y tests**

Run: `npx ng build --configuration development && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: build exitoso, tests en verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard/components/business-drawer/business-drawer.ts src/app/features/dashboard/metricas/metricas/metricas.ts
git commit -m "refactor: consumir BusinessStore en drawer y métricas"
```

---

## Task 10: Eliminar la duplicación de MAX_PUBLISHED

**Files:**
- Modify: `src/app/features/dashboard/metricas/business-list-card/business-list-card.ts`

**Interfaces:**
- Consumes: `MAX_PUBLISHED` de `domain/business/business.policies`.

- [ ] **Step 1: Usar la constante del dominio en lugar de la hardcodeada**

En `src/app/features/dashboard/metricas/business-list-card/business-list-card.ts`:

```typescript
// Agregar import
import { MAX_PUBLISHED } from '../../../../domain/business/business.policies';

// Reemplazar la línea  `readonly MAX_PUBLISHED = 3;`  por:
readonly MAX_PUBLISHED = MAX_PUBLISHED;
```

> Si `strictTemplates`/linter se queja por sombra de nombre, renombrar el import: `import { MAX_PUBLISHED as MAX_PUBLISHED_LIMIT }` y asignar `readonly MAX_PUBLISHED = MAX_PUBLISHED_LIMIT;`. El template (`business-list-card.html`) sigue usando `MAX_PUBLISHED` sin cambios.

- [ ] **Step 2: Verificar compilación y tests**

Run: `npx ng build --configuration development && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: build exitoso, tests en verde.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/dashboard/metricas/business-list-card/business-list-card.ts
git commit -m "refactor: única fuente de verdad para MAX_PUBLISHED desde el dominio"
```

---

## Task 11: Eliminar el servicio y el shim obsoletos

**Files:**
- Delete: `src/app/core/services/business.mock.service.ts`
- Delete: `src/app/core/services/business.mock.service.spec.ts`
- Delete: `src/app/core/models/business.model.ts` (shim)
- Modify: imports que aún apunten a `core/models/business.model`

- [ ] **Step 1: Encontrar imports residuales del modelo viejo y del servicio**

Run: `grep -rn "core/models/business.model\|business.mock.service" src/app | grep -v ".spec.ts:"`
Expected: lista de archivos que aún referencian las rutas viejas (p. ej. `business-list-card.ts`, `business-drawer.ts`).

- [ ] **Step 2: Reapuntar imports del modelo al dominio**

En cada archivo listado, cambiar:
```typescript
// ANTES
import { Business, ... } from '.../core/models/business.model';
// DESPUÉS
import { Business, ... } from '.../domain/business/business.entity';
```
(ajustar la profundidad relativa `../` según la ubicación del archivo).

- [ ] **Step 3: Eliminar los archivos obsoletos**

Run:
```bash
git rm src/app/core/services/business.mock.service.ts src/app/core/services/business.mock.service.spec.ts src/app/core/models/business.model.ts
```

- [ ] **Step 4: Verificar build y suite completa**

Run: `npx ng build --configuration development && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: build exitoso; NO debe quedar ninguna referencia a `BusinessMockService` ni a `core/models/business.model`. Todos los tests en verde.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: eliminar BusinessMockService y modelo legacy tras la migración"
```

---

## Self-Review (completado por el autor del plan)

- **Cobertura del spec:**
  - §4 reglas de dominio → Tasks 2, 3, 4. ✅
  - §5 capa de datos (puerto + mock + http stub + mapper) → Tasks 5, 6. ✅
  - §6 store → Task 7. ✅
  - §7 impacto en presentación → Tasks 9, 10. ✅
  - §8 mover modelo → Tasks 1, 11. ✅
  - §9 testing → tests en Tasks 2–7. ✅
  - §12 swap por provider único → Task 8 (+ nota en Task 6). ✅
- **Placeholders:** ninguno; todo el código está completo. El stub HTTP es intencional (fuera de alcance implementar HTTP real, §11).
- **Consistencia de tipos:** `BusinessRepository` (Task 5) usado idénticamente en `BusinessStore` (Task 7) y provider (Task 8); `StatusTransitionResult` definido en el store y consumido en el drawer (Task 9); `CreateBusinessData` consistente entre puerto, mock repo y store.
