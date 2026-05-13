/* practice.js — Practice Arena Logic */
const API = 'http://localhost:8000/api';

// ── State ──────────────────────────────────────────────────────────────────
let questions = [], currentIdx = 0, sessionActive = false;
let timerInterval = null, timerSeconds = 0;
let bookmarked = JSON.parse(localStorage.getItem('iprep_bookmarks') || '[]');
let sessionHistory = JSON.parse(localStorage.getItem('iprep_history') || '[]');

// ── DOM refs ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const navbar = $('navbar');
const btnGenerate = $('btnGenerate');
const btnRipple   = $('btnRipple');
const emptyState  = $('emptyState');
const questionLoaded = $('questionLoaded');
const answerZone  = $('answerZone');
const feedbackZone = $('feedbackZone');
const answerTA    = $('answerTextarea');
const btnEvaluate = $('btnEvaluate');
const lineNumbers = $('lineNumbers');

// ── Navbar scroll ──────────────────────────────────────────────────────────
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', scrollY > 30));

// ── Generate Questions ─────────────────────────────────────────────────────
btnGenerate.addEventListener('click', async () => {
  triggerRipple();
  const role       = $('roleSelect').value;
  const category   = $('categorySelect').value;
  const difficulty = $('difficultySelect').value;
  $('generateLabel').textContent = 'Generating…';
  btnGenerate.disabled = true;

  try {
    const res = await fetch(`${API}/questions?role=${encodeURIComponent(role)}&category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}&limit=10`);
    const data = await res.json();
    questions = data.questions;
    if (!questions.length) { showToast('No questions found for this filter.'); return; }
    currentIdx = 0;
    sessionActive = true;
    loadQuestion(0);
    updateArenaStatus();
  } catch(e) {
    showToast('⚠️ Could not reach the server. Make sure the backend is running at localhost:8000.');
  } finally {
    $('generateLabel').textContent = 'Generate Questions';
    btnGenerate.disabled = false;
  }
});



// ── Load Question ──────────────────────────────────────────────────────────
function loadQuestion(idx) {
  const q = questions[idx];
  if (!q) return;

  emptyState.style.display = 'none';
  questionLoaded.style.display = 'flex';
  feedbackZone.classList.remove('active');
  feedbackZone.style.display = 'none';
  if ($('perfBadge')) $('perfBadge').classList.remove('pulsing');
  ['fbPositive','fbMissing','fbIdeal'].forEach(id => { const el=$(id); if(el) el.classList.remove('revealed'); });
  answerZone.style.display = 'flex';

  // Reset answer
  answerTA.value = '';
  updateWordCount();
  btnEvaluate.disabled = true;

  // Question counter
  $('qCurrent').textContent = idx + 1;
  $('qTotal').textContent   = questions.length;
  $('questionProgress').textContent = `Question ${idx + 1} of ${questions.length}`;

  // Category / difficulty badges
  $('qCatBadge').textContent  = q.category  || 'General';
  $('qDiffBadge').textContent = q.difficulty || 'Medium';

  // Tags
  const tagsRow = $('qTagsRow');
  tagsRow.innerHTML = (q.tags || []).map(t => `<span class="q-tag">${t}</span>`).join('');

  // Bookmark state
  const isBookmarked = bookmarked.some(b => b.text === q.text);
  $('bookmarkIcon').textContent = isBookmarked ? '★' : '☆';
  $('btnBookmark').classList.toggle('active', isBookmarked);

  // Typewriter
  typewriterAnimate(q.text || q);

  // Progress dots
  buildProgressDots();

  // Timer
  startTimer();

  // Next button state
  $('btnNext').disabled = idx >= questions.length - 1;

  // Status
  updateArenaStatus('active');
}

// ── Typewriter ─────────────────────────────────────────────────────────────
function typewriterAnimate(text) {
  const el = $('questionText');
  el.textContent = '';
  let i = 0;
  const speed = text.length > 100 ? 18 : 25;
  const iv = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) clearInterval(iv);
  }, speed);
}

// ── Progress Dots ──────────────────────────────────────────────────────────
function buildProgressDots() {
  const container = $('qProgressDots');
  container.innerHTML = questions.map((_, i) => {
    let cls = 'prog-dot';
    if (i < currentIdx) cls += ' done';
    if (i === currentIdx) cls += ' active';
    return `<div class="${cls}"></div>`;
  }).join('');
}

// ── Timer ──────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  timerSeconds = 0;
  $('timerDisplay').textContent = '00:00';
  timerInterval = setInterval(() => {
    timerSeconds++;
    const m = String(Math.floor(timerSeconds / 60)).padStart(2,'0');
    const s = String(timerSeconds % 60).padStart(2,'0');
    $('timerDisplay').textContent = `${m}:${s}`;
  }, 1000);
}

