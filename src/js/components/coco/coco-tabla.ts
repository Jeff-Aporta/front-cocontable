// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * <coco-tabla> — tabla de datos de CoContable sobre `<iswc-data-grid>` del kit: recibe columnas declarativas (texto,
 * dinero, número, fecha, sí/no, estado) y filas del API, y avisa la fila elegida. No conoce ninguna ruta del API.
 *
 * Props: `columnas`, `filas`, `vacio` (texto cuando no hay filas). Evento: `coco-fila` `{ fila }` al hacer clic.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, html } from '../../base/componente.js';
import type { CocoTablaProps } from '../../consts/schemas/componentes.schemas.js';
import { celda } from '../../core/ui.js';

class CocoTabla extends Componente<CocoTablaProps> {
  static tag = 'coco-tabla';
  static css = css;
  static deps = ['iswc-data-grid', 'iswc-empty-state'];

  protected override inicial(): CocoTablaProps {
    return { columnas: [], filas: [], vacio: 'No hay registros todavía.' };
  }

  protected override pintar(root: ShadowRoot, props: CocoTablaProps): void {
    if (!props.filas.length) {
      root.append(html`<iswc-empty-state part="vacio" icon="mdi:tray" heading=${props.vacio}></iswc-empty-state>`);
      return;
    }
    const numerico = new Set(['dinero', 'numero']);
    const grid = document.createElement('iswc-data-grid');
    grid.setAttribute('part', 'tabla');
    grid.setAttribute('density', 'compact');
    grid.setAttribute('pagination', '');
    grid.setAttribute('page-size', '25');
    Object.assign(grid, {
      columns: props.columnas.map((c) => ({ field: c.campo, headerName: c.titulo, ...(c.ancho ? { width: c.ancho } : { flex: 1 }), align: numerico.has(c.tipo) ? 'right' : 'left', valueFormatter: (valor: unknown) => celda(valor, c.tipo) })),
      rows: props.filas.map((f, i) => ({ ...f, id: i })),
    });
    grid.addEventListener('iswc-row-click', (e) => {
      const detalle: unknown = e instanceof CustomEvent ? e.detail : null;
      const id = detalle && typeof detalle === 'object' && 'id' in detalle ? Number(detalle.id) : NaN;
      const fila = props.filas[id];
      if (fila) this.emit('coco-fila', { fila });
    });
    root.append(grid);
  }
}

define(CocoTabla);
