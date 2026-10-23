---
template: icon
recipe: critical
label: Borrar
variant: default
items:
  - { glyph: '<img src="assets/icon-skull.svg" alt="">' }
  - { glyph: '<img src="assets/icon-dependency.svg" alt="">' }
  - { glyph: '<img src="assets/icon-flask.svg" alt="">' }
  - { glyph: '<img src="assets/icon-telemetry.svg" alt="">' }
  - { glyph: '<img src="assets/icon-phone-feature.svg" alt="">' }
notes: |
  Primero, borrar. Vamos a pagar la deuda. El código muerto de esa feature flag que se cerró hace dos años. Las dependencias que nadie usa pero que hay que actualizar igual. Los tests que ralentizan la pipeline y no validan funcionalidad, o los flaky que se reintentan un par de veces hasta que pasan. La telemetría que cuesta dinero en Datadog: nos encanta loguear un "Success" en una llamada que se ejecuta millones de veces al día y que no aporta nada.
  Y lo más grande de todo: features. El pasivo más caro no es código, es producto. Esa pantalla que usa el 0,3 % de los usuarios, la integración que nadie pidió desde 2021, la opción de configuración que un cliente pidió una vez. Borrar una feature elimina de golpe el código, los tests, la documentación y el soporte. Y es una conversación con negocio que ustedes pueden abrir con los datos de uso en la mano.
  Antes esto no se hacía porque tal vez te llevaba una semana, y a ver cómo sacás una semana para dedicarte a borrar código. Ahora, con la IA, si no lo hacés es porque no querés. Con un prompt súper simple, "buscá en este repo símbolos sin referencias, flags que nadie lee y dependencias que nadie importa, y prepará las PRs", lo tenés.
  Pero eh, una cosa antes de salir corriendo a borrar. Nosotros también queremos dos cosas: que valoren lo que hacemos, para poder crecer en la empresa, e influir en los demás, para lo mismo. Así que antes de borrar, medir. No es lo mismo decir "mergeé tres PRs borrando tests que no eran muy útiles" que decir "acabo de borrar 120 tests inútiles, el 15 % de los que teníamos, y la pipeline de CI tarda un 28 % menos". La misma tarde de trabajo. Una es limpieza; la otra es impacto, y se nota.
---
