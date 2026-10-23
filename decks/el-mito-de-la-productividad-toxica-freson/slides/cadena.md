---
template: viz
recipe: canvas-signal
label: Visualización · tres ideas
revealStart: 0
steps: 4
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <div class="chain">
        <div class="cell" data-from="1"><img src="assets/icon-target-flat.svg" alt=""></div>
        <div class="cell" data-from="2"><img src="assets/icon-hand-flat.svg" alt=""></div>
        <div class="cell stack" data-from="3">
          <img class="layer" src="assets/icon-batman.svg" alt="" data-from="3" data-until="4">
          <img class="layer" src="assets/icon-joker.svg" alt="" data-from="4">
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
  Imaginen por un momento que hacen las tres cosas. (→)
  Si paran, piensan y cambian la perspectiva, si dejan de perseguir el movimiento para perseguir el impacto, entonces dejan de ser un perfil fácil de reemplazar por una IA y pasan a ser la persona que decide qué hay que construir. Eso no se reemplaza. (→)
  Si dejan de hacer cosas solo porque ahora, con IA, pueden hacerlas, si reducen deuda y complejidad, entonces dejan de ser una fábrica de código y pasan a ser ingenieros que resuelven problemas. Con menos código, menos mantenimiento y más tiempo para lo que importa. (→)
  Y si se sacan la capa, si sueltan, comparten y diseñan para su ausencia, entonces dejan de ser el cuello de botella indispensable y pasan a ser quien multiplica al equipo. Esos ingenieros que todas las empresas quieren tener, y que además pueden ascender, porque no son insustituibles. (→)
  Y si no sueltan la capa... bueno. O morís como héroe, o vivís lo suficiente para convertirte en villano.
---
