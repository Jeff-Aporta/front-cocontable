# AGENTS.md — front-cocontable

Interfaz de **CoContable** (contabilidad, facturación, inventario y cartera para Colombia). Web components vanilla sobre el kit **iswc-base** por CDN, en Deno, creada con `create-iswc-app` (estándar **iswc-foundation**). Se publica en GitHub Pages. El API es `Jeff-Aporta/api-cocontable` (Cloudflare Workers + SQLite en el VPS).

Stack completo: skill [`stack-apps`](https://github.com/Jeff-Aporta/Jeff-Aporta/tree/main/skills/stack-apps). Estándar de apps: skill `iswc-foundation` (instalada en Claude).

## Antes de tocar código

1. Este archivo completo.
2. [`skills/front-cocontable/SKILL.md`](skills/front-cocontable/SKILL.md): recetas (catálogo, módulo del menú, vista, campo).
3. [`specs/iswc/kit/catalog.md`](specs/iswc/kit/catalog.md): componentes del kit (no reinventes ninguno).
4. La skill de la tarea en [`specs/iswc/`](specs/iswc/README.md) (componente, demo, vista, pin).

## Mapa

```
index.html                  shell <coco-app>; metas cocontable-api (producción) y cocontable-api-local (desarrollo)
assets/brand/               el coco: isotipo.svg, logo-horizontal.svg
assets/dl.js                íconos (los literales se barren solos; los que pinta el kit van en `extra`)
src/js/core/
  api.ts                    cliente del API, sesión, empresa activa (cabecera X-Empresa), preferencias
  menu.ts                   módulos del panel izquierdo: id → tag + props   ← una pantalla nueva = una línea
  catalogos.ts              catálogos declarativos (columnas + campos por pestaña)  ← un catálogo o campo nuevo va aquí
  apariencia.ts             tema y paleta (Delfín claro por defecto)
  ui.ts · tirilla.ts        formato, caché de listas, CSV, impresión de la tirilla
src/js/base/                componente.ts (molde + html), controles.ts (selector, campo), zod.ts, props-registro.ts
src/js/consts/schemas/      api.schemas.ts (lo que llega del API y las definiciones) · componentes.schemas.ts (props)
src/js/components/coco/     coco-app (shell) · coco-acceso · coco-tabla · coco-ficha · coco-catalogo
view/<vista>/components/    inicio · ventas (factura, documentos) · cartera (cartera, caja) · informes · contabilidad · ajustes
view/demo/                  galería de componentes
scripts/gen/fichas.*        genera el .md y el .json de cada componente y la galería (deno task fichas)
src/styles/                 _tokens, _mixins, _vista (patrones de pantalla), app.scss
dist/cdn/                   build (se versiona: es lo que sirve GitHub Pages)
```

## Reglas duras

1. Vanilla + Web Components, Deno. Cero frameworks ni bundler en runtime. Kit solo por CDN con un único SHA de 40 hex.
2. UI con el kit (`iswc-*`). Colores solo por tokens `--iswc-*`. La fuente es `--iswc-sans`.
3. **Sin barra superior.** Todo el control va en el panel izquierdo de `<coco-app>`: marca y hamburguesa arriba, módulos al centro, empresa y usuario abajo. El área de trabajo se puede dividir en dos vistas.
4. **Paleta Delfín y tema claro por defecto**; lo que el usuario elija se guarda en sus preferencias (`PUT /api/preferencias`) y en el navegador.
5. Cada componente: `.ts` + `.scss` + `.md` + `.json`, registrado en `src/js/kit-tags.ts`, en `src/js/components/coco/all.ts` y en `scripts/gen/fichas.json` (`deno task fichas` genera `.md`, `.json` y la galería).
6. Tipos con Zod en `src/js/consts/schemas/`; lo que llega del API se parsea, nunca `as`.
7. Las vistas no llaman `fetch`: usan `api` de `core/api.ts`. Sin sesión se muestra la empresa `demo` (solo lectura) y cada escritura invita a entrar (evento `coco:acceso`).
8. Los valores que se muestran al digitar (totales de la factura, diferencia del comprobante) son guía: **los definitivos los calcula el API**.
9. En plantillas `html`, un texto en atributo va como `attr=${valor}` (la base le pone comillas). Nada de `innerHTML` con datos.
10. Hecho = `deno task build`, `deno task check` y `deno task test:all` en verde, y probado en el navegador contra el API.

## Comandos

```bash
deno install                 # dependencias
deno task build              # íconos + SCSS + dist/cdn (si `icons` se cuelga: deno task build:scss && deno run -A src/utils/build.ts)
deno task serve              # http://127.0.0.1:8422/   (usa el API local: `deno task dev` en api-cocontable → :8421)
deno task check              # tipos
deno task fichas             # .md, .json y galería de los componentes de scripts/gen/fichas.json
deno task test:all           # gate
```

## Eventos de ventana

| Evento | Quién lo emite | Para qué |
|---|---|---|
| `coco:sesion` | `core/api.ts` | cambió la sesión o la empresa activa: las vistas recargan |
| `coco:abrir` `{ id }` | una vista | pide al shell abrir un módulo de `menu.ts` |
| `coco:acceso` | una vista | pide al shell el diálogo de inicio de sesión |

## Publicación

Push a `main` → GitHub Pages sirve la raíz (`https://jeff-aporta.github.io/front-cocontable/`). `dist/cdn/` va en el commit.

## Pendiente conocido

Lo que falta frente al estándar iswc-foundation está en `D:/VPS/projs/cocontable/HANDOFF.md` (bloque «Estado del front»): `index.html` y `README.md` por vista, specs WHAT propias y pruebas e2e.
