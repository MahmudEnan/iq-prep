let state={questions:[],idx:0,answers:{},time:1200,timer:null,stats:JSON.parse(localStorage.getItem('tqstats')||'{"attempted":0,"correct":0}')};

function save(){localStorage.setItem('tqstats',JSON.stringify(state.stats));}
function updateDash(){document.getElementById('totalQ').textContent=(window.getAllQuestions?window.getAllQuestions():QUESTIONS).length;document.getElementById('attempted').textContent=state.stats.attempted;let a=state.stats.attempted?Math.round(state.stats.correct/state.stats.attempted*100):0;document.getElementById('accuracy').textContent=a+'%';let bar=document.getElementById('accuracyBar');if(bar)bar.style.width=a+'%';}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='bank')renderBank();}
function toggleMobileDrawer(){if(!window.matchMedia('(max-width: 760px)').matches){show('dash');return;}document.body.classList.toggle('mobile-drawer-open');}
function closeMobileDrawer(){document.body.classList.remove('mobile-drawer-open');}
document.addEventListener('click',function(e){if(e.target.closest('.sidebar nav button'))closeMobileDrawer();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMobileDrawer();});
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.view));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function startTest(){
 let s=document.getElementById('subject').value,n=+document.getElementById('count').value;
 let allQ=window.getAllQuestions?window.getAllQuestions():QUESTIONS;let pool=s==='ALL'?allQ:allQ.filter(q=>q.subject===s);
 let sec=Math.max(5,Math.min(300,parseInt(document.getElementById('secondsPerQuestion')?.value||'15',10)));state.questions=shuffle(pool).slice(0,Math.min(n,pool.length));state.idx=0;state.answers={};state.secondsPerQuestion=sec;state.time=state.questions.length*sec;
 document.getElementById('examTitle').textContent=(s==='ALL'?'Mixed':s)+' Practice Test';
 show('exam');clearInterval(state.timer);state.lastCountdownCue=-1;state.timer=setInterval(()=>{state.time--;renderTimer();if(state.time<=10&&state.time>0&&state.lastCountdownCue!==state.time){state.lastCountdownCue=state.time;if(window.t7Sfx)window.t7Sfx('countdown')}if(state.time<=0){clearInterval(state.timer);submitTest(true)}},1000);renderQ();
}
function renderTimer(){let m=Math.floor(state.time/60),s=state.time%60;document.getElementById('timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function renderQ(){
 let q=state.questions[state.idx];document.getElementById('qnum').textContent=`Question ${state.idx+1} of ${state.questions.length}`;
 document.getElementById('qtext').textContent=q.question;let box=document.getElementById('options');box.innerHTML='';
 q.options.forEach((o,i)=>{let b=document.createElement('button');b.className='opt'+(state.answers[state.idx]===i?' selected':'');b.textContent=String.fromCharCode(65+i)+'. '+o;b.onclick=()=>{state.answers[state.idx]=i;renderQ();renderPalette()};box.appendChild(b)});
 renderPalette();renderTimer();
}
function renderPalette(){let p=document.getElementById('palette');p.innerHTML='';state.questions.forEach((q,i)=>{let b=document.createElement('button');b.className='pal'+(state.answers[i]!==undefined?' answered ':' ')+(i===state.idx?' active':'');b.textContent=i+1;b.onclick=()=>{state.idx=i;renderQ()};p.appendChild(b)})}
function prevQ(){if(state.idx>0){state.idx--;renderQ()}}function nextQ(){if(state.idx<state.questions.length-1){state.idx++;renderQ()}}
function playResultSound(pct){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();const notes=pct<40?[220,180,150]:pct>80?[660,880,1040]:[440,554,660];let t=ctx.currentTime;notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=pct<40?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t+i*.16);g.gain.exponentialRampToValueAtTime(.12,t+i*.16+.025);g.gain.exponentialRampToValueAtTime(.0001,t+i*.16+.14);o.connect(g);g.connect(ctx.destination);o.start(t+i*.16);o.stop(t+i*.16+.15);});setTimeout(()=>ctx.close(),1000);}catch(e){}}
function submitTest(auto=false){
 if(!auto&&!confirm('Submit this test?'))return;clearInterval(state.timer);let c=0;state.questions.forEach((q,i)=>{if(state.answers[i]===q.answer)c++});
 let total=state.questions.length, pct=total?Math.round(c/total*100):0;state.stats.attempted+=total;state.stats.correct+=c;save();updateDash();document.getElementById('rscore').textContent=c+'/'+total;document.getElementById('racc').textContent=pct+'%';document.getElementById('rtime').textContent=Math.max(0,Math.round((total*Number(state.secondsPerQuestion||60)-state.time)/60))+'m';
 playResultSound(pct);if(window.t7Sfx)window.t7Sfx(pct>80?'victory':pct<40?'failure':'click');if(window.t7DailyMission){const ms=document.getElementById('missionStatus');if(ms)ms.textContent='DEBRIEF COMPLETE · '+pct+'%';window.t7DailyMission=false;}let review='<h3>Answer Review</h3><p class="muted">Wrong answers are marked red; the correct answer is marked green.</p>';state.questions.forEach((q,i)=>{let ua=state.answers[i],ok=ua===q.answer;let safe=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));let opts=q.options.map((o,j)=>`<div class="review-option ${j===q.answer?'review-correct':''} ${ua===j&&!ok?'review-wrong':''}"><b>${String.fromCharCode(65+j)}.</b> ${safe(o)} ${j===q.answer?'✓ Correct answer':''} ${ua===j&&!ok?'✕ Your answer':''}</div>`).join('');review+=`<div class="card bank-item review-question ${ok?'review-was-correct':'review-was-wrong'}"><b>${i+1}. ${safe(q.question)}</b><p class="muted">${ua===undefined?'Skipped':ok?'Your answer is correct.':'Your answer: '+safe(q.options[ua])}</p>${opts}<p>${safe(q.explanation)}</p></div>`});document.getElementById('review').innerHTML=review;show('results');
}
function renderBank(){
 let term=(document.getElementById('search').value||'').toLowerCase(),sub=document.getElementById('bankSubject').value,d=document.getElementById('bankDiff').value;
 let allQ=window.getAllQuestions?window.getAllQuestions():QUESTIONS;let arr=allQ.filter(q=>(sub==='ALL'||q.subject===sub)&&(d==='ALL'||q.difficulty===d)&&(q.question.toLowerCase().includes(term)||q.options.some(x=>x.toLowerCase().includes(term))));
 document.getElementById('bankList').innerHTML=arr.map(q=>`<div class="card bank-item"><b>${q.id} • ${q.subject} • ${q.difficulty}</b><p style="margin-top:7px">${q.question}</p><p class="muted">A) ${q.options[0]} &nbsp; B) ${q.options[1]} &nbsp; C) ${q.options[2]} &nbsp; D) ${q.options[3]}</p><p class="muted">Answer: ${q.options[q.answer]}</p></div>`).join('')||'<p class="muted">No matching questions.</p>';
}
document.getElementById('search').oninput=renderBank;document.getElementById('bankSubject').onchange=renderBank;document.getElementById('bankDiff').onchange=renderBank;
function resetData(){if(confirm('Reset all saved progress, session history and mastery data?')){['tqstats','tqHistory','tqQuestionStats','tacPracticeDates','tacStreak','tacOLQ'].forEach(k=>localStorage.removeItem(k));state.stats={attempted:0,correct:0};updateDash();if(window.renderLearningReport)window.renderLearningReport();toast('Progress, history and mastery data reset.')}}
function toast(x){let t=document.getElementById('toast');t.className='toast';t.textContent=x;setTimeout(()=>t.className='',2500)}
window.addEventListener('online',()=>document.getElementById('net').textContent='ONLINE');window.addEventListener('offline',()=>document.getElementById('net').textContent='OFFLINE');
updateDash();renderBank();
