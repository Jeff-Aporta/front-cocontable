// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * <coco-caja> — cierre de caja del día: lo que el sistema espera (ventas y recibos en efectivo, otros medios, egresos en
 * efectivo), la base con que se abrió y lo contado; al cerrar guarda la diferencia (sobrante o faltante). Debajo, los
 * cierres anteriores. Sin props.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../../src/js/base/componente.js';
import { campo } from '../../../src/js/base/controles.js';
import type { Fila } from '../../../src/js/consts/schemas/api.schemas.js';
import type { SinProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { api, sesion } from '../../../src/js/core/api.js';
import { dinero, hoy, num } from '../../../src/js/core/ui.js';
import '../../../src/js/components/coco/coco-tabla.js';

class CocoCaja extends Componente<SinProps> {
  static tag = 'coco-caja';
  static css = css;
  static deps = ['iswc-button', 'iswc-icon', 'iswc-input', 'iswc-stat'];

  #fecha = hoy();
  #base = 0;
  #contado = 0;
  #resumen: Fila | null = null;
  #cierres: Fila[] = [];
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
      [this.#resumen, this.#cierres] = await Promise.all([api.objeto('GET', `caja/resumen?fecha=${this.#fecha}`), api.lista('caja/cierres')]);
    } catch (e) {
      this.#resumen = {};
      avisar(e instanceof Error ? e.message : 'No se pudo cargar', 'danger');
    }
    this.props = {};
  }

  async #cerrar(): Promise<void> {
    try {
      const c = await api.objeto('POST', 'caja/cierre', { fecha: this.#fecha, base: this.#base, contado: this.#contado });
      const dif = num(c['diferencia']);
      avisar(dif === 0 ? 'Caja cuadrada' : dif > 0 ? `Sobrante de ${dinero(dif)}` : `Faltante de ${dinero(-dif)}`, dif === 0 ? 'success' : 'warning');
      await this.#cargar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo cerrar', 'danger');
    }
  }

  protected override pintar(root: ShadowRoot): void {
    const clave = `${sesion.empresa}|${this.#fecha}`;
    if (this.#cargado !== clave) {
      this.#cargado = clave;
      void this.#cargar();
    }
    const r = this.#resumen ?? {};
    const esperado = this.#base + num(r['efectivo']) - num(r['egresos']);
    const diferencia = this.#contado - esperado;
    const cierres = document.createElement('coco-tabla');
    Object.assign(cierres, { props: { columnas: [{ campo: 'fecha', titulo: 'Fecha', tipo: 'fecha', ancho: 120 }, { campo: 'autor', titulo: 'Quién cerró', tipo: 'texto' }, { campo: 'base', titulo: 'Base', tipo: 'dinero', ancho: 120 }, { campo: 'efectivo', titulo: 'Efectivo', tipo: 'dinero', ancho: 130 }, { campo: 'egresos', titulo: 'Egresos', tipo: 'dinero', ancho: 120 }, { campo: 'contado', titulo: 'Contado', tipo: 'dinero', ancho: 130 }, { campo: 'diferencia', titulo: 'Diferencia', tipo: 'dinero', ancho: 130 }], filas: this.#cierres, vacio: 'Aún no hay cierres de caja.' } });
    const repintar = () => { this.props = {}; };
    root.append(html`
      <header class="barra"><h1 class="titulo"><iswc-icon icon="mdi:safe"></iswc-icon>Cierre de caja</h1>${campo('Fecha', 'date', this.#fecha, (v) => { this.#fecha = v || hoy(); repintar(); }, { class: 'fecha' })}</header>
      <div class="totales">
        <iswc-stat label="Ventas y recibos en efectivo" value=${dinero(r['efectivo'])} color="success" icon="mdi:cash"></iswc-stat>
        <iswc-stat label="Otros medios de pago" value=${dinero(r['otros'])} color="neutral" icon="mdi:credit-card"></iswc-stat>
        <iswc-stat label="Egresos en efectivo" value=${dinero(r['egresos'])} color="warning" icon="mdi:cash-minus"></iswc-stat>
        <iswc-stat label="Debe haber en caja" value=${dinero(esperado)} color="brand" icon="mdi:scale-balance"></iswc-stat>
      </div>
      <section class="cuadre" part="cuadre">
        ${campo('Base con que abrió la caja', 'number', this.#base || '', (v) => { this.#base = Number(v) || 0; repintar(); }, { min: '0', 'data-base': '' })}
        ${campo('Efectivo contado', 'number', this.#contado || '', (v) => { this.#contado = Number(v) || 0; repintar(); }, { min: '0', 'data-contado': '' })}
        <p class="diferencia" data-diferencia ?data-mal=${diferencia !== 0}>${diferencia === 0 ? 'Cuadra' : diferencia > 0 ? `Sobran ${dinero(diferencia)}` : `Faltan ${dinero(-diferencia)}`}</p>
        ${sesion.puedeEscribir ? html`<iswc-button data-cerrar onclick=${() => void this.#cerrar()}><iswc-icon slot="prefix" icon="mdi:lock-check"></iswc-icon>Cerrar caja</iswc-button>` : null}
      </section>
      <h2 class="subtitulo">Cierres anteriores</h2>
      ${cierres}
    `);
  }
}

define(CocoCaja);
