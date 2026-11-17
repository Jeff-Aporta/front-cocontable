// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * <coco-catalogo> — pantalla de cualquier catálogo (clientes, productos, cuentas, impuestos…): barra con título,
 * búsqueda, exportar y «Crear»; tabla; y la ficha por pestañas para crear, editar o eliminar. La definición sale de
 * `core/catalogos.ts` por su id: este componente no sabe de qué catálogo se trata.
 *
 * Props: `catalogo` (id). Sin permiso de escritura (demo o rol de consulta) la ficha se abre en solo lectura.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../base/componente.js';
import type { Catalogo, Fila } from '../../consts/schemas/api.schemas.js';
import type { CocoCatalogoProps } from '../../consts/schemas/componentes.schemas.js';
import { ErrorApi, api, sesion } from '../../core/api.js';
import { catalogo } from '../../core/catalogos.js';
import { aCsv, descargar, hoy, limpiarCache, textoDe } from '../../core/ui.js';
import './coco-ficha.js';
import './coco-tabla.js';

class CocoCatalogo extends Componente<CocoCatalogoProps> {
  static tag = 'coco-catalogo';
  static css = css;
  static deps = ['iswc-button', 'iswc-input', 'iswc-icon'];

  #filas: Fila[] = [];
  #cargando = true;
  #busqueda = '';
  #abierta: Fila | null = null;
  #alta = false;
  #cargado = '';

  protected override inicial(): CocoCatalogoProps {
    return { catalogo: 'clientes' };
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

  async #cargar(def: Catalogo): Promise<void> {
    this.#cargando = true;
    try {
      const todas = await api.lista(def.rutaLista);
      const filtro = Object.entries(def.filtro ?? {});
      this.#filas = todas.filter((f) => filtro.every(([k, v]) => (v === true ? f[k] === true || f[k] === 1 : f[k] === v)));
    } catch (e) {
      this.#filas = [];
      avisar(e instanceof Error ? e.message : 'No se pudo cargar', 'danger');
    }
    this.#cargando = false;
    this.props = {};
  }

  async #guardar(def: Catalogo, valores: Record<string, unknown>): Promise<void> {
    const ficha = this.shadow?.querySelector('coco-ficha');
    if (ficha) Object.assign(ficha, { props: { guardando: true, error: '' } });
    try {
      const cuerpo = { ...valores, ...(this.#alta ? def.fijos ?? {} : {}) };
      if (this.#alta) await api.post(def.rutaUno, cuerpo);
      else await api.put(`${def.rutaUno}/${encodeURIComponent(String(this.#abierta?.[def.llave] ?? ''))}`, { ...cuerpo, [def.llave]: this.#abierta?.[def.llave] });
      limpiarCache();
      avisar(`${def.singular[0]?.toUpperCase()}${def.singular.slice(1)} guardado`, 'success');
      this.#abierta = null;
      await this.#cargar(def);
    } catch (e) {
      if (ficha) Object.assign(ficha, { props: { guardando: false, error: e instanceof ErrorApi ? e.message : 'No se pudo guardar' } });
    }
  }

  async #eliminar(def: Catalogo): Promise<void> {
    const llave = String(this.#abierta?.[def.llave] ?? '');
    if (!llave || !confirm(`¿Eliminar ${def.singular} ${llave}? Si ya tiene movimientos es mejor desactivarlo.`)) return;
    try {
      await api.del(`${def.rutaUno}/${encodeURIComponent(llave)}`);
      limpiarCache();
      this.#abierta = null;
      await this.#cargar(def);
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo eliminar', 'danger');
    }
  }

  protected override pintar(root: ShadowRoot, props: CocoCatalogoProps): void {
    const def = catalogo(props.catalogo);
    if (!def) {
      root.append(html`<p class="aviso">El catálogo «${props.catalogo}» no existe.</p>`);
      return;
    }
    const clave = `${sesion.empresa}|${def.id}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      this.#busqueda = '';
      this.#abierta = null;
      void this.#cargar(def);
    }
    const q = this.#busqueda.toLowerCase();
    const visibles = q ? this.#filas.filter((f) => def.columnas.some((c) => String(f[c.campo] ?? '').toLowerCase().includes(q))) : this.#filas;
    const filas = def.arbol ? visibles.map((f) => ({ ...f, nombre: `${' '.repeat(Math.max(Number(f['nivel'] ?? 1) - 1, 0))}${f['nombre'] ?? ''}` })) : visibles;
    const abrir = (fila: Fila | null) => {
      this.#alta = fila === null;
      this.#abierta = fila ?? {};
      this.props = {};
    };
    root.append(html`
      <header class="barra" part="barra">
        <h1 class="titulo"><iswc-icon icon=${def.icono}></iswc-icon>${def.titulo}</h1>
        <iswc-input class="buscar" placeholder="Buscar…" clearable value=${this.#busqueda} oniswc-typing-end=${(e: Event) => { this.#busqueda = textoDe(e.target instanceof Element ? e.target : null); this.props = {}; }}></iswc-input>
        <iswc-button variant="outlined" onclick=${() => descargar(`${def.id}-${hoy()}.csv`, aCsv(visibles, def.columnas))}><iswc-icon slot="prefix" icon="mdi:microsoft-excel"></iswc-icon>Exportar</iswc-button>
        ${sesion.puedeEscribir ? html`<iswc-button data-crear onclick=${() => abrir(null)}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Crear</iswc-button>` : null}
      </header>
      ${this.#cargando ? html`<p class="aviso">Cargando…</p>` : html`<coco-tabla part="tabla" oncoco-fila=${(e: Event) => { const d: unknown = e instanceof CustomEvent ? e.detail : null; if (d && typeof d === 'object' && 'fila' in d) abrir(this.#filas.find((f) => f[def.llave] === Object(d.fila)[def.llave]) ?? null); }}></coco-tabla>`}
      <coco-ficha oncoco-cerrar=${() => { this.#abierta = null; this.props = {}; }} oncoco-guardar=${(e: Event) => { const d: unknown = e instanceof CustomEvent ? e.detail : null; if (d && typeof d === 'object' && 'valores' in d) void this.#guardar(def, Object(d.valores)); }} oncoco-eliminar=${() => void this.#eliminar(def)}></coco-ficha>
    `);
    const tabla = root.querySelector('coco-tabla');
    if (tabla) Object.assign(tabla, { props: { columnas: def.columnas, filas, vacio: q ? 'Nada coincide con la búsqueda.' : `Aún no hay ${def.titulo.toLowerCase()}.` } });
    const ficha = root.querySelector('coco-ficha');
    if (ficha) Object.assign(ficha, { props: { titulo: `${this.#alta ? 'Crear' : sesion.puedeEscribir ? 'Editar' : 'Ver'} ${def.singular}`, campos: def.campos, valores: this.#abierta ?? {}, alta: this.#alta, abierta: this.#abierta !== null, eliminable: !this.#alta && sesion.puedeEscribir, guardando: false, error: '' } });
  }
}

define(CocoCatalogo);
