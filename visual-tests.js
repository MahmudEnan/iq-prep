// T7 visual recognition and non-verbal reasoning practice. These are independent practice simulations.
(() => {
  const $ = id => document.getElementById(id);
  let eyeCode = '', eyeTimeout = null;
  let nv = {questions:[], index:0, answers:{}, seconds:0, timer:null, finished:false};
  const SHAPES = ['▲','■','●','◆','★','⬟','⬢','✦'];
  const ARROWS = ['↑','→','↓','←'];
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const shuffle = arr => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const q = (prompt, figure, options, answer, explanation) => ({prompt,figure,options:options.map(String),answer,explanation});
  function makeNV(i) {
    const type=i%10, v=Math.floor(i/10), A=SHAPES[(v*2)%SHAPES.length], B=SHAPES[(v*2+1)%SHAPES.length], C=SHAPES[(v*2+2)%SHAPES.length], D=SHAPES[(v*2+3)%SHAPES.length];
    if(type===0){ const opts=[A,B,C,D]; return q('Which symbol comes next in the alternating sequence?',`${A}   ${B}   ${A}   ${B}   ?`,[A,C,B,D],0,'The two shapes alternate, so the next shape matches the first.'); }
    if(type===1){ const start=v%4, seq=[0,1,2,3].map(k=>ARROWS[(start+k)%4]); const ans=ARROWS[(start+3)%4]; return q('Continue the quarter-turn arrow sequence.',`${ARROWS[start]}   ${ARROWS[(start+1)%4]}   ${ARROWS[(start+2)%4]}   ?`,[ans,ARROWS[(start+1)%4],ARROWS[start],ARROWS[(start+2)%4]],0,'The arrow rotates by 90 degrees each step.'); }
    if(type===2){ const sides=3+v; const glyphs=['△','□','⬟','⬢','⯃','✡','✿']; const current=[glyphs[(sides-3)%glyphs.length],glyphs[(sides-2)%glyphs.length],glyphs[(sides-1)%glyphs.length]]; const ans=glyphs[sides%glyphs.length]; return q('Choose the next shape in the increasing-side pattern.',`${current[0]}   ${current[1]}   ${current[2]}   ?`,[ans,current[0],current[2],current[1]],0,'The pattern advances to a shape with one more side each time.'); }
    if(type===3){ const n=1+v; const dots='● '.repeat(n).trim(); const next='● '.repeat(n+1).trim(); return q('How many dots belong in the next group?',`${dots}   →   ?`,[String(n+2),String(n+1),String(n),String(n+3)],1,`The number of dots increases by one, so the next group has ${n+1}.`); }
    if(type===4){ const count=3+v; const sticks='| '.repeat(count).trim(); return q('Count the visible matchsticks.',sticks,[String(count-1),String(count+1),String(count),String(count+2)],2,`There are ${count} vertical sticks.`); }
    if(type===5){ return q('Complete the 2 × 2 pattern: each row contains the same two shapes in reverse order.',`${A}   ${B}\n${B}   ?`,[A,C,B,D],0,'The second row reverses the first row, so the missing shape is the first shape.'); }
    if(type===6){ const groups=[['▲','■','◆','●','Circle'],['●','★','◆','■','Circle'],['▲','⬟','⬢','●','Circle'],['◆','■','▲','●','Circle'],['★','◆','■','●','Circle']]; const g=groups[v]; return q('Which figure is the odd one out?',g.slice(0,4).join('   '),['Triangle','Square','Diamond','Circle'],3,'Three figures are angular polygons; the circle has no straight sides.'); }
    if(type===7){ const pairs=[['↗','↖'],['↘','↙'],['↑','↑'],['→','←'],['↙','↘']]; const pair=pairs[v]; return q('Which arrow is the horizontal mirror image of the shown arrow?',pair[0],[pair[1],pair[0],ARROWS[(v+1)%4],ARROWS[(v+2)%4]],0,'A horizontal mirror reverses left and right while keeping vertical direction.'); }
    if(type===8){ const corners=['└','┌','┐','┘']; const start=v%4; return q('Continue the corner-shape rotation.',`${corners[start]}   ${corners[(start+1)%4]}   ${corners[(start+2)%4]}   ?`,[corners[(start+3)%4],corners[start],corners[(start+2)%4],corners[(start+1)%4]],0,'The corner rotates 90 degrees at each step.'); }
    const pairs=[['◇','◆'],['○','●'],['□','■'],['△','▲'],['☆','★']]; const pair=pairs[v]; return q('Complete the outline/filled alternating sequence.',`${pair[0]}   ${pair[1]}   ${pair[0]}   ${pair[1]}   ?`,[pair[0],pair[1],SHAPES[(v+2)%SHAPES.length],SHAPES[(v+3)%SHAPES.length]],0,'Outline and filled versions alternate; the next is the outline shape.');
  }
  function showEyePanel(){ $('nvPanel').style.display='none'; $('eyePanel').style.display='block'; $('eyeFeedback').textContent=''; $('eyeAnswerArea').style.display='none'; $('eyeStimulus').style.display='grid'; $('eyeTimer').textContent='3'; }
  window.startEyeTest = function(){
    clearTimeout(eyeTimeout); show('specialtests'); document.getElementById('visualpractice')?.scrollIntoView({behavior:'smooth',block:'start'}); showEyePanel();
    const distance=+$('eyeDistance').value; const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const len=distance===3?6:distance===2?5:4;
    eyeCode=Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    $('eyeTitle').textContent=`3-Second Visual Reading • ${distance} m`; $('eyeInstruction').textContent=`Stand approximately ${distance} metre(s) from the screen and read the code. Screen size varies, so this is not a calibrated eye chart.`;
    $('eyeStimulus').textContent=eyeCode; $('eyeAnswer').value=''; $('eyeAnswer').disabled=false; $('eyeAnswerArea').style.display='none';
    eyeTimeout=setTimeout(()=>{ $('eyeStimulus').style.display='none'; $('eyeTimer').textContent='DONE'; $('eyeAnswerArea').style.display='block'; $('eyeAnswer').focus(); },3000);
  };
  window.checkEyeAnswer = function(){ const val=norm($('eyeAnswer').value); const correct=norm(eyeCode); $('eyeAnswer').disabled=true; $('eyeFeedback').innerHTML=(val===correct?'<b>Match.</b>':'<b>Not a match.</b>')+` Correct code: <strong>${eyeCode}</strong>.`; };
  window.closeVisualPanel = function(){clearTimeout(eyeTimeout);if(nv.timer)clearInterval(nv.timer);$('eyePanel').style.display='none';$('nvPanel').style.display='none';};
  function fmt(sec){sec=Math.max(0,sec|0);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
  window.startNonverbalTest = function(){
    clearTimeout(eyeTimeout); if(nv.timer)clearInterval(nv.timer); show('specialtests'); document.getElementById('visualpractice')?.scrollIntoView({behavior:'smooth',block:'start'}); $('eyePanel').style.display='none'; $('nvPanel').style.display='block';
    const count=+$('nvCount').value, mins=+$('nvMinutes').value;
    document.querySelector('#nvPanel .actions').innerHTML='<button class="btn" onclick="nvPrev()">← Previous</button><button class="btn primary" onclick="nvNext()">Next →</button><button class="btn danger" onclick="finishNonverbalTest()">Submit exam</button>';
    const all=shuffle(Array.from({length:50},(_,i)=>makeNV(i))); nv={questions:all.slice(0,count),index:0,answers:{},seconds:mins*60,timer:null,finished:false};
    $('nvFeedback').textContent='Mock mode: answers and explanations appear after you submit.'; renderNV(); renderNVTimer();
    nv.timer=setInterval(()=>{nv.seconds--;renderNVTimer();if(nv.seconds<=0)finishNonverbalTest(true);},1000);
  };
  function renderNVTimer(){ $('nvTimer').textContent=fmt(nv.seconds); }
  function renderNV(){
    if(nv.finished)return; const item=nv.questions[nv.index]; $('nvTitle').textContent=`Non-verbal IQ • Question ${nv.index+1}`; $('nvCounter').textContent=`${nv.index+1} of ${nv.questions.length} • ${Object.keys(nv.answers).length} answered`;
    $('nvQuestion').innerHTML=`<p>${item.prompt}</p><div class="nv-figure">${item.figure.replace(/\n/g,'<br>')}</div>`;
    $('nvOptions').innerHTML=''; item.options.forEach((op,j)=>{const b=document.createElement('button');b.type='button';b.className='nv-option'+(nv.answers[nv.index]===j?' selected':'');b.textContent=`${String.fromCharCode(65+j)}. ${op}`;b.onclick=()=>{nv.answers[nv.index]=j;renderNV();};$('nvOptions').appendChild(b);});
  }
  window.nvPrev=function(){if(nv.index>0){nv.index--;renderNV();}};
  window.nvNext=function(){if(nv.index<nv.questions.length-1){nv.index++;renderNV();}else $('nvFeedback').textContent='Last question reached. Submit the exam to see your result.';};
  window.finishNonverbalTest=function(timeUp=false){
    if(nv.finished)return; nv.finished=true;clearInterval(nv.timer);let score=0; const rows=nv.questions.map((it,i)=>{const a=nv.answers[i],ok=a===it.answer;if(ok)score++;return `<div class="roadmap-step"><div class="roadmap-num">${i+1}</div><div><h3>${ok?'Correct':'Review'} · ${it.prompt}</h3><p><b>Your answer:</b> ${a===undefined?'Not answered':it.options[a]} · <b>Correct:</b> ${it.options[it.answer]}</p><p>${it.explanation}</p></div></div>`;}).join('');
    try{const old=JSON.parse(localStorage.getItem('t7_nonverbal_history')||'[]');old.push({date:new Date().toISOString(),score,total:nv.questions.length,accuracy:Math.round(score/nv.questions.length*100),timeLimitSeconds:+$('nvMinutes').value*60,timeUsedSeconds:Math.max(0,+$('nvMinutes').value*60-nv.seconds)});localStorage.setItem('t7_nonverbal_history',JSON.stringify(old.slice(-30)));}catch(e){}
    $('nvTitle').textContent=timeUp?'Time is up — result':'Non-verbal IQ result';$('nvCounter').textContent=`${score}/${nv.questions.length} correct • ${Math.round(score/nv.questions.length*100)}% accuracy`;$('nvQuestion').innerHTML=`<div class="metric-card card" style="padding:18px"><div class="label">PRACTICE SCORE</div><div class="metric">${score}/${nv.questions.length}</div><p>${Math.round(score/nv.questions.length*100)}% accuracy. This is a practice result, not an official ISSB score prediction.</p></div>`;$('nvOptions').innerHTML=rows;$('nvFeedback').textContent='Review the explanations below, then repeat a fresh test to measure improvement.';
    document.querySelector('#nvPanel .actions').innerHTML='<button class="btn primary" onclick="startNonverbalTest()">New exam ↻</button><button class="btn" onclick="closeVisualPanel()">Close</button>';
  };
})();
