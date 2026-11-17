// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * arte.ts — ilustraciones caribeñas de la app (assets/arte/*.svg) como variables CSS `--coco-arte-<nombre>`.
 *
 * Se declaran en `:root` con URL ABSOLUTA (resuelta contra la página) para que las hojas de los shadow roots las usen
 * con `background-image: var(--coco-arte-isla)` sin depender de rutas relativas. El arte es decorativo: va siempre
 * en fondos o pseudo-elementos (sin foco, sin clics, sin texto alternativo) y se oculta en pantallas angostas
 * (mixin `v.adorno` en `src/styles/_vista.scss`).
 */
export const ARTE = ['isla', 'hamaca', 'paisaje', 'agua-de-coco', 'mojito', 'coctel', 'gafas', 'sombrilla', 'palma', 'olas', 'coco'] as const;
export type Arte = (typeof ARTE)[number];

/** Declara las variables del arte en `:root` (idempotente). */
export function declararArte(raiz: HTMLElement = document.documentElement): void {
  for (const nombre of ARTE) {
    const url = new URL(`./assets/arte/${nombre}.svg`, document.baseURI).href;
    raiz.style.setProperty(`--coco-arte-${nombre}`, `url("${url}")`);
  }
}
