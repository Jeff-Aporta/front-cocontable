# front-cocontable

Interfaz de **CoContable**: contabilidad, facturación, inventario y cartera para Colombia. Web components vanilla sobre [iswc-base](https://github.com/Jeff-Aporta/is-webcomponents), sin framework. El API es `api-cocontable` (Cloudflare Workers con los datos en SQLite propio).

**En vivo:** <https://jeff-aporta.github.io/front-cocontable/> — sin cuenta se recorre la empresa de muestra «Cocos del Caribe» en solo lectura.

```bash
deno install && deno task build && deno task serve   # http://127.0.0.1:8422/
```

- Trabajar en el repo (personas y agentes): [AGENTS.md](AGENTS.md)
- Galería de componentes: [`view/demo/`](view/demo/)
