// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-app> — shell de CoContable. SIN barra superior: todo el control vive en el panel izquierdo.
 *
 *   panel izquierdo   arriba: marca (el coco) + botón hamburguesa que lo colapsa a íconos
 *                     centro: navegación por módulos, agrupada
 *                     abajo:  empresa activa y usuario (sesión, apariencia)
 *   área de trabajo   una vista, o dos lado a lado / una sobre otra (split panel); la vista activa recibe el menú
 *
 * El ancho del panel, si está colapsado, las vistas abiertas y la orientación se guardan en las preferencias del
 * usuario (`core/api.ts` → servidor con sesión, navegador siempre). Tema y paleta se aplican en `core/apariencia.ts`.
 * Otras vistas piden abrir un módulo con el evento de ventana `coco:abrir` `{ id }` y el acceso con `coco:acceso`.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, html } from '../../base/componente.js';
import type { Modulo } from '../../consts/schemas/api.schemas.js';
import type { CocoAppProps } from '../../consts/schemas/componentes.schemas.js';
import { cargarPerfil, guardarPreferencias, preferenciasLocales, salir, sesion } from '../../core/api.js';
import { aplicarApariencia } from '../../core/apariencia.js';
import { GRUPOS, MODULOS, modulo } from '../../core/menu.js';
import './coco-acceso.js';

class CocoApp extends Componente<CocoAppProps> {
  static tag = 'coco-app';
  static css = css;
  static deps = ['iswc-icon', 'iswc-split-panel', 'iswc-select'];

  #listo = false;
  #acceso: 'entrar' | 'crear' | null = null;

  /** Pantalla angosta (celular): el menú arranca en íconos, abierto ocupa casi todo y se cierra al elegir un módulo. */
  static #angosto = (): boolean => typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches;

