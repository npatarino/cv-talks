---
template: viz
recipe: canvas-signal
label: Bus factor · 1
revealStart: 0
steps: 0
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <div class="scene">
      <div class="slot" style="left:788px"><svg viewBox="0 0 160 160" class="person" fill="none" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2 64)"><g class="splat" stroke="none"><path d="M40 28 c-6 -8 4 -16 12 -12 c4 -8 16 -8 20 -1 c8 -4 16 4 12 12 c6 6 0 14 -8 12 c-4 8 -16 8 -20 2 c-8 4 -18 -4 -16 -13 Z"/><path d="M44 82 c-6 -6 2 -14 10 -11 c4 -7 14 -6 18 0 c8 -3 14 6 9 12 c4 6 -4 12 -10 9 c-4 6 -14 6 -18 0 c-7 3 -13 -4 -9 -10 Z"/><circle cx="26" cy="18" r="3.5"/><circle cx="90" cy="92" r="3"/></g></g><g class="fill" stroke="none" transform="translate(3 3)"><circle class="m-head" cx="80" cy="22" r="14"/><path class="m-neckfill" d="M76 34 l8 0 l0 9 l-8 0 Z"/><path class="m-shirt" d="M58 44 L51 66 L62 68 L64 92 L96 92 L98 68 L109 66 L102 44 Z"/><circle class="m-hand1" cx="55" cy="100" r="4.5"/><circle class="m-hand2" cx="105" cy="100" r="4.5"/></g><g class="hair" stroke="none" transform="translate(36 0)"><path d="M30 20 c0 -11 6 -16 14 -16 s14 5 14 16 c-4 -6 -8 -8 -14 -8 s-10 2 -14 8 Z"/></g><circle class="ink m-head" stroke-width="5" cx="80" cy="22" r="14"/><path class="ink m-neck" stroke-width="5" d="M76 35 l0 8 M84 35 l0 8"/><path class="ink m-shirt" stroke-width="5" d="M58 44 L51 66 L62 68 L64 92 L96 92 L98 68 L109 66 L102 44 Z"/><path class="ink m-arms" stroke-width="5" d="M52 66 c-1 10 0 20 2 30 M108 66 c1 10 0 20 -2 30"/><circle class="ink m-hand1" stroke-width="4" cx="55" cy="100" r="4.5"/><circle class="ink m-hand2" stroke-width="4" cx="105" cy="100" r="4.5"/><path class="ink m-legs" stroke-width="6" d="M70 95 c-1 18 -2 36 -3 54 M90 95 c1 18 2 36 3 54"/><circle class="shoe m-foot1" cx="63" cy="152" r="5"/><circle class="shoe m-foot2" cx="97" cy="152" r="5"/><circle class="ink thin m-head" stroke-width="2" cx="80" cy="22" r="10"/><path class="ink thin m-thin1" stroke-width="2" d="M64 88 l0 -20 l-10 -2"/><path class="ink thin m-thin2" stroke-width="2" d="M86 86 l9 -9 M83 91 l13 -13"/></svg></div>
      <img class="bus" src="assets/bus.svg" alt="">
      </div>
      <div class="legend swap"><span>Bus factor · 1</span></div>
      <style>
      .s-viz .legend.swap { height: 36px; position: relative; }
      .s-viz .legend.swap > span { position: absolute; left: 0; right: 0; justify-content: center; }
      .s-viz .legend.swap > span::before { display: none; }
      .s-viz .scene { position: relative; flex: 1; min-height: 0; }
      .s-viz .slot { position: absolute; bottom: 83px; width: 104px; height: 104px; }
      .s-viz .bus { position: absolute; bottom: 74px; left: 0; width: 150px; transform: translateX(-360px); animation: bus-in 1.2s cubic-bezier(.5,0,.3,1) .4s forwards; }
      @keyframes bus-in { to { transform: translateX(330px); } }
      .s-viz .slot .person { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; transform-origin: 50% 100%; }
      .s-viz .slot .person .ink { stroke: var(--recipe-ink); }
      .s-viz .slot .person .thin { opacity: .7; }
      .s-viz .slot .person .fill { fill: var(--lemon, #f9d71c); }
      .s-viz .slot .person .hair { fill: var(--charcoal, #1c1c1c); transition: opacity .3s ease .3s; }
      .s-viz .slot .person .shoe { fill: var(--recipe-ink); }
      .s-viz .slot .person path, .s-viz .slot .person circle { transition: d .9s cubic-bezier(.55,0,.25,1) .2s, cx .9s cubic-bezier(.55,0,.25,1) .2s, cy .9s cubic-bezier(.55,0,.25,1) .2s; }
      </style>
  note: { content: 'Ilustración conceptual.', meta: Note_Text }
notes: |
  Bus factor de uno. Todo el conocimiento de algo importante está en una sola persona, y el proyecto queda a un autobús de distancia de pararse.
  Y a veces esa persona sos vos. Sos el salvador.
---
