header('econ');
const COL={price:'#1c2333',price_nat:'#8a93a6',m2:'#13a37a',rate:'#e0533d',fx:'#f0a020',stock:'#4f6bff'};
let META,REG,st={region:qs('region')||'seoul',series:(qs('series')||'price,m2,rate').split(','),mode:qs('mode')||'multi',y0:+(qs('from')||2004),y1:+(qs('to')||2026)},chart,lagChart,stats;
const shift=(k,n)=>{const t=+k.slice(0,4)*12+(+k.slice(5,7))-1+n;return `${t/12|0}-${String(t%12+1).padStart(2,'0')}`};
const chg=(d,pct)=>{const o={};for(const k in d){const p=d[shift(k,-12)];if(p!=null)o[k]=pct?d[k]-p:(d[k]/p-1)*100}return o};
function corr(x,y){const ks=Object.keys(x).filter(k=>k in y),n=ks.length;if(n<24)return{r:null,n};let a=ks.map(k=>x[k]),b=ks.map(k=>y[k]),ma=a.reduce((s,v)=>s+v)/n,mb=b.reduce((s,v)=>s+v)/n,sab=0,sa=0,sb=0;
 for(let i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2}return{r:sab/Math.sqrt(sa*sb),n}}
function cycles(rate){const ks=Object.keys(rate).sort(),out=[];let cur=null;for(const k of ks){const p=rate[shift(k,-1)];if(p==null)continue;const c=rate[k]-p;if(c>1e-9){cur?cur[1]=k:cur=[k,k]}else if(c<-1e-9&&cur){out.push(cur);cur=null}}if(cur)out.push(cur);return out}
const inWin=(d)=>{const o={};for(const k in d)if(+k.slice(0,4)>=st.y0&&+k.slice(0,4)<=st.y1)o[k]=d[k];return o};
function sync(){history.replaceState(null,'',`?region=${st.region}&series=${st.series.join(',')}&mode=${st.mode}&from=${st.y0}&to=${st.y1}`)}
async function load(){REG=await getJSON(`data/regions/${st.region}.json`);const S=REG.series;st.series=st.series.filter(k=>S[k]&&!S[k].na);if(!st.series.includes('price'))st.series.unshift('price');render()}
function render(){sync();const S=REG.series,R=META.regions;crn.textContent=REG.name;
 rsel.innerHTML=['city','country'].map(t=>`<optgroup label="${t=='city'?'도시':'국가'}">`+R.filter(r=>r.type==t).map(r=>`<option value="${r.id}" ${r.id==st.region?'selected':''}>${r.name}</option>`).join('')+'</optgroup>').join('');
 rchips.innerHTML=R.filter(r=>['seoul','tokyo','london','nyc','paris','toronto','korea','us'].includes(r.id)).map(r=>`<span data-r="${r.id}" class="${r.id==st.region?'on':''}">${r.name}</span>`).join('')+'<span class="na" title="ABS RPPI 2021년 중단 — 대체 지표 미확보">시드니 미확보</span>';
 $$('#modeT div').forEach(d=>d.classList.toggle('on',d.dataset.v==st.mode));
 const yrs=[];for(let y=2000;y<=2026;y++)yrs.push(y);y0.innerHTML=yrs.map(y=>`<option ${y==st.y0?'selected':''}>${y}</option>`).join('');y1.innerHTML=yrs.map(y=>`<option ${y==st.y1?'selected':''}>${y}</option>`).join('');
 picker.innerHTML=META.series_order.filter(k=>S[k]).map(k=>{const s=S[k];if(s.na)return`<span class="sc dis" title="${esc(s.na)}">${META.series_names[k]} · 미제공</span>`;const on=st.series.includes(k);
  return`<span class="sc ${on?'on':''}" data-k="${k}" style="${on?'border-color:'+COL[k]:''}"><i style="background:${on?COL[k]:'#9aa2b3'}"></i>${META.series_names[k]} <small>${esc(s.unit)}${s.freq=='Q'?' · 분기':''}</small></span>`}).join('')+'<span class="sc dis">물가 · 준비 중</span>';
 draw();analyze();sources()}
