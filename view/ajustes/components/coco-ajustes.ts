// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-ajustes> — configuración de la cuenta, en tres secciones (prop `seccion`):
 *
 *   empresas    crear y editar empresas, y el equipo de la empresa activa (invitar por usuario con un rol, retirar)
 *   agentes     agentes de IA de la empresa activa: crear (herramientas permitidas, cuáles piden aprobación, tope de
 *               monto, días de vigencia; el token se muestra UNA vez), revocar, y la bitácora con aprobar o rechazar
 *   apariencia  tema claro u oscuro y paleta (Delfín por defecto); se guarda en las preferencias del usuario
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../../src/js/base/componente.js';
import { detalle, opciones, selector } from '../../../src/js/base/controles.js';
import type { CampoEntrada, Fila } from '../../../src/js/consts/schemas/api.schemas.js';
import { CampoSchema } from '../../../src/js/consts/schemas/api.schemas.js';
import type { CocoAjustesProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { DEMO, api, cargarPerfil, guardarPreferencias, sesion } from '../../../src/js/core/api.js';
import { aparienciaActual, aplicarApariencia } from '../../../src/js/core/apariencia.js';
import '../../../src/js/components/coco/coco-ficha.js';
import '../../../src/js/components/coco/coco-tabla.js';

const TITULOS: Record<string, [string, string]> = { empresas: ['Empresas y equipo', 'mdi:domain'], agentes: ['Agentes de IA', 'mdi:robot-happy'], apariencia: ['Apariencia', 'mdi:palette'] };
const ROLES = opciones(['CONTADOR', 'Contador'], ['AUXILIAR', 'Auxiliar'], ['VENDEDOR', 'Vendedor'], ['CONSULTA', 'Consulta']);
const camposEmpresa: CampoEntrada[] = [{ nombre: 'nombre', etiqueta: 'Nombre o razón social', requerido: true }, { nombre: 'nit', etiqueta: 'NIT (sin dígito de verificación)' }, { nombre: 'tipo_persona', etiqueta: 'Tipo de persona', tipo: 'opcion', defecto: 'PJ', opciones: opciones(['PJ', 'Jurídica'], ['PN', 'Natural']) }, { nombre: 'tipo_contribuyente', etiqueta: 'Tipo de contribuyente', tipo: 'opcion', defecto: 'responsable_iva', opciones: opciones(['responsable_iva', 'Responsable de IVA'], ['no_responsable_iva', 'No responsable de IVA'], ['regimen_simple', 'Régimen simple']) }, { nombre: 'ciudad', etiqueta: 'Ciudad' }, { nombre: 'direccion', etiqueta: 'Dirección' }, { nombre: 'telefono', etiqueta: 'Teléfono' }, { nombre: 'email', etiqueta: 'Correo', tipo: 'correo' }];

class CocoAjustes extends Componente<CocoAjustesProps> {
  static tag = 'coco-ajustes';
  static css = css;
  static deps = ['iswc-button', 'iswc-icon', 'iswc-input', 'iswc-select', 'iswc-callout', 'iswc-palette-selector', 'iswc-switch', 'iswc-dialog'];

  #cargado = '';
  #miembros: Fila[] = [];
  #agentes: Fila[] = [];
  #bitacora: Fila[] = [];
  #herramientas: Fila = {};
  #ficha: 'crear' | 'editar' | null = null;
  #agente: { nombre: string; capacidades: Set<string>; aprobacion: Set<string>; monto: number; dias: number } | null = null;
  #token = '';

  protected override inicial(): CocoAjustesProps {
    return { seccion: 'apariencia' };
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

  get #propia(): boolean {
    return sesion.rol === 'DUENO';
  }

  async #cargar(seccion: string): Promise<void> {
    try {
      if (seccion === 'empresas' && this.#propia) this.#miembros = await api.lista(`empresa/${sesion.empresa}/miembros`);
      if (seccion === 'agentes' && this.#propia) {
        const [agentes, bitacora, info] = await Promise.all([api.lista('agentes'), api.lista('agentes/bitacora'), api.objeto('GET', 'info')]);
        this.#agentes = agentes;
        this.#bitacora = bitacora;
        this.#herramientas = Object(info['herramientas']);
      }
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo cargar', 'danger');
    }
    this.props = {};
  }

  /** Corre una llamada, avisa y recarga la sección. */
  async #hacer(accion: () => Promise<unknown>, mensaje: string): Promise<void> {
    try {
      await accion();
      avisar(mensaje, 'success');
      this.#cargado = '';
      this.props = {};
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo completar', 'danger');
    }
  }

  async #guardarEmpresa(v: Fila): Promise<void> {
    const ficha = this.shadow?.querySelector('coco-ficha');
    try {
      const e = this.#ficha === 'editar' ? await api.objeto('PUT', `empresa/${sesion.empresa}`, v) : await api.objeto('POST', 'empresas', v);
      this.#ficha = null;
      await cargarPerfil();
      avisar('Empresa guardada', 'success');
      sesion.cambiarEmpresa(String(e['iempresa'] ?? sesion.empresa));
    } catch (e) {
      if (ficha) Object.assign(ficha, { props: { guardando: false, error: e instanceof Error ? e.message : 'No se pudo guardar' } });
    }
  }

  #empresas(root: ShadowRoot): void {
    const perfil = sesion.perfil;
    if (!perfil?.autenticado) {
      root.append(html`<iswc-callout color="brand"><strong slot="title">Crea tu cuenta para tener tus empresas</strong>Con tu cuenta puedes crear las empresas que necesites e invitar a tu equipo.<iswc-button slot="actions" size="sm" onclick=${() => window.dispatchEvent(new CustomEvent('coco:acceso'))}>Iniciar sesión o crear cuenta</iswc-button></iswc-callout>`);
      return;
    }
    const tabla = document.createElement('coco-tabla');
    Object.assign(tabla, { props: { columnas: [{ campo: 'nombre', titulo: 'Empresa', tipo: 'texto' }, { campo: 'nit', titulo: 'NIT', tipo: 'texto', ancho: 140 }, { campo: 'ciudad', titulo: 'Ciudad', tipo: 'texto', ancho: 160 }, { campo: 'rol', titulo: 'Tu rol', tipo: 'texto', ancho: 130 }], filas: perfil.empresas.filter((e) => e.iempresa !== DEMO), vacio: 'Aún no tienes empresas: crea la primera.' } });
    tabla.addEventListener('coco-fila', (e) => sesion.cambiarEmpresa(String(Object(detalle(e)['fila'])['iempresa'])));
    const equipo = document.createElement('coco-tabla');
    Object.assign(equipo, { props: { columnas: [{ campo: 'iusuario', titulo: 'Usuario', tipo: 'texto', ancho: 180 }, { campo: 'nombre', titulo: 'Nombre', tipo: 'texto' }, { campo: 'rol', titulo: 'Rol', tipo: 'texto', ancho: 140 }], filas: this.#miembros, vacio: 'Solo tú trabajas en esta empresa.' } });
    equipo.addEventListener('coco-fila', (e) => {
      const u = String(Object(detalle(e)['fila'])['iusuario']);
      if (confirm(`¿Retirar a ${u} de la empresa?`)) void this.#hacer(() => api.del(`empresa/${sesion.empresa}/miembro/${encodeURIComponent(u)}`), 'Miembro retirado');
    });
    let invitado = '';
    let rol = 'AUXILIAR';
    root.append(html`
      <section class="bloque"><header class="cab"><h2>Mis empresas</h2><iswc-button data-crear-empresa onclick=${() => { this.#ficha = 'crear'; this.props = {}; }}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Crear empresa</iswc-button>${this.#propia ? html`<iswc-button variant="outlined" onclick=${() => { this.#ficha = 'editar'; this.props = {}; }}>Editar la activa</iswc-button>` : null}</header><p class="pista">Haz clic en una empresa para trabajar en ella.</p>${tabla}</section>
      ${this.#propia ? html`<section class="bloque"><header class="cab"><h2>Equipo de la empresa activa</h2></header>
        <form class="invitar" onsubmit=${(e: Event) => e.preventDefault()}>
          <iswc-input label="Usuario a invitar" placeholder="su nombre de usuario" oniswc-change=${(e: Event) => { invitado = String(Object(e.target)['value'] ?? '').trim().toLowerCase(); }}></iswc-input>
          ${selector('Rol', ROLES, rol, (v) => { rol = v; })}
          <iswc-button onclick=${() => void this.#hacer(() => api.post(`empresa/${sesion.empresa}/miembros`, { iusuario: invitado, rol }), 'Miembro agregado')}>Invitar</iswc-button>
        </form>
        <p class="pista">Contador: todo lo contable. Auxiliar: registra, no anula ni configura. Vendedor: solo ventas y caja. Consulta: solo informes. Clic en un miembro para retirarlo.</p>${equipo}</section>` : null}
      <coco-ficha oncoco-cerrar=${() => { this.#ficha = null; this.props = {}; }} oncoco-guardar=${(e: Event) => void this.#guardarEmpresa(Object(detalle(e)['valores']))}></coco-ficha>
    `);
    const activa = perfil.empresas.find((e) => e.iempresa === sesion.empresa);
    const ficha = root.querySelector('coco-ficha');
    if (ficha) Object.assign(ficha, { props: { titulo: this.#ficha === 'editar' ? 'Editar empresa' : 'Crear empresa', campos: camposEmpresa.map((c) => CampoSchema.parse(c)), valores: this.#ficha === 'editar' ? { ...activa } : {}, alta: this.#ficha !== 'editar', abierta: this.#ficha !== null, eliminable: false, guardando: false, error: '' } });
  }

  async #crearAgente(): Promise<void> {
    const a = this.#agente;
    if (!a) return;
    try {
      const r = await api.objeto('POST', 'agentes', { nombre: a.nombre, capacidades: [...a.capacidades], aprobacion: [...a.aprobacion].filter((h) => a.capacidades.has(h)), monto_maximo: a.monto, dias: a.dias });
      this.#token = String(r['token'] ?? '');
      this.#agente = null;
      this.#cargado = '';
      this.props = {};
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo crear el agente', 'danger');
    }
  }

  #agentesVista(root: ShadowRoot): void {
    if (!this.#propia) {
      root.append(html`<iswc-callout color="brand"><strong slot="title">Solo el dueño de la empresa administra sus agentes</strong>Un agente de IA es una credencial con permisos explícitos sobre UNA empresa. Entra a una empresa tuya para crear los suyos.</iswc-callout>`);
      return;
    }
    const agentes = document.createElement('coco-tabla');
    Object.assign(agentes, { props: { columnas: [{ campo: 'nombre', titulo: 'Agente', tipo: 'texto' }, { campo: 'herramientas', titulo: 'Herramientas', tipo: 'numero', ancho: 130 }, { campo: 'monto_maximo', titulo: 'Tope por operación', tipo: 'dinero', ancho: 170 }, { campo: 'fhexpira', titulo: 'Vence', tipo: 'fecha', ancho: 120 }, { campo: 'bactivo', titulo: 'Activo', tipo: 'si-no', ancho: 90 }], filas: this.#agentes.map((a) => ({ ...a, herramientas: Array.isArray(a['capacidades']) ? a['capacidades'].length : 0, fhexpira: String(a['fhexpira'] ?? '').slice(0, 10) })), vacio: 'Aún no hay agentes.' } });
    agentes.addEventListener('coco-fila', (e) => {
      const a = Object(detalle(e)['fila']);
      if (a['bactivo'] && confirm(`¿Revocar el agente «${a['nombre']}»? Su token deja de servir de inmediato.`)) void this.#hacer(() => api.del(`agente/${a['iagente']}`), 'Agente revocado');
    });
    const bitacora = document.createElement('coco-tabla');
    Object.assign(bitacora, { props: { columnas: [{ campo: 'fh', titulo: 'Cuándo', tipo: 'texto', ancho: 170 }, { campo: 'agente', titulo: 'Agente', tipo: 'texto', ancho: 160 }, { campo: 'herramienta', titulo: 'Herramienta', tipo: 'texto', ancho: 190 }, { campo: 'estado', titulo: 'Estado', tipo: 'estado', ancho: 120 }, { campo: 'motivo', titulo: 'Motivo', tipo: 'texto' }], filas: this.#bitacora.map((b) => ({ ...b, fh: String(b['fh'] ?? '').replace('T', ' ').slice(0, 16) })), vacio: 'Los agentes aún no han hecho nada.' } });
    bitacora.addEventListener('coco-fila', (e) => {
      const b = Object(detalle(e)['fila']);
      if (b['estado'] !== 'pendiente') return;
      const aprobar = confirm(`El agente «${b['agente']}» pide ejecutar ${b['herramienta']} con:\n\n${JSON.stringify(b['jargumentos'], null, 2).slice(0, 900)}\n\nAceptar = APROBAR y ejecutar · Cancelar = decidir si se rechaza`);
      if (aprobar) void this.#hacer(() => api.post(`agentes/bitacora/${b['id']}/aprobar`), 'Acción aprobada y ejecutada');
      else if (confirm('¿Rechazar esta acción?')) void this.#hacer(() => api.post(`agentes/bitacora/${b['id']}/rechazar`), 'Acción rechazada');
    });
    const a = this.#agente;
    const alternar = (conjunto: Set<string>, h: string) => () => { if (conjunto.has(h)) conjunto.delete(h); else conjunto.add(h); this.props = {}; };
    root.append(html`
      <iswc-callout color="brand"><strong slot="title">Zero Trust</strong>Un agente no hereda tus permisos: solo puede usar las herramientas que marques, en esta empresa, hasta que venza. Lo que marques «con aprobación» queda pendiente hasta que tú lo apruebes. Todo queda en la bitácora.</iswc-callout>
      ${this.#token ? html`<iswc-callout class="token" color="warning"><strong slot="title">Token del agente (cópialo ahora: no se vuelve a mostrar)</strong><code data-token>${this.#token}</code><iswc-button slot="actions" size="sm" onclick=${() => { void navigator.clipboard?.writeText(this.#token); avisar('Token copiado'); }}>Copiar</iswc-button><iswc-button slot="actions" size="sm" variant="outlined" onclick=${() => { this.#token = ''; this.props = {}; }}>Ya lo guardé</iswc-button></iswc-callout>` : null}
      <section class="bloque"><header class="cab"><h2>Agentes</h2>${a ? null : html`<iswc-button data-crear-agente onclick=${() => { this.#agente = { nombre: '', capacidades: new Set(), aprobacion: new Set(), monto: 0, dias: 30 }; this.props = {}; }}><iswc-icon slot="prefix" icon="mdi:plus"></iswc-icon>Crear agente</iswc-button>`}</header>
        ${a ? html`<form class="agente" onsubmit=${(e: Event) => e.preventDefault()}>
          <div class="fila3"><iswc-input label="Nombre del agente" value=${a.nombre} oniswc-change=${(e: Event) => { a.nombre = String(Object(e.target)['value'] ?? ''); }}></iswc-input><iswc-input label="Tope por operación (0 = sin tope)" type="number" min="0" value=${String(a.monto)} oniswc-change=${(e: Event) => { a.monto = Number(Object(e.target)['value']) || 0; }}></iswc-input><iswc-input label="Días de vigencia" type="number" min="1" max="365" value=${String(a.dias)} oniswc-change=${(e: Event) => { a.dias = Number(Object(e.target)['value']) || 30; }}></iswc-input></div>
          <div class="herramientas">${Object.entries(this.#herramientas).map(([h, def]) => html`<div class="herramienta" ?data-escribe=${Object(def)['escribe'] === true}><label class="check"><input type="checkbox" data-herramienta=${h} ?checked=${a.capacidades.has(h)} onchange=${alternar(a.capacidades, h)}><span><strong>${h}</strong><small>${String(Object(def)['descripcion'])}</small></span></label>${Object(def)['escribe'] === true && a.capacidades.has(h) ? html`<label class="check aprobacion"><input type="checkbox" ?checked=${a.aprobacion.has(h)} onchange=${alternar(a.aprobacion, h)}>con aprobación</label>` : null}</div>`)}</div>
          <div class="fila-acc"><iswc-button variant="text" onclick=${() => { this.#agente = null; this.props = {}; }}>Cancelar</iswc-button><iswc-button data-guardar-agente onclick=${() => void this.#crearAgente()}>Crear y ver el token</iswc-button></div>
        </form>` : html`<p class="pista">Clic en un agente activo para revocarlo.</p>${agentes}`}
      </section>
      <section class="bloque"><header class="cab"><h2>Bitácora</h2></header><p class="pista">Clic en una acción <strong>pendiente</strong> para aprobarla o rechazarla.</p>${bitacora}</section>
    `);
  }

  #aparienciaVista(root: ShadowRoot): void {
    const actual = aparienciaActual();
    const cambiar = (cambios: Record<string, unknown>) => {
      aplicarApariencia(cambios);
      void guardarPreferencias(cambios);
      this.props = {};
    };
    const paleta = document.createElement('iswc-palette-selector');
    paleta.addEventListener('iswc-change', () => setTimeout(() => void guardarPreferencias({ paleta: aparienciaActual().paleta }), 0));
    root.append(html`
      <section class="bloque"><header class="cab"><h2>Tema</h2></header>
        <div class="temas">
          <button class="tema" type="button" data-tema="light" ?data-actual=${actual.tema === 'light'} onclick=${() => cambiar({ tema: 'light' })}><iswc-icon icon="mdi:white-balance-sunny"></iswc-icon>Claro (día de playa)</button>
          <button class="tema" type="button" data-tema="dark" ?data-actual=${actual.tema === 'dark'} onclick=${() => cambiar({ tema: 'dark' })}><iswc-icon icon="mdi:weather-night"></iswc-icon>Oscuro (noche de mar)</button>
        </div>
      </section>
      <section class="bloque"><header class="cab"><h2>Paleta</h2><iswc-button variant="outlined" onclick=${() => cambiar({ paleta: 'delfin', tema: 'light' })}>Volver a Delfín claro</iswc-button></header><p class="pista">Paleta actual: <strong data-paleta>${actual.paleta}</strong>. Lo que elijas se recuerda en tu cuenta.</p>${paleta}</section>
    `);
  }

  protected override pintar(root: ShadowRoot, props: CocoAjustesProps): void {
    const clave = `${sesion.empresa}|${props.seccion}|${sesion.perfil?.usuario ?? ''}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      void this.#cargar(props.seccion);
    }
    const [titulo, icono] = TITULOS[props.seccion] ?? ['Ajustes', 'mdi:cog'];
    root.append(html`<header class="barra"><h1 class="titulo"><iswc-icon icon=${icono}></iswc-icon>${titulo}</h1></header>`);
    if (props.seccion === 'empresas') this.#empresas(root);
    else if (props.seccion === 'agentes') this.#agentesVista(root);
    else this.#aparienciaVista(root);
  }
}

define(CocoAjustes);