// ── Answer textarea ────────────────────────────────────────────────────────
answerTA.addEventListener('input', () => {
  updateWordCount();
  updateLineNumbers();
  btnEvaluate.disabled = answerTA.value.trim().length < 10;
});

function updateWordCount() {
  const words = answerTA.value.trim().split(/\s+/).filter(Boolean).length;
  const chars = answerTA.value.length;
  $('wordCount').textContent = `${words} word${words !== 1 ? 's' : ''}`;
  $('charCount').textContent = `${chars} chars`;
}

function updateLineNumbers() {
  const lines = answerTA.value.split('\n').length;
  lineNumbers.innerHTML = Array.from({length: Math.max(lines, 1)}, (_,i) => `<span>${i+1}</span>`).join('');
}

// ── Clear ─────────────────────────────────────────────────────────────────
$('btnClear').addEventListener('click', () => {
  answerTA.value = ''; updateWordCount(); updateLineNumbers();
  btnEvaluate.disabled = true;
});

// ── Evaluate ──────────────────────────────────────────────────────────────
btnEvaluate.addEventListener('click', async () => {
  const answer   = answerTA.value.trim();
  const question = questions[currentIdx];
  if (!answer || !question) return;

  clearInterval(timerInterval);
  $('evalSpinner').style.display = 'inline';
  $('evalLabel').textContent = 'Evaluating…';
  btnEvaluate.disabled = true;

  try {
    const res = await fetch(`${API}/evaluate`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        answer, 
        question: question.text || question, 
        category: question.category || ''
      })
    });
    const data = await res.json();
    showFeedback(data);
    saveToHistory(question, data, timerSeconds);
  } catch(e) {
    showToast('⚠️ Evaluation failed. Make sure the backend is running at localhost:8000.');
  } finally {
    $('evalSpinner').style.display = 'none';
    $('evalLabel').textContent = 'Evaluate My Answer';
    btnEvaluate.disabled = false;
  }
});



// ── Show Feedback (Premium V2) ────────────────────────────────────────────
function showFeedback(data) {
  // 1. Slide out the answer zone
  answerZone.classList.add('sliding-out');
  setTimeout(() => {
    answerZone.style.display = 'none';
    answerZone.classList.remove('sliding-out');

    // 2. Reveal feedback zone with animation class
    feedbackZone.classList.add('active');
    feedbackZone.style.display = 'block';

    // 3. Ring glow color by badge
    const ring    = $('ringProgress');
    const scoreEl = $('scoreBig');
    const glowMap = {
      'Excellent':          { grad: 'feedbackGradGreen',  cls: 'glow-green' },
      'Good':               { grad: 'feedbackGrad',       cls: 'glow-cyan'  },
      'Needs Improvement':  { grad: 'feedbackGradYellow', cls: 'glow-yellow' },
      'Weak':               { grad: 'feedbackGradRed',    cls: 'glow-red'   },
    };
    const glow = glowMap[data.badge] || glowMap['Good'];
    ring.classList.remove('glow-green','glow-cyan','glow-yellow','glow-red');
    ring.classList.add(glow.cls);
    ring.setAttribute('stroke', `url(#${glow.grad})`);
    scoreEl.className = `score-num ${glow.cls}`;

    // 4. Animate ring from 0 → score
    const circumference = 345.4;
    ring.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const offset = circumference - (data.overall_score / 100) * circumference;
        ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.23,1,0.32,1)';
        ring.style.strokeDashoffset = offset;
      });
    });

    // 5. Count-up score number
    animateCount(scoreEl, 0, data.overall_score, 1300);

    // 6. Bars (staggered, each transitions at different delay via CSS)
    setTimeout(() => {
      setBar('barRelevance', 'pctRelevance', data.relevance);
      setBar('barDepth',     'pctDepth',     data.depth);
      setBar('barClarity',   'pctClarity',   data.clarity);
    }, 200);

    // 7. Performance badge
    const cfg   = data.badge_config || {};
    const badge = $('perfBadge');
    const color = cfg.color || '#00d4ff';
    badge.style.color = color;
    badge.style.setProperty('--badge-color', cfg.glow || 'rgba(0,212,255,0.3)');
    badge.classList.add('pulsing');
    $('badgeEmoji').innerHTML = cfg.emoji || `<i class="ph-fill ph-info" style="color:${color}"></i>`;
    $('badgeLabel').textContent  = data.badge || data.label || 'Good';
    $('badgeRange').textContent  = cfg.range  || '';

    // 8. Feedback lists
    const fb = data.feedback || {};
    buildFbList('listPositive', fb.positive || []);
    buildFbList('listMissing',  fb.missing  || []);
    buildFbList('listIdeal',    fb.ideal    || []);

    // 9. Staggered block reveal
    ['fbPositive', 'fbMissing', 'fbIdeal'].forEach((id, i) => {
      const el = $(id);
      el.classList.remove('revealed');
      setTimeout(() => el.classList.add('revealed'), 600 + i * 220);
    });

    // 10. Update progress dots
    buildProgressDots();
  }, 400);
}

