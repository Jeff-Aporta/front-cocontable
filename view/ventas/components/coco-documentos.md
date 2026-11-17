---
name: coco-documentos
description: Lista de documentos por clase con su estado, y el detalle con imprimir, finalizar, anular y nota crédito.
---

# `<coco-documentos>`

Lista los documentos de las clases pedidas de la empresa activa, filtra por estado, abre el detalle con sus renglones y acciones, y abre la digitación con «Nuevo».

## Anatomía

```
<coco-documentos>
  #shadow-root
    <header class="barra">  título · filtro de estado · Nuevo
    <coco-tabla>
    <iswc-dialog>            (detalle: <dl class="resumen"> · <coco-tabla> · acciones)
    <coco-ficha>             (recibo, egreso o ajuste)
    <coco-factura>           (al crear un documento con productos)
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `clases` | `string` | `"FV,POS"` | Clases que lista, separadas por coma. |
| `nuevo` | `string` | `"FV"` | Clase que crea el botón Nuevo (vacío = sin botón). |

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-documentos></coco-documentos>
```
