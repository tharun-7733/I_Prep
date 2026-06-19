/* leaderboard.js */
const $ = id => document.getElementById(id);
window.addEventListener('scroll', () => $('navbar').classList.toggle('scrolled', scrollY > 30));

// ── Particle Canvas ────────────────────────────────────────────────────────
const canvas = $('lbCanvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
function initParticles() {
  particles = Array.from({length: 80}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    vx: (Math.random()-.5)*.2, vy: (Math.random()-.5)*.2,
    r: Math.random()*1.2+.3,
    color: Math.random()>.5 ? '#00d4ff' : '#7b2ff7',
    alpha: Math.random()*.5+.15
  }));
}
function animCanvas() {
  ctx.clearRect(0,0,W,H);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if(p.x<0)p.x=W; if(p.x>W)p.x=0;
    if(p.y<0)p.y=H; if(p.y>H)p.y=0;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill();
  });
  ctx.globalAlpha=1; requestAnimationFrame(animCanvas);
}
resize(); initParticles(); animCanvas();
window.addEventListener('resize',()=>{ resize(); initParticles(); });

// ── Leaderboard Data ───────────────────────────────────────────────────────
let LEADERBOARD = [];
const COLORS = ['#00d4ff','#7b2ff7','#00ff88','#ffcc00','#ff4d6d','#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6'];

function updatePodium(data) {
  // Populate the podium if we have at least 3
  const p1 = data[0], p2 = data[1], p3 = data[2];
  
  if (p1) {
    $('p1user').textContent = p1.username;
    $('p1score').textContent = p1.avg_score;
    $('p1sessions').textContent = p1.sessions + ' sessions';
    $('p1badge').textContent = p1.badge;
    $('p1avatar').textContent = p1.username[0].toUpperCase();
    $('podium1').style.visibility = 'visible';
  }
  if (p2) {
    $('p2user').textContent = p2.username;
    $('p2score').textContent = p2.avg_score;
    $('p2sessions').textContent = p2.sessions + ' sessions';
    $('p2badge').textContent = p2.badge;
    $('p2avatar').textContent = p2.username[0].toUpperCase();
    $('podium2').style.visibility = 'visible';
  }
  if (p3) {
    $('p3user').textContent = p3.username;
    $('p3score').textContent = p3.avg_score;
    $('p3sessions').textContent = p3.sessions + ' sessions';
    $('p3badge').textContent = p3.badge;
    $('p3avatar').textContent = p3.username[0].toUpperCase();
    $('podium3').style.visibility = 'visible';
  }
}

function renderTable(data) {
  updatePodium(data);
  const tbody = $('lbTableBody');
  tbody.innerHTML = data.slice(3).map((r, i) => {
    const badgeClass = r.badge === 'Excellent' ? 'badge-excellent' : '';
    const rankCls = r.rank <= 10 ? 'rank-top' : '';
    return `<tr class="lb-row ${r.isCurrentUser?'current-user':''}" style="transition-delay:${i*0.05}s">
      <td><span class="rank-badge ${rankCls}">${r.rank}</span></td>
      <td><div class="user-cell">
        <div class="user-av" style="background:${COLORS[i%COLORS.length]}">${r.username[0].toUpperCase()}</div>
        <span style="font-weight:600;color:${r.isCurrentUser?'var(--cyan)':'var(--text-primary)'}">${r.username}</span>
        ${r.isCurrentUser ? '<span class="you-tag">YOU</span>' : ''}
      </div></td>
      <td style="font-size:0.8rem">${r.role}</td>
      <td style="font-family:var(--font-mono);text-align:center">${r.sessions}</td>
      <td style="font-family:var(--font-mono);text-align:center;color:var(--cyan)">${r.avg_score}%</td>
      <td><div class="streak-cell">${r.streak>0?'<i class="ph-fill ph-fire icon-fire"></i>':''} ${r.streak > 0 ? r.streak+'d' : '—'}</div></td>
      <td>${badgeClass ? `<span class="hist-badge ${badgeClass}">${r.badge}</span>` : `<span style="color:var(--text-muted);font-size:0.78rem">${r.badge}</span>`}</td>
    </tr>`;
  }).join('');

  // Staggered row animation
  const rows = tbody.querySelectorAll('.lb-row');
  const rowObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('row-in'); rowObs.unobserve(e.target); } });
  }, {threshold:0.05});
  rows.forEach(r => rowObs.observe(r));
  $('lbCount').textContent = `${data.length} performers`;
}

async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      LEADERBOARD = await res.json();
    }
  } catch (error) {
    console.warn('Backend /api/leaderboard not available yet. Falling back to local progress history.');
  }

  if (!LEADERBOARD || LEADERBOARD.length === 0) {
    // Fallback: Populate with local history data so it's not totally empty
    const authUser = JSON.parse(localStorage.getItem('iprep_user') || 'null');
    const saved = JSON.parse(localStorage.getItem('iprep_settings') || '{}');
    const historyRaw = localStorage.getItem('iprep_history');
    
    let username = authUser?.name || saved.name || 'You';
    let role = saved.role || 'Backend Engineer';
    let sessions = 0, avg_score = 0;
    
    if (historyRaw) {
      try {
        const history = JSON.parse(historyRaw);
        sessions = history.length;
        if (sessions > 0) {
          avg_score = Math.round(history.reduce((sum, h) => sum + h.score, 0) / sessions);
        }
      } catch(e) {}
    }
    
    // Simulate some realistic competition using local data
    LEADERBOARD = [
      {rank: 1, username: username, role: role, sessions: sessions, avg_score: avg_score, badge: (avg_score >= 90 ? 'Excellent' : avg_score >= 70 ? 'Good' : avg_score >= 50 ? 'Needs Improvement' : 'Weak'), streak: 1, isCurrentUser: true}
    ];
  }
  
  renderTable(LEADERBOARD);
}

// ── Tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // For a real app, this might trigger another API fetch based on the time filter.
    // Here we just re-render or simulate
    const shuffled = LEADERBOARD.map(r => ({...r}));
    renderTable(shuffled);
  });
});

// ── Role filter ────────────────────────────────────────────────────────────
$('roleFilter').addEventListener('change', () => {
  const role = $('roleFilter').value;
  const filtered = role === 'All' ? LEADERBOARD : LEADERBOARD.filter(r => r.role === role || r.isCurrentUser);
  renderTable(filtered);
});

// ── Init ───────────────────────────────────────────────────────────────────
fetchLeaderboard();
// Badge strip (add hist-badge class shim)
document.head.insertAdjacentHTML('beforeend',`<style>.hist-badge{display:inline-block;font-size:.68rem;font-family:var(--font-mono);font-weight:700;padding:3px 9px;border-radius:5px}</style>`);
