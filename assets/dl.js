// @contexto INDICE.md · skills/iswc-foundation/SKILL.md
// assets/dl.js — íconos de la app: SOLO configuración de rutas (`deno task icons`, corre dentro de `build`).
// Baja a assets/iconify/<set>/<nombre>.svg los íconos que usa la app (sin mapa) y poda los que ya nadie usa.
// En ejecución <iswc-icon> busca: localStorage → <html data-icons> (la web PUBLICADA de la app: deno.json →
// iswc.host + assets/iconify/, lo declara el registrador) → API de Iconify. Si un ícono no estaba publicado,
// la consola dice `[iswc-icon] falta en local: <set>:<nombre>`: ese id va en `extra` y se corre `deno task icons`.
// Herramienta ONLINE del kit, siempre @main (la tarea `icons` lleva --reload del origen: Deno cachea los módulos remotos).
import { descargarIconos } from 'https://raw.githubusercontent.com/Jeff-Aporta/is-webcomponents/main/dist/cdn/vendor-distributions/client/tools/download-iconify.mjs';

await descargarIconos({
  raiz: new URL('..', import.meta.url),
  roots: ['index.html', 'src', 'view'],
  // ids que el barrido no ve: armados en ejecución o pintados por dentro por los componentes del kit que usa la app
  // (empty-state, button, select, input, switch, dialog, data-grid, checkbox, callout, toast, stat, tab-group). Sin ellos, Pages
  // responde 404/503 y el ícono cae a la API de Iconify (auditoría del 2026-11-17).
  extra: ['mdi:information-outline', 'mdi:information', 'mdi:close', 'mdi:close-circle', 'mdi:alert', 'mdi:alert-outline', 'mdi:alert-circle', 'mdi:alert-circle-outline', 'mdi:check', 'mdi:check-circle', 'mdi:check-circle-outline', 'mdi:chevron-up', 'mdi:chevron-down', 'mdi:chevron-left', 'mdi:chevron-right', 'mdi:magnify', 'mdi:loading', 'mdi:inbox-outline', 'mdi:eye-outline', 'mdi:eye-off-outline', 'mdi:minus'],
});
