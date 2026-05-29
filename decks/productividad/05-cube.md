---
template: icon
recipe: default
order: 5
revealStart: 0
label: Cubo Animado
items:
  - glyph: |
      <svg id="pc" viewBox="0 0 640 640" style="width:480px;color:currentColor;overflow:visible"><g stroke="currentColor" stroke-width="15" fill="none"></g></svg>
      <span class="revealable" style="position:absolute;width:0;height:0;pointer-events:none" aria-hidden="true"></span>
      <script>
      (()=>{
        const H=140,C=320,V=[],E=[],g=pc.firstChild;
        for(let i=0;i<8;i++)V.push([i&1?H:-H,i&2?H:-H,i&4?H:-H]);
        for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){let d=i^j;if(!(d&(d-1)))E.push([i,j])}
        const L=E.map(()=>g.appendChild(document.createElementNS("http://www.w3.org/2000/svg","line")));
        const ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);

        function draw(k){
          const p=1/((1-k)/6e4+k/1400);
          const P=V.map(v=>{
            const rx=-.419*k,ry=.593*k;
            const x=v[0]+12*k,y=v[1]+8*k,z=v[2];
            const x2=x*Math.cos(ry)+z*Math.sin(ry),z2=-x*Math.sin(ry)+z*Math.cos(ry);
            const y3=y*Math.cos(rx)-z2*Math.sin(rx),z3=y*Math.sin(rx)+z2*Math.cos(rx);
            const s=p/(p-z3);
            return[C+x2*s,C+y3*s];
          });
          E.forEach(([a,b],i)=>{
            L[i].setAttribute("x1",P[a][0]);L[i].setAttribute("y1",P[a][1]);
            L[i].setAttribute("x2",P[b][0]);L[i].setAttribute("y2",P[b][1]);
          });
        }

        draw(0); // cuadrado estático inicial

        let started=false;
        function startAnim(){
          if(started)return; started=true;
          const t0=performance.now();
          (function f(t){
            const r=((t-t0)%7000)/7000;
            const k=r<.1?0:r<.4?ez((r-.1)/.3):r<.6?1:r<.9?1-ez((r-.6)/.3):0;
            draw(k);
            requestAnimationFrame(f);
          })(t0);
        }

        // Diferimos con setTimeout para que present.js (que corre después
        // como <script src>) haya ejecutado initReveal() antes de que
        // chequeemos el estado del trigger.
        const trigger=pc.nextElementSibling;
        setTimeout(()=>{
          if(!trigger) return;
          if(!trigger.hasAttribute('data-reveal-hidden')) startAnim();
          else new MutationObserver((_,obs)=>{
            if(!trigger.hasAttribute('data-reveal-hidden')){obs.disconnect();startAnim();}
          }).observe(trigger,{attributes:true,attributeFilter:['data-reveal-hidden']});
        }, 0);
      })();
      </script>
---
