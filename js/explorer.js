header('econ');
const COL={price:'#1c2333',price_nat:'#8a93a6',m2:'#13a37a',rate:'#e0533d',fx:'#f0a020',stock:'#4f6bff',gdp:'#7b4fd6',cpi:'#d6336c',unemp:'#0c8599',lend:'#a0522d',bm:'#5c940d'};
let META,REG,PK,IDX,PLACES=[],st={region:qs('region')||'seoul',series:(qs('series')||'price,m2,rate').split(','),mode:qs('mode')||'multi',y0:+(qs('from')||2004),y1:+(qs('to')||2026)},chart,lagChart,stats;
const shift=(k,n)=>{const t=+k.slice(0,4)*12+(+k.slice(5,7))-1+n;return `${t/12|0}-${String(t%12+1).padStart(2,'0')}`};
const chg=(d,pct)=>{const o={};for(const k in d){const p=d[shift(k,-12)];if(p!=null)o[k]=pct?d[k]-p:(d[k]/p-1)*100}return o};
function corr(x,y,min=24){const ks=Object.keys(x).filter(k=>k in y),n=ks.length;if(n<min)return{r:null,n};let a=ks.map(k=>x[k]),b=ks.map(k=>y[k]),ma=a.reduce((s,v)=>s+v)/n,mb=b.reduce((s,v)=>s+v)/n,sab=0,sa=0,sb=0;
 for(let i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2}return{r:sab/Math.sqrt(sa*sb),n}}
function cycles(rate){const ks=Object.keys(rate).sort(),out=[];let cur=null;for(const k of ks){const p=rate[shift(k,-1)];if(p==null)continue;const c=rate[k]-p;if(c>1e-9){cur?cur[1]=k:cur=[k,k]}else if(c<-1e-9&&cur){out.push(cur);cur=null}}if(cur)out.push(cur);return out}
const inWin=(d)=>{const o={};for(const k in d)if(+k.slice(0,4)>=st.y0&&+k.slice(0,4)<=st.y1)o[k]=d[k];return o};
function sync(){history.replaceState(null,'',`?region=${st.region}&series=${st.series.join(',')}&mode=${st.mode}&from=${st.y0}&to=${st.y1}`)}
// --- 검색: data/search.json(국가 217 · 도시) + World Bank 연간 지표(브라우저 실시간, CC BY 4.0) ---
const PL=()=>IDX||(IDX=getJSON('data/search.json').then(d=>PLACES=d.places).catch(()=>PLACES=[]));
const WBI={gdp:['NY.GDP.MKTP.KD.ZG','GDP 성장률',1],cpi:['FP.CPI.TOTL.ZG','물가상승률(CPI)',1],unemp:['SL.UEM.TOTL.ZS','실업률',0],lend:['FR.INR.LEND','대출금리',0],bm:['FM.LBL.BMNY.ZG','통화량(M2) 증가율',1],fx:['PA.NUS.FCRF','공식 환율',0]};
async function wbFetch(code){const ck='wb1:'+code,c=sessionStorage.getItem(ck);if(c)return JSON.parse(c);const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),9000);
 try{const j=await fetch(`https://api.worldbank.org/v2/country/${code}/indicator/${Object.values(WBI).map(x=>x[0]).join(';')}?source=2&format=json&date=2000:2026&per_page=1000`,{signal:ctl.signal}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()});
  const o={};for(const r of j[1]||[])if(r.value!=null)(o[r.indicator.id]??={})[r.date+'-07']=+(+r.value).toFixed(3);sessionStorage.setItem(ck,JSON.stringify(o));return o}finally{clearTimeout(t)}}
async function addWB(G,p){const code=G.wb||p?.wb;if(!code)return;let o;try{o=await wbFetch(code)}catch(e){G.wbErr=1;return}
 const cn=(PLACES.find(x=>x.t=='country'&&x.wb==code)||{}).ko||G.name,S=G.series,city=G.type=='city';
 for(const[k,[id,nm,g]]of Object.entries(WBI)){if(S[k])continue;const d=o[id];
  S[k]=d&&Object.keys(d).length?{label:`${cn} ${nm}${k=='fx'?' (1달러당 현지통화)':''}${city?' · 국가 단위':''} (연간)`,unit:k=='fx'?'현지통화/USD':'%',kind:k=='fx'?'level':'pct',g,src:'wb',freq:'A',note:'',data:d}:{na:'이 지역은 해당 지표 데이터가 없어요 (World Bank)'}}}