function draw(){const S=REG.series,sel=st.series.map(k=>[k,S[k]]);
 const all=new Set();sel.forEach(([k,s])=>Object.keys(inWin(s.data)).forEach(m=>all.add(m)));const M=[...all].sort();
 const reb=st.mode=='rebase',mob=innerWidth<600;let base=null;
 if(reb){base=M.find(m=>sel.filter(([k,s])=>s.kind!='pct').every(([k,s])=>s.data[m]!=null))||M[0]}
 const scales={x:{ticks:{maxTicksLimit:mob?5:12,font:{size:10}}}},axes={};let ai=0;
 const ds=sel.map(([k,s])=>{let d=s.data,ax;
  if(s.kind=='pct'){ax='yR';scales.yR={position:'right',title:{display:!mob,text:'% (금리)'},grid:{drawOnChartArea:false},ticks:{font:{size:10}}}}
  else if(reb){ax='yL';const b=d[base]??d[Object.keys(d).sort().find(m=>m>=base)];const o={};for(const m in d)o[m]=d[m]/b*100;d=o;scales.yL={position:'left',title:{display:!mob,text:`${base} = 100`},ticks:{font:{size:10}}}}
  else{const u=s.unit;if(!axes[u]){axes[u]='y'+(ai++);scales[axes[u]]={position:'left',display:ai==1||!mob,title:{display:!mob,text:u},grid:{drawOnChartArea:ai==1},ticks:{font:{size:10}}}}ax=axes[u]}
  return{label:s.label,data:M.map(m=>d[m]??null),borderColor:COL[k],backgroundColor:COL[k],yAxisID:ax,pointRadius:0,borderWidth:k=='price'?2.5:1.8,borderDash:k=='fx'?[5,3]:k=='price_nat'?[2,2]:[],stepped:s.kind=='pct',spanGaps:true,tension:.15}});
 const rate=S.rate&&!S.rate.na?S.rate.data:null,cyc=rate?cycles(rate).filter(([a,b])=>b>=M[0]&&a<=M[M.length-1]):[];
 $('#cyc').innerHTML=rate&&shadeT.checked?'▒ 금리 인상기(데이터에서 자동 계산): '+cyc.map(([a,b])=>`<span>${a<M[0]?M[0]:a}~${b}</span>`).join(' '):'';
 const shade={id:'shade',beforeDatasetsDraw(ch){if(!shadeT.checked)return;const{ctx,chartArea:a,scales:{x}}=ch;ctx.save();ctx.fillStyle='rgba(224,83,61,.10)';for(const[s0,e]of cyc){const i=M.findIndex(m=>m>=s0),j=M.findLastIndex(m=>m<=e);if(i<0||j<0)continue;const x1=x.getPixelForValue(i),x2=x.getPixelForValue(j);ctx.fillRect(x1,a.top,Math.max(2,x2-x1),a.bottom-a.top)}ctx.restore()}};
 chart&&chart.destroy();chart=new Chart(c,{type:'line',data:{labels:M,datasets:ds},options:{maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}},scales},plugins:[shade]});
 ctitle.textContent=REG.name+' — '+sel.map(([k])=>META.series_names[k]).join(' × ')+(reb?` (${base}=100)`:'');
 axnote.textContent=(reb?`100 재기준: 수준 지표는 ${base}=100으로 맞춰 왼쪽 축 하나에, %인 금리는 재기준하지 않고 오른쪽 축.`:'원 단위: 단위가 다른 지표는 자동으로 다른 축에 배정(%는 오른쪽).'+(Object.keys(axes).length>2?' 축이 3개 이상이면 100 재기준 모드를 권장합니다.':''))+' 분기 지표는 분기 중간월에 표시. '+sel.filter(([k,s])=>s.note).map(([k,s])=>s.label+': '+s.note).join(' · ')}
