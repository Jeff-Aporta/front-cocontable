// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-informes> — todos los informes en una pantalla: lista por grupo (Contables, Terceros, Ventas, Compras, Cartera,
 * Inventario, Cierre de caja) a la izquierda; a la derecha los parámetros del informe elegido, sus totales, la tabla y
 * «Exportar a Excel» (CSV con punto y coma). La lista sale de `GET informes`; los parámetros de cada uno se declaran
 * aquí (`PARAMETROS`). Sin props.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, html } from '../../../src/js/base/componente.js';
import { campo, opciones, selector } from '../../../src/js/base/controles.js';
import type { Columna, Fila, Opcion } from '../../../src/js/consts/schemas/api.schemas.js';
import { ColumnaSchema } from '../../../src/js/consts/schemas/api.schemas.js';
import type { SinProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { api, sesion } from '../../../src/js/core/api.js';
import { aCsv, descargar, dinero, hoy, inicioAnio, listaCacheada, opcionesDe } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-tabla.js';

type Parametro = { nombre: string; etiqueta: string; tipo: 'fecha' | 'texto' | 'opcion'; defecto?: () => string; opciones?: Opcion[]; fuente?: [string, string, string] };

const desde: Parametro = { nombre: 'desde', etiqueta: 'Desde', tipo: 'fecha', defecto: inicioAnio };
const hasta: Parametro = { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'fecha', defecto: hoy };
const por = (...pares: [string, string][]): Parametro => ({ nombre: 'por', etiqueta: 'Agrupar por', tipo: 'opcion', defecto: () => pares[0]?.[0] ?? '', opciones: opciones(...pares) });
const tercero: Parametro = { nombre: 'tercero', etiqueta: 'Tercero', tipo: 'opcion', fuente: ['terceros', 'nit', 'nombre'] };
const AGRUPAR: [string, string][] = [['dia', 'Día'], ['mes', 'Mes'], ['producto', 'Producto'], ['tercero', 'Tercero'], ['vendedor', 'Vendedor'], ['forma_pago', 'Forma de pago']];

/** Parámetros y columnas de cada informe (nombre = el de `GET informes/{nombre}`). */
const PARAMETROS: Record<string, { parametros: Parametro[]; columnas: [string, string, string?][]; lista?: string; totales?: [string, string][] }> = {
  'balance-prueba': { parametros: [desde, hasta, { nombre: 'nivel', etiqueta: 'Nivel', tipo: 'opcion', defecto: () => '5', opciones: opciones(['1', 'Clase'], ['2', 'Grupo'], ['3', 'Cuenta'], ['4', 'Subcuenta'], ['5', 'Auxiliar']) }], columnas: [['codigo', 'Código'], ['nombre', 'Cuenta'], ['anterior', 'Saldo anterior', 'dinero'], ['debito', 'Débitos', 'dinero'], ['credito', 'Créditos', 'dinero'], ['saldo', 'Saldo', 'dinero']], totales: [['total_debito', 'Débitos'], ['total_credito', 'Créditos']] },
  auxiliar: { parametros: [desde, hasta, { nombre: 'cuenta', etiqueta: 'Cuenta', tipo: 'opcion', fuente: ['cuentas', 'codigo', 'nombre'] }, tercero], columnas: [['fecha', 'Fecha'], ['comprobante', 'Comprobante'], ['cuenta', 'Cuenta'], ['tercero_nombre', 'Tercero'], ['detalle', 'Detalle'], ['debito', 'Débito', 'dinero'], ['credito', 'Crédito', 'dinero'], ['saldo', 'Saldo', 'dinero']], totales: [['saldo_anterior', 'Saldo anterior'], ['saldo_final', 'Saldo final']] },
  'libro-diario': { parametros: [desde, hasta], columnas: [['fecha', 'Fecha'], ['tipo', 'Tipo'], ['numero', 'Número'], ['cuenta', 'Cuenta'], ['cuenta_nombre', 'Nombre'], ['detalle', 'Detalle'], ['debito', 'Débito', 'dinero'], ['credito', 'Crédito', 'dinero']], totales: [['total_debito', 'Débitos'], ['total_credito', 'Créditos']] },
  'estado-resultados': { parametros: [desde, hasta], columnas: [['seccion', 'Sección'], ['codigo', 'Código'], ['nombre', 'Cuenta'], ['valor', 'Valor', 'dinero']], totales: [['total_ingresos', 'Ingresos'], ['total_costos', 'Costos'], ['total_gastos', 'Gastos'], ['utilidad', 'Utilidad']] },
  'balance-general': { parametros: [hasta], columnas: [['seccion', 'Sección'], ['codigo', 'Código'], ['nombre', 'Cuenta'], ['valor', 'Valor', 'dinero']], totales: [['total_activo', 'Activo'], ['total_pasivo', 'Pasivo'], ['total_patrimonio', 'Patrimonio']] },
  terceros: { parametros: [{ nombre: 'rol', etiqueta: 'Rol', tipo: 'opcion', opciones: opciones(['cliente', 'Clientes'], ['proveedor', 'Proveedores'], ['empleado', 'Empleados'], ['vendedor', 'Vendedores']) }, { nombre: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto' }, { nombre: 'tipo_persona', etiqueta: 'Tipo de persona', tipo: 'opcion', opciones: opciones(['PN', 'Natural'], ['PJ', 'Jurídica']) }, { nombre: 'tipo_contribuyente', etiqueta: 'Tipo de contribuyente', tipo: 'opcion', opciones: opciones(['responsable_iva', 'Responsable de IVA'], ['no_responsable_iva', 'No responsable de IVA'], ['regimen_simple', 'Régimen simple'], ['gran_contribuyente', 'Gran contribuyente']) }], columnas: [['nit', 'Documento'], ['dv', 'DV'], ['nombre', 'Nombre'], ['tipo_persona', 'Persona'], ['tipo_contribuyente', 'Contribuyente'], ['ciudad', 'Ciudad'], ['telefono', 'Teléfono'], ['email', 'Correo']] },
  ventas: { parametros: [desde, hasta, por(...AGRUPAR)], columnas: [['grupo', 'Grupo'], ['nombre', 'Nombre'], ['documentos', 'Documentos', 'numero'], ['cantidad', 'Cantidad', 'numero'], ['subtotal', 'Subtotal', 'dinero'], ['iva', 'IVA', 'dinero'], ['total', 'Total', 'dinero'], ['utilidad', 'Utilidad', 'dinero']], totales: [['total', 'Total vendido']] },
  compras: { parametros: [desde, hasta, por(...AGRUPAR)], columnas: [['grupo', 'Grupo'], ['nombre', 'Nombre'], ['documentos', 'Documentos', 'numero'], ['cantidad', 'Cantidad', 'numero'], ['subtotal', 'Subtotal', 'dinero'], ['iva', 'IVA', 'dinero'], ['total', 'Total', 'dinero']], totales: [['total', 'Total comprado']] },
  'cartera-cxc': { parametros: [tercero, { nombre: 'corte', etiqueta: 'Corte', tipo: 'fecha', defecto: hoy }], lista: 'documentos', columnas: [['documento', 'Documento'], ['tercero_nombre', 'Cliente'], ['fecha', 'Fecha'], ['vence', 'Vence'], ['valor', 'Total', 'dinero'], ['abonado', 'Abonado', 'dinero'], ['saldo', 'Saldo', 'dinero'], ['rango', 'Edad']], totales: [['total', 'Total'], ['abonado', 'Abonado'], ['saldo', 'Saldo'], ['en_mora', 'En mora']] },
  'cartera-cxp': { parametros: [tercero, { nombre: 'corte', etiqueta: 'Corte', tipo: 'fecha', defecto: hoy }], lista: 'documentos', columnas: [['documento', 'Documento'], ['tercero_nombre', 'Proveedor'], ['fecha', 'Fecha'], ['vence', 'Vence'], ['valor', 'Total', 'dinero'], ['abonado', 'Abonado', 'dinero'], ['saldo', 'Saldo', 'dinero'], ['rango', 'Edad']], totales: [['total', 'Total'], ['abonado', 'Abonado'], ['saldo', 'Saldo'], ['en_mora', 'En mora']] },
  existencias: { parametros: [{ nombre: 'bodega', etiqueta: 'Bodega', tipo: 'opcion', fuente: ['bodegas', 'codigo', 'nombre'] }, { nombre: 'q', etiqueta: 'Producto', tipo: 'texto' }], columnas: [['codigo', 'Referencia'], ['nombre', 'Producto'], ['categoria', 'Categoría'], ['cantidad', 'Existencia', 'numero'], ['promedio', 'Costo promedio', 'dinero'], ['costo', 'Valor', 'dinero'], ['precio_venta', 'Precio de venta', 'dinero']], totales: [['total_costo', 'Valor del inventario']] },
  kardex: { parametros: [{ nombre: 'producto', etiqueta: 'Producto', tipo: 'opcion', fuente: ['productos', 'codigo', 'nombre'] }, desde, hasta], columnas: [['fecha', 'Fecha'], ['documento', 'Documento'], ['bodega', 'Bodega'], ['entrada', 'Entrada', 'numero'], ['salida', 'Salida', 'numero'], ['saldo_cantidad', 'Saldo', 'numero'], ['promedio', 'Costo promedio', 'dinero'], ['saldo_costo', 'Valor', 'dinero']], totales: [['saldo_costo', 'Valor final']] },
  'cierre-caja': { parametros: [{ nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', defecto: hoy }], lista: 'detalle', columnas: [['clase', 'Documento'], ['forma_pago', 'Forma de pago'], ['n', 'Cantidad', 'numero'], ['valor', 'Valor', 'dinero']], totales: [['efectivo', 'Efectivo'], ['otros', 'Otros medios'], ['egresos', 'Egresos']] },
};

/** Los informes por secciones (estado de resultados y balance general) se aplanan a una sola lista con su sección. */
function filasDe(nombre: string, datos: Fila, lista: string): Fila[] {
  const de = (clave: string): Fila[] => (Array.isArray(datos[clave]) ? datos[clave].map((f: unknown) => Object(f)) : []);
  if (nombre === 'estado-resultados') return [...de('ingresos').map((f) => ({ seccion: 'Ingresos', ...f })), ...de('costos').map((f) => ({ seccion: 'Costos', ...f })), ...de('gastos').map((f) => ({ seccion: 'Gastos', ...f }))];
  if (nombre === 'balance-general') return [...de('activo').map((f) => ({ seccion: 'Activo', ...f })), ...de('pasivo').map((f) => ({ seccion: 'Pasivo', ...f })), ...de('patrimonio').map((f) => ({ seccion: 'Patrimonio', ...f })), { seccion: 'Patrimonio', codigo: '', nombre: 'Resultado del ejercicio', valor: datos['resultado_ejercicio'] }];
  return de(lista);
}

class CocoInformes extends Componente<SinProps> {
  static tag = 'coco-informes';
  static css = css;
  static deps = ['iswc-button', 'iswc-icon', 'iswc-input', 'iswc-select', 'iswc-stat'];

  #lista: Fila[] = [];
  #actual = 'balance-prueba';
  #valores: Record<string, string> = {};
  #datos: Fila | null = null;
  #cargando = false;
  #empresa = '';
  #fuentes: Record<string, Opcion[]> = {};

  override onConnected(): void {
    super.onConnected();
    window.addEventListener('coco:sesion', this.#recargar);
  }

  override onDisconnected(): void {
    window.removeEventListener('coco:sesion', this.#recargar);
  }

  #recargar = (): void => {
    this.#empresa = '';
    this.props = {};
  };

  async #iniciar(): Promise<void> {
    this.#lista = await api.lista('informes').catch(() => []);
    this.#elegir(this.#actual);
  }

  #elegir(nombre: string): void {
    this.#actual = nombre;
    const def = PARAMETROS[nombre];
    this.#valores = Object.fromEntries((def?.parametros ?? []).map((p) => [p.nombre, p.defecto?.() ?? '']));
    this.#datos = null;
    for (const p of def?.parametros ?? []) {
      const f = p.fuente;
      if (f && !this.#fuentes[f[0]]) void listaCacheada(f[0], sesion.empresa).then((l) => { this.#fuentes[f[0]] = opcionesDe(l, f[1], f[2]); this.props = {}; });
    }
    void this.#generar();
  }

  async #generar(): Promise<void> {
    this.#cargando = true;
    this.props = {};
    const q = new URLSearchParams(Object.entries(this.#valores).filter(([, v]) => v));
    try {
      this.#datos = await api.objeto('GET', `informes/${this.#actual}?${q}`);
    } catch (e) {
      this.#datos = { error: e instanceof Error ? e.message : 'No se pudo generar' };
    }
    this.#cargando = false;
    this.props = {};
  }

  protected override pintar(root: ShadowRoot): void {
    if (this.#empresa !== sesion.empresa) {
      this.#empresa = sesion.empresa;
      this.#fuentes = {};
      void this.#iniciar();
    }
    const def = PARAMETROS[this.#actual];
    const grupos = [...new Set(this.#lista.map((i) => String(i['grupo'])))];
    const titulo = String(this.#lista.find((i) => i['nombre'] === this.#actual)?.['titulo'] ?? 'Informes');
    const columnas: Columna[] = (def?.columnas ?? []).map(([c, t, tipo]) => ColumnaSchema.parse({ campo: c, titulo: t, tipo: tipo ?? 'texto' }));
    const filas = this.#datos ? filasDe(this.#actual, this.#datos, def?.lista ?? 'lineas') : [];
    const usadas = columnas.filter((c) => filas.some((f) => f[c.campo] !== undefined && f[c.campo] !== null));
    const tabla = document.createElement('coco-tabla');
    Object.assign(tabla, { props: { columnas: usadas.length ? usadas : columnas, filas, vacio: 'El informe no tiene datos con estos parámetros.' } });
    const cambiar = (nombre: string) => (v: string) => { this.#valores[nombre] = v; };
    const control = (p: Parametro) => p.tipo === 'opcion'
      ? selector(p.etiqueta, [{ valor: '', texto: 'Todos' }, ...(p.opciones ?? (p.fuente ? this.#fuentes[p.fuente[0]] ?? [] : []))], this.#valores[p.nombre] ?? '', cambiar(p.nombre))
      : campo(p.etiqueta, p.tipo === 'fecha' ? 'date' : 'text', this.#valores[p.nombre] ?? '', cambiar(p.nombre));
    root.append(html`
      <div class="marco">
        <nav class="indice" aria-label="Informes">
          <h1 class="titulo"><iswc-icon icon="mdi:chart-box"></iswc-icon>Informes</h1>
          ${grupos.map((g) => html`<section class="grupo"><h2>${g}</h2>${this.#lista.filter((i) => i['grupo'] === g).map((i) => html`<button class="item" type="button" data-informe=${String(i['nombre'])} ?data-actual=${i['nombre'] === this.#actual} onclick=${() => this.#elegir(String(i['nombre']))}>${String(i['titulo'])}</button>`)}</section>`)}
        </nav>
        <section class="informe" part="informe">
          <header class="barra">
            <h2 class="nombre">${titulo}</h2>
            <iswc-button variant="outlined" data-exportar onclick=${() => descargar(`${this.#actual}-${hoy()}.csv`, aCsv(filas, usadas.length ? usadas : columnas))}><iswc-icon slot="prefix" icon="mdi:microsoft-excel"></iswc-icon>Exportar a Excel</iswc-button>
          </header>
          <form class="parametros" onsubmit=${(e: Event) => { e.preventDefault(); void this.#generar(); }}>
            ${(def?.parametros ?? []).map(control)}
            <iswc-button data-generar ?loading=${this.#cargando} onclick=${() => void this.#generar()}>Generar</iswc-button>
          </form>
          ${this.#datos?.['error'] ? html`<p class="aviso">${String(this.#datos['error'])}</p>` : null}
          ${this.#datos && !this.#datos['error'] && def?.totales ? html`<div class="totales">${def.totales.map(([k, t]) => html`<iswc-stat label=${t} value=${dinero(this.#datos?.[k])} color="neutral"></iswc-stat>`)}${this.#actual === 'balance-general' ? html`<iswc-stat label="¿Cuadra?" value=${this.#datos['cuadra'] ? 'Sí' : 'No'} color=${this.#datos['cuadra'] ? 'success' : 'danger'}></iswc-stat>` : null}</div>` : null}
          ${this.#datos && !this.#datos['error'] ? tabla : this.#cargando ? html`<p class="aviso">Generando…</p>` : null}
        </section>
      </div>
    `);
  }
}

define(CocoInformes);