async function load(){const id=st.region;await PL();const p=PLACES.find(x=>x.id==id),bare=()=>({id,name:p.ko,type:p.t,country:p.cc,wb:p.wb,series:{price:{na:'BIS 주거용 부동산가격 통계에 없는 나라'},rate:{na:'BIS 정책금리 통계에 없는 나라'}}});
 try{REG=p&&!p.f?bare():await getJSON(`data/regions/${id}.json`)}
 catch(e){if(p&&p.t=='country')REG=bare();else if(id!='seoul'){st.region='seoul';return load()}else throw e}
 await addWB(REG,p);const S=REG.series;st.series=st.series.filter(k=>S[k]&&!S[k].na);PK=['price','gdp','cpi',...META.series_order].find(k=>S[k]&&!S[k].na);
 if(PK){if(!st.series.includes(PK))st.series.unshift(PK);if(PK!='price'&&st.series.length<2)for(const k of['rate','gdp','cpi'])if(st.series.length<3&&S[k]&&!S[k].na&&!st.series.includes(k))st.series.push(k)}render()}
function render(){sync();const S=REG.series,R=META.regions;crn.textContent=REG.name;
 rsel.innerHTML=['city','country'].map(t=>`<optgroup label="${t=='city'?'도시':'국가'}">`+R.filter(r=>r.type==t).map(r=>`<option value="${r.id}" ${r.id==st.region?'selected':''}>${r.name}</option>`).join('')+'</optgroup>').join('')+(R.some(r=>r.id==st.region)?'':`<optgroup label="검색한 지역"><option value="${esc(st.region)}" selected>${esc(REG.name)}</option></optgroup>`);
 rchips.innerHTML=R.filter(r=>['seoul','tokyo','london','nyc','paris','toronto','korea','us'].includes(r.id)).map(r=>`<span data-r="${r.id}" class="${r.id==st.region?'on':''}">${r.name}</span>`).join('')+'<span class="na" title="ABS RPPI 2021년 중단 — 대체 지표 미확보">시드니 미확보</span>';
 $$('#modeT div').forEach(d=>d.classList.toggle('on',d.dataset.v==st.mode));
 const yrs=[];for(let y=2000;y<=2026;y++)yrs.push(y);y0.innerHTML=yrs.map(y=>`<option ${y==st.y0?'selected':''}>${y}</option>`).join('');y1.innerHTML=yrs.map(y=>`<option ${y==st.y1?'selected':''}>${y}</option>`).join('');
 picker.innerHTML=META.series_order.filter(k=>S[k]).map(k=>{const s=S[k];if(s.na)return`<span class="sc dis" title="${esc(s.na)}">${META.series_names[k]} · 미제공</span>`;const on=st.series.includes(k);
  return`<span class="sc ${on?'on':''}" data-k="${k}" style="${on?'border-color:'+COL[k]:''}"><i style="background:${on?COL[k]:'#9aa2b3'}"></i>${META.series_names[k]} <small>${esc(s.unit)}${s.freq=='Q'?' · 분기':s.freq=='A'?' · 연간':''}</small></span>`}).join('')+(S.cpi&&!S.cpi.na?'':'<span class="sc dis">물가 · 준비 중</span>')+(REG.wbErr?'<span class="sc dis" title="api.worldbank.org 응답 없음">World Bank 연간 지표 · 불러오지 못함</span>':'');
 if(!PK){chart&&chart.destroy();ctitle.textContent=REG.name+' — 표시할 데이터가 없어요';$('#corr').innerHTML='';story.innerHTML='';srcs.innerHTML='';return}
 draw();analyze();sources()}
