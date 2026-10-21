---
template: viz
recipe: canvas-signal
label: Visualización · tres ideas
revealStart: 0
steps: 5
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <div class="chain">
        <div class="cell" data-from="1"><img src="assets/icon-impact-2.svg" alt=""></div>
        <div class="cell" data-from="2"><img src="assets/icon-avoid.svg" alt=""></div>
        <div class="cell stack" data-from="3">
          <img class="layer" src="assets/icon-cape-dark.svg" alt="" data-from="3" data-until="4">
          <img class="layer" src="assets/icon-batman.svg" alt="" data-from="4" data-until="5">
          <img class="layer" src="assets/icon-joker.svg" alt="" data-from="5">
        </div>
      </div>
      <style>
      .s-viz .chain { flex: 1; display: flex; align-items: center; justify-content: center; gap: 40px; }
      .s-viz .cell { width: 100px; height: 100px; position: relative; }
      .s-viz .cell img { width: 100px; height: 100px; display: block; }
      .s-viz .cell .layer { position: absolute; inset: 0; transition: opacity .7s ease, transform .7s ease; }
      .s-viz .cell .layer.is-off { opacity: 0; transform: scale(.85); }
      </style>
notes: |
  Tres ideas para llevarse. (→)
  1. Parar. Pensar. Cambiar la perspectiva. Dejar de perseguir el movimiento para perseguir el impacto. No escribimos código, resolvemos problemas. Si hacemos eso, multiplicamos el valor que entregamos y dejamos de ser profesionales fácilmente reemplazables por una IA. (→)
  2. Reducir deuda técnica. Dejar de hacer cosas solo porque ahora, con IA, podemos hacerlas. Reducir complejidad. Dejamos de ser fábricas de escribir código para convertirnos en ingenieros que resuelven problemas reales. (→)
  3. Que otros no controlen tu carrera. Si dejás que otros lo hagan, te van a convertir en un héroe. (→ se quita la capa, queda Batman)
  Y los héroes están muy bien... (→ Batman se convierte en el Joker)
  ... pero no te olvides: o morís como héroe, o vivís lo suficiente para convertirte en villano.
---
