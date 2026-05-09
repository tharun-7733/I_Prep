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
const LEADERBOARD = [
  {rank:1,username:'aditya_sys',role:'System Designer',sessions:42,avg_score:94,badge:'Excellent',streak:14,isCurrentUser:false},
  {rank:2,username:'priya_backend',role:'Backend Engineer',sessions:38,avg_score:91,badge:'Excellent',streak:10,isCurrentUser:false},
  {rank:3,username:'karan_fs',role:'Full Stack Developer',sessions:35,avg_score:89,badge:'Excellent',streak:7,isCurrentUser:false},
  {rank:4,username:'neha_ml',role:'Backend Engineer',sessions:29,avg_score:85,badge:'Excellent',streak:5,isCurrentUser:false},
  {rank:5,username:'rahul_dsa',role:'DSA / Competitive Programming',sessions:27,avg_score:83,badge:'Good',streak:12,isCurrentUser:false},
  {rank:6,username:'you',role:'Backend Engineer',sessions:7,avg_score:75,badge:'Good',streak:3,isCurrentUser:true},
  {rank:7,username:'divya_front',role:'Frontend Developer',sessions:22,avg_score:78,badge:'Good',streak:4,isCurrentUser:false},
  {rank:8,username:'arjun_devops',role:'DevOps Engineer',sessions:19,avg_score:76,badge:'Good',streak:2,isCurrentUser:false},
  {rank:9,username:'sneha_full',role:'Full Stack Developer',sessions:17,avg_score:71,badge:'Good',streak:0,isCurrentUser:false},
  {rank:10,username:'vikram_sys',role:'System Designer',sessions:15,avg_score:69,badge:'Good',streak:1,isCurrentUser:false},
];

const COLORS = ['#00d4ff','#7b2ff7','#00ff88','#ffcc00','#ff4d6d','#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6'];

function renderTable(data) {
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

// ── Tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Shuffle scores slightly for effect
    const shuffled = LEADERBOARD.map(r => ({...r, avg_score: Math.max(50, r.avg_score + Math.round((Math.random()-0.5)*6))}));
    shuffled.sort((a,b) => b.avg_score - a.avg_score);
    shuffled.forEach((r,i) => r.rank = i+1);
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
renderTable(LEADERBOARD);
// Badge strip (add hist-badge class shim)
document.head.insertAdjacentHTML('beforeend',`<style>.hist-badge{display:inline-block;font-size:.68rem;font-family:var(--font-mono);font-weight:700;padding:3px 9px;border-radius:5px}</style>`);