function draw(){const S=REG.series,sel=st.series.map(k=>[k,S[k]]);
 const all=new Set();sel.forEach(([k,s])=>Object.keys(inWin(s.data)).forEach(m=>all.add(m)));const M=[...all].sort();
 const reb=st.mode=='rebase',mob=innerWidth<600;let base=null;
 if(reb){base=M.find(m=>sel.filter(([k,s])=>s.kind!='pct').every(([k,s])=>s.data[m]!=null))||M[0]}
 const scales={x:{ticks:{maxTicksLimit:mob?5:12,font:{size:10}}}},axes={};let ai=0;
 const ds=sel.map(([k,s])=>{let d=s.data,ax;
  if(s.kind=='pct'){ax='yR';scales.yR={position:'right',title:{display:!mob,text:'%'},grid:{drawOnChartArea:false},ticks:{font:{size:10}}}}
  else if(reb){ax='yL';const b=d[base]??d[Object.keys(d).sort().find(m=>m>=base)];const o={};for(const m in d)o[m]=d[m]/b*100;d=o;scales.yL={position:'left',title:{display:!mob,text:`${base} = 100`},ticks:{font:{size:10}}}}
  else{const u=s.unit;if(!axes[u]){axes[u]='y'+(ai++);scales[axes[u]]={position:'left',display:ai==1||!mob,title:{display:!mob,text:u},grid:{drawOnChartArea:ai==1},ticks:{font:{size:10}}}}ax=axes[u]}
  return{label:s.label,data:M.map(m=>d[m]??null),borderColor:COL[k],backgroundColor:COL[k],yAxisID:ax,borderWidth:k=='price'?2.5:1.8,borderDash:k=='fx'?[5,3]:k=='price_nat'?[2,2]:[],stepped:s.kind=='pct'&&s.freq!='A',pointRadius:s.freq=='A'?2.5:0,spanGaps:true,tension:.15}});
 const rate=S.rate&&!S.rate.na?S.rate.data:null,cyc=rate?cycles(rate).filter(([a,b])=>b>=M[0]&&a<=M[M.length-1]):[];
 $('#cyc').innerHTML=rate&&shadeT.checked?'▒ 금리 인상기(데이터에서 자동 계산): '+cyc.slice(-8).map(([a,b])=>`<span>${a<M[0]?M[0]:a}~${b}</span>`).join(' ')+(cyc.length>8?` <span class="muted">외 ${cyc.length-8}개 구간(그래프 음영)</span>`:''):'';
 const shade={id:'shade',beforeDatasetsDraw(ch){if(!shadeT.checked)return;const{ctx,chartArea:a,scales:{x}}=ch;ctx.save();ctx.fillStyle='rgba(224,83,61,.10)';for(const[s0,e]of cyc){const i=M.findIndex(m=>m>=s0),j=M.findLastIndex(m=>m<=e);if(i<0||j<0)continue;const x1=x.getPixelForValue(i),x2=x.getPixelForValue(j);ctx.fillRect(x1,a.top,Math.max(2,x2-x1),a.bottom-a.top)}ctx.restore()}};
 chart&&chart.destroy();chart=new Chart(c,{type:'line',data:{labels:M,datasets:ds},options:{maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}},scales},plugins:[shade]});
 ctitle.textContent=REG.name+' — '+sel.map(([k])=>META.series_names[k]).join(' × ')+(reb&&sel.some(([k,s])=>s.kind!='pct')?` (${base}=100)`:'');
 axnote.textContent=(reb?`100 재기준: 수준 지표는 ${base}=100으로 맞춰 왼쪽 축 하나에, %인 금리는 재기준하지 않고 오른쪽 축.`:'원 단위: 단위가 다른 지표는 자동으로 다른 축에 배정(%는 오른쪽).'+(Object.keys(axes).length>2?' 축이 3개 이상이면 100 재기준 모드를 권장합니다.':''))+' 분기 지표는 분기 중간월에 표시.'+(sel.some(([k,s])=>s.freq=='A')?' 연간 지표(World Bank)는 해당 연도 7월 위치에 점으로 표시.':'')+' '+sel.filter(([k,s])=>s.note).map(([k,s])=>s.label+': '+s.note).join(' · ')}
