/* T7 learning analytics, persistent WAT input, mock mode and portable progress backup. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const dayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Keep the same textarea element for the entire WAT run. Replacing innerHTML on every word
  // was destroying focus and forcing users to tap the answer field repeatedly.
  window.renderWAT = function renderWATPersistent(){
    if (sp.idx >= WAT_WORDS.length) { finishSpecial(); return; }
    const word = WAT_WORDS[sp.idx];
    const host = $('specialContent');
    if (!$('watAnswer')) {
      host.innerHTML = `<div class="roadmap-callout">Write one natural, constructive sentence using each word. The word changes every 10 seconds. The same writing field stays active between words to avoid repeated taps.</div><div id="watWord" style="text-align:center;font-size:clamp(2.5rem,8vw,5rem);font-weight:800;color:var(--gold);padding:22px"></div><label class="special-label" for="watAnswer">Your sentence</label><textarea id="watAnswer" class="special-input" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Start typing your sentence here…"></textarea><p class="special-content-note" id="watCounter"></p><p class="special-content-note">Tip: keep the answer short, clear and constructive. The auto-score is only a rough writing check, not an ISSB evaluation.</p>`;
      const field=$('watAnswer');
      field.addEventListener('input',()=>{sp.answers[sp.idx]=field.value;});
      // Initial focus follows the user's Start WAT action. Some mobile browsers may still
      // require a first tap to open the virtual keyboard due to OS security restrictions.
      requestAnimationFrame(()=>{ try { field.focus({preventScroll:true}); } catch { field.focus(); } });
    }
    $('watWord').textContent = word;
    $('watCounter').textContent = `Word ${sp.idx+1} of ${WAT_WORDS.length} • Keep typing in the same field as the next word appears.`;
    const field=$('watAnswer');
    if (field.dataset.wordIndex !== String(sp.idx)) {
      field.value=''; field.dataset.wordIndex=String(sp.idx); sp.answers[sp.idx]='';
      // Do not blur/refocus: retaining focus keeps continuous typing possible on desktop
      // and on mobile keyboards that allow programmatic focus to persist.
    }
    $('specialNext').textContent='Next Word →';
    setStage('Word '+(sp.idx+1)+' / '+WAT_WORDS.length,'Write one sentence',10);
  };

  // Track completed standard tests, category performance, question-level mastery and genuine
  // practice-day streaks. Only a completed test earns a streak day.
  const originalSubmit = window.submitTest;
  window.submitTest = function trackedSubmit(auto=false){
    const snapshot = {questions:[...(state.questions||[])], answers:{...(state.answers||{})}, subject:$('examTitle')?.textContent||'Practice Test', totalTime:state.time, startedAt:Date.now()};
    originalSubmit(auto);
    if (!$('results')?.classList.contains('active') || !snapshot.questions.length) return;
    const sessions=read('tqHistory',[]), qs=read('tqQuestionStats',{}), date=dayKey();
    let correct=0, wrong=[];
    snapshot.questions.forEach((q,i)=>{
      const ua=snapshot.answers[i], ok=ua===q.answer; if(ok) correct++; else wrong.push(q);
      const id=String(q.id||q.question), x=qs[id]||{seen:0,correct:0,wrong:0,category:q.category||q.subject||'Uncategorized',question:q.question};
      x.seen++; x.lastSeen=date; if(ok)x.correct++;else x.wrong++; x.category=q.category||q.subject||'Uncategorized'; x.question=q.question; qs[id]=x;
    });
    sessions.push({date,at:new Date().toISOString(),subject:snapshot.subject,total:snapshot.questions.length,correct,accuracy:Math.round(correct/snapshot.questions.length*100),wrongIds:wrong.map(q=>q.id),durationSeconds:Math.max(0,snapshot.questions.length*Number(state.secondsPerQuestion||60)-Number(snapshot.totalTime||0))});
    write('tqHistory',sessions.slice(-300)); write('tqQuestionStats',qs);
    const dates=[...new Set([...read('tacPracticeDates',[]),date])].sort(); write('tacPracticeDates',dates);
    renderLearningReport();
    if (typeof window.updateTacticalHUD==='function') window.updateTacticalHUD();
  };

  function getCategoryStats(){
    const qs=read('tqQuestionStats',{}), map={};
    Object.values(qs).forEach(q=>{const k=q.category||'Uncategorized';const x=map[k]||(map[k]={category:k,seen:0,correct:0,wrong:0,questions:0,mastered:0});x.seen+=q.seen||0;x.correct+=q.correct||0;x.wrong+=q.wrong||0;x.questions++;if((q.seen||0)>=3&&(q.correct||0)/(q.seen||1)>=.8)x.mastered++;});
    return Object.values(map).map(x=>({...x,accuracy:x.seen?Math.round(x.correct/x.seen*100):0,mastery:x.questions?Math.round(x.mastered/x.questions*100):0})).sort((a,b)=>a.accuracy-b.accuracy||b.seen-a.seen);
  }
  function renderLearningReport(){
    const sessions=read('tqHistory',[]), qs=Object.values(read('tqQuestionStats',{})), cats=getCategoryStats();
    if(!$('learningBreakdown')) return;
    const recent=sessions.slice(-3), recentN=recent.reduce((a,s)=>a+s.total,0), recentC=recent.reduce((a,s)=>a+s.correct,0);
    $('learnRecentAcc').textContent=recentN?Math.round(recentC/recentN*100)+'%':'—';
    $('learnRecentMeta').textContent=recent.length?`${recent.length} latest session(s) • ${recentN} questions`:'Complete a test to start tracking.';
    const mastered=qs.filter(q=>q.seen>=3&&q.correct/q.seen>=.8).length, mastery=qs.length?Math.round(mastered/qs.length*100):0;
    $('learnMastery').textContent=mastery+'%'; $('learnMasteryBar').style.width=mastery+'%';
    const weak=cats.find(c=>c.seen>=3&&c.accuracy<80);
    $('learnNextStep').textContent=weak?`Review ${weak.category}`:'Take a short diagnostic test';
    $('learnNextReason').textContent=weak?`${weak.accuracy}% accuracy across ${weak.seen} recorded attempts. Aim to explain the rule before retrying.`:'More completed questions are needed to identify a reliable weak area.';
    $('weakPracticeBtn').disabled=!weak;
    $('learningBreakdown').innerHTML=cats.length?cats.slice(0,12).map(c=>`<div class="roadmap-step"><div class="roadmap-num">${c.accuracy}%</div><div><h3>${esc(c.category)} <span class="section-tag">${c.seen} attempts</span></h3><p>${c.correct} correct • ${c.wrong} incorrect • ${c.questions} distinct questions</p><div class="progress-track"><span style="width:${c.accuracy}%"></span></div><p>${c.seen<3?'Need more attempts before drawing a strong conclusion.':c.accuracy<80?'Priority: review the rule, solve 5 untimed examples, then retest.':c.accuracy>=90?'Strong so far: practise timed mixed questions to protect speed.':'Keep practising until accuracy is consistently 80%+.'}</p></div></div>`).join(''):'<p class="muted">Your category-wise performance will appear here after the first completed test.</p>';
  }
  window.startWeakPractice=function(){const weak=getCategoryStats().find(c=>c.seen>=3&&c.accuracy<80);if(!weak){alert('No reliable weak category yet. Complete a few practice tests first.');return;}const sel=$('subject');const qs=Object.values(read('tqQuestionStats',{}));const badIds=new Set(qs.filter(q=>q.category===weak.category&&q.wrong>0).map(q=>q.question));let allQ=window.getAllQuestions?window.getAllQuestions():QUESTIONS;let pool=allQ.filter(q=>q.category===weak.category);if(!pool.length)pool=allQ.filter(q=>q.subject===weak.category);if(!pool.length){alert('No questions are tagged for this category in the bank. Use the question bank search to review it.');return;}state.questions=shuffle(pool).slice(0,Math.min(20,pool.length));state.idx=0;state.answers={};state.time=state.questions.length*30;state.secondsPerQuestion=30;$('examTitle').textContent='Weak-Area Practice: '+weak.category;show('exam');clearInterval(state.timer);state.timer=setInterval(()=>{state.time--;renderTimer();if(state.time<=0){clearInterval(state.timer);submitTest(true)}},1000);renderQ();};
  window.renderLearningReport=renderLearningReport;

  // Extended timed IQ mock. 80 questions × 30 seconds = 40 minutes; the app labels this
  // as a training simulation because actual entry-specific formats can vary.
  function addMockButton(){
    const host=document.querySelector('#examselect .form-card .actions');
    if(host&&!$('issbMockBtn')){const b=document.createElement('button');b.id='issbMockBtn';b.className='btn';b.textContent='Start 40-minute IQ mock (80 Q)';b.onclick=()=>{ $('subject').value='IQ';$('count').value='80';$('secondsPerQuestion').value='30';startTest();};host.appendChild(b);const note=document.createElement('p');note.className='muted';note.textContent='Training target: 80% accuracy (64/80). This is a practice benchmark, not a predicted ISSB mark.';host.appendChild(note);}
    const hero=document.querySelector('#dash .hero-actions');
    if(hero&&!$('heroMockBtn')){const b=document.createElement('button');b.id='heroMockBtn';b.className='btn';b.textContent='40-min IQ mock';b.onclick=()=>{ $('subject').value='IQ';$('count').value='80';$('secondsPerQuestion').value='30';startTest();};hero.appendChild(b);}
  }

  // Portable, versioned backup. Import merges/overwrites only T7's own progress keys.
  function backupData(){return {app:'T7 Defense IQ Prep',schemaVersion:1,exportedAt:new Date().toISOString(),data:Object.fromEntries(['tqstats','tqHistory','tqQuestionStats','tacPracticeDates','tacOLQ','tacBranch','tacStreak'].map(k=>[k,localStorage.getItem(k)]))};}
  $('exportProgress')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(backupData(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`t7-progress-backup-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backupStatus').textContent='Backup exported. Keep the JSON file somewhere safe.';});
  $('importProgressFile')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(parsed.app!=='T7 Defense IQ Prep'||!parsed.data||parsed.schemaVersion!==1)throw Error('This is not a supported T7 backup.');for(const k of ['tqstats','tqHistory','tqQuestionStats','tacPracticeDates','tacOLQ','tacBranch','tacStreak'])if(Object.prototype.hasOwnProperty.call(parsed.data,k)&&parsed.data[k]!==null)localStorage.setItem(k,parsed.data[k]);$('backupStatus').textContent='Backup imported. Reload the app to refresh every panel.';if(typeof updateDash==='function')updateDash();renderLearningReport();}catch(err){$('backupStatus').textContent='Import failed: '+err.message;}finally{e.target.value='';}});

  // Automatically inspect question-bank structure; this does not certify factual correctness.
  function addBankAudit(){
    const settings=document.querySelector('#settings .settings-card');if(!settings||$('bankAudit'))return;
    const box=document.createElement('div');box.className='bank-audit-panel';box.innerHTML='<div class="card-topline"><span>QUESTION BANK QUALITY CHECK</span><span class="section-tag">STRUCTURE ONLY</span></div><h2>Run question-bank audit</h2><p class="muted">Checks duplicate IDs, duplicate question text, answer-index validity and missing explanations. It cannot prove that every answer is factually correct.</p><button class="btn" id="bankAudit">Run local audit</button><div id="bankAuditResult" class="muted" style="margin-top:12px"></div>';settings.appendChild(box);
    $('bankAudit').addEventListener('click',()=>{const seenId=new Set(),seenText=new Set();let duplicateIds=0,duplicateText=0,bad=0,missing=0;for(const q of (window.getAllQuestions?window.getAllQuestions():QUESTIONS)){const id=String(q.id||'');const txt=String(q.question||'').trim().toLowerCase();if(seenId.has(id))duplicateIds++;seenId.add(id);if(seenText.has(txt))duplicateText++;seenText.add(txt);if(!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)bad++;if(!String(q.explanation||'').trim())missing++;}const allQ=window.getAllQuestions?window.getAllQuestions():QUESTIONS;const iq=allQ.filter(q=>q.subject==='IQ').length;$('bankAuditResult').innerHTML=`<b>Audit complete:</b> ${allQ.length} total questions; ${iq} tagged IQ.<br>Duplicate IDs: ${duplicateIds} • duplicate question text: ${duplicateText} • invalid answer structure: ${bad} • missing explanations: ${missing}.<br><b>Important:</b> a structurally valid bank can still contain an incorrect answer. Have subject experts review answers before treating this as exam-verified.`;});
  }

  renderLearningReport(); addMockButton(); addBankAudit();
  // Ensure stats and analytics refresh when returning to the dashboard.
  document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='dash'||b.dataset.view==='tacticalhq')renderLearningReport();}));
})();
