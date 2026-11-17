// @contexto AGENTS.md · skills/iswc-foundation/references/04-estilos.md
/**
 * apariencia.ts — aplica tema, paleta y densidad a `<html>` y los deja donde `boot.ts` los lee antes del primer pintado
 * (`iswc:app-cfg`, la misma llave que usan `<iswc-theme-toggle>` y `<iswc-palette-selector>` del kit).
 * Por defecto: paleta Delfín y tema claro.
 */
export const TEMA_DEFECTO = 'light';
export const PALETA_DEFECTO = 'delfin';
/** Paletas del kit que se ofrecen en Apariencia (id → nombre). */
export const PALETAS: [string, string][] = [['delfin', 'Delfín'], ['cardenal', 'Cardenal'], ['beta', 'Beta'], ['esmeralda', 'Esmeralda'], ['coral', 'Coral'], ['ambar', 'Ámbar'], ['violeta', 'Violeta'], ['grafito', 'Grafito']];

/** Aplica las preferencias de apariencia que vengan (lo que falte queda como está). */
export function aplicarApariencia(p: Record<string, unknown>): void {
  const raiz = document.documentElement;
  const tema = p['tema'] === 'dark' || p['tema'] === 'light' ? p['tema'] : null;
  const paleta = typeof p['paleta'] === 'string' && p['paleta'] ? p['paleta'] : null;
  if (tema) {
    raiz.dataset['theme'] = tema;
    raiz.classList.toggle('theme-dark', tema === 'dark');
    raiz.classList.toggle('theme-light', tema === 'light');
  }
  if (paleta) raiz.dataset['palette'] = paleta;
  if (p['densidad'] === 'compacta' || p['densidad'] === 'comoda') raiz.dataset['densidad'] = p['densidad'];
  if (!tema && !paleta) return;
  try {
    const previo: unknown = JSON.parse(localStorage.getItem('iswc:app-cfg') ?? '{}');
    const cfg = previo && typeof previo === 'object' ? previo : {};
    localStorage.setItem('iswc:app-cfg', JSON.stringify({ ...cfg, ...(tema ? { theme: tema } : {}), ...(paleta ? { palette: paleta } : {}) }));
  } catch { /* sin almacenamiento: se aplica solo en esta carga */ }
}

/** Tema y paleta vigentes en la página. */
export function aparienciaActual(): { tema: string; paleta: string; densidad: string } {
  const d = document.documentElement.dataset;
  return { tema: d['theme'] ?? TEMA_DEFECTO, paleta: d['palette'] ?? PALETA_DEFECTO, densidad: d['densidad'] ?? 'comoda' };
}
