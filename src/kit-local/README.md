# kit-local — copias de trabajo de componentes del kit

Esta carpeta trae **solo** los componentes del [iswc-base](https://github.com/Jeff-Aporta/is-webcomponents) que hay que
ajustar, para iterar en CoContable sin publicar el kit en cada cambio (la misma metodología de `tk-lab`).

## Metodología

1. Se trae el componente con su cierre de imports: `node scripts/kit-local/traer.mjs components/data/ag-grid.ts`
   (copia desde `D:/VPS/transversales/iswc-base/src`; los imports del kit publicados quedan apuntando al CDN del pin).
2. Se registra en `OVERRIDES_KIT` (`src/js/kit-tags.ts`): el registrador carga la copia local por tag y la del CDN
   nunca se ejecuta. `src/utils/build.ts` compila `src/kit-local` como entradas.
3. Se ajusta aquí con el ciclo corto de la app (build + gate + capturas en móvil, tablet y escritorio).
4. Cuando queda firme, el cambio se lleva a `iswc-base/src` (commit + push del kit) y, **cuando el `dist/` del kit
   se publique con él**, se sube el pin de la app (`deno task pin`), se borra esta copia y su entrada en `OVERRIDES_KIT`.

## Qué hay aquí y por qué

| Copia | Por qué |
| --- | --- |
| `data/ag-grid.ts` + `ag-grid.scss` + `utils/` + `schemas/` + `core/schemas/prefs.schemas.ts` | `coco-tabla` pasó de `iswc-data-grid` a `iswc-ag-grid` (la barra plana y los modales que se aprobaron en tk-lab). Ajustes del pie y la barra para que sea transversal en cualquier ancho: conteo «3 filas» / «3 de 10 filas» (sin el total repetido); con una sola página se ocultan el paginador **y** el selector de tamaño (por clase del pie: el atributo `hidden` no gana al `display` del host de `iswc-button`); flechas del paginador centradas (el `::part(button)` en flex y sin tamaño mínimo: en grid, los slots vacíos de prefijo y sufijo empujaban el ícono hacia abajo); pie que se parte en dos renglones con *container query* del ancho de la grilla (no de la ventana); búsqueda de una sola caja (la lupa en el slot `start` del `iswc-input`; el contenedor solo es la zona de soltar para agrupar, punteada únicamente mientras se arrastra encima); selector de tamaño sin la segunda caja. |

Estado: los ajustes ya están en `iswc-base/src` (commit del kit). Falta que el dueño publique el `dist/` del kit
(tiene trabajo propio a medias en `dist/`) para subir el pin y borrar esta copia.
