header('records');
const norm=s=>(s||'').toLowerCase().replace(/[\s·.\-]/g,'');
getJSON('data/people/index.json').then(IX=>{const F=IX.fields;
 const card=p=>`<div class="card pc" data-id="${p.id}" style="cursor:pointer"><div class="th2" style="${p.thumb?`background-image:url(${p.thumb})`:''}">${p.thumb?'':'사진 없음'}</div><div><h3><a href="person.html?id=${p.id}">${esc(p.name_ko)}</a> <span class="muted">${esc(p.name_en)}</span></h3>
  <div class="kv"><span>생몰</span>${esc(p.born||'?')}${p.died?' – '+esc(p.died):''}${p.conflict?' <span class="tag ex">출처 간 날짜 불일치 — 모두 표시</span>':''}</div>
  <div class="kv"><span>분야</span>${p.fields.map(f=>F[f]?.ko||f).join(', ')} · <a href="https://www.wikidata.org/wiki/${p.qid}" target="_blank" rel="noopener" style="text-decoration:underline">${p.qid}</a></div>
  <div>${p.n?`<span class="tag real">검증 영상 ${p.n}개</span> `+Object.entries(p.types).map(([t,c])=>`<span class="tag">${TYPE_KO[t]||t} ${c}</span>`).join(' '):'<span class="tag">아카이브 준비 중</span>'}</div></div></div>`;
 const wd=async raw=>{try{const r=await (await fetch('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&type=item&limit=3&language=ko&uselang=ko&search='+encodeURIComponent(raw))).json();
   const L=(r.search||[]);if(!L.length)return;$('#res').insertAdjacentHTML('beforeend',`<div class="card" style="grid-column:1/-1"><b>큐레이션 목록에 없는 이름 — Wikidata 프로필 조회 결과</b> <span class="muted">(CC0 · 자동 조회, 동명이인 주의)</span>${L.map(x=>`<div class="kv" style="margin-top:8px"><span>${esc(x.id)}</span><b>${esc(x.label||'')}</b> — ${esc(x.description||'설명 없음')} · <a href="https://www.wikidata.org/wiki/${x.id}" target="_blank" rel="noopener" style="text-decoration:underline">Wikidata</a> · <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(x.label||raw)}" target="_blank" rel="noopener" style="text-decoration:underline">YouTube에서 검색 ↗</a> <span class="tag">아카이브 준비 중</span></div>`).join('')}<div class="muted" style="margin-top:6px">검증되지 않은 영상은 자동으로 넣지 않습니다. 추가는 scripts/add_person.py (QID + 영상 ID 검증)로 합니다.</div></div>`)}catch(e){}};
 const run=raw=>{raw=(raw||'').trim();const s=norm(raw);q.value=raw;history.replaceState(null,'','?q='+encodeURIComponent(raw));
  const fk=s&&Object.keys(F).find(k=>F[k].kw.some(w=>norm(w)==s||s.length>=2&&norm(F[k].ko).includes(s))||norm(F[k].ko)==s);
  let L=IX.people,how;
  if(!s)how='전체 인물 '+L.length+'명 · 분야를 고르거나 이름을 검색하세요';
  else if(fk){L=L.filter(p=>p.fields.includes(fk));how=`"${esc(raw)}" → 분야 <b>${F[fk].ko}</b> · ${L.length}명`}
  else{L=L.filter(p=>[p.name_ko,p.name_en,p.id,...(p.aliases||[])].some(n=>norm(n).includes(s)||s.length>=4&&s.includes(norm(n))&&norm(n).length>=3));how=`"${esc(raw)}" → 이름 검색 · ${L.length}명`}
  L=[...L].sort((a,b)=>b.n-a.n||a.name_ko.localeCompare(b.name_ko));interp.innerHTML=how;
  fchips.innerHTML=`<span class="chip ${!s?'on':''}" data-q="">전체 ${IX.people.length}</span>`+Object.entries(F).map(([k,f])=>`<span class="chip ${k==fk?'on':''}" data-q="${f.ko}">${f.ko} ${IX.people.filter(p=>p.fields.includes(k)).length}</span>`).join('');
  res.innerHTML=L.map(card).join('')||'<div class="muted">큐레이션 목록에 결과 없음.</div>';
  if(s&&!fk&&!L.length)wd(raw)};
 pf.onsubmit=e=>{e.preventDefault();run(q.value)};fchips.onclick=e=>{const v=e.target.closest('[data-q]')?.dataset.q;if(v!=null)run(v)};
 res.onclick=e=>{if(e.target.closest('a'))return;const c=e.target.closest('[data-id]');if(c)location.href='person.html?id='+c.dataset.id};run(qs('q')||'')});
const TYPE_KO={speech:'연설',interview:'인터뷰',conversation:'대담',talk:'강연',press:'기자회견',documentary:'다큐',other:'기타',runway:'런웨이',keynote:'키노트'};
