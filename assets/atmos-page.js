/* Particle X Climate · Atmosphere theme for pages under Research Overwatch: measures the hero and footer,
   sets the sky stops (--hb, --pp) and header height (--ph-h), and gives atmos.js matching header stops. Load before atmos.js.
   Reading pages (body.atmos-read): the sky descends all the way to the footer, and every band takes the sky colour at its height. */
(function(){
  var de=document.documentElement,b=document.body,S=window.ATMOS_STOPS=[],read=b.classList.contains('atmos-read');window.ATMOS_HEADER_ALPHA=1;
  var C=[[21,19,15],[28,25,21],[31,59,55],[44,90,82],[159,179,166],[230,223,207],[246,241,231]],K=[0,.45,1,0,0,0,0],L=[0,0,0,.3,.62,.8,1];
  function top(el){return el.getBoundingClientRect().top+scrollY;}
  function measure(){
    var hero=document.querySelector('.hero'),ft=document.querySelector('footer'),ph=document.querySelector('.ph'),H=de.scrollHeight||1;
    var hb=hero?Math.round(top(hero)+hero.offsetHeight):520,pp=hb+(innerWidth<641?1400:1100);
    if(ft)pp=read?Math.max(hb+400,Math.round(top(ft))):Math.min(pp,Math.max(hb+400,Math.round(top(ft))));
    b.style.setProperty('--ph-h',(ph?ph.offsetHeight:76)+'px');
    b.style.setProperty('--hb',hb+'px');b.style.setProperty('--pp',pp+'px');
    if(read)b.style.setProperty('--sbw',(innerWidth-de.clientWidth)+'px');
    S.length=0;for(var i=0;i<C.length;i++)S.push([Math.min(1,(hb*K[i]+(i>2?hb+(pp-hb)*L[i]:0))/H),C[i]]);
    S.push([1,C[6]]);
    if(read)queueBands();
  }
  /* bands: start from the sky at the band's height and step toward paper (light sky) or night teal (dark sky) only until
     every text colour on it reads at 7.4:1 against the glass at its top, middle and bottom; every other band steps 3 further.
     Text between bands takes the sky's tone, with a soft veil only where neither ink nor paper reaches 7.4:1 on bare sky. */
  var INK=[28,25,21],PAPER=[246,241,231],NIGHT=[16,40,36],LITE=[252,249,243],LIGHT_TEXT=[INK,[61,55,47],[110,40,24]],DARK_TEXT=[PAPER,[232,225,212],[236,213,164]];
  function lum(c){return c.reduce(function(s,v,k){v/=255;v=v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);return s+v*[.2126,.7152,.0722][k];},0);}
  function cr(a,c){var x=lum(a),y=lum(c);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function step(t,g,f){return t.map(function(v,k){return Math.round(v+(g[k]-v)*f);});}
  function tintFor(y0,y1,a,extra){
    var H=de.scrollHeight,sk=[y0,(y0+y1)/2,y1].map(function(y){return window.ATMOS_COL(Math.min(1,Math.max(0,y/H)));});
    var light=cr(sk[1],INK)>=cr(sk[1],PAPER),texts=light?LIGHT_TEXT:DARK_TEXT,tgt=light?LITE:NIGHT,t=sk[1].slice();
    function ok(t){return sk.every(function(s){var g=t.map(function(v,k){return v*a+s[k]*(1-a);});return texts.every(function(c){return cr(c,g)>=7.4;});});}
    for(var i=0;i<40&&!ok(t);i++)t=step(t,tgt,.1);
    if(a===0)return {t:t,light:light,ok:ok(t)};
    for(i=0;i<(extra||0);i++)t=step(t,tgt,.1);
    return {t:t,light:light,ok:true};
  }
  function apply(el,r,veil){el.style.setProperty('--tint',r.t.join(' '));el.classList.toggle('tone-lt',r.light);el.classList.toggle('tone-dk',!r.light);el.classList.toggle('veil',!!veil);}
  var BANDS=':is(.papers,.grants,.ideas)>article,.picked,.takeaways,.fence',FREE='section:not(.hero)>:is(h2,.lede,.note,.signoff,.joint)';
  function bands(){
    document.querySelectorAll('.wrap '+BANDS).forEach(function(e,i){var y=top(e);apply(e,tintFor(y,y+e.offsetHeight,i%2?.58:.86,i%2?0:3));});
    /* free text: bare sky where it reads; otherwise a full-width strip that fills the gap above it and, unless the next line has its own strip, below it */
    var free=[].slice.call(document.querySelectorAll('.wrap '+FREE)),veiled=free.filter(function(e){var y=top(e),r=tintFor(y,y+e.offsetHeight,0);if(r.ok)apply(e,r);return !r.ok;});
    veiled.forEach(function(e){var q=e.getBoundingClientRect(),ps=e.parentElement.previousElementSibling,pv=e.previousElementSibling||(ps&&ps.matches('section:not(.hero)')?ps.lastElementChild:null),nx=e.nextElementSibling,cs=getComputedStyle(e),
      mt=pv?q.top-pv.getBoundingClientRect().bottom:parseFloat(cs.marginTop),
      mb=nx?(veiled.indexOf(nx)>=0?0:nx.getBoundingClientRect().top-q.bottom):parseFloat(cs.marginBottom);
      e.style.setProperty('--mt',Math.max(0,mt)+'px');e.style.setProperty('--mb',Math.max(0,mb)+'px');
      apply(e,tintFor(q.top+scrollY-mt,q.bottom+scrollY+mb,.86),true);});
  }
  /* chosen-paper record: let long URLs and file names break after / and . only (overflow-wrap:anywhere stays as the fallback) */
  function breaks(){document.querySelectorAll('.picked :is(.meta,.url)').forEach(function(el){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n,list=[];while(n=w.nextNode())if(/\S{24,}/.test(n.data))list.push(n);
    list.forEach(function(n){var f=document.createDocumentFragment();n.data.split(/(\S{24,})/).forEach(function(part,i){
      if(i%2){part.split(/(?<=[\/.])(?=.)/).forEach(function(bit,j){if(j)f.appendChild(document.createElement('wbr'));f.appendChild(document.createTextNode(bit));});}
      else if(part)f.appendChild(document.createTextNode(part));});n.parentNode.replaceChild(f,n);});});}
  if(read)breaks();
  var q=false;function queueBands(){if(q)return;q=true;requestAnimationFrame(function(){q=false;if(window.ATMOS_COL)bands();});}
  /* the section strip (phone) wears the header's current tone */
  window.ATMOS_ON_SCROLL=function(){var ph=document.querySelector('.ph'),t=document.querySelector('.sticky-toc');if(!ph||!t)return;
    t.style.setProperty('--sb',ph.style.getPropertyValue('--hb'));t.classList.toggle('on-light',ph.classList.contains('on-light'));};
  measure();
  addEventListener('resize',measure);addEventListener('load',measure);
  if(document.fonts)document.fonts.ready.then(measure);
  if('ResizeObserver' in window)new ResizeObserver(measure).observe(b);
})();