  protected override inicial(): CocoAppProps {
    const p = preferenciasLocales();
    const paneles = Array.isArray(p['paneles']) ? p['paneles'].filter((x): x is string => typeof x === 'string').slice(0, 2) : [];
    return { paneles: paneles.length ? paneles : ['inicio'], activo: 0, colapsado: CocoApp.#angosto() || p['menu'] === 'colapsado', orientacion: p['orientacion'] === 'vertical' ? 'vertical' : 'horizontal', ancho: typeof p['menuAncho'] === 'number' ? p['menuAncho'] : 20 };
  }

  override onConnected(): void {
    super.onConnected();
    window.addEventListener('coco:sesion', this.#alCambiarSesion);
    window.addEventListener('coco:abrir', this.#alPedirModulo);
    window.addEventListener('coco:acceso', this.#alPedirAcceso);
    void cargarPerfil().catch(() => null).then(() => {
      this.#listo = true;
      this.#alCambiarSesion();
    });
  }

  override onDisconnected(): void {
    window.removeEventListener('coco:sesion', this.#alCambiarSesion);
    window.removeEventListener('coco:abrir', this.#alPedirModulo);
    window.removeEventListener('coco:acceso', this.#alPedirAcceso);
  }

  #alCambiarSesion = (): void => {
    aplicarApariencia({ ...preferenciasLocales(), ...(sesion.perfil?.preferencias ?? {}) });
    this.props = {};
  };

  #alPedirModulo = (e: Event): void => {
    const d: unknown = e instanceof CustomEvent ? e.detail : null;
    if (d && typeof d === 'object' && 'id' in d && typeof d.id === 'string') this.#abrir(d.id);
  };

  #alPedirAcceso = (): void => {
    this.#acceso = 'entrar';
    this.props = {};
  };

  /** Cambia el estado del shell y lo recuerda. */
  #cambiar(cambios: Partial<CocoAppProps>): void {
    this.props = cambios;
    const p = this.props;
    // en el celular el estado del menú es de esa pantalla: no pisa la preferencia de escritorio
    if (CocoApp.#angosto()) void guardarPreferencias({ paneles: p.paneles, orientacion: p.orientacion });
    else void guardarPreferencias({ paneles: p.paneles, menu: p.colapsado ? 'colapsado' : 'abierto', orientacion: p.orientacion, menuAncho: p.ancho });
  }

  /** Abre un módulo en el panel activo (en el celular, además, recoge el menú). */
  #abrir(id: string): void {
    const paneles = [...this.props.paneles];
    paneles[Math.min(this.props.activo, paneles.length - 1)] = id;
    this.#cambiar(CocoApp.#angosto() ? { paneles, colapsado: true } : { paneles });
  }

  #dividir(): void {
    const p = this.props;
    if (p.paneles.length > 1) this.#cambiar({ paneles: [p.paneles[p.activo] ?? 'inicio'], activo: 0 });
    else this.#cambiar({ paneles: [p.paneles[0] ?? 'inicio', 'informes'], activo: 1 });
  }

  #vista(m: Modulo, indice: number, props: CocoAppProps): Node {
    const el = document.createElement(m.tag);
    Object.assign(el, { props: m.props });
    const activo = props.paneles.length > 1 && props.activo === indice;
    return html`<section class="panel" part="panel" ?data-activo=${activo} onpointerdown=${() => { if (this.props.paneles.length > 1 && this.props.activo !== indice) this.props = { activo: indice }; }}>${el}</section>`;
  }

  #menu(props: CocoAppProps): Node {
    const actual = props.paneles[Math.min(props.activo, props.paneles.length - 1)];
    const boton = (m: Modulo) => html`<button class="item" type="button" title=${m.titulo} data-modulo=${m.id} ?data-actual=${m.id === actual} onclick=${() => this.#abrir(m.id)}><iswc-icon icon=${m.icono}></iswc-icon><span class="texto">${m.titulo}</span></button>`;
    return html`${GRUPOS.map((g) => {
      const items = MODULOS.filter((m) => m.grupo === g);
      if (!g) return html`${items.map(boton)}`;
      const abierto = items.some((m) => m.id === actual);
      return html`<details class="grupo" ?open=${abierto}><summary class="rotulo" title=${g}><iswc-icon icon=${items[0]?.icono ?? 'mdi:folder'}></iswc-icon><span class="texto">${g}</span><iswc-icon class="flecha" icon="mdi:chevron-down"></iswc-icon></summary>${items.map(boton)}</details>`;
    })}`;
  }

