---
name: coco-comprobantes
description: Comprobantes contables: lista con filtros y editor de renglones con totales y diferencia; pendiente, finalizar, anular y eliminar.
---

# `<coco-comprobantes>`

Comprobantes contables: lista con filtros y editor de renglones con totales y diferencia; pendiente, finalizar, anular y eliminar.

## Anatomía

```
<coco-comprobantes>
  #shadow-root
    <header class="barra">  título · filtros · Nuevo            (lista)
    <coco-tabla>
    — editor —
    <header class="barra">  número y estado · diferencia · total
    <section class="encabezado">  tipo · fecha · tercero · centro de costo
    <section part="nuevo">  cuenta · detalle · débito · crédito · Agregar
    <section part="renglones">  <div class="fila-r"> × n · totales
    <footer class="acciones">  Eliminar · Anular · Guardar pendiente · Finalizar
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

<!-- exclude: Props -->

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-comprobantes></coco-comprobantes>
```
