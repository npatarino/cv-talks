---
template: viz
recipe: canvas-quiet
label: 'Skills · matriz de habilidades'
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <style>
      section.slide.s-viz { padding: 0; }
      .s-viz .stage { margin: 0; }
      .s-viz .stage > .wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 80px 120px; }
      .s-viz .mk { display: inline-block; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
      .s-viz .center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; }
      .s-viz .big { font-family: var(--font-display); font-size: 84px; line-height: 1.1; letter-spacing: .01em; text-transform: uppercase; }
      .s-viz .serif { font-family: var(--font-editorial); font-size: 44px; line-height: 1.2; font-weight: 400; }
      .s-viz .strike { text-decoration: line-through; text-decoration-thickness: .12em; }
      .s-viz .row { display: flex; gap: 70px; justify-content: center; align-items: center; }
      .s-viz .cell { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .s-viz img.ic { height: 150px; width: auto; }
      .s-viz .credits { font-family: var(--font-ui); font-weight: 700; font-size: 22px; }
      </style>
      <style>section.slide.s-viz{background:#75FAB1 !important;color:#2B2B2B !important;}</style><style>.s-viz table.sk{border-collapse:separate;border-spacing:0;background:#2B2B2B;color:#FFFFFF;border-radius:26px;overflow:hidden;width:100%;font-family:var(--font-ui);font-size:26px}.s-viz table.sk th,.s-viz table.sk td{padding:22px 24px;border-bottom:2px solid #444;text-align:center}.s-viz table.sk td:first-child,.s-viz table.sk th:first-child{text-align:left;padding-left:40px}.s-viz table.sk td.v{color:#75FAB1;font-size:40px;line-height:1}.s-viz table.sk td.v.bla{font-family:var(--font-mono);font-size:14px;line-height:1.2;text-transform:uppercase}.s-viz table.sk th{font-weight:700;font-size:26px}.s-viz table.sk tr:last-child td{border-bottom:0}.s-viz table.sk caption{caption-side:top;background:#2B2B2B;color:#FFFFFF;font-family:var(--font-display);font-size:40px;padding:34px 0 10px;border-radius:26px 26px 0 0}</style><div class="wrap" style="justify-content:center;padding:60px 110px"><table class="sk"><caption>SKILLS</caption><tr><th>Dimension</th><th>SW I</th><th>SWE II</th><th>Senior</th><th>Staff</th><th>Principal</th><th>...</th></tr><tr><td>Scope of influence</td><td class="v">◯</td><td class="v">◔</td><td class="v">◑</td><td class="v">◕</td><td class="v">●</td><td class="v">●</td></tr><tr><td>Ownership</td><td class="v">-</td><td class="v">•</td><td class="v">• •</td><td class="v">⁖</td><td class="v">∷</td><td class="v">⁙</td></tr><tr><td>Ambiguity</td><td class="v">≣</td><td class="v">≡</td><td class="v">=</td><td class="v">—</td><td class="v">·</td><td class="v">·</td></tr><tr><td>Technical Complexity</td><td class="v">-</td><td class="v">—</td><td class="v">+</td><td class="v">✱</td><td class="v">✳</td><td class="v">✺</td></tr><tr><td>Communication</td><td class="v bla">bla</td><td class="v bla">bla<br>bla</td><td class="v bla">bla<br>bla<br>bla</td><td class="v bla">blabla<br>blabla<br>blabla</td><td class="v bla">blablabla<br>blablabla<br>blablabla</td><td class="v bla">blablabla<br>blablabla<br>blablabla<br>blablabla</td></tr></table></div>
steps: 0
notes: |
  Y una buena forma de empezar a hacerse una ida de qué es uno, y dónde está es con una matriz de habilidades.

  ¿Quién tiene una matriz de habilidades definida en su trabajo? Un montón, ¿y cuántos de ustedes abren ese documento más de 1 vez al año.
---
