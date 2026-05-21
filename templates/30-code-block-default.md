---
template: code-block
recipe: canvas-quiet
order: 30
label: "Code-block · default"
fields:
  title:
    content: "Detección<br>de regresiones."
    meta: "Title_Text"
  code:
    meta: "Code_Block"
    source: "ci/check-regressions.ts"
    content: |
      <span class="ln"> 1</span><span class="kw">function</span> <span class="fn">checkRegressions</span>(report: <span class="ty">Report</span>): <span class="ty">Result</span> {
      <span class="ln"> 2</span>    <span class="kw">const</span> failed = report.cases.<span class="fn">filter</span>((c) =&gt; !c.passed);
      <span class="ln"> 3</span>    <span class="kw">if</span> (failed.length === <span class="num">0</span>) {
      <span class="ln"> 4</span>        <span class="kw">return</span> { ok: <span class="kw">true</span> };
      <span class="ln"> 5</span>    }
      <span class="ln"> 6</span>    <span class="kw">throw</span> <span class="kw">new</span> <span class="ty">RegressionError</span>(failed);
      <span class="ln"> 7</span>}
---
