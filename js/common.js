// shared header, mode toggle, helpers
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qs=k=>new URLSearchParams(location.search).get(k);
const getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw Error(u+' '+r.status);return r.json()});
function header(active){
  const nav=[['explorer.html','📈 경제 지표','econ'],['people.html','🗣 발언과 기록','rec'],['index.html#science','🔬 과학과 사회','sci']];
  const mode=localStorage.getItem('mode')||'data';document.body.classList.toggle('story',mode=='story');
  document.body.insertAdjacentHTML('afterbegin',`<div class="top"><a class="logo" href="index.html">History<span>Lab</span></a>
<div class="nav">${nav.map(([h,l,k])=>k==active?`<b><a href="${h}">${l}</a></b>`:`<a class="nv" href="${h}">${l}</a>`).join('')}</div><div class="sp"></div>
<form id="gs" class="hide-m" style="display:contents"><input class="search" id="gq" placeholder="🔍 &quot;서울&quot;, &quot;패션 디자이너&quot;…" aria-label="검색"></form>
<div class="toggle" id="mode"><div data-m="data" class="${mode=='data'?'on':''}">📊 데이터</div><div data-m="story" class="${mode=='story'?'on':''}">📖 스토리</div></div></div>`);
  $('#mode').onclick=e=>{const m=e.target.dataset.m;if(!m)return;localStorage.setItem('mode',m);$$('#mode div').forEach(d=>d.classList.toggle('on',d.dataset.m==m));document.body.classList.toggle('story',m=='story');window.onMode&&onMode(m)};
  $('#gs').onsubmit=e=>{e.preventDefault();go($('#gq').value)};
  document.body.insertAdjacentHTML('beforeend','<div class="foot" style="max-width:1200px;margin:10px auto 30px;padding:0 32px;font-size:12px;color:#8a93a6">HistoryLab MVP · 1단계(비상업) — 각 데이터는 원 작성기관 출처·이용조건을 따릅니다. 영상은 YouTube 공식 임베드로 재생되며 <a href="https://www.youtube.com/t/terms" style="text-decoration:underline">YouTube 서비스 약관</a>이 적용됩니다. 상관계수는 인과를 뜻하지 않습니다.</div>');
}
const REGION_WORDS={'서울':'seoul','한국':'korea','런던':'london','영국':'uk','뉴욕':'nyc','미국':'us','도쿄':'tokyo','일본':'japan','파리':'paris','유로존':'eurozone','토론토':'toronto','밴쿠버':'vancouver','캐나다':'canada','샌프란시스코':'sf','la':'la'};
function go(q){q=(q||'').trim();if(!q)return;const k=Object.keys(REGION_WORDS).find(w=>q.toLowerCase().includes(w));
  if(k&&/집값|부동산|금리|환율|통화|m2|주가|^\S+$/i.test(q)&&!/디자이너|기업가/.test(q)){location.href='explorer.html?region='+REGION_WORDS[k];return}
  location.href='people.html?q='+encodeURIComponent(q)}
const fmtDur=s=>{const h=s/3600|0,m=s%3600/60|0,x=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
