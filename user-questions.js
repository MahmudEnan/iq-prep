/* User questions are local to this browser. Current Affairs is isolated and expires by chosen age. */
(() => {
  const KEY='t7UserQuestions', CA_KEY='t7ManualCurrentAffairs';
  const EDITOR_KEY='22May+1Sept';
  // Access exists only in this active app view; it is never persisted to storage.
  let editorUnlocked=false;
  // One-time repair for V1.9: remove the two local custom questions that were
  // mistakenly appearing as the entire Question Bank when the default bank
  // was not exposed on window. The bundled default questions remain untouched.
  try {
    if (localStorage.getItem('t7DefaultBankRestoreFixV20') !== 'done') {
      localStorage.removeItem(KEY);
      localStorage.setItem('t7DefaultBankRestoreFixV20', 'done');
    }
  } catch (error) { console.warn('T7 local custom-question cleanup was skipped:', error); }
  const hasAccess=()=>editorUnlocked;
  function lockEditor(message='Editor locked. Enter the key again to add questions.'){
    editorUnlocked=false;
    if($('questionEditorKey')) $('questionEditorKey').value='';
    if($('questionKeyStatus')) $('questionKeyStatus').textContent=message;
    syncEditorAccess();
  }
  const readKey=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  const read=()=>readKey(KEY);
  const readCA=()=>readKey(CA_KEY);
  const writeCA=rows=>localStorage.setItem(CA_KEY,JSON.stringify(rows));
  const pruneCA=()=>{const now=Date.now(),rows=readCA(),alive=rows.filter(q=>Number.isFinite(Date.parse(q.expiresAt||''))&&Date.parse(q.expiresAt)>now);if(alive.length!==rows.length)writeCA(alive);return alive;};
  window.getAllQuestions=()=>[...(window.QUESTIONS||[]),...read()];
  window.getUserQuestions=read;
  const $=id=>document.getElementById(id);
  function updateCount(){const el=$('totalQ');if(el)el.textContent=window.getAllQuestions().length;const count=$('userQuestionCount');if(count)count.textContent=read().length;}
  function status(s){const el=$('addQuestionStatus');if(el)el.textContent=s;}
  const keyGate=$('questionKeyGate'), editorPanel=$('questionEditorPanel');
  function syncEditorAccess(){const ok=hasAccess();if(keyGate)keyGate.hidden=ok;if(editorPanel)editorPanel.hidden=!ok;}
  const subject=$('newQSubject'), expiryField=$('caExpiryField'), expiryInput=$('newQExpiryDays');
  function syncSubject(){const ca=subject?.value==='Current Affairs';if(expiryField)expiryField.hidden=!ca;if(expiryInput)expiryInput.required=!!ca;}
  subject?.addEventListener('change',syncSubject);syncSubject();
  $('unlockQuestionEditor')?.addEventListener('click',()=>{const value=$('questionEditorKey')?.value||'';if(value===EDITOR_KEY){editorUnlocked=true;$('questionKeyStatus').textContent='Editor unlocked until you leave this page or switch away.';syncEditorAccess();$('questionEditorKey').value='';}else $('questionKeyStatus').textContent='Incorrect key. No question was added.';});
  $('questionEditorKey')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('unlockQuestionEditor')?.click()});
  syncEditorAccess();
  // Any app navigation closes the editor. Switching browser tabs/windows also locks it.
  document.addEventListener('click',event=>{const nav=event.target.closest('[data-view]');if(nav)lockEditor();},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)lockEditor();});
  window.addEventListener('pagehide',()=>{editorUnlocked=false;});
  $('addQuestionForm')?.addEventListener('submit',e=>{
    e.preventDefault(); if(!hasAccess()){status('Unlock the editor with the private key first.');return;}
    const subj=$('newQSubject').value,category=$('newQCategory').value,difficulty=$('newQDifficulty').value;
    const question=$('newQPrompt').value.trim(),options=[0,1,2,3].map(i=>$('newQOpt'+i).value.trim()),answer=Number($('newQAnswer').value),explanation=$('newQExplanation').value.trim();
    if(!subj||!category||!difficulty||!question||options.some(x=>!x)||!Number.isInteger(answer)||answer<0||answer>3||!explanation){status('Complete every field and select the correct answer.');return;}
    if(subj==='Current Affairs'){
      const days=Number(expiryInput?.value||7); if(!Number.isInteger(days)||days<1||days>365){status('Current Affairs expiry must be between 1 and 365 days.');return;}
      const current=pruneCA(); const duplicate=current.some(q=>String(q.question||'').trim().toLowerCase()===question.toLowerCase());
      if(duplicate&&!confirm('A Current Affairs question with the same wording already exists. Add it anyway?'))return;
      const now=Date.now(),item={id:'CA-ADMIN-'+now.toString(36).toUpperCase(),category:category==='Current Affairs'?'General':category,subject:'Current Affairs',difficulty,question,options,answer,explanation,source:'Manually added by admin',createdAt:new Date(now).toISOString(),expiresAt:new Date(now+days*86400000).toISOString(),manual:true};
      current.push(item);writeCA(current);e.target.reset();if(expiryInput)expiryInput.value='7';syncSubject();updateCount();status(`Added to Current Affairs only. It expires in ${days} day(s) and will not enter the offline Question Bank.`);
      window.dispatchEvent(new CustomEvent('t7:current-affairs-updated')); if(typeof updateDash==='function')updateDash();
      const caNav=document.querySelector('[data-view="currentaffairs"]'); if(caNav)caNav.querySelector('small')?.classList.add('online-chip');
      return;
    }
    const existing=window.getAllQuestions().some(q=>String(q.question||'').trim().toLowerCase()===question.toLowerCase());
    if(existing&&!confirm('A similar question already exists. Add it anyway?'))return;
    const item={id:'USER-'+Date.now().toString(36).toUpperCase(),branch:'Custom',subject:subj,category,difficulty,question,options,answer,explanation};
    const all=read();all.push(item);localStorage.setItem(KEY,JSON.stringify(all));e.target.reset();syncSubject();updateCount();status('Question added to the Question Bank. It is now available in Practice Test.');
    if(typeof updateDash==='function')updateDash();if(typeof renderBank==='function')renderBank();
  });
  $('exportUserQuestions')?.addEventListener('click',()=>{const rows=read();if(!rows.length){status('Add at least one regular question before exporting.');return;}const source='// T7 custom questions export. Keep questions.js unchanged and load this file after it.\nwindow.T7_USER_QUESTIONS = '+JSON.stringify(rows,null,2)+';\n';const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));const a=document.createElement('a');a.href=url;a.download='t7-user-questions.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);status('Question Bank export downloaded. Current Affairs questions are kept separately on the Current Affairs page.');});
  const typeChooser=$('questionTypeChooser'), iqForm=$('addQuestionForm'), specialEditor=$('specialQuestionEditor');
  const specialTypes={
    WAT:{title:'WAT — Word Association Test',fields:[['prompt','Word / prompt','text','Enter the word shown to the candidate'],['sample','Sample response (optional)','textarea','A constructive sample sentence']]},
    PPDT:{title:'PPDT — Picture Perception & Description',fields:[['prompt','Picture / story prompt','textarea','Describe the picture or provide a prompt'],['guide','Evaluation guide (optional)','textarea','Character, action, goal and outcome']]},
    PLANNING:{title:'Planning Test',fields:[['prompt','Scenario / situation','textarea','Describe the situation and available resources'],['constraints','Constraints / problems','textarea','List time, distance, resources or problems'],['guide','Expected solution / evaluation guide','textarea','Describe the important points of a good plan']]},
    EYE:{title:'Eye Test',fields:[['prompt','Visual question / stimulus','textarea','Enter the visual prompt or describe the image'],['options','Options (one per line)','textarea','Option A\nOption B\nOption C\nOption D'],['answer','Correct answer','text','Enter the correct option or answer'],['guide','Explanation (optional)','textarea','Explain the answer']]},
    NONVERBAL:{title:'Non-verbal IQ',fields:[['prompt','Pattern / figure prompt','textarea','Describe the pattern or image'],['options','Options (one per line)','textarea','Option A\nOption B\nOption C\nOption D'],['answer','Correct answer','text','Enter the correct option'],['guide','Explanation (optional)','textarea','Explain the pattern rule']]}
  };
  let activeCustomType='';
  function addField(parent,field){const [id,label,type,placeholder]=field;const wrap=document.createElement('div');const lab=document.createElement('label');lab.htmlFor='custom_'+id;lab.textContent=label;const el=document.createElement(type==='textarea'?'textarea':'input');el.id='custom_'+id;el.name=id;el.placeholder=placeholder;el.className=type==='textarea'?'special-input':'select';if(type==='textarea')el.rows=3;else el.type='text';if(!label.includes('optional'))el.required=true;wrap.append(lab,el);parent.append(wrap)}
  document.querySelectorAll('[data-qtype]').forEach(btn=>btn.addEventListener('click',()=>{
    const type=btn.dataset.qtype;activeCustomType=type;
    if(type==='IQ'){typeChooser.hidden=true;iqForm.hidden=false;specialEditor.hidden=true;return;}
    const cfg=specialTypes[type];if(!cfg)return;typeChooser.hidden=true;iqForm.hidden=true;specialEditor.hidden=false;$('specialQuestionTypeTitle').textContent=cfg.title;$('specialQuestionFields').replaceChildren();cfg.fields.forEach(f=>addField($('specialQuestionFields'),f));$('specialQuestionStatus').textContent='Saved locally in this browser.';
  }));
  $('backQuestionTypes')?.addEventListener('click',()=>{specialEditor.hidden=true;iqForm.hidden=true;typeChooser.hidden=false;activeCustomType='';});
  $('specialQuestionForm')?.addEventListener('submit',e=>{
    e.preventDefault();if(!hasAccess()){ $('specialQuestionStatus').textContent='Unlock the editor with the private key first.';return; }
    const cfg=specialTypes[activeCustomType];if(!cfg)return;
    const data={};cfg.fields.forEach(([id,label])=>{data[id]=$('custom_'+id)?.value.trim()||''});
    const rows=readKey('t7CustomSpecialQuestions');rows.push({id:'CUSTOM-'+Date.now().toString(36).toUpperCase(),type:activeCustomType,difficulty:$('specialQDifficulty').value,...data,createdAt:new Date().toISOString()});
    try{localStorage.setItem('t7CustomSpecialQuestions',JSON.stringify(rows));e.target.reset();$('specialQuestionStatus').textContent=`${cfg.title} saved locally. This custom item is stored separately from the existing IQ bank.`;}catch(err){$('specialQuestionStatus').textContent='Could not save: browser storage may be full.';}
  });
  updateCount();
})();
