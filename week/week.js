/* Week pages: Copy link (needs the async clipboard). Stays hidden when it cannot work. */
(function(){
  var url=(document.querySelector('link[rel="canonical"]')||location).href,title=document.title;
  var b=document.querySelector('.wk-copy'),lab=b&&b.querySelector('.wk-copy-label'),st=document.querySelector('.wk-status'),t;
  if(!b||!navigator.clipboard||!navigator.clipboard.writeText)return;
  b.hidden=false;
  function show(msg,ok){lab.textContent=msg;b.classList.toggle('is-copied',ok);if(st)st.textContent=ok?'Link copied':msg;clearTimeout(t);
    t=setTimeout(function(){lab.textContent='Copy link';b.classList.remove('is-copied');if(st)st.textContent='';},2400);}
  b.addEventListener('click',function(){navigator.clipboard.writeText(url).then(function(){show('Copied',true);},function(){show('Copy failed',false);});});
})();
