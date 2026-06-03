---
template: icon
recipe: canvas-quiet
revealStart: 0
label: Cubo Animado
items:
  - glyph: |
      <div id="cube-anim-trigger" class="revealable" style="display:none"></div>
      <svg id="pc" viewBox="0 0 640 640" style="width:480px;color:var(--ivory);overflow:visible"><g stroke="currentColor" stroke-width="15" fill="none" stroke-linecap="round"></g></svg>
      <script>
      (()=>{
      const H=140,C=320,V=[],E=[],g=document.querySelector("#pc > g");
      for(let i=0;i<8;i++)V.push([i&1?H:-H,i&2?H:-H,i&4?H:-H]);
      for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){let d=i^j;if(!(d&d-1))E.push([i,j])}
      const L=E.map(()=>g.appendChild(document.createElementNS("http://www.w3.org/2000/svg","line")));
      const ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
      
      const trigger = document.getElementById("cube-anim-trigger");
      let animating = !trigger.hasAttribute("data-reveal-hidden");
      let startT = animating ? performance.now() : null;

      const observer = new MutationObserver(() => {
        const isHidden = trigger.hasAttribute("data-reveal-hidden");
        if (!isHidden && !animating) {
          animating = true;
          startT = performance.now();
        } else if (isHidden && animating) {
          animating = false;
        }
      });
      observer.observe(trigger, { attributes: true, attributeFilter: ["data-reveal-hidden"] });

      (function f(t){
        let k = 0;
        if (animating && startT !== null) {
          const r = ((t - startT) % 7000) / 7000;
          k = r < .1 ? 0 : r < .4 ? ez((r - .1) / .3) : r < .6 ? 1 : r < .9 ? 1 - ez((r - .6) / .3) : 0;
        }

        const rx=-.419*k,ry=.593*k,p=1/((1-k)/6e4+k/1400);
        const P=V.map(v=>{
          const x=v[0]+12*k,y=v[1]+8*k,z=v[2];
          const x2=x*Math.cos(ry)+z*Math.sin(ry),z2=-x*Math.sin(ry)+z*Math.cos(ry);
          const y3=y*Math.cos(rx)-z2*Math.sin(rx),z3=y*Math.sin(rx)+z2*Math.cos(rx);
          const s=p/(p-z3);return[C+x2*s,C+y3*s]
        });
        E.forEach(([a,b],i)=>{L[i].setAttribute("x1",P[a][0]);L[i].setAttribute("y1",P[a][1]);L[i].setAttribute("x2",P[b][0]);L[i].setAttribute("y2",P[b][1])});
        requestAnimationFrame(f)
      })(performance.now());
      })();
      </script>
variant: default
notes: |
  Si yo les pregunto qué ven acá, estoy seguro que la mayoría me va a decir un cuadrado, y tendría todo el sentido del mundo, porque es un cuadrado. Pero como todo en esta vida es cuestión de perspectiva, porque también podría ser un cubo, y seguiríamos teniendo razón.
  Y con esto quiero que entremos a esta charla, dispuestos a cambiar nuestra perspectiva sobre la productividad.
---
