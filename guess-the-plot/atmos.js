/* Guess the Plot · Atmosphere theme: menu + header tone from the page's layer gradient (window.ATMOS_STOPS). */
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
    ph.style.setProperty('--hb','rgba('+c.join(',')+',.94)');ph.classList.toggle('on-light',light);
    if(window.ATMOS_ON_SCROLL)window.ATMOS_ON_SCROLL();}
  var tk=false;function req(){if(!tk){tk=true;requestAnimationFrame(function(){tk=false;tone();});}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);
  if('ResizeObserver' in window)new ResizeObserver(req).observe(document.body);
  tone();
})();
