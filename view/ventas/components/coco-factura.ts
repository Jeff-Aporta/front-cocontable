// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-factura> — digitación de un documento con renglones: factura de venta (FV), tirilla POS, cotización (COT),
 * remisión (REM) o factura de compra (FC).
 *
 *   encabezado   numeración (FE / POS…), fecha, bodega, tercero (Consumidor final por defecto en ventas), forma de pago
 *   buscador     por nombre, referencia o código de barras: Enter agrega el producto (o suma 1 si ya está)
 *   renglones    cantidad, valor unitario, descuento %, IVA % y subtotal; quitar renglón
 *   totales      bruto, descuento, subtotal, IVA, retenciones y TOTAL A PAGAR; lo recibido y el cambio
 *   atajos       F9 finalizar · F4 limpiar · F2 descuento al último renglón · crear cliente y producto al vuelo
 *
 * Los valores que se muestran son un cálculo local para guiar a quien digita; los definitivos los liquida el API al
 * finalizar. Props: `clase`. Evento: `coco-documento` `{ documento }` al finalizar o guardar el borrador.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../../src/js/base/componente.js';
import { campo, detalle, selector } from '../../../src/js/base/controles.js';
import type { Fila } from '../../../src/js/consts/schemas/api.schemas.js';
import type { CocoFacturaProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { api, sesion } from '../../../src/js/core/api.js';
import { catalogo } from '../../../src/js/core/catalogos.js';
import { dinero, hoy, limpiarCache, listaCacheada, num, opcionesDe } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-ficha.js';

const CONSUMIDOR_FINAL = '222222222222';
const TITULOS: Record<string, string> = { FV: 'Factura de venta', POS: 'Punto de venta', COT: 'Cotización', REM: 'Remisión', FC: 'Factura de compra' };
const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

class CocoFactura extends Componente<CocoFacturaProps> {
  static tag = 'coco-factura';
  static css = css;
  static deps = ['iswc-button', 'iswc-input', 'iswc-select', 'iswc-icon', 'iswc-callout', 'iswc-dialog'];

  #cat: Record<string, Fila[]> = {};
  #cargado = '';
  #enc: Record<string, string> = {};
  #renglones: { producto: string; nombre: string; cantidad: number; precio: number; descuento_pct: number; iva_pct: number }[] = [];
  #retenciones = new Set<string>();
  #recibido = 0;
  #busqueda = '';
  #ocupado = false;
  #ficha: 'clientes' | 'proveedores' | 'productos' | null = null;
  #listo: Fila | null = null;

  protected override inicial(): CocoFacturaProps {
    return { clase: 'POS' };
  }

  override onConnected(): void {
    super.onConnected();
    window.addEventListener('coco:sesion', this.#recargar);
    this.addEventListener('keydown', this.#atajos);
  }

  override onDisconnected(): void {
    window.removeEventListener('coco:sesion', this.#recargar);
    this.removeEventListener('keydown', this.#atajos);
  }

  #recargar = (): void => {
    this.#cargado = '';
    this.props = {};
  };

  #atajos = (e: KeyboardEvent): void => {
    if (e.key === 'F9') {
      e.preventDefault();
      void this.#enviar(false);
    } else if (e.key === 'F4') {
      e.preventDefault();
      this.#limpiar();
    } else if (e.key === 'F2') {
      e.preventDefault();
      this.#descuento();
    }
  };

  get #compra(): boolean {
    return this.props.clase === 'FC';
  }

  #limpiar(): void {
    this.#renglones = [];
    this.#retenciones.clear();
    this.#recibido = 0;
    this.#busqueda = '';
    this.#listo = null;
    this.#enc = { fecha: hoy(), bodega: 'PRINC', tercero: this.#compra ? '' : CONSUMIDOR_FINAL, forma_pago: 'EFECTIVO', resolucion: '', observaciones: '' };
    this.props = {};
  }

  async #cargar(): Promise<void> {
    const e = sesion.empresa;
    const [terceros, productos, impuestos, formas, bodegas, resoluciones] = await Promise.all(['terceros', 'productos', 'impuestos', 'formas-pago', 'bodegas', 'resoluciones'].map((r) => listaCacheada(r, e)));
    this.#cat = { terceros: terceros ?? [], productos: productos ?? [], impuestos: impuestos ?? [], formas: formas ?? [], bodegas: bodegas ?? [], resoluciones: resoluciones ?? [] };
    this.props = {};
  }

  /** Descuento % al último renglón (atajo F2). */
  #descuento(): void {
    const ultimo = this.#renglones.at(-1);
    if (!ultimo) return;
    const v = prompt(`Descuento % para ${ultimo.nombre}`, String(ultimo.descuento_pct));
    if (v === null) return;
    ultimo.descuento_pct = Math.min(Math.max(Number(v) || 0, 0), 100);
    this.props = {};
  }

  /** Agrega el producto que coincide con lo buscado (código de barras o referencia exactos; si no, el primero por nombre). */
  #agregar(texto: string): void {
    const q = texto.trim().toLowerCase();
    if (!q) return;
    const lista = (this.#cat['productos'] ?? []).filter((p) => p['activo'] !== false && p['activo'] !== 0);
    const p = lista.find((x) => String(x['codigo_barras'] ?? '').toLowerCase() === q || String(x['codigo']).toLowerCase() === q) ?? lista.find((x) => String(x['nombre']).toLowerCase().includes(q));
    if (!p) {
      avisar(`No hay un producto que coincida con «${texto}». Puedes crearlo con el botón +.`, 'warning');
      return;
    }
    const codigo = String(p['codigo']);
    const previo = this.#renglones.find((r) => r.producto === codigo);
    if (previo) previo.cantidad += 1;
    else {
      const iva = num((this.#cat['impuestos'] ?? []).find((i) => i['codigo'] === p['impuesto'])?.['tarifa']);
      const bruto = this.#compra ? num(p['costo']) : num(p['precio_venta']);
      const precio = !this.#compra && (p['bprecio_incluye_iva'] === true || p['bprecio_incluye_iva'] === 1) ? r2(bruto / (1 + iva / 100)) : bruto;
      this.#renglones.push({ producto: codigo, nombre: String(p['nombre']), cantidad: 1, precio, descuento_pct: 0, iva_pct: iva });
    }
    this.#busqueda = '';
    this.props = {};
  }

  /** Totales locales (guía). */
  #totales(): Record<string, number> {
    let bruto = 0;
    let subtotal = 0;
    let iva = 0;
    for (const r of this.#renglones) {
      const b = r2(r.cantidad * r.precio);
      const base = r2(b * (1 - r.descuento_pct / 100));
      bruto += b;
      subtotal += base;
      iva += r2((base * r.iva_pct) / 100);
    }
    let retenido = 0;
    for (const codigo of this.#retenciones) {
      const imp = (this.#cat['impuestos'] ?? []).find((i) => i['codigo'] === codigo);
      const base = imp?.['tipo'] === 'RETEIVA' ? iva : subtotal;
      if (base >= num(imp?.['base_minima'])) retenido += r2((base * num(imp?.['tarifa'])) / 100);
    }
    return { bruto: r2(bruto), descuento: r2(bruto - subtotal), subtotal: r2(subtotal), iva: r2(iva), retenido: r2(retenido), total: r2(subtotal + iva - retenido) };
  }

  async #enviar(borrador: boolean): Promise<void> {
    if (this.#ocupado || this.#listo) return;
    if (!sesion.puedeEscribir) {
      window.dispatchEvent(new CustomEvent('coco:acceso'));
      return;
    }
    if (!this.#renglones.length) {
      avisar('Agrega al menos un producto.', 'warning');
      return;
    }
    if (!this.#enc['tercero']) {
      avisar(this.#compra ? 'Elige el proveedor.' : 'Elige el cliente.', 'warning');
      return;
    }
    const t = this.#totales();
    const credito = (this.#cat['formas'] ?? []).find((f) => f['codigo'] === this.#enc['forma_pago'])?.['tipo'] === 'credito';
    this.#ocupado = true;
    try {
      const cuerpo = { fecha: this.#enc['fecha'], tercero: this.#enc['tercero'], bodega: this.#enc['bodega'], forma_pago: this.#enc['forma_pago'], ...(this.#enc['resolucion'] ? { resolucion: this.#enc['resolucion'] } : {}), observaciones: this.#enc['observaciones'] ?? '', retenciones: [...this.#retenciones], borrador, ...(!credito && !this.#compra && this.#recibido > 0 ? { recibido: this.#recibido } : {}), renglones: this.#renglones.map((r) => ({ producto: r.producto, cantidad: r.cantidad, precio: r.precio, descuento_pct: r.descuento_pct, iva_pct: r.iva_pct })) };
      const doc = await api.objeto('POST', `documentos/${this.props.clase}`, cuerpo);
      limpiarCache();
      this.#listo = doc;
      avisar(borrador ? 'Borrador guardado' : `${TITULOS[this.props.clase] ?? 'Documento'} ${doc['numero_completo'] ?? ''} por ${dinero(doc['total'])}${num(doc['cambio']) > 0 ? ` · cambio ${dinero(doc['cambio'])}` : ''}`, 'success');
      this.emit('coco-documento', { documento: doc });
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo guardar', 'danger');
    }
    this.#ocupado = false;
    this.props = {};
  }

  async #guardarFicha(valores: Fila): Promise<void> {
    const tipo = this.#ficha;
    const def = tipo ? catalogo(tipo) : undefined;
    if (!tipo || !def) return;
    const ficha = this.shadow?.querySelector('coco-ficha');
    try {
      const creado = await api.objeto('POST', def.rutaUno, { ...valores, ...(def.fijos ?? {}) });
      limpiarCache();
      this.#ficha = null;
      await this.#cargar();
      if (tipo === 'productos') this.#agregar(String(creado['codigo'] ?? ''));
      else {
        this.#enc['tercero'] = String(creado['nit'] ?? '');
        this.props = {};
      }
    } catch (e) {
      if (ficha) Object.assign(ficha, { props: { guardando: false, error: e instanceof Error ? e.message : 'No se pudo guardar' } });
    }
  }

  protected override pintar(root: ShadowRoot, props: CocoFacturaProps): void {
    const clave = `${sesion.empresa}|${props.clase}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      this.#cat = {};
      this.#limpiar();
      void this.#cargar();
      return;
    }
    const venta = !this.#compra;
    const titulo = TITULOS[props.clase] ?? props.clase;
    if (this.#listo) {
      const d = this.#listo;
      root.append(html`
        <section class="hecho" part="hecho">
          <iswc-icon icon="mdi:check-decagram"></iswc-icon>
          <h1>${titulo} ${String(d['numero_completo'] ?? '')}</h1>
          <p class="total">${dinero(d['total'])}</p>
          ${num(d['cambio']) > 0 ? html`<p class="cambio">Recibido ${dinero(d['recibido'])} · <strong>Cambio ${dinero(d['cambio'])}</strong></p>` : null}
          <div class="fila">
            <iswc-button variant="outlined" onclick=${() => this.emit('coco-imprimir', { documento: d })}><iswc-icon slot="prefix" icon="mdi:printer"></iswc-icon>Imprimir tirilla</iswc-button>
            <iswc-button data-nueva onclick=${() => this.#limpiar()}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Nueva</iswc-button>
          </div>
        </section>`);
      return;
    }
    const set = (k: string) => (v: string) => {
      this.#enc[k] = v;
      this.props = {};
    };
    const terceros = (this.#cat['terceros'] ?? []).filter((t) => (venta ? t['es_cliente'] === true || t['es_cliente'] === 1 || t['nit'] === CONSUMIDOR_FINAL : t['es_proveedor'] === true || t['es_proveedor'] === 1));
    const resoluciones = (this.#cat['resoluciones'] ?? []).filter((r) => r['clase'] === props.clase);
    const retenciones = (this.#cat['impuestos'] ?? []).filter((i) => ['RETEFUENTE', 'RETEIVA', 'RETEICA'].includes(String(i['tipo'])));
    const t = this.#totales();
    const credito = (this.#cat['formas'] ?? []).find((f) => f['codigo'] === this.#enc['forma_pago'])?.['tipo'] === 'credito';
    const numero = (r: { cantidad: number; precio: number; descuento_pct: number; iva_pct: number }, k: 'cantidad' | 'precio' | 'descuento_pct' | 'iva_pct', ancho: string) =>
      campo('', 'number', r[k], (v) => { r[k] = Math.max(Number(v) || 0, 0); this.props = {}; }, { class: ancho, min: '0', 'aria-label': k });
    root.append(html`
      <header class="barra">
        <h1 class="titulo"><iswc-icon icon=${venta ? 'mdi:cash-register' : 'mdi:cart'}></iswc-icon>${titulo}<span class="estado">Pendiente</span></h1>
        <span class="atajos">F9 finalizar · F4 limpiar · F2 descuento</span>
      </header>
      ${sesion.puedeEscribir ? null : html`<iswc-callout class="aviso-demo" color="warning">Estás en la empresa de muestra: puedes armar el documento, pero para guardarlo inicia sesión.</iswc-callout>`}
      <section class="encabezado" part="encabezado">
        ${resoluciones.length > 1 ? selector('Numeración', opcionesDe(resoluciones, 'iresolucion', 'nombre'), this.#enc['resolucion'] || String(resoluciones[0]?.['iresolucion'] ?? ''), set('resolucion')) : null}
        ${campo('Fecha', 'date', this.#enc['fecha'] ?? hoy(), set('fecha'))}
        ${selector('Bodega', opcionesDe(this.#cat['bodegas'] ?? [], 'codigo', 'nombre'), this.#enc['bodega'] ?? 'PRINC', set('bodega'))}
        <div class="con-boton">${selector(venta ? 'Cliente' : 'Proveedor', opcionesDe(terceros, 'nit', 'nombre'), this.#enc['tercero'] ?? '', set('tercero'), { 'data-tercero': '' })}<iswc-button variant="outlined" title=${venta ? 'Crear cliente' : 'Crear proveedor'} data-crear-tercero onclick=${() => { this.#ficha = venta ? 'clientes' : 'proveedores'; this.props = {}; }}><iswc-icon icon="mdi:account-plus"></iswc-icon></iswc-button></div>
        ${selector('Forma de pago', opcionesDe(this.#cat['formas'] ?? [], 'codigo', 'nombre'), this.#enc['forma_pago'] ?? 'EFECTIVO', set('forma_pago'))}
      </section>
      <section class="buscador">
        <div class="con-boton">
          <iswc-input data-buscar label="Buscar producto o leer código de barras" placeholder="Nombre, referencia o código de barras y Enter" value=${this.#busqueda} oniswc-enter=${(e: Event) => this.#agregar(String(Object(e.target)['value'] ?? ''))}></iswc-input>
          <iswc-button variant="outlined" title="Crear producto" data-crear-producto onclick=${() => { this.#ficha = 'productos'; this.props = {}; }}><iswc-icon icon="mdi:package-variant-plus"></iswc-icon></iswc-button>
        </div>
      </section>
      <section class="renglones" part="renglones">
        <div class="fila-r cabecera"><span>Producto</span><span>Cant.</span><span>Vr. unitario</span><span>Desc. %</span><span>IVA %</span><span class="der">Subtotal</span><span></span></div>
        ${this.#renglones.length
          ? this.#renglones.map((r, i) => html`<div class="fila-r" data-renglon=${r.producto}><span class="producto"><strong>${r.nombre}</strong><small>${r.producto}</small></span>${numero(r, 'cantidad', 'n')}${numero(r, 'precio', 'n')}${numero(r, 'descuento_pct', 'n')}${numero(r, 'iva_pct', 'n')}<span class="der">${dinero(r2(r.cantidad * r.precio * (1 - r.descuento_pct / 100)))}</span><button class="quitar" type="button" title="Quitar" onclick=${() => { this.#renglones.splice(i, 1); this.props = {}; }}><iswc-icon icon="mdi:close"></iswc-icon></button></div>`)
          : html`<p class="vacio">Busca un producto para empezar. Con un lector, solo pasa el código de barras.</p>`}
      </section>
      <section class="pie" part="pie">
        <div class="lado">
          ${retenciones.length ? html`<div class="retenciones"><span class="rotulo">Retenciones</span>${retenciones.map((i) => { const codigo = String(i['codigo']); return html`<label class="check"><input type="checkbox" ?checked=${this.#retenciones.has(codigo)} onchange=${() => { if (this.#retenciones.has(codigo)) this.#retenciones.delete(codigo); else this.#retenciones.add(codigo); this.props = {}; }}>${String(i['nombre'])}</label>`; })}</div>` : null}
          ${campo('Observaciones', 'text', this.#enc['observaciones'] ?? '', (v) => { this.#enc['observaciones'] = v; })}
        </div>
        <dl class="totales" part="totales">
          <dt>Total bruto</dt><dd>${dinero(t['bruto'])}</dd>
          <dt>Descuento</dt><dd>${dinero(t['descuento'])}</dd>
          <dt>Subtotal</dt><dd>${dinero(t['subtotal'])}</dd>
          <dt>IVA</dt><dd>${dinero(t['iva'])}</dd>
          <dt>Retenciones</dt><dd>${dinero(t['retenido'])}</dd>
          <dt class="grande">Total a pagar</dt><dd class="grande" data-total>${dinero(t['total'])}</dd>
          ${venta && !credito && props.clase !== 'COT' && props.clase !== 'REM' ? html`<dt>Recibido</dt><dd>${campo('', 'number', this.#recibido || '', (v) => { this.#recibido = Number(v) || 0; this.props = {}; }, { class: 'recibido', min: '0', 'aria-label': 'Recibido', placeholder: 'Efectivo recibido' })}</dd><dt>Cambio</dt><dd data-cambio>${dinero(Math.max(this.#recibido - (t['total'] ?? 0), 0))}</dd>` : null}
        </dl>
      </section>
      <footer class="acciones">
        <iswc-button variant="text" color="danger" onclick=${() => this.#limpiar()}>F4 · Limpiar</iswc-button>
        ${props.clase === 'FV' ? html`<iswc-button variant="outlined" onclick=${() => void this.#enviar(true)}>Guardar pendiente</iswc-button>` : null}
        <iswc-button data-finalizar size="lg" ?loading=${this.#ocupado} onclick=${() => void this.#enviar(false)}>F9 · Finalizar</iswc-button>
      </footer>
      <coco-ficha oncoco-cerrar=${() => { this.#ficha = null; this.props = {}; }} oncoco-guardar=${(e: Event) => void this.#guardarFicha(Object(detalle(e)['valores']))}></coco-ficha>
    `);
    const def = this.#ficha ? catalogo(this.#ficha) : undefined;
    const ficha = root.querySelector('coco-ficha');
    if (ficha) Object.assign(ficha, { props: { titulo: def ? `Crear ${def.singular}` : '', campos: def?.campos ?? [], valores: {}, alta: true, abierta: !!def, eliminable: false, guardando: false, error: '' } });
  }
}

define(CocoFactura);
