---
template: viz
recipe: canvas-signal
label: Héroe · capa gris
revealStart: 0
steps: 1
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <div class="cape-stack">
        <img class="layer" src="assets/cape-blue.svg" alt="" data-from="0" data-until="1">
        <img class="layer" src="assets/icon-cape-dark.svg" alt="" data-from="1">
      </div>
      <style>
      .s-viz .cape-stack { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; }
      .s-viz .cape-stack .layer { position: absolute; width: 100px; height: 100px; transition: opacity 1.2s ease; }
      .s-viz .cape-stack .layer.is-off { opacity: 0; }
      </style>
notes: |
  Desheroicificarnos. Reducir nuestro protagonismo. (→ la capa pierde el color)
  Tu nivel de impacto no se mide por las veces que salvás al mundo, sino por diseñar un sistema tan robusto, automatizado y autoexplicativo que funciona perfectamente cuando no estás.
  Y esto no significa trabajar menos, ni desentenderse del equipo. Significa multiplicar a quienes te rodean y dejar de ser el cuello de botella. Sí, vas a tener menos visibilidad. Pero vas a ser mejor ingeniero.
  ¿Y cómo se hace? Tres cosas.
---
