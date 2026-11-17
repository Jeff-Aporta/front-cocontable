// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-comprobantes> — comprobantes contables (los asientos). Lista con filtros por tipo y estado; y el editor:
 * tipo de comprobante, fecha, tercero, centro de costo, y los renglones (cuenta, tercero, detalle, débito, crédito) con
 * el botón «Agregar». Muestra totales y la DIFERENCIA en vivo: con diferencia se puede guardar como pendiente, pero no
 * finalizar. Un pendiente se edita o elimina; un finalizado solo se anula. Sin props.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../../src/js/base/componente.js';
import { campo, detalle, selector } from '../../../src/js/base/controles.js';
import type { Fila, Opcion } from '../../../src/js/consts/schemas/api.schemas.js';
import type { SinProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { api, sesion } from '../../../src/js/core/api.js';
import { dinero, hoy, listaCacheada, num, opcionesDe } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-tabla.js';

type Renglon = { cuenta: string; tercero: string; detalle: string; debito: number; credito: number };
const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

class CocoComprobantes extends Componente<SinProps> {
  static tag = 'coco-comprobantes';
  static css = css;
  static deps = ['iswc-button', 'iswc-icon', 'iswc-input', 'iswc-select', 'iswc-callout'];

  #filas: Fila[] = [];
  #cargado = '';
  #filtro: Record<string, string> = { tipo: '', estado: '' };
  #cat: Record<string, Opcion[]> = { tipos: [], cuentas: [], terceros: [], centros: [] };
  #editor: { id?: number; estado: string; numero: string; tipo: string; fecha: string; tercero: string; cc: string; observaciones: string; renglones: Renglon[] } | null = null;
  #nuevo: Renglon = { cuenta: '', tercero: '', detalle: '', debito: 0, credito: 0 };
  #ocupado = false;

  override onConnected(): void {
    super.onConnected();
    window.addEventListener('coco:sesion', this.#recargar);
  }

  override onDisconnected(): void {
    window.removeEventListener('coco:sesion', this.#recargar);
  }

  #recargar = (): void => {
    this.#cargado = '';
    this.#editor = null;
    this.props = {};
  };

  async #cargar(): Promise<void> {
    const e = sesion.empresa;
    const q = new URLSearchParams(Object.entries(this.#filtro).filter(([, v]) => v));
    const [filas, tipos, cuentas, terceros, centros] = await Promise.all([api.lista(`comprobantes?${q}`).catch(() => []), listaCacheada('tipos-comprobante', e), listaCacheada('cuentas', e), listaCacheada('terceros', e), listaCacheada('centros-costo', e)]);
    this.#filas = filas.map((c) => ({ ...c, numero: c['numero'] ? `${c['tipo']}-${c['numero']}` : 'Pendiente' }));
    this.#cat = { tipos: opcionesDe(tipos.filter((t) => t['bmanual'] === true || t['bmanual'] === 1), 'codigo', 'nombre'), cuentas: opcionesDe(cuentas.filter((c) => c['auxiliar'] === true || c['auxiliar'] === 1), 'codigo', 'nombre'), terceros: opcionesDe(terceros, 'nit', 'nombre'), centros: opcionesDe(centros, 'codigo', 'nombre') };
    this.props = {};
  }

  #crear(): void {
    this.#editor = { estado: 'borrador', numero: 'Pendiente', tipo: this.#cat['tipos']?.find((t) => t.valor === 'NC-1')?.valor ?? this.#cat['tipos']?.[0]?.valor ?? 'NC-1', fecha: hoy(), tercero: '', cc: '', observaciones: '', renglones: [] };
    this.#nuevo = { cuenta: '', tercero: '', detalle: '', debito: 0, credito: 0 };
    this.props = {};
  }

  async #abrir(id: unknown): Promise<void> {
    try {
      const c = await api.objeto('GET', `comprobante/${id}`);
      const movimientos = Array.isArray(c['movimientos']) ? c['movimientos'].map((m: unknown) => Object(m)) : [];
      this.#editor = { id: num(c['id']), estado: String(c['estado']), numero: String(c['numero_completo']), tipo: String(c['tipo']), fecha: String(c['fecha']), tercero: String(c['tercero'] ?? ''), cc: String(c['cc'] ?? ''), observaciones: String(c['observaciones'] ?? ''), renglones: movimientos.map((m: Fila) => ({ cuenta: String(m['cuenta']), tercero: String(m['tercero'] ?? ''), detalle: String(m['detalle'] ?? ''), debito: num(m['debito']), credito: num(m['credito']) })) };
      this.props = {};
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo abrir', 'danger');
    }
  }

  #agregar(): void {
    const n = this.#nuevo;
    const ed = this.#editor;
    if (!ed) return;
    if (!n.cuenta) return avisar('Elige la cuenta contable.', 'warning');
    if ((n.debito > 0) === (n.credito > 0)) return avisar('Escribe un valor en débito o en crédito (solo en uno).', 'warning');
    ed.renglones.push({ ...n, tercero: n.tercero || ed.tercero });
    this.#nuevo = { cuenta: '', tercero: '', detalle: n.detalle, debito: 0, credito: 0 };
    this.props = {};
  }

  async #guardar(finalizar: boolean): Promise<void> {
    const ed = this.#editor;
    if (!ed || this.#ocupado) return;
    this.#ocupado = true;
    try {
      const c = await api.objeto('POST', 'comprobantes', { ...(ed.id ? { id: ed.id } : {}), tipo: ed.tipo, fecha: ed.fecha, tercero: ed.tercero || null, cc: ed.cc || null, observaciones: ed.observaciones, finalizar, movimientos: ed.renglones.map((r) => ({ cuenta: r.cuenta, tercero: r.tercero || null, cc: ed.cc || null, detalle: r.detalle, debito: r.debito, credito: r.credito })) });
      avisar(finalizar ? `Comprobante ${c['numero_completo']} finalizado` : 'Guardado como pendiente', 'success');
      this.#editor = null;
      this.#cargado = '';
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo guardar', 'danger');
    }
    this.#ocupado = false;
    this.props = {};
  }

  async #accion(metodo: 'POST' | 'DELETE', ruta: string, pregunta: string): Promise<void> {
    if (!confirm(pregunta)) return;
    try {
      await api.objeto(metodo, ruta);
      avisar('Listo', 'success');
      this.#editor = null;
      this.#cargado = '';
      this.props = {};
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo completar', 'danger');
    }
  }

  #pintarEditor(root: ShadowRoot): void {
    const ed = this.#editor;
    if (!ed) return;
    const editable = ed.estado === 'borrador' && sesion.puedeEscribir;
    const debito = r2(ed.renglones.reduce((a, r) => a + r.debito, 0));
    const credito = r2(ed.renglones.reduce((a, r) => a + r.credito, 0));
    const diferencia = r2(debito - credito);
    const nombre = (lista: Opcion[] | undefined, valor: string) => lista?.find((o) => o.valor === valor)?.texto ?? valor;
    const repintar = () => { this.props = {}; };
    const n = this.#nuevo;
    root.append(html`
      <iswc-button class="volver" variant="text" onclick=${() => { this.#editor = null; repintar(); }}><iswc-icon slot="prefix" icon="mdi:arrow-left"></iswc-icon>Volver a comprobantes</iswc-button>
      <header class="barra">
        <h1 class="titulo"><iswc-icon icon="mdi:book-open-variant"></iswc-icon>Comprobante contable <span class="estado" data-estado=${ed.estado}>${ed.numero} · ${ed.estado}</span></h1>
        ${diferencia !== 0 ? html`<span class="diferencia" data-diferencia>Diferencia ${dinero(diferencia)}</span>` : html`<span class="cuadra" data-diferencia>Cuadrado</span>`}
        <span class="total">Total ${dinero(debito)}</span>
      </header>
      <section class="encabezado">
        ${editable ? selector('Tipo de comprobante', this.#cat['tipos'] ?? [], ed.tipo, (v) => { ed.tipo = v; }) : html`<p class="dato"><small>Tipo</small>${nombre(this.#cat['tipos'], ed.tipo)}</p>`}
        ${editable ? campo('Fecha de elaboración', 'date', ed.fecha, (v) => { ed.fecha = v; }) : html`<p class="dato"><small>Fecha</small>${ed.fecha}</p>`}
        ${editable ? selector('Tercero', this.#cat['terceros'] ?? [], ed.tercero, (v) => { ed.tercero = v; }, { clearable: '' }) : html`<p class="dato"><small>Tercero</small>${nombre(this.#cat['terceros'], ed.tercero) || '—'}</p>`}
        ${editable ? selector('Centro de costo', this.#cat['centros'] ?? [], ed.cc, (v) => { ed.cc = v; }, { clearable: '' }) : html`<p class="dato"><small>Centro de costo</small>${nombre(this.#cat['centros'], ed.cc) || '—'}</p>`}
      </section>
      ${editable ? html`<section class="nuevo" part="nuevo">
        ${selector('Cuenta contable', this.#cat['cuentas'] ?? [], n.cuenta, (v) => { n.cuenta = v; }, { 'data-cuenta': '' })}
        ${campo('Detalle', 'text', n.detalle, (v) => { n.detalle = v; }, { 'data-detalle': '' })}
        ${campo('Débito', 'number', n.debito || '', (v) => { n.debito = Number(v) || 0; }, { min: '0', 'data-debito': '' })}
        ${campo('Crédito', 'number', n.credito || '', (v) => { n.credito = Number(v) || 0; }, { min: '0', 'data-credito': '' })}
        <iswc-button data-agregar onclick=${() => this.#agregar()}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Agregar</iswc-button>
      </section>` : null}
      <section class="renglones" part="renglones">
        <div class="fila-r cabecera"><span>Cuenta contable</span><span>Tercero</span><span>Detalle</span><span class="der">Débito</span><span class="der">Crédito</span><span></span></div>
        ${ed.renglones.length ? ed.renglones.map((r, i) => html`<div class="fila-r" data-renglon=${r.cuenta}><span>${nombre(this.#cat['cuentas'], r.cuenta)}</span><span>${nombre(this.#cat['terceros'], r.tercero) || '—'}</span><span>${r.detalle}</span><span class="der">${r.debito ? dinero(r.debito) : ''}</span><span class="der">${r.credito ? dinero(r.credito) : ''}</span>${editable ? html`<button class="quitar" type="button" title="Quitar" onclick=${() => { ed.renglones.splice(i, 1); repintar(); }}><iswc-icon icon="mdi:close"></iswc-icon></button>` : html`<span></span>`}</div>`) : html`<p class="vacio">Agrega el primer renglón: una cuenta con su valor al débito o al crédito.</p>`}
        <div class="fila-r totales"><span>Totales</span><span></span><span></span><span class="der" data-debitos>${dinero(debito)}</span><span class="der" data-creditos>${dinero(credito)}</span><span></span></div>
      </section>
      ${editable ? campo('Observaciones', 'text', ed.observaciones, (v) => { ed.observaciones = v; }, { class: 'observaciones' }) : html`<p class="dato"><small>Observaciones</small>${ed.observaciones || '—'}</p>`}
      <footer class="acciones">
        ${editable && ed.id ? html`<iswc-button variant="text" color="danger" onclick=${() => void this.#accion('DELETE', `comprobante/${ed.id}`, '¿Eliminar este comprobante pendiente?')}>Eliminar</iswc-button>` : null}
        ${ed.estado === 'finalizado' && sesion.puedeEscribir ? html`<iswc-button variant="text" color="danger" data-anular onclick=${() => void this.#accion('POST', `comprobante/${ed.id}/anular`, 'Anular lo saca de los informes y conserva su número. ¿Continuar?')}>Anular</iswc-button>` : null}
        ${editable ? html`<iswc-button variant="outlined" data-pendiente onclick=${() => void this.#guardar(false)}>Guardar pendiente</iswc-button><iswc-button data-finalizar ?disabled=${diferencia !== 0 || ed.renglones.length < 2} ?loading=${this.#ocupado} onclick=${() => void this.#guardar(true)}>Finalizar</iswc-button>` : null}
      </footer>
    `);
  }

  protected override pintar(root: ShadowRoot): void {
    const clave = `${sesion.empresa}|${this.#filtro['tipo']}|${this.#filtro['estado']}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      void this.#cargar();
    }
    if (this.#editor) {
      this.#pintarEditor(root);
      return;
    }
    const tabla = document.createElement('coco-tabla');
    Object.assign(tabla, { props: { columnas: [{ campo: 'tipo_nombre', titulo: 'Tipo', tipo: 'texto' }, { campo: 'numero', titulo: 'Número', tipo: 'texto', ancho: 130 }, { campo: 'fecha', titulo: 'Fecha', tipo: 'fecha', ancho: 120 }, { campo: 'observaciones', titulo: 'Observaciones', tipo: 'texto' }, { campo: 'estado', titulo: 'Estado', tipo: 'estado', ancho: 120 }, { campo: 'total_debito', titulo: 'Total', tipo: 'dinero', ancho: 140 }], filas: this.#filas, vacio: 'Aún no hay comprobantes.' } });
    tabla.addEventListener('coco-fila', (e) => void this.#abrir(Object(detalle(e)['fila'])['id']));
    const filtrar = (k: string) => (v: string) => { this.#filtro[k] = v; this.props = {}; };
    root.append(html`
      <header class="barra">
        <h1 class="titulo"><iswc-icon icon="mdi:book-open-variant"></iswc-icon>Comprobantes</h1>
        ${selector('', [{ valor: '', texto: 'Todos los tipos' }, ...(this.#cat['tipos'] ?? [])], this.#filtro['tipo'] ?? '', filtrar('tipo'), { class: 'filtro', 'aria-label': 'Tipo' })}
        ${selector('', [{ valor: '', texto: 'Todos los estados' }, { valor: 'borrador', texto: 'Pendientes' }, { valor: 'finalizado', texto: 'Finalizados' }, { valor: 'anulado', texto: 'Anulados' }], this.#filtro['estado'] ?? '', filtrar('estado'), { class: 'filtro', 'aria-label': 'Estado' })}
        ${sesion.puedeEscribir ? html`<iswc-button data-nuevo onclick=${() => this.#crear()}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Nuevo</iswc-button>` : null}
      </header>
      ${tabla}
    `);
  }
}

define(CocoComprobantes);
