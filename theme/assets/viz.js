/* viz.js · progressive steps for `viz` slides.
   step = nº de `.revealable.viz-step` visibles (los oculta present.js con
   data-reveal-hidden). En cada cambio:
     - section.dataset.step = step
     - cada [data-from="n"] recibe/pierde `.is-on` según step >= n
     - [data-until="n"] se apaga cuando step >= n (para reemplazos)
     - dispara `vizstep` ({detail:{step, prev}}) en la section para JS propio.
   Los elementos de datos no necesitan nada más: la animación vive en el CSS
   del slide (transiciones sobre `.is-on`). */
(function () {
  var section = document.querySelector("section.s-viz");
  if (!section) return;
  var markers = section.querySelectorAll(".viz-step");
  var prev = -1;
  function current() {
    var n = 0;
    markers.forEach(function (m) { if (!m.hasAttribute("data-reveal-hidden")) n++; });
    return n;
  }
  function apply() {
    var step = current();
    if (step === prev) return;
    section.dataset.step = step;
    section.querySelectorAll("[data-from]").forEach(function (el) {
      el.classList.toggle("is-on", step >= parseInt(el.dataset.from, 10));
    });
    section.querySelectorAll("[data-until]").forEach(function (el) {
      el.classList.toggle("is-off", step >= parseInt(el.dataset.until, 10));
    });
    section.dispatchEvent(new CustomEvent("vizstep", { detail: { step: step, prev: prev } }));
    prev = step;
  }
  var mo = new MutationObserver(apply);
  markers.forEach(function (m) { mo.observe(m, { attributes: true, attributeFilter: ["data-reveal-hidden"] }); });
  // present.js inicializa los hidden en DOMContentLoaded/load: aplicamos tras ambos.
  apply();
  window.addEventListener("load", apply);
  document.addEventListener("DOMContentLoaded", apply);
})();
