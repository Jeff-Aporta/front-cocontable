// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-documentos> — lista de documentos de una o varias clases (facturas, tirillas, cotizaciones, remisiones, notas
 * crédito, compras, recibos, egresos, ajustes de inventario) con su estado, y el detalle de cada uno con sus acciones:
 * imprimir tirilla, finalizar un pendiente, anular y hacer la nota crédito de una venta.
 *
 * «Nuevo» abre la digitación: `<coco-factura>` para documentos con productos, o una ficha corta para recibos de caja,
 * egresos (un concepto contable) y ajustes de inventario. Props: `clases` (separadas por coma) y `nuevo` (clase a crear).
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../../src/js/base/componente.js';
import { detalle, selector } from '../../../src/js/base/controles.js';
import type { CampoEntrada, Fila } from '../../../src/js/consts/schemas/api.schemas.js';
import { CampoSchema } from '../../../src/js/consts/schemas/api.schemas.js';
import type { CocoDocumentosProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { api, sesion } from '../../../src/js/core/api.js';
import { imprimirTirilla } from '../../../src/js/core/tirilla.js';
import { dinero, hoy, limpiarCache } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-ficha.js';
import '../../../src/js/components/coco/coco-tabla.js';
import './coco-factura.js';

const TITULOS: Record<string, string> = { 'FV,POS': 'Facturas de venta', COT: 'Cotizaciones', REM: 'Remisiones', NCV: 'Notas crédito', FC: 'Facturas de compra', RC: 'Recibos de caja', CE: 'Comprobantes de egreso', AI: 'Ajustes de inventario' };
const CON_PRODUCTOS = new Set(['FV', 'POS', 'COT', 'REM', 'FC']);
const tercero: CampoEntrada = { nombre: 'tercero', etiqueta: 'Tercero', tipo: 'opcion', requerido: true, fuente: { ruta: 'terceros', valor: 'nit', texto: 'nombre' } };
const forma: CampoEntrada = { nombre: 'forma_pago', etiqueta: 'Forma de pago', tipo: 'opcion', requerido: true, defecto: 'EFECTIVO', fuente: { ruta: 'formas-pago', valor: 'codigo', texto: 'nombre' } };
const concepto = (etiqueta: string): CampoEntrada[] => [{ nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoy() }, tercero, forma, { nombre: 'cuenta', etiqueta, tipo: 'opcion', requerido: true, fuente: { ruta: 'cuentas', valor: 'codigo', texto: 'nombre' }, ayuda: 'Debe ser una cuenta auxiliar.' }, { nombre: 'detalle', etiqueta: 'Detalle', requerido: true }, { nombre: 'valor', etiqueta: 'Valor', tipo: 'dinero', requerido: true }, { nombre: 'observaciones', etiqueta: 'Observaciones' }];
/** Fichas cortas de los documentos sin renglones de producto. */
const FICHAS: Record<string, { titulo: string; campos: CampoEntrada[] }> = {
  RC: { titulo: 'Nuevo recibo de caja (otros ingresos)', campos: concepto('Cuenta del ingreso') },
  CE: { titulo: 'Nuevo comprobante de egreso (gasto)', campos: concepto('Cuenta del gasto') },
  AI: { titulo: 'Nuevo ajuste de inventario', campos: [{ nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoy() }, { nombre: 'producto', etiqueta: 'Producto', tipo: 'opcion', requerido: true, fuente: { ruta: 'productos', valor: 'codigo', texto: 'nombre' } }, { nombre: 'cantidad', etiqueta: 'Cantidad (negativa para sacar)', tipo: 'numero', requerido: true }, { nombre: 'costo_unitario', etiqueta: 'Costo unitario (solo entradas)', tipo: 'dinero' }, { nombre: 'observaciones', etiqueta: 'Observaciones', defecto: 'Inventario inicial' }] },
};

class CocoDocumentos extends Componente<CocoDocumentosProps> {
  static tag = 'coco-documentos';
  static css = css;
  static deps = ['iswc-button', 'iswc-icon', 'iswc-dialog', 'iswc-select', 'iswc-tag'];

  #filas: Fila[] = [];
  #cargando = true;
  #cargado = '';
  #estado = '';
  #nuevo = false;
  #abierto: Fila | null = null;

  protected override inicial(): CocoDocumentosProps {
    return { clases: 'FV,POS', nuevo: 'FV' };
  }

  override onConnected(): void {
    super.onConnected();
    window.addEventListener('coco:sesion', this.#recargar);
  }

  override onDisconnected(): void {
    window.removeEventListener('coco:sesion', this.#recargar);
  }

  #recargar = (): void => {
    this.#cargado = '';
    this.props = {};
  };

  async #cargar(props: CocoDocumentosProps): Promise<void> {
    this.#cargando = true;
    try {
      this.#filas = (await api.lista(`documentos?clase=${encodeURIComponent(props.clases)}${this.#estado ? `&estado=${this.#estado}` : ''}`)).map((d) => ({ ...d, numero: d['numero'] ? `${d['prefijo'] ?? ''}${d['numero']}` : 'Pendiente' }));
    } catch (e) {
      this.#filas = [];
      avisar(e instanceof Error ? e.message : 'No se pudo cargar', 'danger');
    }
    this.#cargando = false;
    this.props = {};
  }

  async #abrir(id: unknown): Promise<void> {
    try {
      this.#abierto = await api.objeto('GET', `documento/${id}`);
      this.props = {};
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo abrir', 'danger');
    }
  }

  /** Corre una acción del detalle (anular, finalizar, nota crédito) y refresca. */
  async #accion(ruta: string, pregunta: string, cuerpo: Fila = {}): Promise<void> {
    if (!this.#abierto || !confirm(pregunta)) return;
    try {
      const r = await api.objeto('POST', `documento/${this.#abierto['id']}/${ruta}`, cuerpo);
      limpiarCache();
      avisar('Listo', 'success');
      this.#abierto = r['eliminado'] ? null : ruta === 'nota-credito' ? this.#abierto : r;
      await this.#cargar(this.props);
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo completar', 'danger');
    }
  }

  async #guardarCorto(clase: string, v: Fila): Promise<void> {
    const ficha = this.shadow?.querySelector('coco-ficha');
    try {
      if (clase === 'AI') await api.post('inventario/ajuste', { fecha: v['fecha'], observaciones: v['observaciones'] ?? '', renglones: [{ producto: v['producto'], cantidad: v['cantidad'], ...(Number(v['costo_unitario']) > 0 ? { costo_unitario: v['costo_unitario'] } : {}) }] });
      else await api.post(`pagos/${clase}`, { fecha: v['fecha'], tercero: v['tercero'], forma_pago: v['forma_pago'], observaciones: v['observaciones'] ?? '', conceptos: [{ cuenta: v['cuenta'], detalle: v['detalle'], valor: v['valor'] }] });
      limpiarCache();
      this.#nuevo = false;
      avisar('Documento registrado', 'success');
      await this.#cargar(this.props);
    } catch (e) {
      if (ficha) Object.assign(ficha, { props: { guardando: false, error: e instanceof Error ? e.message : 'No se pudo guardar' } });
    }
  }

  #imprimir(doc: Fila): void {
    const e = sesion.perfil?.empresas.find((x) => x.iempresa === sesion.empresa);
    imprimirTirilla(doc, { nombre: e?.nombre ?? 'CoContable', nit: e?.nit, dv: e?.dv, ciudad: e?.ciudad });
  }

  #detalle(d: Fila): Node {
    const renglones = document.createElement('coco-tabla');
    Object.assign(renglones, { props: { columnas: [{ campo: 'producto', titulo: 'Ref.', tipo: 'texto', ancho: 110 }, { campo: 'descripcion', titulo: 'Descripción', tipo: 'texto' }, { campo: 'cantidad', titulo: 'Cant.', tipo: 'numero', ancho: 90 }, { campo: 'precio', titulo: 'Vr. unit.', tipo: 'dinero', ancho: 120 }, { campo: 'base', titulo: 'Subtotal', tipo: 'dinero', ancho: 130 }], filas: Array.isArray(d['renglones']) ? d['renglones'] : [], vacio: 'Sin renglones.' } });
    const venta = d['clase'] === 'FV' || d['clase'] === 'POS';
    const escribe = sesion.puedeEscribir;
    const finalizado = d['estado'] === 'finalizado';
    return html`
      <iswc-dialog open label=${`${d['clase']} ${d['numero_completo']} · ${d['estado']}`} oniswc-after-hide=${() => { this.#abierto = null; this.props = {}; }}>
        <dl class="resumen">
          <dt>Fecha</dt><dd>${String(d['fecha'])}</dd>
          <dt>Tercero</dt><dd>${String(d['tercero_nombre'] ?? d['tercero'])}</dd>
          <dt>Forma de pago</dt><dd>${String(d['forma_pago'] ?? '—')}</dd>
          <dt>Subtotal</dt><dd>${dinero(d['subtotal'])}</dd>
          <dt>IVA</dt><dd>${dinero(d['iva'])}</dd>
          <dt>Total</dt><dd class="total">${dinero(d['total'])}</dd>
        </dl>
        ${renglones}
        ${escribe && finalizado ? html`<iswc-button slot="footer" variant="text" color="danger" data-anular onclick=${() => void this.#accion('anular', 'Anular el documento revierte inventario, cartera y contabilidad. ¿Continuar?')}>Anular</iswc-button>` : null}
        ${escribe && d['estado'] === 'borrador' ? html`<iswc-button slot="footer" variant="text" color="danger" onclick=${() => void this.#accion('anular', '¿Eliminar este pendiente?')}>Eliminar</iswc-button><iswc-button slot="footer" onclick=${() => void this.#accion('finalizar', '¿Finalizar y contabilizar este documento?')}>Finalizar</iswc-button>` : null}
        ${escribe && finalizado && venta ? html`<iswc-button slot="footer" variant="outlined" onclick=${() => void this.#accion('nota-credito', 'Se hará una nota crédito por todo lo que falte por devolver. ¿Continuar?', { fecha: hoy() })}>Nota crédito</iswc-button>` : null}
        <iswc-button slot="footer" variant="outlined" data-imprimir onclick=${() => this.#imprimir(d)}><iswc-icon slot="prefix" icon="mdi:printer"></iswc-icon>Imprimir</iswc-button>
      </iswc-dialog>`;
  }

  protected override pintar(root: ShadowRoot, props: CocoDocumentosProps): void {
    const clave = `${sesion.empresa}|${props.clases}|${this.#estado}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      void this.#cargar(props);
    }
    const titulo = TITULOS[props.clases] ?? 'Documentos';
    if (this.#nuevo && CON_PRODUCTOS.has(props.nuevo)) {
      const factura = document.createElement('coco-factura');
      Object.assign(factura, { props: { clase: props.nuevo } });
      factura.addEventListener('coco-imprimir', (e) => this.#imprimir(Object(detalle(e)['documento'])));
      root.append(html`<iswc-button class="volver" variant="text" onclick=${() => { this.#nuevo = false; this.#cargado = ''; this.props = {}; }}><iswc-icon slot="prefix" icon="mdi:arrow-left"></iswc-icon>Volver a ${titulo.toLowerCase()}</iswc-button>${factura}`);
      return;
    }
    const tabla = document.createElement('coco-tabla');
    Object.assign(tabla, { props: { columnas: [{ campo: 'clase', titulo: 'Tipo', tipo: 'texto', ancho: 80 }, { campo: 'numero', titulo: 'Número', tipo: 'texto', ancho: 120 }, { campo: 'fecha', titulo: 'Fecha', tipo: 'fecha', ancho: 120 }, { campo: 'tercero', titulo: 'NIT / CC', tipo: 'texto', ancho: 140 }, { campo: 'tercero_nombre', titulo: 'Tercero', tipo: 'texto' }, { campo: 'estado', titulo: 'Estado', tipo: 'estado', ancho: 120 }, { campo: 'total', titulo: 'Total', tipo: 'dinero', ancho: 140 }], filas: this.#filas, vacio: `Aún no hay ${titulo.toLowerCase()}.` } });
    tabla.addEventListener('coco-fila', (e) => void this.#abrir(Object(detalle(e)['fila'])['id']));
    root.append(html`
      <header class="barra">
        <h1 class="titulo"><iswc-icon icon="mdi:receipt-text"></iswc-icon>${titulo}</h1>
        ${selector('', [{ valor: '', texto: 'Todos los estados' }, { valor: 'finalizado', texto: 'Finalizados' }, { valor: 'borrador', texto: 'Pendientes' }, { valor: 'anulado', texto: 'Anulados' }], this.#estado, (v) => { this.#estado = v; this.props = {}; }, { class: 'filtro', 'aria-label': 'Estado' })}
        ${props.nuevo && sesion.puedeEscribir ? html`<iswc-button data-nuevo onclick=${() => { this.#nuevo = true; this.props = {}; }}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Nuevo</iswc-button>` : null}
      </header>
      ${this.#cargando ? html`<p class="aviso">Cargando…</p>` : tabla}
      ${this.#abierto ? this.#detalle(this.#abierto) : null}
      <coco-ficha oncoco-cerrar=${() => { this.#nuevo = false; this.props = {}; }} oncoco-guardar=${(e: Event) => void this.#guardarCorto(props.nuevo, Object(detalle(e)['valores']))}></coco-ficha>
    `);
    const corta = FICHAS[props.nuevo];
    const ficha = root.querySelector('coco-ficha');
    if (ficha) Object.assign(ficha, { props: { titulo: corta?.titulo ?? '', campos: (corta?.campos ?? []).map((c) => CampoSchema.parse(c)), valores: {}, alta: true, abierta: this.#nuevo && !!corta, eliminable: false, guardando: false, error: '' } });
  }
}

define(CocoDocumentos);
