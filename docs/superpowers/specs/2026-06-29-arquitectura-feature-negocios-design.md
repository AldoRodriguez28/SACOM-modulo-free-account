# Diseño: Arquitectura por capas — Feature de Negocios (piloto)

- **Fecha:** 2026-06-29
- **Estado:** Aprobado para implementación
- **Alcance:** Validar la arquitectura objetivo en la feature de **negocios** (la de más lógica) y dejar el patrón como referencia para propagar al resto del proyecto.

## 1. Contexto y problema

El proyecto (Angular 22, NgModules) tiene la lógica de negocio embebida dentro de `core/services/business.mock.service.ts`. En una sola clase conviven cuatro responsabilidades:

1. **Reglas de negocio** — `MAX_PUBLISHED = 3`, transiciones de estado, campos mínimos, permisos de acción.
2. **Estado/UI** — signals (`businesses`, `publishedCount`, `hasPublishSlot`).
3. **Persistencia / fuente de datos** — `sessionStorage`, seed desde `mock-data.json`, migración retrocompatible.
4. **Generación de datos** — `crypto.randomUUID()`, `new Date()`, asignación de `userId`.

Consecuencias:
- Al conectar la API real habría que reescribir el servicio completo y la regla `MAX_PUBLISHED` se iría con él.
- La regla `MAX_PUBLISHED` ya está **duplicada**: vive en el servicio y hardcodeada en `business-list-card`.
- Las reglas no son testeables sin Angular/TestBed.

## 2. Decisiones tomadas

- **Backend:** API REST real próximamente → se diseña capa de datos con puerto (interfaz) + implementaciones intercambiables.
- **Standalone:** se migrará a componentes standalone + guards/interceptors funcionales (a nivel proyecto; esta feature deja el patrón listo).
- **Arquitectura:** Opción A — **capas pragmáticas** (Domain · Data · Application · Presentation), dependencias en una sola dirección. Descartadas: Clean/Hexagonal con use-cases explícitos (sobre-ingeniería para el tamaño) y refactor ligero sin puerto (fuga de detalles del mock).
- **Alcance:** piloto en feature de negocios; luego se propaga.

## 3. Arquitectura objetivo

Dirección de dependencias: `Presentation → Application → Domain ← Data`.

| Capa | Contiene | Conoce Angular/RxJS |
|------|----------|---------------------|
| **Domain** | Reglas puras, entidades, policies, validación, máquina de estados | ❌ TS puro |
| **Data** | Puerto (interfaz) + impl mock/http, mapeo DTO↔dominio | HttpClient solo aquí |
| **Application** | Store con signals; orquesta repositorio y aplica reglas de dominio | ✅ signals, DI |
| **Presentation** | Componentes standalone | ✅ |

### Estructura de archivos

```
src/app/
├── domain/business/                    # TS PURO — sin Angular, sin RxJS
│   ├── business.entity.ts              # Business, BusinessStatus, BusinessDraft, Address, Hours…
│   ├── business.policies.ts            # MAX_PUBLISHED, hasPublishSlot(), canPublish()
│   ├── business.validation.ts          # requiredFieldsForPublish(data) → string[]
│   └── business.state-machine.ts       # nextStatusOnFinalize(), canDelete(), canUnpublish()
│
├── data/business/
│   ├── business.repository.ts          # interfaz BusinessRepository + InjectionToken BUSINESS_REPOSITORY
│   ├── business.mock.repository.ts     # impl: sessionStorage + mock-data.json + migración + IDs/fechas
│   ├── business.http.repository.ts     # impl futura (HttpClient) — stub que lanza NotImplemented por ahora
│   └── business.mapper.ts              # DTO API ↔ entidad de dominio (placeholder hasta definir API)
│
└── features/dashboard/business/
    └── business.store.ts               # @Injectable; signals + orquestación; reemplaza al mock service
```

## 4. Reglas de negocio a extraer al dominio

Funciones puras (entrada → salida, sin efectos secundarios):

- **`MAX_PUBLISHED = 3`** — constante única (elimina la duplicación con `business-list-card`).
- **`publishedCount(businesses)`** y **`hasPublishSlot(businesses)`** = `publishedCount < MAX_PUBLISHED`.
- **`requiredFieldsForPublish(data)`** — devuelve lista de campos faltantes: nombre, categoría, dirección (`fullAddress` o `street`), teléfono público.
- **Máquina de estados (`nextStatusOnFinalize`)**:
  - `published` → re-publica aplicando draft (sigue `published`).
  - `in_progress` | `unpublished` + hay slot → `published`.
  - `in_progress` | `unpublished` + sin slot → `unpublished` (con mensaje de límite).