const ann=d=>{const g={};for(const k in d)(g[k.slice(0,4)]??=[]).push(d[k]);const o={};for(const y in g)o[y+'-07']=g[y].reduce((a,b)=>a+b)/g[y].length;return o};
const drv=s=>s.g?s.data:chg(s.data,s.kind=='pct');
const dname=s=>s.g?'값(%)':s.kind=='pct'?(s.freq=='A'?'1년 변화(%p)':'12개월 변화(%p)'):s.freq=='A'?'전년비(%)':'전년동월비(%)';
function analyze(){const S=REG.series,P=S[PK],pyM=inWin(drv(P)),out=[],tn=META.series_names[PK]+' '+dname(P);
 for(const k of st.series.filter(k=>k!=PK&&k!='price_nat')){const s=S[k];if(!s||s.na)continue;const A=s.freq=='A'||P.freq=='A';let dr=drv(s),py=pyM;if(A){dr=ann(dr);py=ann(pyM)}const scan=[];
  for(let L=0;L<=24;L+=A?12:1){const sh={};for(const m in dr)sh[shift(m,L)]=dr[m];const r=corr(sh,py,A?8:24);scan.push([L,r.r,r.n])}
  const v=scan.filter(x=>x[1]!=null);if(!v.length)continue;const best=v.reduce((a,b)=>Math.abs(b[1])>Math.abs(a[1])?b:a);
  out.push({k,A,label:META.series_names[k],driver:dname(s),lag0:scan[0][1],n0:scan[0][2],best_lag:best[0],best_r:best[1],best_n:best[2],edge:best[0]==24,scan})}
 const r2=x=>x==null?'–':(x>0?'+':'')+x.toFixed(2),lg=o=>o.best_lag==0?'동시점':(o.A?o.best_lag/12+'년':o.best_lag+'개월')+' 선행',u=o=>o.A?'개년':'개월';
 $('#cnote').textContent=`변화율끼리 비교 (${tn} vs 각 지표 변화) · 연간 지표가 끼면 연평균으로 맞춰 연 단위 비교 · 선택 기간 기준`;
 corr_.innerHTML=out.length?out.map(o=>`<div class="card"><div class="muted">${o.label} ${o.driver} → ${tn}${o.A?' · 연 단위':''}</div><div class="big">r = ${r2(o.lag0)}</div><div class="muted">동시점 · n=${o.n0}${u(o)}</div><div style="margin-top:6px;font-size:13px">가장 강한 시차: <b>${lg(o)}, r = ${r2(o.best_r)}</b> <span class="muted">(n=${o.best_n})</span>${o.edge?' <span class="tag ex">탐색 범위 끝값 — 해석 주의</span>':''}</div></div>`).join(''):'<div class="muted">비교 지표를 켜세요 (또는 겹치는 데이터가 부족 — 월별 24개월·연간 8년 미만).</div>';
 lagSel.innerHTML=out.map(o=>`<option value="${o.k}">${o.label}</option>`).join('');lagSel.value=out.find(o=>o.k=='rate')?'rate':(out[0]||{}).k;drawLag(out);
 const pk=Object.keys(inWin(P.data)).sort();if(!pk.length){story.innerHTML='<div class="muted">선택 기간에 데이터가 없어요.</div>';return}
 const lv=P.kind!='pct',cv=lv?+((P.data[pk.at(-1)]/P.data[pk[0]]-1)*100).toFixed(1):+(P.data[pk.at(-1)]-P.data[pk[0]]).toFixed(2),f2=x=>x==null?null:+x.toFixed(2);
 stats={region:REG.name,series:st.series.map(k=>S[k].label),window:[pk[0],pk.at(-1)],[PK+(lv?'_change_pct':'_change_pp')]:cv,corr:out.map(o=>({vs:o.label,driver:o.driver,lag0_r:f2(o.lag0),n:o.n0,[o.A?'best_lag_y':'best_lag_m']:o.A?o.best_lag/12:o.best_lag,best_r:f2(o.best_r),edge:o.edge}))};
 const mx=pk.reduce((a,b)=>P.data[b]>P.data[a]?b:a);story.innerHTML=`<b>📖 자동 요약 (데이터 계산)</b><div class="sub">${REG.name} ${P.label}: ${pk[0]}→${pk.at(-1)} ${cv>0?'+':''}${cv}${lv?'%':'%p'} · 기간 내 최고점 ${mx}${out[0]&&out[0].lag0!=null?` · ${out[0].label} 변화와의 동시점 상관 r=${r2(out[0].lag0)}`:''}. 상관은 인과가 아닙니다.</div>`;
 window.renderAI&&renderAI($('#ai'),stats)}
