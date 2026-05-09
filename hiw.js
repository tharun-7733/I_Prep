/* ═══════════════════════════════════════════
   HIW.JS — How It Works Page Interactions
═══════════════════════════════════════════ */

// ── Navbar scroll ──────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ── SVG Gradient Defs ─────────────────────
(function injectSvgDefs() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <defs>
      <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00d4ff"/>
        <stop offset="100%" stop-color="#7b2ff7"/>
      </linearGradient>
      <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00d4ff"/>
        <stop offset="100%" stop-color="#7b2ff7"/>
      </linearGradient>
    </defs>`;
  document.body.prepend(svg);
})();

// ── IntersectionObserver Setup ────────────
const observerOpts = { threshold: 0.25 };

// ── Timeline line progress ─────────────────
const tlProgress = document.getElementById('tlProgress');
const timelineWrapper = document.querySelector('.timeline-wrapper');

function updateTimelineLine() {
  if (!tlProgress || !timelineWrapper) return;
  const rect = timelineWrapper.getBoundingClientRect();
  const wh = window.innerHeight;
  const totalH = timelineWrapper.offsetHeight;
  const scrolled = Math.max(0, Math.min(1, (wh - rect.top) / (wh + totalH)));
  const drawn = scrolled * 800;
  tlProgress.setAttribute('y2', drawn);
}
window.addEventListener('scroll', updateTimelineLine, { passive: true });
updateTimelineLine();

// ── Step cards: slide-in on scroll ────────
const stepCards = document.querySelectorAll('.step-card');
const nodeEls = document.querySelectorAll('.step-node');

// Assign purple nodes
[1, 3].forEach(i => {
  const node = document.getElementById(`node${i + 1}`);
  if (node) node.classList.add('step-purple');
});

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Activate associated node
      const cardId = entry.target.id; // card1, card2, ...
      const num = cardId.replace('card', '');
      const node = document.getElementById(`node${num}`);
      if (node) node.classList.add('active');
      // Trigger step-specific animations
      triggerStepAnim(num);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

stepCards.forEach(card => cardObserver.observe(card));

// ── Step-specific animations ──────────────
function triggerStepAnim(num) {
  if (num === '1') animateDropdown();
  if (num === '2') animateQuestionGen();
  if (num === '3') animateEditor();
  if (num === '4') animateScore();
}

// Step 1 — Role dropdown cycling
function animateDropdown() {
  const roles = ['Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer', 'System Designer', 'DSA / CP'];
  const roleText = document.getElementById('roleText');
  const chips = document.querySelectorAll('.chip');
  if (!roleText) return;
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % roles.length;
    roleText.style.opacity = '0';
    roleText.style.transform = 'translateY(-4px)';
    setTimeout(() => {
      roleText.textContent = roles[idx];
      roleText.style.opacity = '1';
      roleText.style.transform = 'translateY(0)';
    }, 200);
  }, 1800);
  // Dropdown click
  const dropdown = document.getElementById('roleDropdown');
  const selected = dropdown?.querySelector('.selector-selected');
  const options = dropdown?.querySelectorAll('.selector-option');
  selected?.addEventListener('click', () => dropdown.classList.toggle('open'));
  options?.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      document.getElementById('roleText').textContent = opt.textContent;
      dropdown.classList.remove('open');
    });
  });
  document.addEventListener('click', e => {
    if (!dropdown?.contains(e.target)) dropdown?.classList.remove('open');
  });
}

// Step 2 — Question gen reveal
function animateQuestionGen() {
  const questions = document.querySelectorAll('.gen-q');
  const genCount = document.getElementById('genCount');
  if (!questions.length) return;
  let count = 0;
  questions.forEach((q, i) => {
    setTimeout(() => {
      q.classList.add('revealed');
      count++;
      if (genCount) genCount.textContent = `${count} / 8`;
    }, i * 300 + 400);
  });
}

// Step 3 — Typewriter answer
function animateEditor() {
  const edAnswer = document.getElementById('edAnswer');
  const edWords = document.getElementById('edWords');
  const edTimer = document.getElementById('edTimer');
  if (!edAnswer) return;

  const text = `The Virtual DOM is a lightweight in-memory representation of the real DOM. React maintains this tree and uses a diffing algorithm called reconciliation to determine what changed.

When state or props update, React re-renders the component tree virtually, compares it with the previous snapshot (diffing), and computes the minimal set of DOM mutations needed.

Key optimizations include key-based list reconciliation and batchedUpdates, which reduce costly repaints.`;

  let i = 0;
  let wordCount = 0;
  const interval = setInterval(() => {
    if (i >= text.length) { clearInterval(interval); return; }
    edAnswer.textContent += text[i];
    i++;
    wordCount = edAnswer.textContent.trim().split(/\s+/).filter(Boolean).length;
    if (edWords) edWords.textContent = `${wordCount} words`;
  }, 28);

  // Timer countdown
  let secs = 154;
  const timerInterval = setInterval(() => {
    if (secs <= 0) { clearInterval(timerInterval); return; }
    secs++;
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    if (edTimer) edTimer.textContent = `${m}:${s}`;
  }, 1000);
}

// Step 4 — Score ring + bars
function animateScore() {
  const scoreNum = document.getElementById('scoreNum');
  const scoreFill = document.getElementById('scoreFill');
  const bar1 = document.getElementById('bar1');
  const bar2 = document.getElementById('bar2');
  const bar3 = document.getElementById('bar3');
  const val1 = document.getElementById('val1');
  const val2 = document.getElementById('val2');
  const val3 = document.getElementById('val3');

  if (!scoreNum) return;

  const target = 87;
  const circumference = 201;
  const bars = [
    { el: bar1, valEl: val1, target: 91 },
    { el: bar2, valEl: val2, target: 80 },
    { el: bar3, valEl: val3, target: 88 },
  ];

  // Animate overall score counter
  let current = 0;
  const scoreInterval = setInterval(() => {
    current = Math.min(current + 2, target);
    scoreNum.textContent = current;
    if (scoreFill) {
      const offset = circumference - (current / 100) * circumference;
      scoreFill.style.strokeDashoffset = offset;
    }
    if (current >= target) clearInterval(scoreInterval);
  }, 20);

  // Animate bars
  setTimeout(() => {
    bars.forEach(({ el, valEl, target: t }) => {
      if (el) el.style.width = `${t}%`;
      if (valEl) {
        let v = 0;
        const bi = setInterval(() => {
          v = Math.min(v + 2, t);
          valEl.textContent = `${v}%`;
          if (v >= t) clearInterval(bi);
        }, 20);
      }
    });
  }, 300);
}