  #pie(props: CocoAppProps): Node {
    const perfil = sesion.perfil;
    const select = document.createElement('iswc-select');
    select.setAttribute('class', 'empresa');
    select.setAttribute('full-width', '');
    select.setAttribute('aria-label', 'Empresa activa');
    select.replaceChildren(...(perfil?.empresas ?? []).map((e) => Object.assign(document.createElement('iswc-option'), { value: e.iempresa, textContent: e.nombre })));
    Object.assign(select, { value: sesion.empresa });
    select.addEventListener('iswc-change', () => {
      const v = 'value' in select ? String(select.value) : '';
      if (v && v !== sesion.empresa) sesion.cambiarEmpresa(v);
    });
    const autenticado = perfil?.autenticado === true;
    const inicial = autenticado ? (perfil?.nombre ?? perfil?.usuario ?? '?').slice(0, 1).toUpperCase() : '';
    return html`
      <footer class="pie" part="pie">
        ${props.colapsado ? null : select}
        <div class="usuario">
          <span class="avatar" aria-hidden="true">${autenticado ? inicial : html`<iswc-icon icon="mdi:account"></iswc-icon>`}</span>
          <span class="quien texto"><strong>${autenticado ? perfil?.nombre ?? perfil?.usuario : 'Invitado'}</strong><small>${autenticado ? (sesion.rol === 'PUBLICO' ? 'Demo (solo lectura)' : sesion.rol.toLowerCase()) : 'Viendo la demo'}</small></span>
          <button class="icono" type="button" title="Apariencia" onclick=${() => this.#abrir('apariencia')}><iswc-icon icon="mdi:palette"></iswc-icon></button>
          ${autenticado
            ? html`<button class="icono" type="button" title="Cerrar sesión" onclick=${() => void salir()}><iswc-icon icon="mdi:logout"></iswc-icon></button>`
            : html`<button class="icono" data-entrar type="button" title="Iniciar sesión" onclick=${() => this.#alPedirAcceso()}><iswc-icon icon="mdi:login"></iswc-icon></button>`}
        </div>
      </footer>`;
  }

  protected override pintar(root: ShadowRoot, props: CocoAppProps): void {
    if (!this.#listo) {
      root.append(html`<div class="cargando"><img src="./assets/brand/isotipo.svg" alt="" width="72" height="72"><p>Abriendo CoContable…</p></div>`);
      return;
    }
    const dos = props.paneles.length > 1;
    const lateral = html`
      <aside class="lateral" part="lateral" ?data-colapsado=${props.colapsado}>
        <header class="marca">
          <button class="icono hamburguesa" type="button" title=${props.colapsado ? 'Abrir el menú' : 'Colapsar el menú'} aria-expanded=${props.colapsado ? 'false' : 'true'} onclick=${() => this.#cambiar({ colapsado: !props.colapsado })}><iswc-icon icon="mdi:menu"></iswc-icon></button>
          <img class="logo" src="./assets/brand/isotipo.svg" alt="" width="34" height="34">
          <strong class="nombre texto"><span class="co">Co</span>Contable</strong>
        </header>
        <nav class="nav" aria-label="Módulos">${this.#menu(props)}</nav>
        <div class="acciones">
          <button class="item" type="button" data-dividir title=${dos ? 'Volver a una sola vista' : 'Dividir en dos vistas'} onclick=${() => this.#dividir()}><iswc-icon icon=${dos ? 'mdi:dock-window' : 'mdi:view-split-vertical'}></iswc-icon><span class="texto">${dos ? 'Una sola vista' : 'Dividir la vista'}</span></button>
          ${dos ? html`<button class="item" type="button" title="Girar la división" onclick=${() => this.#cambiar({ orientacion: props.orientacion === 'horizontal' ? 'vertical' : 'horizontal' })}><iswc-icon icon="mdi:rotate-right-variant"></iswc-icon><span class="texto">Girar la división</span></button>` : null}
        </div>
        ${this.#pie(props)}
      </aside>`;
    const vistas = props.paneles.map((id, i) => this.#vista(modulo(id), i, props));
    const trabajo = dos
      ? html`<iswc-split-panel class="trabajo" part="trabajo" position="50" orientation=${props.orientacion}><div slot="start" class="hueco">${vistas[0]}</div><div slot="end" class="hueco">${vistas[1]}</div></iswc-split-panel>`
      : html`<main class="trabajo" part="trabajo">${vistas[0]}</main>`;
    if (props.colapsado) root.append(html`<div class="marco colapsado">${lateral}${trabajo}</div>`);
    else root.append(html`<iswc-split-panel class="marco" position=${CocoApp.#angosto() ? '85' : String(props.ancho)} onreposition=${(e: Event) => this.#alRedimensionar(e)}><div slot="start" class="hueco">${lateral}</div><div slot="end" class="hueco">${trabajo}</div></iswc-split-panel>`);
    const acceso = document.createElement('coco-acceso');
    Object.assign(acceso, { props: { abierto: this.#acceso !== null, modo: this.#acceso ?? 'entrar' } });
    acceso.addEventListener('coco-cerrar', () => {
      this.#acceso = null;
      this.props = {};
    });
    root.append(acceso);
  }

  /** Recuerda el ancho del panel izquierdo sin repintar (el divisor ya está donde la persona lo dejó). */
  #alRedimensionar(e: Event): void {
    const panel = e.currentTarget;
    if (CocoApp.#angosto() || !(panel instanceof HTMLElement) || !('position' in panel) || e.target !== panel) return;
    const ancho = Math.round(Number(panel.position));
    if (!Number.isFinite(ancho) || ancho < 8 || ancho > 60) return;
    void guardarPreferencias({ menuAncho: ancho });
  }
}

define(CocoApp);
