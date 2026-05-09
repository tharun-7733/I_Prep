/* ═══════════════════════════════════════════
   SCRIPT.JS — I_Prep Hero Landing Page
═══════════════════════════════════════════ */

// ── Navbar scroll ──────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Typewriter ────────────────────────────
const roles = ['Software Engineer', 'Backend Developer', 'Full Stack Dev', 'System Designer', 'ML Engineer', 'DevOps Engineer'];
const typeEl = document.getElementById('typewriterText');
let rIdx = 0, cIdx = 0, deleting = false;

function type() {
  if (!typeEl) return;
  const current = roles[rIdx];
  if (!deleting) {
    typeEl.textContent = current.slice(0, cIdx + 1);
    cIdx++;
    if (cIdx === current.length) { setTimeout(() => { deleting = true; type(); }, 1800); return; }
  } else {
    typeEl.textContent = current.slice(0, cIdx - 1);
    cIdx--;
    if (cIdx === 0) {
      deleting = false;
      rIdx = (rIdx + 1) % roles.length;
    }
  }
  setTimeout(type, deleting ? 55 : 95);
}
setTimeout(type, 700);

// ── Particle Canvas ────────────────────────
const canvas = document.getElementById('particleCanvas');
const ctx = canvas?.getContext('2d');
let mouse = { x: 0.5, y: 0.5 };
let particles = [];
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
function createParticles(n = 120) {
  particles = [];
  for (let i = 0; i < n; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.6 ? '#00d4ff' : '#7b2ff7'
    });
  }
}
function animParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  const mx = mouse.x * W, my = mouse.y * H;
  particles.forEach(p => {
    // Subtle parallax toward mouse
    const dx = (mx - p.x) * 0.00008;
    const dy = (my - p.y) * 0.00008;
    p.x += p.vx + dx;
    p.y += p.vy + dy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Draw lines between nearby particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = '#00d4ff';
        ctx.globalAlpha = (1 - dist / 90) * 0.08;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  requestAnimationFrame(animParticles);
}
if (canvas) {
  resize();
  createParticles();
  animParticles();
  window.addEventListener('resize', () => { resize(); createParticles(); });
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX / W;
    mouse.y = e.clientY / H;
  });
}

// ── Dashboard Preview slide-in ─────────────
const dashboardPreview = document.getElementById('dashboardPreview');
const dashObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { dashboardPreview?.classList.add('visible'); dashObs.unobserve(e.target); } });
}, { threshold: 0.2 });
if (dashboardPreview) dashObs.observe(dashboardPreview);
// Also show on load after short delay
setTimeout(() => { dashboardPreview?.classList.add('visible'); }, 600);

// ── Stats counter animation ────────────────
function animateCounter(el, target, suffix) {
  let start = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    const display = target >= 1000 ? (start >= 1000 ? Math.floor(start / 1000) + ',000' : start) : start;
    el.textContent = target >= 10000 ? '10,000' : display;
    if (start >= target) clearInterval(timer);
  }, 25);
}
const statCards = document.querySelectorAll('.stat-card');
const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      const target = parseInt(e.target.dataset.target);
      const counter = e.target.querySelector('.counter');
      if (counter) animateCounter(counter, target);
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
statCards.forEach(c => statObs.observe(c));

// ── Scroll-triggered generic fade-ins ─────
const fadeEls = document.querySelectorAll('.step-card, .feature-card');
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); fadeObs.unobserve(e.target); } });
}, { threshold: 0.18 });
fadeEls.forEach(el => fadeObs.observe(el));

// ── Hamburger menu (mobile) ─────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
