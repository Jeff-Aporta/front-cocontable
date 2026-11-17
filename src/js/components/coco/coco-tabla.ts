// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * <coco-tabla> — tabla de datos de CoContable sobre `<iswc-ag-grid>` del kit: recibe columnas declarativas (texto,
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
  static deps = ['iswc-ag-grid', 'iswc-empty-state'];

  protected override inicial(): CocoTablaProps {
    return { columnas: [], filas: [], vacio: 'No hay registros todavía.' };
  }

  protected override pintar(root: ShadowRoot, props: CocoTablaProps): void {
    if (!props.filas.length) {
      root.append(html`<iswc-empty-state part="vacio" icon="mdi:tray" heading=${props.vacio}></iswc-empty-state>`);
      return;
    }
    const numerico = new Set(['dinero', 'numero']);
    // ancho mínimo por tipo: en pantallas angostas la grilla se desplaza en horizontal en vez de recortar las cifras
    const MINIMO: Record<string, number> = { dinero: 130, numero: 90, fecha: 110, texto: 150 };
    const grid = document.createElement('iswc-ag-grid');
    grid.setAttribute('part', 'tabla');
    grid.setAttribute('density', 'compact');
    grid.setAttribute('pagination', '');
    grid.setAttribute('page-size', '25');
    const filas = props.filas.map((f, i) => ({ ...f, id: i }));
    const columnas = props.columnas.map((c) => ({ field: c.campo, headerName: c.titulo, minWidth: Math.min(c.ancho ?? 999, MINIMO[c.tipo] ?? 100), ...(c.ancho ? { width: c.ancho } : { flex: 1 }), align: numerico.has(c.tipo) ? 'right' : 'left', valueFormatter: (p: unknown) => celda(p && typeof p === 'object' && 'value' in p ? p.value : p, c.tipo) }));
    // el módulo (copia local o del kit) llega perezoso: asignar antes de definirse taparía los setters
    void customElements.whenDefined('iswc-ag-grid').then(() => Object.assign(grid, { columnDefs: columnas, rowData: filas }));
    grid.addEventListener('iswc-cell-click', (e) => {
      const detalle: unknown = e instanceof CustomEvent ? e.detail : null;
      const fila = detalle && typeof detalle === 'object' && 'row' in detalle && detalle.row && typeof detalle.row === 'object' && 'id' in detalle.row ? props.filas[Number(detalle.row.id)] : undefined;
      if (fila) this.emit('coco-fila', { fila });
    });
    root.append(grid);
  }
}

define(CocoTabla);
