let state={questions:[],idx:0,answers:{},time:1200,timer:null,stats:JSON.parse(localStorage.getItem('tqstats')||'{"attempted":0,"correct":0}')};

function save(){localStorage.setItem('tqstats',JSON.stringify(state.stats));}
function updateDash(){document.getElementById('totalQ').textContent=QUESTIONS.length;document.getElementById('attempted').textContent=state.stats.attempted;let a=state.stats.attempted?Math.round(state.stats.correct/state.stats.attempted*100):0;document.getElementById('accuracy').textContent=a+'%';let bar=document.getElementById('accuracyBar');if(bar)bar.style.width=a+'%';}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='bank')renderBank();}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.view));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function startTest(){
 let s=document.getElementById('subject').value,n=+document.getElementById('count').value;
 let pool=s==='ALL'?QUESTIONS:QUESTIONS.filter(q=>q.subject===s);
 state.questions=shuffle(pool).slice(0,Math.min(n,pool.length));state.idx=0;state.answers={};state.time=state.questions.length*60;
 document.getElementById('examTitle').textContent=(s==='ALL'?'Mixed':s)+' Practice Test';
 show('exam');clearInterval(state.timer);state.timer=setInterval(()=>{state.time--;renderTimer();if(state.time<=0){clearInterval(state.timer);submitTest(true)}},1000);renderQ();
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
function submitTest(auto=false){
 if(!auto&&!confirm('Submit this test?'))return;clearInterval(state.timer);let c=0;state.questions.forEach((q,i)=>{if(state.answers[i]===q.answer)c++});
 let total=state.questions.length;state.stats.attempted+=total;state.stats.correct+=c;save();updateDash();document.getElementById('rscore').textContent=c+'/'+total;document.getElementById('racc').textContent=Math.round(c/total*100)+'%';document.getElementById('rtime').textContent=Math.max(0,Math.round((total*60-state.time)/60))+'m';
 let review='<h3>Answer Review</h3>';state.questions.forEach((q,i)=>{let ua=state.answers[i];review+=`<div class="card bank-item"><b>${i+1}. ${q.question}</b><p class="muted">Your answer: ${ua===undefined?'Skipped':q.options[ua]} | Correct: ${q.options[q.answer]}</p><p>${q.explanation}</p></div>`});document.getElementById('review').innerHTML=review;show('results');
}
function renderBank(){
 let term=(document.getElementById('search').value||'').toLowerCase(),sub=document.getElementById('bankSubject').value,d=document.getElementById('bankDiff').value;
 let arr=QUESTIONS.filter(q=>(sub==='ALL'||q.subject===sub)&&(d==='ALL'||q.difficulty===d)&&(q.question.toLowerCase().includes(term)||q.options.some(x=>x.toLowerCase().includes(term))));
 document.getElementById('bankList').innerHTML=arr.map(q=>`<div class="card bank-item"><b>${q.id} • ${q.subject} • ${q.difficulty}</b><p style="margin-top:7px">${q.question}</p><p class="muted">A) ${q.options[0]} &nbsp; B) ${q.options[1]} &nbsp; C) ${q.options[2]} &nbsp; D) ${q.options[3]}</p><p class="muted">Answer: ${q.options[q.answer]}</p></div>`).join('')||'<p class="muted">No matching questions.</p>';
}
document.getElementById('search').oninput=renderBank;document.getElementById('bankSubject').onchange=renderBank;document.getElementById('bankDiff').onchange=renderBank;
function resetData(){if(confirm('Reset all saved progress?')){localStorage.removeItem('tqstats');state.stats={attempted:0,correct:0};updateDash();toast('Progress reset.')}}
function toast(x){let t=document.getElementById('toast');t.className='toast';t.textContent=x;setTimeout(()=>t.className='',2500)}
window.addEventListener('online',()=>document.getElementById('net').textContent='ONLINE');window.addEventListener('offline',()=>document.getElementById('net').textContent='OFFLINE');
updateDash();renderBank();
