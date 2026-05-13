/* progress.js */
const API = 'http://localhost:8000/api';
const $ = id => document.getElementById(id);

window.addEventListener('scroll', () => $('navbar').classList.toggle('scrolled', scrollY > 30));

// IntersectionObserver for fade-up
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }});
}, {threshold:0.15});
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

// Counter animation
function animCount(el, target, suffix='') {
  let start = 0;
  const dur = 1400, startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime)/dur, 1);
    const ease = 1 - Math.pow(1-t, 3);
    start = Math.round(target * ease);
    el.textContent = start + suffix;
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Counter cards observe
document.querySelectorAll('.sc-counter').forEach(el => {
  const cardObs = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting){
      animCount(el, parseInt(el.dataset.target));
      cardObs.unobserve(el);
    }
  }, {threshold:0.4});
  cardObs.observe(el.closest('.summary-card'));
});

// ── Load data ──────────────────────────────────────────────────────────────
async function loadProgress() {
  const historyRaw = localStorage.getItem('iprep_history');
  let history = [];
  if (historyRaw) {
    try { history = JSON.parse(historyRaw); } catch(e){}
  }

  let data;
  let SESSIONS = [];

  if (history && history.length > 0) {
    // 1. Group by date to form "sessions"
    const grouped = {};
    const catScores = {}; // For radar
    
    history.forEach(item => {
      const d = item.date;
      if (!grouped[d]) grouped[d] = { date: d, count: 0, totalScore: 0, categories: {} };
      grouped[d].count++;
      grouped[d].totalScore += item.score;
      
      const c = item.category || 'General';
      grouped[d].categories[c] = (grouped[d].categories[c] || 0) + 1;

      if (!catScores[c]) catScores[c] = { total: 0, count: 0 };
      catScores[c].total += item.score;
      catScores[c].count++;
    });

    // 2. Build sessions array
    SESSIONS = Object.values(grouped).map(g => {
      const avg = Math.round(g.totalScore / g.count);
      let bestCat = Object.keys(g.categories).sort((a,b) => g.categories[b] - g.categories[a])[0];
      let badge = avg >= 90 ? 'Excellent' : avg >= 70 ? 'Good' : avg >= 50 ? 'Needs Improvement' : 'Weak';
      return {
        date: g.date,
        role: 'Mixed Role', // from local storage we don't have role saved per question
        category: bestCat,
        questions: g.count,
        avg_score: avg,
        badge: badge
      };
    });
    // Sort oldest to newest for the line chart
    SESSIONS.sort((a,b) => new Date(a.date) - new Date(b.date));

    // 3. Build top level stats
    const totalQuestions = history.length;
    const avgScore = Math.round(history.reduce((sum, item) => sum + item.score, 0) / totalQuestions);
    const sessionsCompleted = SESSIONS.length;
    let bestOverallCat = Object.keys(catScores).sort((a,b) => (catScores[b].total/catScores[b].count) - (catScores[a].total/catScores[a].count))[0];

    // 4. Build radar data
    const radar = {};
    Object.keys(catScores).forEach(c => {
      radar[c] = Math.round(catScores[c].total / catScores[c].count);
    });

    data = {
      total_questions: totalQuestions,
      avg_score: avgScore,
      best_category: bestOverallCat,
      sessions_completed: sessionsCompleted,
      session_scores: SESSIONS.map((s, i) => ({ label: `S${i+1}`, score: s.avg_score, date: s.date })),
      radar: radar
    };
    
    // Sort newest to oldest for history table
    SESSIONS.sort((a,b) => new Date(b.date) - new Date(a.date));

  } else {
    // No history yet — show clean empty state
    data = {
      total_questions:    0,
      avg_score:          0,
      best_category:      'N/A',
      sessions_completed: 0,
      session_scores:     [],
      radar:              {}
    };
    SESSIONS = [];
  }

  // Update DOM targets dynamically
  const counters = document.querySelectorAll('.sc-counter');
  if(counters[0]) counters[0].dataset.target = data.total_questions;
  if(counters[1]) counters[1].dataset.target = data.avg_score;
  if(counters[2]) counters[2].dataset.target = data.sessions_completed;
  
  const bestCatEl = document.querySelector('.sc-text');
  if(bestCatEl) bestCatEl.textContent = data.best_category.replace('Technical Concepts','Technical');

  drawLineChart(data.session_scores);
  drawRadar(data.radar);
  loadHistory(SESSIONS);
}

