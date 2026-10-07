---
template: viz
recipe: canvas-quiet
label: Esfuerzo vs impacto · matriz
revealStart: 0
steps: 2
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <style>
        .s-viz .mx-mv { opacity: 0; transition: transform 1.6s cubic-bezier(.45,.05,.2,1), opacity .6s ease; }
        .s-viz[data-step="2"] .mx-mv { opacity: 1; }
        .s-viz .mx-1 { transform: translate(1150px, 380px); } .s-viz[data-step="2"] .mx-1 { transform: translate(260px, 110px); }
        .s-viz .mx-2 { transform: translate(1250px, 440px); } .s-viz[data-step="2"] .mx-2 { transform: translate(430px, 180px); }
        .s-viz .mx-3 { transform: translate(1350px, 400px); } .s-viz[data-step="2"] .mx-3 { transform: translate(230px, 250px); }
      </style>
      <svg viewBox="0 0 1680 560" preserveAspectRatio="xMidYMid meet">
        <g data-from="1" fill="var(--recipe-warn)">
          <circle cx="1100" cy="380" r="26"/><circle cx="1230" cy="460" r="26"/><circle cx="1360" cy="350" r="26"/>
          <circle cx="1480" cy="450" r="26"/><circle cx="1560" cy="520" r="26"/>
        </g>
        <path class="draw" data-from="2" pathLength="1" fill="none" stroke="var(--recipe-em)" stroke-width="8" stroke-linecap="round"
          d="M1000 330 C 900 250, 760 190, 640 170"/>
        <path data-from="2" fill="none" stroke="var(--recipe-em)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M672 134 L636 170 L676 200"/>
        <g fill="var(--recipe-accent)">
          <circle class="mx-mv mx-1" r="34"/><circle class="mx-mv mx-2" r="34"/><circle class="mx-mv mx-3" r="34"/>
        </g>
      </svg>
      <div class="legend">
        <span data-from="1" class="dot" style="--c:var(--recipe-warn)">Actividad: reuniones, tickets, PRs, commits, horas extra</span>
        <span data-from="2" class="dot" style="--c:var(--recipe-accent)">Impacto: dependencias, equipos, feature clave</span>
      </div>
  note: { content: 'Ilustrativo.', meta: Note_Text }
notes: |
  El esfuerzo no es valor que aportemos a nuestros usuarios. El movimiento no es impacto que estamos generando dentro de la compañía.
  La actividad no es productividad.
  Fijaos: lo que solemos medir (reuniones, tickets movidos, PRs, commits, horas extra) es mucho esfuerzo y poco impacto.
  Y lo que de verdad mueve la aguja (eliminar dependencias, desbloquear equipos, entregar la feature clave) requiere a menudo menos actividad visible, no más.
---
