/* Particle X Climate · Atmosphere theme for pages under Research Overwatch: measures the hero and footer,
   sets the sky stops (--hb, --pp) and header height (--ph-h), and gives atmos.js matching header stops. Load before atmos.js. */
(function(){
  var de=document.documentElement,S=window.ATMOS_STOPS=[];window.ATMOS_HEADER_ALPHA=1;
  var C=[[21,19,15],[28,25,21],[31,59,55],[44,90,82],[159,179,166],[230,223,207],[246,241,231]],K=[0,.45,1,0,0,0,0],L=[0,0,0,.3,.62,.8,1];
  function top(el){return el.getBoundingClientRect().top+scrollY;}
  function measure(){
    var hero=document.querySelector('.hero'),ft=document.querySelector('footer'),ph=document.querySelector('.ph'),H=de.scrollHeight||1;
    var hb=hero?Math.round(top(hero)+hero.offsetHeight):520,pp=hb+(innerWidth<641?1400:1100);
    if(ft)pp=Math.min(pp,Math.max(hb+400,Math.round(top(ft))));
    document.body.style.setProperty('--ph-h',(ph?ph.offsetHeight:76)+'px');
    document.body.style.setProperty('--hb',hb+'px');document.body.style.setProperty('--pp',pp+'px');
    S.length=0;for(var i=0;i<C.length;i++)S.push([Math.min(1,(hb*K[i]+(i>2?hb+(pp-hb)*L[i]:0))/H),C[i]]);
    S.push([1,C[6]]);
  }
  measure();
  addEventListener('resize',measure);addEventListener('load',measure);
  if('ResizeObserver' in window)new ResizeObserver(measure).observe(document.body);
})();