// ── Line Chart ─────────────────────────────────────────────────────────────
function drawLineChart(sessions) {
  if(!sessions||!sessions.length) return;
  const W=640, H=200, padL=30, padR=20, padT=20, padB=30;
  const iW=W-padL-padR, iH=H-padT-padB;
  const n = sessions.length;
  const maxScore = 100;
  const pts = sessions.map((s,i)=>({
    x: padL + (i/(n-1||1))*iW,
    y: padT + (1 - s.score/maxScore)*iH,
    score: s.score, label: s.label
  }));

  // Path
  const dLine = 'M ' + pts.map(p=>`${p.x} ${p.y}`).join(' L ');
  const dArea = dLine + ` L ${pts[pts.length-1].x} ${H-padB} L ${pts[0].x} ${H-padB} Z`;

  const linePath = $('linePath');
  const lineArea = $('lineArea');
  linePath.setAttribute('d', dLine);
  lineArea.setAttribute('d', dArea);

  // Animate line draw
  const lineLen = linePath.getTotalLength ? linePath.getTotalLength() : 1000;
  linePath.setAttribute('stroke-dasharray', lineLen);
  linePath.setAttribute('stroke-dashoffset', lineLen);

  const lineObs = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting) {
      linePath.style.strokeDashoffset = '0';
      lineObs.unobserve(entries[0].target);
    }
  }, {threshold:0.3});
  lineObs.observe($('lineChart'));

  // Dots
  const dotsG = $('lineDots');
  dotsG.innerHTML = pts.map(p=>`
    <circle cx="${p.x}" cy="${p.y}" r="4" fill="#0a0f1e" stroke="#00d4ff" stroke-width="2"/>
    <circle cx="${p.x}" cy="${p.y}" r="2" fill="#00d4ff"/>
  `).join('');

  // Labels
  const labG = $('lineLabels');
  labG.innerHTML = pts.map(p=>`
    <text x="${p.x}" y="${H-padB+16}" text-anchor="middle"
      font-size="9" fill="rgba(255,255,255,0.3)" font-family="JetBrains Mono">${p.label}</text>
    <text x="${p.x}" y="${p.y-9}" text-anchor="middle"
      font-size="9" fill="#00d4ff" font-family="JetBrains Mono">${p.score}</text>
  `).join('');
}

// ── Radar Chart ────────────────────────────────────────────────────────────
function drawRadar(data) {
  const cx=150, cy=140, R=90;
  const keys = Object.keys(data);
  const n = keys.length;
  const angles = keys.map((_,i) => (i/n)*2*Math.PI - Math.PI/2);

  // Grid polygons
  const gridG = $('radarGrid');
  gridG.innerHTML = [0.25,0.5,0.75,1].map(frac=>{
    const pts = angles.map(a=>`${cx+R*frac*Math.cos(a)},${cy+R*frac*Math.sin(a)}`).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }).join('') + angles.map(a=>`<line x1="${cx}" y1="${cy}" x2="${cx+R*Math.cos(a)}" y2="${cy+R*Math.sin(a)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`).join('');

  // Labels
  const labG = $('radarLabels');
  labG.innerHTML = keys.map((k,i)=>{
    const a = angles[i]; const dist = R+20;
    const x = cx+dist*Math.cos(a), y = cy+dist*Math.sin(a);
    const anchor = Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle';
    const shortK = k.replace('Technical Concepts','Tech').replace('System Design','Sys.Design');
    return `<text x="${x}" y="${y+4}" text-anchor="${anchor}" font-size="9" fill="rgba(255,255,255,0.45)" font-family="JetBrains Mono">${shortK}\n${data[k]}%</text>`;
  }).join('');

  // Fill polygon
  const fillPts = keys.map((k,i)=>{
    const a=angles[i]; const r=R*(data[k]/100);
    return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
  }).join(' ');

  const fillEl = $('radarFill');
  fillEl.setAttribute('points', fillPts);

  // Animate on scroll
  const rObs = new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting){ fillEl.style.opacity='1'; rObs.unobserve(entries[0].target); }
  },{threshold:0.3});
  rObs.observe($('radarChart'));

  // Dots
  $('radarDots').innerHTML = keys.map((k,i)=>{
    const a=angles[i]; const r=R*(data[k]/100);
    return `<circle cx="${cx+r*Math.cos(a)}" cy="${cy+r*Math.sin(a)}" r="4" fill="#7b2ff7" stroke="#fff" stroke-width="1.5"/>`;
  }).join('');
}

// ── Session History ────────────────────────────────────────────────────────
function loadHistory(SESSIONS) {
  const tbody = $('historyBody');
  if (!SESSIONS || SESSIONS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">No session history yet. Start practicing!</td></tr>`;
    return;
  }
  tbody.innerHTML = SESSIONS.map((s,i)=>{
    const badgeClass = {Excellent:'badge-excellent',Good:'badge-good','Needs Improvement':'badge-needs',Weak:'badge-weak'}[s.badge]||'badge-good';
    return `<tr style="transition-delay:${i*0.07}s">
      <td style="color:var(--text-muted);font-family:var(--font-mono)">${i+1}</td>
      <td style="font-family:var(--font-mono);font-size:0.78rem">${s.date}</td>
      <td>${s.role}</td>
      <td>${s.category}</td>
      <td style="text-align:center;font-family:var(--font-mono)">${s.questions}</td>
      <td style="text-align:center;font-family:var(--font-mono);color:var(--cyan)">${s.avg_score}%</td>
      <td><span class="hist-badge ${badgeClass}">${s.badge}</span></td>
    </tr>`;
  }).join('');

  // Stagger rows
  const rows = tbody.querySelectorAll('tr');
  const rowObs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('row-visible'); rowObs.unobserve(e.target); }
    });
  },{threshold:0.1});
  rows.forEach(r=>rowObs.observe(r));
}

loadProgress();
