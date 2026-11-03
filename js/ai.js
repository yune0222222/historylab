// BYOK AI insight: key stays in this browser (sessionStorage; optional localStorage). Only computed stats are sent.
const AI_PROMPT='너는 경제 데이터 해설가다. 아래 JSON의 수치만 근거로 한국어 3줄 요약을 써라. JSON에 없는 숫자·사실은 쓰지 마라. 상관은 인과가 아님을 한 줄에 밝혀라. "edge":true 인 시차는 신뢰하지 말라고 표시하라.';
function hash(s){let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)}
const getKey=()=>sessionStorage.getItem('oai_key')||localStorage.getItem('oai_key')||'';
function verifyNums(text,stats){const allowed=new Set();const walk=v=>{if(typeof v=='number'){allowed.add(Math.abs(v));allowed.add(Math.abs(+v.toFixed(1)));allowed.add(Math.abs(+v.toFixed(2)))}else if(typeof v=='string')(v.match(/\d+(\.\d+)?/g)||[]).forEach(n=>allowed.add(+n));else if(v&&typeof v=='object')Object.values(v).forEach(walk)};walk(stats);
 [0,1,2,3,12,24,100].forEach(n=>allowed.add(n));const bad=(text.match(/-?\d+(\.\d+)?/g)||[]).map(n=>Math.abs(+n)).filter(n=>![...allowed].some(a=>Math.abs(a-n)<0.011));return[...new Set(bad)]}
function renderAI(el,stats){const payload=JSON.stringify(stats),ck='ai:'+hash(payload),cached=localStorage.getItem(ck),key=getKey();
 el.innerHTML=`<h3>✨ AI 인사이트 — 선택한 조합 요약</h3><div class="muted">원데이터가 아니라 아래 계산 결과만 전송 (약 ${Math.round(payload.length/3)} 토큰) · gpt-4o-mini · 본인 키(BYOK)</div>
<details style="margin-top:6px"><summary class="muted">전송할 JSON 보기</summary><pre>${esc(JSON.stringify(stats,null,1))}</pre></details>
${key?'':`<form onsubmit="return false"><input type="password" autocomplete="off" id="aiKey" placeholder="🔑 OpenAI API 키 (sk-…) — 이 브라우저에만 저장"><label class="muted"><input type="checkbox" id="aiRem"> 이 기기에서 기억 (localStorage — 공용 PC에서는 사용 금지)</label></form>`}
<div><button class="btn" id="aiGo">${cached?'캐시된 요약 보기':'요약 생성'}</button> ${key?'<a href="#" id="aiForget" class="muted" style="margin-left:8px;text-decoration:underline">키 지우기</a>':''}</div>
<div class="out" id="aiOut"></div><div class="muted" style="margin-top:6px">키는 서버로 보내지 않고 브라우저에서 OpenAI로 직접 요청합니다. 지출 한도와 만료 키 사용을 권장합니다. 키가 없으면 위 자동 계산 수치만 표시됩니다.</div>`;
 const out=el.querySelector('#aiOut');const show=t=>{const bad=verifyNums(t,stats);out.innerHTML=esc(t)+(bad.length?`<div class="warn">⚠ 계산 결과에 없는 숫자 포함: ${bad.join(', ')} — 확인 필요</div>`:'<div class="muted">✓ 숫자 검증 통과 (모든 숫자가 계산 결과에 존재)</div>')};
 el.querySelector('#aiForget')?.addEventListener('click',e=>{e.preventDefault();sessionStorage.removeItem('oai_key');localStorage.removeItem('oai_key');renderAI(el,stats)});
 el.querySelector('#aiGo').onclick=async()=>{if(cached)return show(cached);let k=getKey();const ki=el.querySelector('#aiKey');
  if(!k&&ki){k=ki.value.trim();if(!/^sk-/.test(k)){out.innerHTML='<span class="warn">sk- 로 시작하는 키를 입력하세요.</span>';return}sessionStorage.setItem('oai_key',k);if(el.querySelector('#aiRem').checked)localStorage.setItem('oai_key',k)}
  out.textContent='생성 중…';
  try{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+k},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.2,max_tokens:220,messages:[{role:'system',content:AI_PROMPT},{role:'user',content:payload}]})});
   const j=await r.json();if(!r.ok)throw Error(j.error?.message||r.status);const t=j.choices[0].message.content.trim();localStorage.setItem(ck,t);show(t)}catch(e){out.innerHTML=`<span class="warn">요청 실패: ${esc(e.message)}</span>`}}}
