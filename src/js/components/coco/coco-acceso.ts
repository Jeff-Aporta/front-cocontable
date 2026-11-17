// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * <coco-acceso> — diálogo para iniciar sesión o crear la cuenta. Llama al API por `core/api.ts` y, al entrar, la sesión
 * avisa a toda la app (`coco:sesion`). La contraseña nunca se guarda ni se escribe en ningún registro.
 *
 * Props: `abierto`, `modo` (`entrar` | `crear`). Evento: `coco-cerrar`.
 */
import { define } from '@jeff-aporta/iswc-base/core/iswc-element.min.mjs';
import css from 'iswc:css';
import { Componente, avisar, html } from '../../base/componente.js';
import type { CocoAccesoProps } from '../../consts/schemas/componentes.schemas.js';
import { entrar, registrarse } from '../../core/api.js';
import { textoDe } from '../../core/ui.js';

class CocoAcceso extends Componente<CocoAccesoProps> {
  static tag = 'coco-acceso';
  static css = css;
  static deps = ['iswc-dialog', 'iswc-input', 'iswc-button', 'iswc-callout'];

  #error = '';
  #ocupado = false;

  protected override inicial(): CocoAccesoProps {
    return { abierto: false, modo: 'entrar' };
  }

  #campo(nombre: string): string {
    return textoDe(this.shadow?.querySelector(`[data-campo="${nombre}"]`) ?? null);
  }

  async #enviar(props: CocoAccesoProps): Promise<void> {
    if (this.#ocupado) return;
    this.#ocupado = true;
    this.#error = '';
    try {
      if (props.modo === 'crear') await registrarse({ iusuario: this.#campo('iusuario').toLowerCase(), nombre: this.#campo('nombre'), email: this.#campo('email'), password: this.#campo('password') });
      else await entrar(this.#campo('iusuario').toLowerCase(), this.#campo('password'));
      this.#ocupado = false;
      avisar('¡Bienvenido a CoContable!', 'success');
      this.emit('coco-cerrar', {});
    } catch (e) {
      this.#ocupado = false;
      this.#error = e instanceof Error ? e.message : 'No se pudo entrar';
      const aviso = this.shadow?.querySelector('[data-error]');
      if (aviso) {
        aviso.textContent = this.#error;
        aviso.removeAttribute('hidden');
      }
    }
  }

  protected override pintar(root: ShadowRoot, props: CocoAccesoProps): void {
    if (!props.abierto) return;
    const crear = props.modo === 'crear';
    const enviar = () => void this.#enviar(props);
    root.append(html`
      <iswc-dialog open label=${crear ? 'Crea tu cuenta' : 'Inicia sesión'} oniswc-after-hide=${() => this.emit('coco-cerrar', {})}>
        <form class="acceso" onsubmit=${(e: Event) => { e.preventDefault(); enviar(); }}>
          <div class="banner" aria-hidden="true"></div>
          <p class="lema">${crear ? 'Tu contabilidad, fresca como agua de coco.' : 'Qué bueno verte de nuevo.'}</p>
          <iswc-input data-campo="iusuario" label="Usuario" autocomplete="username" required></iswc-input>
          ${crear ? html`<iswc-input data-campo="nombre" label="Tu nombre"></iswc-input><iswc-input data-campo="email" label="Correo" type="email" required></iswc-input>` : null}
          <iswc-input data-campo="password" label="Contraseña" type="password" password-toggle autocomplete=${crear ? 'new-password' : 'current-password'} hint=${crear ? 'Mínimo 12 caracteres.' : ''} required oniswc-enter=${enviar}></iswc-input>
          <iswc-callout data-error color="danger" hidden></iswc-callout>
        </form>
        <iswc-button slot="footer" variant="text" onclick=${() => { this.props = { modo: crear ? 'entrar' : 'crear' }; }}>${crear ? 'Ya tengo cuenta' : 'Crear una cuenta'}</iswc-button>
        <iswc-button slot="footer" data-enviar onclick=${enviar}>${crear ? 'Crear cuenta' : 'Entrar'}</iswc-button>
      </iswc-dialog>
    `);
  }
}

define(CocoAcceso);
