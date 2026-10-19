/* T7 Current Affairs: isolated online-only module. Never mutates QUESTIONS or offline model data. */
(() => {
  const EXPIRE_MS = 72 * 60 * 60 * 1000;
  let items = [];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function alive(q, now = Date.now()) {
    const created = Date.parse(q.createdAt || q.verifiedAt || q.publishedAt || '');
    const explicitExpiry = Date.parse(q.expiresAt || '');
    const expiry = Number.isFinite(explicitExpiry) ? explicitExpiry : (Number.isFinite(created) ? created + EXPIRE_MS : 0);
    return expiry > now && Number.isFinite(created) && created <= now + 5 * 60 * 1000;
  }
  function category(q) {
    const s = `${q.category || ''} ${q.question || ''}`.toLowerCase();
    if (/bangladesh|dhaka|bangladeshi|বাংলাদেশ/.test(s)) return 'Bangladesh';
    if (/sport|football|cricket|olympic|tennis/.test(s)) return 'Sports';
    if (/science|technology|ai |artificial intelligence|space|satellite/.test(s)) return 'Science & Technology';
    if (/econom|trade|bank|inflation|gdp|market/.test(s)) return 'Economy';
    if (/international|united nations|un |world|global|summit|president|prime minister/.test(s)) return 'International';
    return 'General';
  }
  function render() {
    const filter = $('caTopic')?.value || 'ALL';
    const shown = items.filter(q => filter === 'ALL' || category(q) === filter);
    $('caTotal').textContent = String(shown.length);
    $('caList').innerHTML = shown.length ? shown.map((q,i) => `<article class="card ca-card"><div class="eyebrow">${esc(category(q))} / DAILY BRIEF</div><h3>${esc(q.question)}</h3><div class="ca-meta">${esc(q.source || 'Source not specified')} · Expires ${esc(new Date(q.expiresAt || (Date.parse(q.createdAt || q.verifiedAt || q.publishedAt) + EXPIRE_MS)).toLocaleString())}</div><div class="ca-options">${q.options.map((o,j)=>`<button class="ca-option" data-ca="${i}" data-answer="${j}">${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}</div><div class="ca-explanation" id="caExplain${i}"><b>Correct answer:</b> ${esc(q.options[q.answer])}<br>${esc(q.explanation)}${q.sourceUrl ? `<p><a class="ca-source" href="${esc(q.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open source article ↗</a></p>` : ''}</div></article>`).join('') : '<div class="card ca-card"><h3>No active questions</h3><p class="muted">No current questions match this category. Refresh later when the online feed has new items.</p></div>';
    $('caList').querySelectorAll('[data-ca]').forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.ca), chosen = Number(btn.dataset.answer), q = shown[idx];
      const card = btn.closest('.ca-card');
      card.querySelectorAll('.ca-option').forEach((b,j) => { b.disabled = true; if(j === q.answer) b.classList.add('correct'); if(j === chosen && chosen !== q.answer) b.classList.add('wrong'); });
      card.querySelector('.ca-explanation').classList.add('open');
    }));
  }
  async function refresh() {
    $('caStatus').textContent = navigator.onLine ? 'Connecting…' : 'Offline';
    $('caNotice').innerHTML = '<span class="note-icon">i</span><p>Fetching online Current Affairs. This does not change the offline question bank.</p>';
    try {
      const response = await fetch('./current-affairs.json?ts=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      items = (Array.isArray(data.questions) ? data.questions : []).filter(q => q && q.question && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 && alive(q));
      $('caUpdated').textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Not reported';
      $('caStatus').textContent = 'ONLINE';
      $('caNotice').innerHTML = `<span class="note-icon">✓</span><p>Loaded ${items.length} unexpired question(s). Questions expire after 72 hours. AI verification can still make mistakes; use the source link to confirm important facts.</p>`;
      render();
    } catch (error) {
      items = [];
      $('caUpdated').textContent = 'Unavailable'; $('caStatus').textContent = navigator.onLine ? 'Feed error' : 'Offline';
      $('caNotice').innerHTML = '<span class="note-icon">i</span><p>Current Affairs is online-only and could not load. Your offline IQ bank and local AI remain unaffected. Check hosting path and current-affairs.json.</p>';
      render(); console.warn('Current Affairs unavailable:', error);
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('caRefresh')?.addEventListener('click', refresh);
    $('caTopic')?.addEventListener('change', render);
    refresh();
  });
})();
