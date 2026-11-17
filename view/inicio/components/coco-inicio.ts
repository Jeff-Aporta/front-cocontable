// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-inicio> — tablero de inicio: una tarjeta por módulo (ventas, inventario, clientes, proveedores, vendedores,
 * empleados, compras, gastos, cartera por cobrar y por pagar, cotizaciones, notas crédito, ingresos y egresos) con la
 * cifra del mes; la gráfica de ingresos, costos y gastos de los últimos meses; y los últimos documentos.
 * Cada tarjeta abre su módulo (evento de ventana `coco:abrir`). Datos: `GET tablero` de la empresa activa.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, html } from '../../../src/js/base/componente.js';
import type { Fila } from '../../../src/js/consts/schemas/api.schemas.js';
import type { SinProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { DEMO, api, sesion } from '../../../src/js/core/api.js';
import { dinero, num } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-tabla.js';

const objeto = (v: unknown): Fila => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v)) : {});
const lista = (v: unknown): Fila[] => (Array.isArray(v) ? v.map(objeto) : []);

class CocoInicio extends Componente<SinProps> {
  static tag = 'coco-inicio';
  static css = css;
  static deps = ['iswc-stat', 'iswc-bar-chart', 'iswc-icon', 'iswc-callout', 'iswc-button'];

  #datos: Fila | null = null;
  #error = '';
  #cargado = '';

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

  async #cargar(): Promise<void> {
    try {
      this.#datos = await api.objeto('GET', 'tablero');
      this.#error = '';
    } catch (e) {
      this.#datos = null;
      this.#error = e instanceof Error ? e.message : 'No se pudo cargar el tablero';
    }
    this.props = {};
  }

  protected override pintar(root: ShadowRoot): void {
    if (this.#cargado !== sesion.empresa) {
      this.#cargado = sesion.empresa;
      this.#datos = null;
      void this.#cargar();
    }
    const empresa = sesion.perfil?.empresas.find((e) => e.iempresa === sesion.empresa);
    const abrir = (id: string) => window.dispatchEvent(new CustomEvent('coco:abrir', { detail: { id } }));
    root.append(html`<header class="barra"><h1 class="titulo"><iswc-icon icon="mdi:home"></iswc-icon>${empresa?.nombre ?? 'Inicio'}</h1></header>`);
    if (sesion.empresa === DEMO) root.append(html`<iswc-callout class="demo" color="brand"><strong slot="title">Estás viendo la empresa de muestra</strong>Puedes recorrer todo con datos de ejemplo. Para llevar tu propia contabilidad, crea tu cuenta gratis.<iswc-button slot="actions" size="sm" onclick=${() => window.dispatchEvent(new CustomEvent('coco:acceso'))}>Iniciar sesión o crear cuenta</iswc-button></iswc-callout>`);
    if (this.#error) {
      root.append(html`<p class="aviso">${this.#error}</p>`);
      return;
    }
    if (!this.#datos) {
      root.append(html`<p class="aviso">Cargando el tablero…</p>`);
      return;
    }
    const t = objeto(this.#datos['tarjetas']);
    const total = (k: string) => dinero(objeto(t[k])['total']);
    const cuantos = (k: string) => `${num(objeto(t[k])['n'])} este mes`;
    const tarjetas: [string, string, string, string, string, string][] = [
      ['facturas', 'Ventas', total('ventas'), cuantos('ventas'), 'mdi:cash-register', 'brand'],
      ['productos', 'Inventario', dinero(objeto(t['inventario'])['costo']), `${num(objeto(t['inventario'])['unidades'])} unidades`, 'mdi:barcode', 'neutral'],
      ['clientes', 'Clientes', String(num(t['clientes'])), 'activos', 'mdi:account-group', 'success'],
      ['proveedores', 'Proveedores', String(num(t['proveedores'])), 'activos', 'mdi:truck-delivery', 'danger'],
      ['vendedores', 'Vendedores', String(num(t['vendedores'])), 'activos', 'mdi:account-tie', 'brand'],
      ['empleados', 'Empleados', String(num(t['empleados'])), 'activos', 'mdi:badge-account', 'success'],
      ['compras', 'Compras', total('compras'), cuantos('compras'), 'mdi:cart', 'neutral'],
      ['egresos', 'Gastos', dinero(t['gastos']), 'del mes', 'mdi:currency-usd', 'warning'],
      ['cxc', 'Cartera por cobrar', dinero(t['cartera_cxc']), `${dinero(t['cartera_cxc_mora'])} en mora`, 'mdi:hand-coin', 'warning'],
      ['cxp', 'Cartera por pagar', dinero(t['cartera_cxp']), `${dinero(t['cartera_cxp_mora'])} en mora`, 'mdi:credit-card-clock', 'danger'],
      ['caja', 'Cierre de caja', 'Hoy', 'cuadra tu efectivo', 'mdi:safe', 'success'],
      ['cotizaciones', 'Cotizaciones', total('cotizaciones'), cuantos('cotizaciones'), 'mdi:file-document-edit', 'brand'],
      ['notas-credito', 'Notas crédito', total('notas_credito'), cuantos('notas_credito'), 'mdi:file-undo', 'neutral'],
      ['ingresos', 'Ingresos', total('ingresos'), cuantos('ingresos'), 'mdi:cash-plus', 'success'],
    ];
    root.append(html`<div class="tarjetas" part="tarjetas">${tarjetas.map(([id, rotulo, valor, apoyo, icono, color]) => html`<button class="tarjeta" type="button" data-modulo=${id} onclick=${() => abrir(id)}><iswc-stat label=${rotulo} value=${valor} helper=${apoyo} icon=${icono} color=${color}></iswc-stat></button>`)}</div>`);
    const serie = lista(this.#datos['serie']);
    // iswc-bar-chart (no <iswc-chart type="bar">): el genérico solo pinta barras si el módulo de barras ya registró su
    // dibujante; sin él quedan los ejes sin marcas (auditoría del 2026-11-17).
    const grafica = document.createElement('iswc-bar-chart');
    grafica.setAttribute('label', 'Ingresos, costos y gastos por mes');
    const config = { type: 'bar', data: { labels: serie.map((s) => String(s['mes'])), datasets: [{ label: 'Ingresos', data: serie.map((s) => num(s['ingresos'])) }, { label: 'Costos', data: serie.map((s) => num(s['costos'])) }, { label: 'Gastos', data: serie.map((s) => num(s['gastos'])) }] } };
    // el módulo llega perezoso: asignar `config` antes de definirse dejaría una propiedad propia que tapa el setter
    void customElements.whenDefined('iswc-bar-chart').then(() => Object.assign(grafica, { config }));
    const ultimos = document.createElement('coco-tabla');
    Object.assign(ultimos, { props: { columnas: [{ campo: 'numero', titulo: 'Número', tipo: 'texto', ancho: 110 }, { campo: 'fecha', titulo: 'Fecha', tipo: 'fecha', ancho: 120 }, { campo: 'tercero_nombre', titulo: 'Tercero', tipo: 'texto' }, { campo: 'total', titulo: 'Total', tipo: 'dinero', ancho: 140 }], filas: lista(this.#datos['ultimos']), vacio: 'Aún no hay documentos.' } });
    root.append(html`<div class="dos"><section class="bloque"><h2>Últimos meses</h2>${grafica}</section><section class="bloque"><h2>Últimos documentos</h2>${ultimos}</section></div>`);
  }
}

define(CocoInicio);