- **`canDelete(business)`** — falso si `published`.
- **`canUnpublish(business)`** — verdadero solo si `published`.
- **Lógica de draft** — decidir si una edición va al draft (negocio `published`) o directo (resto). La política decide; el store/repo aplica.

Los **mensajes de usuario** (toasts) se mantienen en la capa de aplicación/presentación; el dominio devuelve resultados/estados, no copys.

## 5. Capa de datos (puerto e implementaciones)

`BusinessRepository` (interfaz) expone operaciones de persistencia, retornando `Observable`:

- `getAll()`, `getById(id)`
- `create(data)`, `update(id, partialData)`
- `remove(id)`
- `uploadLogo(file)`

`BUSINESS_REPOSITORY` es un `InjectionToken<BusinessRepository>`.

- **`BusinessMockRepository`**: mueve aquí `sessionStorage`, seed desde `mock-data.json`, migración retrocompatible, y la generación de `id`/`createdAt`/`userId` (responsabilidad del backend en el futuro).
- **`BusinessHttpRepository`**: stub inicial (estructura lista, métodos lanzan "no implementado") hasta que exista la API y su contrato.

Swap mock → http = cambiar un único provider:
```ts
{ provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository }   // hoy
{ provide: BUSINESS_REPOSITORY, useClass: BusinessHttpRepository }   // mañana
```

## 6. Capa de aplicación (store)

`BusinessStore` (`@Injectable({ providedIn: 'root' })`) reemplaza a `BusinessMockService` para los consumidores:

- **Estado:** `businesses` (signal), `publishedCount` / `hasPublishSlot` (computed, delegando a policies del dominio).
- **Orquestación:** cada operación (`finalize`, `publish`, `unpublish`, `softDelete`, `saveProgress`, `addBusiness`) valida con el dominio, calcula el estado con la máquina de estados, delega persistencia al repositorio y actualiza el signal.
- Devuelve los mismos contratos que hoy consumen los componentes (`StatusTransitionResult`, etc.) para minimizar cambios en la UI.

## 7. Impacto en presentación (consumidores actuales)

- `features/dashboard/components/business-drawer/business-drawer.ts` → inyecta `BusinessStore` en vez de `BusinessMockService`.
- `features/dashboard/metricas/metricas/metricas.ts` → idem.
- `features/dashboard/metricas/business-list-card/` → usa `MAX_PUBLISHED` desde `domain/business.policies.ts` (deja de hardcodearlo).
- La superficie pública del store iguala la del servicio actual, por lo que los cambios son de import/inyección, no de lógica en componentes.

## 8. Modelo de datos

`core/models/business.model.ts` se mueve a `domain/business/business.entity.ts`. Se actualizan los imports de los consumidores migrados. Otras features aún no migradas no usan este modelo, así que no rompe nada fuera del piloto.

## 9. Testing

- **Dominio:** tests unitarios puros (Jasmine, sin TestBed) para policies, validación y máquina de estados — incluyendo bordes: exactamente 3 publicados, finalizar sin slot, eliminar publicado, draft sobre publicado.
- **Repositorio mock:** tests de persistencia/migración.
- **Store:** tests con repositorio mock inyectado verificando orquestación y estado.

## 10. Convenciones del proyecto

- Todo artefacto Angular (`@Injectable` store y repositorios) se genera con `ng generate`; los archivos de dominio puro son TS plano.
- Se mantiene SCSS y prefijo `app`.

## 11. Fuera de alcance (este piloto)

- Migración a standalone del resto de features (se hará por separado).
- Definición del contrato real de la API y la implementación HTTP completa (solo stub).
- Refactor de auth/metrics (se propagará el patrón después de validar el piloto).

## 12. Criterios de éxito

- Las reglas de negocio viven en `domain/` como funciones puras, sin dependencias de Angular.
- `MAX_PUBLISHED` tiene una única fuente de verdad.
- Cambiar de mock a HTTP no requiere tocar dominio, store ni componentes (solo el provider).
- Los componentes de negocios funcionan igual que antes (sin regresión funcional).
- Tests de dominio corren sin TestBed.
