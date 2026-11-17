// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * fichas.mjs — genera, a partir de `scripts/gen/fichas.json`, la ficha `.md` (front matter + 6 secciones) y el preview
 * `.json` (`iswc-preview/v1`, con un control por prop) de cada componente `coco-*`, y reescribe la galería
 * (`view/demo/manifest.json`). Así un componente nuevo solo añade su entrada a `fichas.json`.
 *   deno run -A scripts/gen/fichas.mjs            genera lo que falta
 *   deno run -A scripts/gen/fichas.mjs --todo     regenera todas (pisa las existentes)
 * Lo corre `deno task fichas`; el guardián `tests/vistas/contrato-componentes.test.ts` valida el resultado.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const raiz = new URL('../../', import.meta.url);
const ruta = (rel) => new URL(rel, raiz);
const fichas = JSON.parse(readFileSync(ruta('scripts/gen/fichas.json'), 'utf8'));
const todo = process.argv.includes('--todo');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tabla = (cab, filas) => (filas.length ? [`| ${cab.join(' | ')} |`, `| ${cab.map(() => '---').join(' | ')} |`, ...filas.map((f) => `| ${f.join(' | ')} |`)].join('\n') : null);

/** Carpeta del componente: transversal (`src/js/components/coco/`) o de una vista (`view/<vista>/components/`). */
const carpeta = (f) => (f.vista ? `view/${f.vista}/components/` : 'src/js/components/coco/');

function md(f) {
  const props = tabla(['Prop', 'Tipo', 'Por defecto', 'Qué hace'], (f.props ?? []).map((p) => [`\`${p.nombre}\``, `\`${p.tipo}\``, `\`${JSON.stringify(p.defecto ?? null)}\``, p.que]));
  const eventos = tabla(['Evento', 'Detalle', 'Cuándo'], (f.eventos ?? []).map((e) => [`\`${e.nombre}\``, `\`${e.detalle}\``, e.cuando]));
  const seccion = (titulo, cuerpo) => `## ${titulo}\n\n${cuerpo ?? `<!-- exclude: ${titulo} -->`}\n`;
  return [
    '---', `name: ${f.tag}`, `description: ${f.descripcion}`, '---', '',
    `# \`<${f.tag}>\``, '', f.proposito, '',
    seccion('Anatomía', '```\n' + f.anatomia.join('\n') + '\n```'),
    seccion('Atributos observados', null),
    seccion('Props', props),
    seccion('Eventos', eventos),
    seccion('Slots', null),
    seccion('Ejemplos', '```html\n' + (f.ejemplo ?? `<${f.tag}></${f.tag}>`) + '\n```' + (f.ejemploJs ? '\n\n```js\n' + f.ejemploJs + '\n```' : '')),
  ].join('\n');
}

function json(f) {
  const control = (p) => {
    const base = { prop: `props:${p.nombre}`, label: p.nombre, default: p.defecto ?? null };
    if (p.opciones) return { control: 'select', options: p.opciones, ...base };
    if (p.tipo === 'boolean') return { control: 'boolean', ...base };
    if (p.tipo === 'number') return { control: 'number', ...base };
    if (p.tipo === 'string') return { control: 'text', ...base };
    return { control: 'json', ...base };
  };
  const id = f.tag.replace(/^coco-/, 'demo-');
  const demo = { kind: 'demo', html: `<div class="stage"><${f.tag} id="${id}"></${f.tag}></div>`, target: `#${id}`, ...((f.props ?? []).length ? { controls: f.props.map(control) } : {}) };
  const notas = { kind: 'html', html: `<iswc-callout color="brand"><strong slot="title">Cuándo usarlo</strong>${esc(f.cuando)}</iswc-callout><iswc-callout color="warning"><strong slot="title">Cuándo no</strong>${esc(f.cuandoNo)}</iswc-callout>` };
  return JSON.stringify({ $schema: 'iswc-preview/v1', tag: f.tag, category: f.vista ?? 'app', navTitle: f.titulo, title: `&lt;${f.tag}&gt;`, titleHtml: false, storageKey: `docs-${f.tag}`, styles: '.stage{padding:1rem;min-height:18rem}', sections: [{ id: 'intro', title: `&lt;${f.tag}&gt;`, lede: f.descripcion, blocks: [demo, notas] }] });
}

let escritos = 0;
for (const f of fichas) {
  for (const [ext, generar] of [['md', md], ['json', json]]) {
    const destino = ruta(`${carpeta(f)}${f.tag}.${ext}`);
    if (!todo && existsSync(destino)) continue;
    writeFileSync(destino, generar(f) + (ext === 'md' ? '' : '\n'));
    escritos++;
  }
}
const manifest = fichas.map((f) => ({ tag: f.tag, file: f.vista ? `../${f.vista}/components/${f.tag}.json` : `../../src/js/components/coco/${f.tag}.json` }));
writeFileSync(ruta('view/demo/manifest.json'), JSON.stringify(manifest));
console.log(`[fichas] ${fichas.length} componentes · ${escritos} archivos escritos · galería actualizada`);
