// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * tirilla.ts — imprime un documento como tirilla de 80 mm (POS) usando el diálogo de impresión del navegador.
 * Es un documento de impresión aparte (en un iframe oculto), no interfaz de la app: por eso arma su propio HTML,
 * siempre con los textos escapados.
 */
import type { Fila } from '../consts/schemas/api.schemas.js';
import { dinero, num } from './ui.js';

const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NOMBRES: Record<string, string> = { FV: 'FACTURA DE VENTA', POS: 'TIQUETE POS', COT: 'COTIZACIÓN', REM: 'REMISIÓN', NCV: 'NOTA CRÉDITO', FC: 'FACTURA DE COMPRA', RC: 'RECIBO DE CAJA', CE: 'COMPROBANTE DE EGRESO', AI: 'AJUSTE DE INVENTARIO' };

/** HTML de la tirilla de un documento (el que devuelve `GET documento/{id}`) para la empresa dada. */
export function htmlTirilla(doc: Fila, empresa: { nombre: string; nit?: string | null | undefined; dv?: string | null | undefined; ciudad?: string | null | undefined }): string {
  const renglones = Array.isArray(doc['renglones']) ? doc['renglones'] : [];
  const linea = (rotulo: string, valor: unknown, fuerte = false) => (num(valor) || fuerte ? `<tr class="${fuerte ? 'fuerte' : ''}"><td>${esc(rotulo)}</td><td class="der">${esc(dinero(valor))}</td></tr>` : '');
  const filas = renglones.map((r) => {
    const f: Fila = r && typeof r === 'object' ? Object.fromEntries(Object.entries(r)) : {};
    return `<tr><td colspan="2">${esc(f['producto_nombre'] ?? f['descripcion'])}</td></tr><tr><td>${esc(num(f['cantidad']))} x ${esc(dinero(f['precio']))}${num(f['descuento_pct']) ? ` (-${esc(num(f['descuento_pct']))}%)` : ''}</td><td class="der">${esc(dinero(f['base']))}</td></tr>`;
  }).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(doc['numero_completo'])}</title><style>
    @page { size: 80mm auto; margin: 4mm; }
    body { width: 72mm; margin: 0 auto; font: 12px/1.35 ui-monospace, Consolas, monospace; color: #000; }
    h1 { margin: 0; font-size: 15px; text-align: center; }
    p { margin: 2px 0; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    td { padding: 1px 0; vertical-align: top; }
    .der { text-align: right; white-space: nowrap; }
    .fuerte td { padding-top: 4px; border-top: 1px dashed #000; font-size: 15px; font-weight: 700; }
    hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  </style></head><body>
    <h1>${esc(empresa.nombre)}</h1>
    ${empresa.nit ? `<p>NIT ${esc(empresa.nit)}${empresa.dv ? `-${esc(empresa.dv)}` : ''}</p>` : ''}
    ${empresa.ciudad ? `<p>${esc(empresa.ciudad)}</p>` : ''}
    <hr><p><strong>${esc(NOMBRES[String(doc['clase'])] ?? doc['clase'])} ${esc(doc['numero_completo'])}</strong></p>
    <p>${esc(doc['fecha'])} · ${esc(doc['forma_pago'] ?? '')}</p>
    <p>${esc(doc['tercero_nombre'] ?? '')} · ${esc(doc['tercero'] ?? '')}</p>
    <table>${filas}</table>
    <table>${linea('Subtotal', doc['subtotal'])}${linea('IVA', doc['iva'])}${linea('Impuesto al consumo', doc['inc'])}${linea('Retefuente', doc['retefuente'])}${linea('ReteIVA', doc['reteiva'])}${linea('ReteICA', doc['reteica'])}${linea('TOTAL', doc['total'], true)}${linea('Recibido', doc['recibido'])}${linea('Cambio', doc['cambio'])}</table>
    <hr><p>${doc['estado'] === 'anulado' ? '*** ANULADO ***' : 'Gracias por su compra'}</p><p>CoContable</p>
  </body></html>`;
}

/** Abre el diálogo de impresión con la tirilla del documento. */
export function imprimirTirilla(doc: Fila, empresa: { nombre: string; nit?: string | null | undefined; dv?: string | null | undefined; ciudad?: string | null | undefined }): void {
  const marco = document.createElement('iframe');
  marco.setAttribute('aria-hidden', 'true');
  marco.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  marco.srcdoc = htmlTirilla(doc, empresa);
  marco.addEventListener('load', () => {
    marco.contentWindow?.focus();
    marco.contentWindow?.print();
    setTimeout(() => marco.remove(), 60_000);
  });
  document.body.append(marco);
}
