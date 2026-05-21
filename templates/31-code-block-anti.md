---
template: code-block
recipe: canvas-quiet
order: 31
label: "Code-block · anti"
variant: anti
fields:
  title:
    content: "Así <em>NO</em>."
    meta: "Title_Text"
  code:
    meta: "Code_Block"
    content: |
      <span class="cm">// Catch genérico, sin contexto, sin métricas.</span>
      try {
          processBatch(items);
      } catch (e) {
          console.log("oops");
      }
---
