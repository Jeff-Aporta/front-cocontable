// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-cartera> — cartera por cobrar (CxC) o por pagar (CxP): búsqueda por nombre o razón social, totales (Total,
 * Abonado, Saldo, En mora), documentos pendientes con su edad, historial de abonos y el abono a un documento
 * (genera un recibo de caja en CxC o un comprobante de egreso en CxP). Props: `tipo`.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../../src/js/base/componente.js';
import { detalle, valorEvento } from '../../../src/js/base/controles.js';
import type { Fila } from '../../../src/js/consts/schemas/api.schemas.js';
import { CampoSchema } from '../../../src/js/consts/schemas/api.schemas.js';
import type { CocoCarteraProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { api, sesion } from '../../../src/js/core/api.js';
import { dinero, hoy, limpiarCache, num } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-ficha.js';
import '../../../src/js/components/coco/coco-tabla.js';

class CocoCartera extends Componente<CocoCarteraProps> {
  static tag = 'coco-cartera';
  static css = css;
  static deps = ['iswc-button', 'iswc-icon', 'iswc-input', 'iswc-stat', 'iswc-dialog'];

  #datos: Fila | null = null;
  #cargado = '';
  #q = '';
  #abonar: Fila | null = null;
  #historial: Fila[] | null = null;

  protected override inicial(): CocoCarteraProps {
    return { tipo: 'CxC' };
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

  async #cargar(tipo: string): Promise<void> {
    try {
      this.#datos = await api.objeto('GET', `cartera/${tipo}${this.#q ? `?q=${encodeURIComponent(this.#q)}` : ''}`);
    } catch (e) {
      this.#datos = { documentos: [] };
      avisar(e instanceof Error ? e.message : 'No se pudo cargar', 'danger');
    }
    this.props = {};
  }

  async #verHistorial(tipo: string): Promise<void> {
    this.#historial = await api.lista(`cartera/${tipo}/abonos`).catch(() => []);
    this.props = {};
  }

  async #guardarAbono(tipo: string, v: Fila): Promise<void> {
    const doc = this.#abonar;
    const ficha = this.shadow?.querySelector('coco-ficha');
    if (!doc) return;
    try {
      await api.post(`pagos/${tipo === 'CxC' ? 'RC' : 'CE'}`, { fecha: v['fecha'], tercero: doc['tercero'], forma_pago: v['forma_pago'], observaciones: v['observaciones'] ?? '', abonos: [{ cartera_id: doc['id'], valor: v['valor'] }] });
      limpiarCache();
      this.#abonar = null;
      avisar('Abono registrado', 'success');
      await this.#cargar(tipo);
    } catch (e) {
      if (ficha) Object.assign(ficha, { props: { guardando: false, error: e instanceof Error ? e.message : 'No se pudo guardar' } });
    }
  }

  protected override pintar(root: ShadowRoot, props: CocoCarteraProps): void {
    const clave = `${sesion.empresa}|${props.tipo}|${this.#q}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      void this.#cargar(props.tipo);
    }
    const cobrar = props.tipo === 'CxC';
    const d = this.#datos;
    const tabla = document.createElement('coco-tabla');
    Object.assign(tabla, { props: { columnas: [{ campo: 'documento', titulo: 'Documento', tipo: 'texto', ancho: 120 }, { campo: 'tercero_nombre', titulo: cobrar ? 'Cliente' : 'Proveedor', tipo: 'texto' }, { campo: 'fecha', titulo: 'Fecha', tipo: 'fecha', ancho: 115 }, { campo: 'vence', titulo: 'Vence', tipo: 'fecha', ancho: 115 }, { campo: 'valor', titulo: 'Total', tipo: 'dinero', ancho: 130 }, { campo: 'abonado', titulo: 'Abonado', tipo: 'dinero', ancho: 130 }, { campo: 'saldo', titulo: 'Saldo', tipo: 'dinero', ancho: 130 }, { campo: 'rango', titulo: 'Mora (días)', tipo: 'texto', ancho: 120 }], filas: Array.isArray(d?.['documentos']) ? d['documentos'] : [], vacio: this.#q ? 'No se encontraron registros.' : `No hay cuentas por ${cobrar ? 'cobrar' : 'pagar'} pendientes.` } });
    tabla.addEventListener('coco-fila', (e) => {
      if (!sesion.puedeEscribir) return;
      this.#abonar = Object(detalle(e)['fila']);
      this.props = {};
    });
    const historial = document.createElement('coco-tabla');
    Object.assign(historial, { props: { columnas: [{ campo: 'fecha', titulo: 'Fecha', tipo: 'fecha', ancho: 115 }, { campo: 'recibo', titulo: cobrar ? 'Recibo' : 'Egreso', tipo: 'texto', ancho: 110 }, { campo: 'documento', titulo: 'Abona a', tipo: 'texto', ancho: 110 }, { campo: 'tercero_nombre', titulo: 'Tercero', tipo: 'texto' }, { campo: 'valor', titulo: 'Valor', tipo: 'dinero', ancho: 130 }], filas: this.#historial ?? [], vacio: 'Aún no hay abonos.' } });
    root.append(html`
      <header class="barra">
        <h1 class="titulo"><iswc-icon icon=${cobrar ? 'mdi:hand-coin' : 'mdi:credit-card-clock'}></iswc-icon>Cartera por ${cobrar ? 'cobrar' : 'pagar'}</h1>
        <iswc-input class="buscar" placeholder="Nombre o razón social" clearable value=${this.#q} oniswc-typing-end=${(e: Event) => { this.#q = valorEvento(e).trim(); this.props = {}; }}></iswc-input>
        <iswc-button variant="outlined" data-historial onclick=${() => void this.#verHistorial(props.tipo)}><iswc-icon slot="prefix" icon="mdi:history"></iswc-icon>Historial de abonos</iswc-button>
      </header>
      <div class="totales" part="totales">
        <iswc-stat label="Total" value=${dinero(d?.['total'])} color="neutral" icon="mdi:sigma"></iswc-stat>
        <iswc-stat label="Abonado" value=${dinero(d?.['abonado'])} color="success" icon="mdi:cash-check"></iswc-stat>
        <iswc-stat label="Saldo" value=${dinero(d?.['saldo'])} color="brand" icon="mdi:scale-balance"></iswc-stat>
        <iswc-stat label="En mora" value=${dinero(d?.['en_mora'])} color=${num(d?.['en_mora']) > 0 ? 'danger' : 'neutral'} icon="mdi:alert-circle"></iswc-stat>
      </div>
      ${d ? tabla : html`<p class="aviso">Cargando…</p>`}
      ${sesion.puedeEscribir && d ? html`<p class="pista">Haz clic en un documento para registrarle un abono.</p>` : null}
      ${this.#historial ? html`<iswc-dialog open label="Historial de abonos" oniswc-after-hide=${() => { this.#historial = null; this.props = {}; }}>${historial}</iswc-dialog>` : null}
      <coco-ficha oncoco-cerrar=${() => { this.#abonar = null; this.props = {}; }} oncoco-guardar=${(e: Event) => void this.#guardarAbono(props.tipo, Object(detalle(e)['valores']))}></coco-ficha>
    `);
    const doc = this.#abonar;
    const campos = [{ nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoy() }, { nombre: 'valor', etiqueta: `Valor del abono (saldo ${dinero(doc?.['saldo'])})`, tipo: 'dinero', requerido: true, defecto: num(doc?.['saldo']) }, { nombre: 'forma_pago', etiqueta: 'Forma de pago', tipo: 'opcion', requerido: true, defecto: 'EFECTIVO', fuente: { ruta: 'formas-pago', valor: 'codigo', texto: 'nombre' } }, { nombre: 'observaciones', etiqueta: 'Observaciones' }].map((c) => CampoSchema.parse(c));
    const ficha = root.querySelector('coco-ficha');
    if (ficha) Object.assign(ficha, { props: { titulo: doc ? `Abono a ${doc['documento']} · ${doc['tercero_nombre']}` : '', campos, valores: {}, alta: true, abierta: !!doc, eliminable: false, guardando: false, error: '' } });
  }
}

define(CocoCartera);
