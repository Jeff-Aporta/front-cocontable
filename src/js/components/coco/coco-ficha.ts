// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * <coco-ficha> — formulario declarativo en un diálogo, con pestañas. Pinta los campos que recibe (texto, número, dinero,
 * fecha, correo, sí/no, opción, área) con los controles del kit y devuelve los valores al guardar. No llama al API:
 * quien lo usa decide qué hacer con `coco-guardar`.
 *
 * Props: `titulo`, `campos`, `valores`, `alta` (los campos `soloAlta` se bloquean al editar), `abierta`, `guardando`,
 * `error`, `eliminable`. Eventos: `coco-guardar` `{ valores }`, `coco-eliminar`, `coco-cerrar`.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, html } from '../../base/componente.js';
import type { Campo, Opcion } from '../../consts/schemas/api.schemas.js';
import type { CocoFichaProps } from '../../consts/schemas/componentes.schemas.js';
import { sesion } from '../../core/api.js';
import { angosto, listaCacheada, opcionesDe, valorDe } from '../../core/ui.js';

const TIPO_INPUT: Record<string, string> = { texto: 'text', numero: 'number', dinero: 'number', fecha: 'date', correo: 'email' };

class CocoFicha extends Componente<CocoFichaProps> {
  static tag = 'coco-ficha';
  static css = css;
  static deps = ['iswc-drawer', 'iswc-tab-group', 'iswc-input', 'iswc-select', 'iswc-switch', 'iswc-textarea', 'iswc-button', 'iswc-callout'];

  protected override inicial(): CocoFichaProps {
    return { titulo: '', campos: [], valores: {}, alta: true, abierta: false, guardando: false, error: '', eliminable: false };
  }

  /** Solo cambian `guardando` o `error`: se actualizan sin repintar (no se pierde lo digitado). */
  protected override parcial(props: CocoFichaProps, previos: CocoFichaProps): boolean {
    if (props.abierta !== previos.abierta || props.campos !== previos.campos || props.valores !== previos.valores || props.titulo !== previos.titulo) return false;
    const aviso = this.shadow?.querySelector('[data-error]');
    if (aviso) {
      aviso.textContent = props.error;
      aviso.toggleAttribute('hidden', !props.error);
    }
    this.shadow?.querySelector('[data-guardar]')?.toggleAttribute('loading', props.guardando);
    return true;
  }

  /** Valor inicial de un campo: el del registro, o su valor por defecto en un alta. */
  #inicialDe(c: Campo, props: CocoFichaProps): unknown {
    const v = props.valores[c.nombre];
    return v === undefined || v === null ? (props.alta ? c.defecto ?? '' : '') : v;
  }

  #control(c: Campo, props: CocoFichaProps): Node {
    const valor = this.#inicialDe(c, props);
    const bloqueado = c.soloAlta && !props.alta;
    if (c.tipo === 'si-no') return html`<iswc-switch data-campo=${c.nombre} ?checked=${valor === true || valor === 1}>${c.etiqueta}</iswc-switch>`;
    if (c.tipo === 'area') return html`<iswc-textarea data-campo=${c.nombre} label=${c.etiqueta} value=${String(valor)} hint=${c.ayuda ?? ''}></iswc-textarea>`;
    if (c.tipo === 'opcion') {
      const select = document.createElement('iswc-select');
      select.setAttribute('data-campo', c.nombre);
      select.setAttribute('label', c.etiqueta);
      select.setAttribute('full-width', '');
      if (!c.requerido) select.setAttribute('clearable', '');
      if (c.requerido) select.setAttribute('required', '');
      const llenar = (opciones: Opcion[]) => {
        select.replaceChildren(...opciones.map((o) => Object.assign(document.createElement('iswc-option'), { value: o.valor, textContent: o.texto })));
        Object.assign(select, { value: String(valor ?? '') });
      };
      llenar(c.opciones ?? []);
      const fuente = c.fuente;
      if (fuente) void listaCacheada(fuente.ruta, sesion.empresa).then((lista) => llenar(opcionesDe(lista, fuente.valor, fuente.texto)));
      return select;
    }
    return html`<iswc-input data-campo=${c.nombre} label=${c.etiqueta} type=${TIPO_INPUT[c.tipo] ?? 'text'} value=${String(valor)} hint=${c.ayuda ?? ''} ?required=${c.requerido} ?disabled=${bloqueado}></iswc-input>`;
  }

  /** Lee todos los controles y arma el objeto a guardar (números como número, vacíos como `null`). */
  #leer(props: CocoFichaProps): Record<string, unknown> {
    const salida: Record<string, unknown> = {};
    for (const c of props.campos) {
      const crudo = valorDe(this.shadow?.querySelector(`[data-campo="${c.nombre}"]`) ?? null);
      if (c.tipo === 'si-no') salida[c.nombre] = crudo === true;
      else if (c.tipo === 'numero' || c.tipo === 'dinero') salida[c.nombre] = crudo === '' || crudo == null ? 0 : Number(crudo);
      else salida[c.nombre] = crudo === '' || crudo == null ? null : String(crudo).trim();
    }
    return salida;
  }

  #guardar(props: CocoFichaProps): void {
    const valores = this.#leer(props);
    const falta = props.campos.find((c) => c.requerido && (valores[c.nombre] === null || valores[c.nombre] === ''));
    if (falta) {
      this.props = { error: `Falta: ${falta.etiqueta}` };
      return;
    }
    this.emit('coco-guardar', { valores });
  }

  protected override pintar(root: ShadowRoot, props: CocoFichaProps): void {
    if (!props.abierta) return;
    const pestanas = [...new Set(props.campos.map((c) => c.pestana))];
    const cuerpo = (pestana: string) => html`<div class="campos">${props.campos.filter((c) => c.pestana === pestana).map((c) => this.#control(c, props))}</div>`;
    const contenido = pestanas.length > 1
      ? html`<iswc-tab-group active=${pestanas[0] ?? ''}>
          ${pestanas.map((p) => html`<iswc-tab slot="nav" panel=${p}>${p}</iswc-tab>`)}
          ${pestanas.map((p) => html`<iswc-tab-panel name=${p}>${cuerpo(p)}</iswc-tab-panel>`)}
        </iswc-tab-group>`
      : cuerpo(pestanas[0] ?? '');
    root.append(html`
      <iswc-drawer open label=${props.titulo} placement=${angosto() ? 'bottom' : 'end'} part="dialogo" oniswc-after-hide=${() => this.emit('coco-cerrar', {})}>
        <form class="ficha" onsubmit=${(e: Event) => e.preventDefault()}>
          ${contenido}
          <iswc-callout data-error color="danger" ?hidden=${!props.error}>${props.error}</iswc-callout>
        </form>
        ${props.eliminable ? html`<iswc-button slot="footer" variant="text" color="danger" onclick=${() => this.emit('coco-eliminar', {})}>Eliminar</iswc-button>` : null}
        <iswc-button slot="footer" variant="outlined" onclick=${() => this.emit('coco-cerrar', {})}>Cancelar</iswc-button>
        <iswc-button slot="footer" data-guardar ?loading=${props.guardando} onclick=${() => this.#guardar(props)}>Guardar</iswc-button>
      </iswc-drawer>
    `);
  }
}

define(CocoFicha);
