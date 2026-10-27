---
template: viz
recipe: canvas-quiet
label: 'Matriz · mi rol y el siguiente'
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
      <style>section.slide.s-viz{background:#FCE55E !important;color:#2B2B2B !important;}</style><div class="wrap" style="padding:0"><svg viewBox="0 0 1920 1080" style="width:100%;height:100%" fill="none"><polygon points="960,474 999,487 1023,520 1023,560 999,593 960,606 921,593 897,560 897,520 921,487" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><polygon points="960,408 1038,433 1086,499 1086,581 1038,647 960,672 882,647 834,581 834,499 882,433" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><polygon points="960,342 1076,380 1148,479 1148,601 1076,700 960,738 844,700 772,601 772,479 844,380" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><polygon points="960,276 1115,326 1211,458 1211,622 1115,754 960,804 805,754 709,622 709,458 805,326" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><polygon points="960,210 1154,273 1274,438 1274,642 1154,807 960,870 766,807 646,642 646,438 766,273" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="960" y2="210" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="1154" y2="273" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="1274" y2="438" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="1274" y2="642" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="1154" y2="807" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="960" y2="870" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="766" y2="807" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="646" y2="642" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="646" y2="438" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><line x1="960" y1="540" x2="766" y2="273" stroke="#2B2B2B" stroke-opacity=".35" stroke-width="1.5"/><polygon points="960,243 1125,313 1195,464 1274,642 1115,754 960,771 873,660 787,596 850,504 873,420" fill="#E8625C" fill-opacity=".9"/><text x="960" y="158" text-anchor="middle" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Owns</text><text x="1189" y="232" text-anchor="start" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Ambiguity</text><text x="1331" y="427" text-anchor="start" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Communication</text><text x="1331" y="669" text-anchor="start" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Technical Complexity</text><text x="1189" y="864" text-anchor="start" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Impact</text><text x="960" y="938" text-anchor="middle" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Execution</text><text x="731" y="864" text-anchor="end" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Process Improvement</text><text x="589" y="669" text-anchor="end" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Knowledge / Judgement</text><text x="589" y="427" text-anchor="end" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Mentorship</text><text x="731" y="232" text-anchor="end" fill="#E33E80" font-family="var(--font-ui)" font-weight="700" font-size="26">Collaboration</text></svg></div>
steps: 0
notes: |
  Obviamente hay que validar esta matriz con alguien, con tu mánager, con alguien que tenga evidencias y que pueda confirmar dónde estás.
  Yo suelo hacer esta matriz dos veces, una en mi rol, y una en el siguiente.
  En el siguiente, obviamente porque es donde tengo más que aprender, más para crecer, más para centrarme y esforzarme.
  Pero no te olvides de tu rol, porque a pesar de que busques esa promoción, tenés que hacer lo que se espera de vos, no podés hacer lo de tu siguiente rol y estar under performance de lo que se espera de vos.
---
