---
name: coco-factura
description: Digitación de un documento con renglones: factura de venta, tirilla POS, cotización, remisión o factura de compra.
---

# `<coco-factura>`

Encabezado (numeración, fecha, bodega, tercero, forma de pago), buscador por nombre, referencia o código de barras, renglones editables, retenciones, totales, lo recibido y el cambio. Atajos: F9 finalizar, F4 limpiar, F2 descuento. Crea cliente y producto al vuelo. Los valores definitivos los liquida el API.

## Anatomía

```
<coco-factura>
  #shadow-root
    <header class="barra">  título · estado · atajos
    <section part="encabezado">  selectores y fecha
    <section class="buscador">  <iswc-input data-buscar> · crear producto
    <section part="renglones">  <div class="fila-r"> × n
    <section part="pie">  retenciones · <dl part="totales">
    <footer class="acciones">  Limpiar · Guardar pendiente · Finalizar
    <coco-ficha>             (cliente o producto al vuelo)
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `clase` | `string` | `"POS"` | Clase de documento que digita. |

## Eventos

| Evento | Detalle | Cuándo |
| --- | --- | --- |
| `coco-documento` | `{ documento }` | Al finalizar o guardar el pendiente. |
| `coco-imprimir` | `{ documento }` | Al pedir la tirilla del documento recién finalizado. |

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-factura></coco-factura>
```