function analyze(){const S=REG.series,P=S.price,py=inWin(chg(P.data,false)),out=[];
 for(const k of ['rate','m2','fx','stock'].filter(k=>st.series.includes(k))){const s=S[k];if(!s||s.na)continue;const dr=chg(s.data,s.kind=='pct');const scan=[];
  for(let L=0;L<=24;L++){const sh={};for(const m in dr)sh[shift(m,L)]=dr[m];const r=corr(sh,py);scan.push([L,r.r,r.n])}
  const v=scan.filter(x=>x[1]!=null);if(!v.length)continue;const best=v.reduce((a,b)=>Math.abs(b[1])>Math.abs(a[1])?b:a);
  out.push({k,label:META.series_names[k],driver:s.kind=='pct'?'12개월 변화(%p)':'전년동월비(%)',lag0:scan[0][1],n0:scan[0][2],best_lag:best[0],best_r:best[1],best_n:best[2],edge:best[0]==24,scan})}
 const r2=x=>x==null?'–':(x>0?'+':'')+x.toFixed(2);
 corr_.innerHTML=out.length?out.map(o=>`<div class="card"><div class="muted">${o.label} ${o.driver} → 집값 전년동월비</div><div class="big">r = ${r2(o.lag0)}</div><div class="muted">동시점 · n=${o.n0}개월</div><div style="margin-top:6px;font-size:13px">가장 강한 시차: <b>${o.best_lag}개월 선행, r = ${r2(o.best_r)}</b> <span class="muted">(n=${o.best_n})</span>${o.edge?' <span class="tag ex">탐색 범위 끝값 — 해석 주의</span>':''}</div></div>`).join(''):'<div class="muted">금리·통화량 등 비교 지표를 켜세요 (또는 겹치는 데이터가 24개월 미만).</div>';
 lagSel.innerHTML=out.map(o=>`<option value="${o.k}">${o.label}</option>`).join('');lagSel.value=out.find(o=>o.k=='rate')?'rate':(out[0]||{}).k;drawLag(out);
 const pk=Object.keys(inWin(P.data)).sort();stats={region:REG.name,series:st.series.map(k=>S[k].label),window:[pk[0],pk[pk.length-1]],
  price_change_pct:+((P.data[pk[pk.length-1]]/P.data[pk[0]]-1)*100).toFixed(1),corr:out.map(o=>({vs:o.label,driver:o.driver,lag0_r:+o.lag0.toFixed(2),n:o.n0,best_lag_m:o.best_lag,best_r:+o.best_r.toFixed(2),edge:o.edge}))};
 const mx=pk.reduce((a,b)=>P.data[b]>P.data[a]?b:a);story.innerHTML=`<b>📖 자동 요약 (데이터 계산)</b><div class="sub">${REG.name} ${P.label}: ${pk[0]}→${pk[pk.length-1]} ${stats.price_change_pct>0?'+':''}${stats.price_change_pct}% · 기간 내 최고점 ${mx}${out[0]?` · ${out[0].label} 변화와의 동시점 상관 r=${r2(out[0].lag0)}`:''}. 상관은 인과가 아닙니다.</div>`;
 window.renderAI&&renderAI($('#ai'),stats)}
const corr_={set innerHTML(v){$('#corr').innerHTML=v}};
function drawLag(out){const o=out.find(x=>x.k==lagSel.value);lagChart&&lagChart.destroy();if(!o)return;
 lagChart=new Chart(lag,{type:'bar',data:{labels:o.scan.map(x=>x[0]),datasets:[{data:o.scan.map(x=>x[1]),backgroundColor:o.scan.map(x=>x[0]==o.best_lag?'#e0533d':'#c9d2ff')}]},options:{maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9},maxTicksLimit:13}},y:{min:-1,max:1,ticks:{font:{size:9}}}}}});lagSel.onchange=()=>drawLag(out)}
function sources(){const S=REG.series,src=META.sources;srcs.innerHTML=Object.entries(S).filter(([k,s])=>!s.na&&st.series.includes(k)).map(([k,s])=>{const x=src[s.src];return`<tr><td>${esc(s.label)}</td><td><a href="${x[1]}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(x[0])}</a></td><td class="${x[2]}">${esc(x[3])}</td></tr>`}).join('')+Object.entries(S).filter(([k,s])=>s.na).map(([k,s])=>`<tr><td>${META.series_names[k]}</td><td colspan="2" class="warn">미제공 — ${esc(s.na)}</td></tr>`).join('')}
picker.onclick=e=>{const k=e.target.closest('[data-k]')?.dataset.k;if(!k||k=='price')return;st.series=st.series.includes(k)?st.series.filter(x=>x!=k):[...st.series,k];render()};
rchips.onclick=e=>{const r=e.target.dataset.r;if(r){st.region=r;load()}};rsel.onchange=()=>{st.region=rsel.value;load()};
modeT.onclick=e=>{const v=e.target.dataset.v;if(v){st.mode=v;render()}};y0.onchange=y1.onchange=()=>{st.y0=+y0.value;st.y1=Math.max(+y1.value,st.y0+2);render()};shadeT.onchange=draw;
addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(draw,200)});
getJSON('data/regions.json').then(m=>{META=m;load()}).catch(e=>{document.querySelector('.wrap').insertAdjacentHTML('beforeend',`<p class="warn">데이터를 불러오지 못했습니다: ${esc(e.message)}</p>`)});
