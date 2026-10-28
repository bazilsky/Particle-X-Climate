/* Particle X Climate · Atmosphere theme: optional JS menu button + header tone from the page gradient (window.ATMOS_STOPS). */
(function(){
  var ph=document.querySelector('.ph'),b=document.querySelector('.menu-btn');
  if(b)b.addEventListener('click',function(){var o=ph.classList.toggle('nav-open');b.setAttribute('aria-expanded',o);});
  var STOPS=window.ATMOS_STOPS;if(!ph||!STOPS)return;
  function colAt(f){for(var i=1;i<STOPS.length;i++){if(f<=STOPS[i][0]){var a=STOPS[i-1],c=STOPS[i],t=(f-a[0])/(c[0]-a[0]||1);return a[1].map(function(v,k){return Math.round(v+(c[1][k]-v)*t);});}}return STOPS[STOPS.length-1][1];}
  function lum(c){return c.reduce(function(s,v,k){v/=255;v=v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);return s+v*[.2126,.7152,.0722][k];},0);}
  function cr(a,c){var x=lum(a),y=lum(c);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  var INK=[28,25,21],PAPER=[246,241,231];
  window.ATMOS_COL=colAt;
  function tone(){var y=scrollY+ph.offsetHeight/2,f=Math.min(1,Math.max(0,y/document.documentElement.scrollHeight)),c=colAt(f);
    var light=cr(c,INK)>=cr(c,PAPER),tgt=light?PAPER:INK;
    for(var i=0;i<10&&cr(c,light?INK:PAPER)<7.6;i++)c=c.map(function(v,k){return Math.round(v+(tgt[k]-v)*.2);});
    ph.style.setProperty('--hb','rgba('+c.join(',')+','+(window.ATMOS_HEADER_ALPHA||.94)+')');ph.classList.toggle('on-light',light);
    if(window.ATMOS_ON_SCROLL)window.ATMOS_ON_SCROLL();}
  var tk=false;function req(){if(!tk){tk=true;requestAnimationFrame(function(){tk=false;tone();});}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);
  if('ResizeObserver' in window)new ResizeObserver(req).observe(document.body);
  tone();
  /* open sky: items that sit straight on the sky take its tone at their height: .sky-lt (ink) or .sky-dk (paper) where every text
     colour reads at 7:1 on the bare sky; otherwise a soft, edgeless scrim (.sky-scrim) only as strong as needed for 5.5:1.
     Dark-only items (instrument decks) keep paper text and get a dark scrim when the sky is too light for it. */
  var SKY=[['.atmos-index .week-btn,.atmos-index section:not(.hero)>h2,.atmos-lab .tile,.atmos-lab .arc-note,.atmos-nb h2.family,.atmos-gtp .gtp-weeks>li,.atmos-gtp .gtp-archive>h2,.atmos-gtp .hint','auto'],
    ['.atmos-gtp .deck,.atmos-nb .deck','dark']];
  var BARE=5.5,LT=[INK,[61,55,47]],DK=[PAPER,[227,220,207]],LITE=[252,249,243],NIGHT=[21,19,15];
  function pageTop(e){var y=0;while(e){y+=e.offsetTop;e=e.offsetParent;}return y;}
  function okOn(cols,txt,t){return cols.every(function(c){return txt.every(function(x){return cr(x,c)>=t;});});}
  function scrimA(cols,txt,sc){for(var a=.2;a<.96;a+=.05){var g=cols.map(function(c){return c.map(function(v,k){return v*(1-a)+sc[k]*a;});});if(okOn(g,txt,5.5))return Math.round(a*100)/100;}return .95;}
  /* items in one grid row share one decision (and one scrim strength), so a row reads as one soft band, never a run of patches */
  function sky(){var H=document.documentElement.scrollHeight||1;
    SKY.forEach(function(g){var rows={},keys=[];
      document.querySelectorAll(g[0]).forEach(function(e){if(keys.indexOf(e.parentElement)<0)keys.push(e.parentElement);
        var hd=g[1]==='auto'&&e.querySelector('h2,h3'),t=pageTop(e),k=(e.parentElement&&getComputedStyle(e.parentElement).display==='grid')?keys.indexOf(e.parentElement)+'|'+t:Math.random();
        var r=rows[k]||(rows[k]={els:[],y0:1e9,y1:0});r.els.push(e);r.y0=Math.min(r.y0,pageTop(hd&&hd.offsetParent?hd:e));r.y1=Math.max(r.y1,t+e.offsetHeight);});
      Object.keys(rows).forEach(function(k){var r=rows[k],cols=[];
        for(var i=0;i<=4;i++)cols.push(colAt(Math.min(1,Math.max(0,(r.y0+(r.y1-r.y0)*i/4)/H))));
        var lt=g[1]==='auto'&&okOn(cols,LT,BARE),dk=!lt&&okOn(cols,DK,BARE),sc=!lt&&!dk,ad=sc?scrimA(cols,DK,NIGHT):0,al=sc&&g[1]==='auto'?scrimA(cols,LT,LITE):9,light=sc&&al<ad;
        r.els.forEach(function(e){e.classList.toggle('sky-lt',lt);e.classList.toggle('sky-dk',dk);e.classList.toggle('sky-scrim',sc);e.classList.toggle('scrim-lt',light);
          if(sc){e.style.setProperty('--sc',(light?LITE:NIGHT).join(' '));e.style.setProperty('--sa',light?al:ad);}});
        /* one scrim per row: the first item paints a single soft band under the whole row; the rest paint none */
        var bx=r.els.map(function(e){return e.getBoundingClientRect();}),L=Math.min.apply(0,bx.map(function(b){return b.left;})),T=Math.min.apply(0,bx.map(function(b){return b.top;})),R=Math.max.apply(0,bx.map(function(b){return b.right;})),B=Math.max.apply(0,bx.map(function(b){return b.bottom;}));
        r.els.forEach(function(e,i){e.classList.toggle('scrim-follow',sc&&i>0);if(sc&&!i){var b=bx[0];e.style.setProperty('--sl',(L-b.left)+'px');e.style.setProperty('--st',(T-b.top)+'px');e.style.setProperty('--sw',(R-L)+'px');e.style.setProperty('--sh',(B-T)+'px');e.style.setProperty('--vl',(-b.left)+'px');e.style.setProperty('--vw',document.documentElement.clientWidth+'px');}});});});}
  var sq=false;function reqSky(){if(!sq){sq=true;requestAnimationFrame(function(){sq=false;sky();});}}
  addEventListener('resize',reqSky);addEventListener('load',reqSky);if(document.fonts)document.fonts.ready.then(reqSky);
  if('ResizeObserver' in window)new ResizeObserver(reqSky).observe(document.body);
  sky();
})();