function setBar(barId, pctId, value) {
  const el = $(barId);
  // force reflow to reset transition
  el.style.width = '0%';
  void el.offsetWidth;
  el.style.width = `${value}%`;
  animateCount($(pctId), 0, value, 1100, '%');
}

function buildFbList(id, items) {
  $(id).innerHTML = items.map(txt => `<li>${txt}</li>`).join('');
}

function animateCount(el, from, to, duration, suffix = '') {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * ease) + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Feedback actions ───────────────────────────────────────────────────────
$('btnTryAgain').addEventListener('click', () => {
  feedbackZone.classList.remove('active');
  feedbackZone.style.display = 'none';
  // reset badge pulse
  $('perfBadge').classList.remove('pulsing');
  // reset ring
  $('ringProgress').style.strokeDashoffset = '345.4';
  // reset bars
  ['barRelevance','barDepth','barClarity'].forEach(id => { $(id).style.width='0%'; });
  // reset blocks
  ['fbPositive','fbMissing','fbIdeal'].forEach(id => $(id).classList.remove('revealed'));

  answerZone.style.display = 'flex';
  answerTA.value = '';
  updateWordCount(); updateLineNumbers();
  btnEvaluate.disabled = true;
  startTimer();
});

$('btnNextQuestion').addEventListener('click', () => {
  if (currentIdx < questions.length - 1) {
    currentIdx++;
    loadQuestion(currentIdx);
    // Reset feedback state
    feedbackZone.classList.remove('active');
    feedbackZone.style.display = 'none';
    $('perfBadge').classList.remove('pulsing');
    ['fbPositive','fbMissing','fbIdeal'].forEach(id => $(id).classList.remove('revealed'));
  } else {
    showToast('<i class="ph-fill ph-confetti"></i> Session complete! Check your progress.');
    $('btnNext').disabled = true;
  }
});

$('btnCloseFeedback').addEventListener('click', () => {
  feedbackZone.classList.remove('active');
  feedbackZone.style.display = 'none';
  $('perfBadge').classList.remove('pulsing');
  ['fbPositive','fbMissing','fbIdeal'].forEach(id => $(id).classList.remove('revealed'));
  answerZone.style.display = 'flex';
});

// ── Skip / Next ────────────────────────────────────────────────────────────
$('btnSkip').addEventListener('click', () => {
  if (currentIdx < questions.length - 1) { currentIdx++; loadQuestion(currentIdx); }
});
$('btnNext').addEventListener('click', () => {
  if (currentIdx < questions.length - 1) { currentIdx++; loadQuestion(currentIdx); }
});

// ── Bookmark ───────────────────────────────────────────────────────────────
$('btnBookmark').addEventListener('click', () => {
  const q = questions[currentIdx]; if (!q) return;
  const idx = bookmarked.findIndex(b => b.text === (q.text || q));
  if (idx === -1) {
    bookmarked.push(q);
    $('bookmarkIcon').textContent = '★';
    $('btnBookmark').classList.add('active');
    showToast('Question bookmarked ★');
  } else {
    bookmarked.splice(idx, 1);
    $('bookmarkIcon').textContent = '☆';
    $('btnBookmark').classList.remove('active');
  }
  localStorage.setItem('iprep_bookmarks', JSON.stringify(bookmarked));
});

// ── Helpers ────────────────────────────────────────────────────────────────
function updateArenaStatus(state = 'ready') {
  const dot = document.querySelector('.status-dot');
  if (state === 'active') {
    dot.className = 'status-dot status-active';
    $('statusText').textContent = 'Session Active';
  } else {
    dot.className = 'status-dot status-ready';
    $('statusText').textContent = 'Ready';
  }
}

function triggerRipple() {
  btnRipple.classList.remove('rippling');
  void btnRipple.offsetWidth;
  btnRipple.classList.add('rippling');
}

function saveToHistory(q, result, timeSec) {
  const entry = {
    date: new Date().toISOString().split('T')[0],
    question: (q.text || q).slice(0, 80) + '…',
    score: result.overall_score,
    badge: result.badge || result.label,
    time: timeSec,
    category: q.category || '',
  };
  sessionHistory.unshift(entry);
  sessionHistory = sessionHistory.slice(0, 100);
  localStorage.setItem('iprep_history', JSON.stringify(sessionHistory));
}

function showToast(msg) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:9999;
    display:flex;align-items:center;gap:10px;
    background:rgba(13,27,42,0.95);border:1px solid rgba(0,212,255,0.3);
    color:#f0f4ff;padding:12px 20px;border-radius:12px;font-size:0.875rem;
    backdrop-filter:blur(20px);box-shadow:0 8px 30px rgba(0,0,0,0.4);
    animation:slideUp 0.3s ease;`;
  el.innerHTML = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
