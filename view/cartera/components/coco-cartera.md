---
name: coco-cartera
description: Cartera por cobrar o por pagar: búsqueda por nombre, totales (total, abonado, saldo, en mora), documentos pendientes, historial de abonos y registro de un abono.
---

# `<coco-cartera>`

Cartera por cobrar o por pagar: búsqueda por nombre, totales (total, abonado, saldo, en mora), documentos pendientes, historial de abonos y registro de un abono.

## Anatomía

```
<coco-cartera>
  #shadow-root
    <header class="barra">  título · buscar · historial
    <div part="totales">  <iswc-stat> × 4
    <coco-tabla>
    <iswc-dialog>  (historial)
    <coco-ficha>   (abono)
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `tipo` | `string` | `"CxC"` | Por cobrar o por pagar. |

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-cartera></coco-cartera>
```
