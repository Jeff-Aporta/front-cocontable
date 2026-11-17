---
name: front-cocontable
description: >-
  Recetas para trabajar en front-cocontable (interfaz de CoContable sobre iswc-base): agregar un catálogo o un campo,
  una pantalla al menú, una vista nueva, un informe, o conectar una acción con el API. Usar al tocar este repo.
---

# front-cocontable — recetas

Lee antes [`AGENTS.md`](../../AGENTS.md). Componentes del kit: skill `iswc-base`. Estándar de apps: skill `iswc-foundation`.

## Agregar un campo a un catálogo (por ejemplo a terceros)

1. API: la columna en `src/domain/empresa.ts` de `api-cocontable` (y actualizar el VPS).
2. Aquí: una línea en el arreglo `campos` del catálogo en `src/js/core/catalogos.ts` (`nombre`, `etiqueta`, `tipo`, `pestana`). Tipos: `texto`, `numero`, `dinero`, `fecha`, `correo`, `si-no`, `opcion` (con `opciones` fijas o `fuente` = otro catálogo), `area`.
3. Si debe verse en la tabla: una línea en `columnas`.

## Agregar un catálogo

1. Su definición en `DEFINICIONES` de `core/catalogos.ts` (rutas del CRUD de DER, llave, columnas, campos).
2. Una línea en `core/menu.ts`: `cat('id', 'Título', 'mdi:icono', 'Grupo')`. No hay que escribir ningún componente.

## Agregar una pantalla propia

1. Componente en `view/<vista>/components/coco-<nombre>.ts` (más su `.scss`): extiende `Componente<Props>`, se recarga con `coco:sesion`, usa `api` y `<coco-tabla>` / `<coco-ficha>`.
2. Props: schema en `consts/schemas/componentes.schemas.ts` y una línea en `base/props-registro.ts`.
3. Registro: `kit-tags.ts` (`VIEW_TAGS`), `components/coco/all.ts` y una entrada en `scripts/gen/fichas.json`; luego `deno task fichas`.
4. Menú: una línea en `core/menu.ts` con su `tag` y `props`.

## Agregar un informe

1. API: una entrada en `INFORMES` de `src/rutas.ts`.
2. Aquí: una entrada en `PARAMETROS` de `view/informes/components/coco-informes.ts` (parámetros, columnas, totales).

## Patrones

- Estado de la vista en campos privados (`#filas`, `#abierto`) y repintar con `this.props = {}`.
- Controles: `selector(...)` y `campo(...)` de `base/controles.ts`; el `detail` de un evento con `detalle(e)`.
- Avisos: `avisar(mensaje, color)` con color `success`, `warning` o `danger`.
- Escrituras: si `sesion.puedeEscribir` es falso, no muestres el botón o pide acceso con el evento de ventana `coco:acceso`.
- Tras crear o editar un catálogo: `limpiarCache()`.

## Probar

`deno task dev` en `api-cocontable` (puerto 8421) y `deno task serve` aquí (8422). La app en `127.0.0.1` usa el API local. La empresa `demo` se lee sin cuenta; para escribir, crea una cuenta de prueba desde el diálogo de acceso.