const corr_={set innerHTML(v){$('#corr').innerHTML=v}};
function drawLag(out){const o=out.find(x=>x.k==lagSel.value);lagChart&&lagChart.destroy();if(!o)return;
 lagChart=new Chart(lag,{type:'bar',data:{labels:o.scan.map(x=>x[0]),datasets:[{data:o.scan.map(x=>x[1]),backgroundColor:o.scan.map(x=>x[0]==o.best_lag?'#e0533d':'#c9d2ff')}]},options:{maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9},maxTicksLimit:13}},y:{min:-1,max:1,ticks:{font:{size:9}}}}}});lagSel.onchange=()=>drawLag(out)}
function sources(){const S=REG.series,src=META.sources;srcs.innerHTML=Object.entries(S).filter(([k,s])=>!s.na&&st.series.includes(k)).map(([k,s])=>{const x=src[s.src];return`<tr><td>${esc(s.label)}</td><td><a href="${x[1]}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(x[0])}</a></td><td class="${x[2]}">${esc(x[3])}</td></tr>`}).join('')+Object.entries(S).filter(([k,s])=>s.na).map(([k,s])=>`<tr><td>${META.series_names[k]}</td><td colspan="2" class="warn">미제공 — ${esc(s.na)}</td></tr>`).join('')}
picker.onclick=e=>{const k=e.target.closest('[data-k]')?.dataset.k;if(!k||k==PK)return;st.series=st.series.includes(k)?st.series.filter(x=>x!=k):[...st.series,k];render()};
rchips.onclick=e=>{const r=e.target.dataset.r;if(r){st.region=r;load()}};rsel.onchange=()=>{st.region=rsel.value;load()};
modeT.onclick=e=>{const v=e.target.dataset.v;if(v){st.mode=v;render()}};y0.onchange=y1.onchange=()=>{st.y0=+y0.value;st.y1=Math.max(+y1.value,st.y0+2);render()};shadeT.onchange=draw;
const norm=x=>String(x||'').toLowerCase().replace(/[\s.\-·,()']/g,'');let hits=[],hi=0;
function find(q){q=norm(q);if(!q)return[];const o=[];for(const p of PLACES){const ns=[p.ko,p.en,...(p.al||[])].map(norm),sc=ns.includes(q)?0:ns.some(n=>n.startsWith(q))?1:ns.some(n=>n.includes(q))?2:9;if(sc<9)o.push([sc-(p.p?.3:0)-(p.pre?.2:0),p])}return o.sort((a,b)=>a[0]-b[0]).slice(0,10).map(x=>x[1])}
const cname=cc=>(PLACES.find(x=>x.t=='country'&&x.cc==cc)||{}).ko||cc;
function showHits(){const q=pq.value.trim();hits=find(q);hi=0;pres.hidden=!q;
 pres.innerHTML=hits.length?hits.map((p,i)=>`<div data-i="${i}" class="${i==hi?'on':''}" role="option">${p.t=='city'?'🏙':'🌐'} <b>${esc(p.ko)}</b> <span class="muted">${esc(p.en)}${p.t=='city'?' · '+esc(cname(p.cc)):''}</span><small>${p.pre?'기본 · ':''}${p.t=='city'?'도시 · 집값':p.p?'국가 · 집값+연간':'국가 · 연간 지표'}</small></div>`).join(''):`<p>“${esc(q)}” 데이터 없음 — 데이터가 있는 나라(217개)와 도시(미국 30개 대도시권·한국 광역시 등)만 검색돼요.</p>`}
function pick(p){if(!p)return;pq.value='';pres.hidden=true;pq.blur();st.region=p.id;load()}
pq.onfocus=()=>PL();pq.oninput=()=>PL().then(showHits);
pq.onkeydown=e=>{if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();if(!hits.length)return;hi=(hi+(e.key=='ArrowDown'?1:hits.length-1))%hits.length;$$('#pres div').forEach((d,i)=>d.classList.toggle('on',i==hi))}else if(e.key=='Enter'){e.preventDefault();pick(hits[hi])}else if(e.key=='Escape')pres.hidden=true};
pres.onmousedown=e=>{e.preventDefault();const d=e.target.closest('[data-i]');if(d)pick(hits[+d.dataset.i])};pq.onblur=()=>setTimeout(()=>pres.hidden=true,150);
addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(draw,200)});
getJSON('data/regions.json').then(m=>{META=m;load()}).catch(e=>{document.querySelector('.wrap').insertAdjacentHTML('beforeend',`<p class="warn">데이터를 불러오지 못했습니다: ${esc(e.message)}</p>`)});
