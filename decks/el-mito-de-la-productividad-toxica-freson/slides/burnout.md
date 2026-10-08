---
template: icon
recipe: critical
label: burnout
variant: default
items:
  - glyph: |
      <svg viewBox="0 0 512 512" style="overflow:visible" fill="none" stroke="#fafaf8" stroke-linecap="round" stroke-linejoin="round">
      <style>
      .fm-fresh { animation: fm-consume 3.6s linear .9s forwards; }
      .fm-head { animation: fm-headout .5s ease-in .9s forwards; }
      .fm-travel { animation: fm-travel 3.6s linear .9s forwards; }
      .fm-char { opacity: 0; animation: fm-in .3s ease-out .8s forwards; }
      .fm-ignite { transform-box: fill-box; transform-origin: 50% 100%; opacity: 0; transform: scale(.2); animation: fm-pop .3s cubic-bezier(.3,1.6,.5,1) .8s forwards, fm-out .45s ease-in 4.4s forwards; }
      .fm-flicker { transform-box: fill-box; transform-origin: 50% 100%; animation: fm-flick .16s ease-in-out .8s infinite alternate; }
      .fm-smoke { opacity: 0; animation: fm-smoke 2.4s ease-out 4.7s infinite; }
      @keyframes fm-consume { to { y: 452px; height: 4px; } }
      @keyframes fm-headout { to { opacity: 0; transform: translateY(14px) scale(.6); } }
      @keyframes fm-in { to { opacity: 1; } }
      @keyframes fm-travel { to { transform: translateY(284px); } }
      @keyframes fm-pop { to { opacity: 1; transform: scale(1); } }
      @keyframes fm-out { to { opacity: 0; transform: scale(.3); } }
      @keyframes fm-flick { from { transform: scale(1,1) rotate(-3deg); } to { transform: scale(.92,1.12) rotate(4deg); } }
      @keyframes fm-smoke { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: .7; } 100% { opacity: 0; transform: translateY(-80px); } }
      </style>
      <!-- palo sin quemar (se consume desde arriba) -->
      <rect class="fm-fresh" fill="#f9d71c" stroke="none" x="242" y="135" width="40" height="330" rx="18"/>
      <rect class="fm-fresh" stroke-width="16" x="236" y="128" width="40" height="330" rx="18"/>
      <!-- cabeza -->
      <g class="fm-head" style="transform-box: fill-box; transform-origin: 50% 100%;">
      <path fill="#a64132" stroke="none" transform="translate(6 7)" d="M256 60 c26 0 40 24 40 50 c0 24 -16 40 -40 40 c-24 0 -40 -16 -40 -40 c0 -26 14 -50 40 -50 Z"/>
      <path stroke-width="16" d="M256 60 c26 0 40 24 40 50 c0 24 -16 40 -40 40 c-24 0 -40 -16 -40 -40 c0 -26 14 -50 40 -50 Z"/>
      </g>
      <!-- frente de brasa + llama, viajan juntos -->
      <g class="fm-travel">
      <path class="fm-char" fill="#1c1c1c" stroke="#fafaf8" stroke-width="14" d="M238 108 c6 -8 30 -8 36 0 c-2 22 4 44 -2 66 c-10 6 -22 6 -32 0 c-6 -22 0 -44 -2 -66 Z"/>
      <g class="fm-ignite"><g class="fm-flicker">
      <path fill="#f9d71c" stroke="none" transform="translate(5 5)" d="M256 110 c-44 -36 -44 -82 -8 -112 c-4 28 14 36 22 20 c26 22 34 66 -14 92 Z"/>
      <path stroke-width="14" d="M256 110 c-44 -36 -44 -82 -8 -112 c-4 28 14 36 22 20 c26 22 34 66 -14 92 Z"/>
      <path fill="#fafaf8" stroke="none" d="M256 98 c-18 -16 -16 -40 0 -52 c16 12 18 36 0 52 Z"/>
      </g></g>
      </g>
      <!-- humo -->
      <path class="fm-smoke" stroke-width="8" opacity=".7" d="M258 384 c-14 -18 10 -30 -4 -50 c-12 -16 8 -30 -2 -46"/>
      </svg>
notes: |
  Burnout.
  Nos cuesta admitirlo, pero muchos de los que estamos acá, estoy casi seguro que estamos al borde del burnout y no lo sabemos, o no lo queremos ver porque nos dejamos llevar.
  Yo cuando miro para atrás veo un montón de momentos en los que estuve en burnout, pero no lo sabía, y muchas de esas veces, yo creía que estaba siendo súper productivo.
  Por eso me gustaría cambiar la definición de lo que yo creo que es productividad.
---
