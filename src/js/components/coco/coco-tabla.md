---
name: coco-tabla
description: Tabla de datos sobre la grilla del kit, con columnas declarativas y aviso de la fila elegida.
---

# `<coco-tabla>`

Recibe columnas (texto, dinero, número, fecha, sí/no, estado) y filas, las formatea y emite la fila al hacer clic. No conoce el API.

## Anatomía

```
<coco-tabla>
  #shadow-root
    <iswc-data-grid part="tabla">     (o <iswc-empty-state part="vacio"> sin filas)
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `columnas` | `Columna[]` | `[{"campo":"codigo","titulo":"Código","tipo":"texto","ancho":120},{"campo":"nombre","titulo":"Nombre","tipo":"texto"},{"campo":"valor","titulo":"Valor","tipo":"dinero","ancho":140}]` | Columnas: campo, título, tipo y ancho opcional. |
| `filas` | `Fila[]` | `[{"codigo":"COCO-001","nombre":"Agua de coco 330 ml","valor":4500},{"codigo":"COCO-002","nombre":"Cocada blanca x 6","valor":9800}]` | Filas tal como llegan del API. |
| `vacio` | `string` | `"No hay registros todavía."` | Texto cuando no hay filas. |

## Eventos

| Evento | Detalle | Cuándo |
| --- | --- | --- |
| `coco-fila` | `{ fila }` | Al hacer clic en una fila. |

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-tabla></coco-tabla>
```
