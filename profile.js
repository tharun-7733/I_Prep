/* profile.js */
const $ = id => document.getElementById(id);
window.addEventListener('scroll', () => $('navbar').classList.toggle('scrolled', scrollY > 30));

// Fade-in animations
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }});
},{threshold:0.1});
document.querySelectorAll('.fade-left,.fade-right').forEach(el => obs.observe(el));

// ── Tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.ptab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    const panel = $(`tab-${btn.dataset.tab}`);
    if(panel){ panel.style.display = 'flex'; }
    if(btn.dataset.tab === 'stats') drawMiniChart();
    if(btn.dataset.tab === 'saved') loadSaved();
  });
});

// ── Mini Line Chart ────────────────────────────────────────────────────────
function drawMiniChart() {
  const scores = [70, 88, 56, 65, 91, 74, 82];
  const W=500, H=120, padL=20, padR=20, padT=15, padB=20;
  const iW=W-padL-padR, iH=H-padT-padB;
  const n = scores.length;
  const pts = scores.map((s,i)=>({
    x: padL + (i/(n-1))*iW,
    y: padT + (1-s/100)*iH
  }));
  const dLine = 'M '+pts.map(p=>`${p.x} ${p.y}`).join(' L ');
  const dArea = dLine + ` L ${pts[n-1].x} ${H-padB} L ${pts[0].x} ${H-padB} Z`;
  $('miniPath').setAttribute('d',dLine);
  $('miniArea').setAttribute('d',dArea);
  $('miniDots').innerHTML = pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3" fill="#0a0f1e" stroke="#00d4ff" stroke-width="2"/>`).join('');
  setTimeout(()=>{ $('miniPath').style.strokeDashoffset='0'; },200);
}
drawMiniChart();

// ── Saved Questions ────────────────────────────────────────────────────────
function loadSaved() {
  const bookmarks = JSON.parse(localStorage.getItem('iprep_bookmarks') || '[]');
  const list = $('savedList');
  const empty = $('savedEmpty');
  // Remove old items
  list.querySelectorAll('.saved-item').forEach(el => el.remove());
  if(!bookmarks.length){
    empty.style.display='block'; return;
  }
  empty.style.display='none';
  bookmarks.forEach(q => {
    const text = q.text || (typeof q === 'string' ? q : JSON.stringify(q));
    const el = document.createElement('div');
    el.className = 'saved-item';
    el.innerHTML = `
      <div class="saved-q-text">${text.slice(0,120)}${text.length>120?'…':''}</div>
      <a href="practice.html" class="btn-ghost" style="font-size:0.78rem;padding:8px 14px;white-space:nowrap">Practice Again</a>`;
    list.appendChild(el);
  });
}

// ── Settings Save ──────────────────────────────────────────────────────────
$('btnSaveSettings')?.addEventListener('click', () => {
  const data = {
    name: $('setName').value,
    email: $('setEmail').value,
    role: $('setRole').value,
    difficulty: $('setDiff').value,
    notifications: $('notifToggle').checked,
    streakAlerts: $('streakToggle').checked,
  };
  localStorage.setItem('iprep_settings', JSON.stringify(data));
  // Update sidebar
  $('profileName').textContent = data.name;
  const roleMap = {backend:'Aspiring Backend Engineer',frontend:'Aspiring Frontend Developer',fullstack:'Full Stack Developer',devops:'DevOps Engineer',system:'System Designer'};
  $('profileRole').textContent = roleMap[data.role] || data.role;
  $('avatarCircle').textContent = data.name[0]?.toUpperCase() || 'U';
  showToast('✅ Settings saved!');
});

// ── Load saved settings ────────────────────────────────────────────────────
const saved = JSON.parse(localStorage.getItem('iprep_settings') || '{}');
if(saved.name){ $('setName').value=saved.name; $('profileName').textContent=saved.name; $('avatarCircle').textContent=saved.name[0]?.toUpperCase()||'T'; }
if(saved.email) $('setEmail').value=saved.email;
if(saved.role) $('setRole').value=saved.role;
if(saved.difficulty) $('setDiff').value=saved.difficulty;

function showToast(msg) {
  const el = document.createElement('div');
  el.style.cssText=`position:fixed;bottom:2rem;right:2rem;z-index:9999;background:rgba(13,27,42,0.95);border:1px solid rgba(0,212,255,0.3);color:#f0f4ff;padding:12px 20px;border-radius:12px;font-size:0.875rem;backdrop-filter:blur(20px);box-shadow:0 8px 30px rgba(0,0,0,0.4);`;
  el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}
