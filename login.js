/* login.js */
const $ = id => document.getElementById(id);


// ── Brand Canvas Particles ─────────────────────────────────────────────────
const canvas = $('brandCanvas');
if(canvas){
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];
  const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
  resize(); window.addEventListener('resize', resize);
  for(let i=0;i<60;i++) pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.2+.3,a:Math.random()*.4+.1,c:Math.random()>.5?'#00d4ff':'#7b2ff7'});
  function draw(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{ p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.c;ctx.globalAlpha=p.a;ctx.fill();});
    ctx.globalAlpha=1; requestAnimationFrame(draw);
  }
  draw();
}

// ── Terminal Animation ─────────────────────────────────────────────────────
const termLines = [
  {text:'> Loading Backend Engineer questions...', hl:false},
  {text:'✓ 10 questions generated (Medium)', hl:true},
  {text:'> Q3: Explain the CAP theorem...', hl:false},
  {text:'> Evaluating answer...', hl:false},
  {text:'✓ Score: 82/100  |  Badge: Good', hl:true},
  {text:'> Feedback: Strong base, add examples', hl:false},
  {text:'> Next question queued ✨', hl:false},
];
const termOut = $('termOut');
let li = 0;
function addTermLine(){
  if(li>=termLines.length){li=0;termOut.innerHTML='';setTimeout(addTermLine,1200);return;}
  const d = termLines[li++];
  const span = document.createElement('div');
  span.className = 'term-out-line'+(d.hl?' hl':'');
  let ci = 0;
  const iv = setInterval(()=>{
    span.textContent += d.text[ci++];
    if(ci>=d.text.length){ clearInterval(iv); setTimeout(addTermLine, d.hl?700:350); }
  },22);
  termOut.appendChild(span);
  termOut.scrollTop = termOut.scrollHeight;
}
if(termOut) setTimeout(addTermLine, 600);

// ── Tab switching ──────────────────────────────────────────────────────────
function switchMode(mode) {
  const isLogin = mode === 'login';
  $('tabLogin').classList.toggle('active', isLogin);
  $('tabSignup').classList.toggle('active', !isLogin);
  $('loginForm').style.display = isLogin ? 'flex' : 'none';
  $('signupForm').style.display = isLogin ? 'none' : 'flex';
  $('authSwitch').innerHTML = isLogin
    ? `Don't have an account? <button class="switch-link" id="switchToSignup">Sign up free</button>`
    : `Already have an account? <button class="switch-link" id="switchToLogin">Login</button>`;
  bindSwitch();
}
function bindSwitch(){
  $('switchToSignup')?.addEventListener('click',()=>switchMode('signup'));
  $('switchToLogin')?.addEventListener('click',()=>switchMode('login'));
}
$('tabLogin').addEventListener('click',()=>switchMode('login'));
$('tabSignup').addEventListener('click',()=>switchMode('signup'));
bindSwitch();

// ── Password toggles ───────────────────────────────────────────────────────
function togglePw(inputId, btnId){
  const inp = $(inputId), btn = $(btnId);
  if(!inp||!btn)return;
  btn.addEventListener('click',()=>{
    inp.type = inp.type==='password' ? 'text' : 'password';
    btn.innerHTML = inp.type==='password' ? '<i class="ph ph-eye"></i>' : '<i class="ph ph-eye-slash"></i>';
  });
}
togglePw('loginPw','toggleLoginPw');
togglePw('signupPw','toggleSignupPw');

// ── Neon focus effect ──────────────────────────────────────────────────────
document.querySelectorAll('.auth-input').forEach(inp=>{
  inp.addEventListener('focus',()=>inp.style.borderColor='var(--cyan)');
  inp.addEventListener('blur',()=>{inp.style.borderColor='';inp.classList.remove('error');});
});

// ── Login Submit ───────────────────────────────────────────────────────────
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const pw    = $('loginPw').value;
  let valid = true;
  if(!email||!email.includes('@')){$('loginEmail').classList.add('error');valid=false;}
  if(pw.length < 6){$('loginPw').classList.add('error');valid=false;}
  if(!valid)return;

  $('loginSpinner').style.display='inline';
  $('loginLabel').textContent='Logging in…';
  $('btnLogin').disabled=true;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: pw,
  });

  if (error) {
    alert(error.message);
    $('loginSpinner').style.display='none';
    $('loginLabel').textContent='Login';
    $('btnLogin').disabled=false;
    return;
  }

  window.location.href = 'practice.html';
});

// ── Signup Submit ──────────────────────────────────────────────────────────
$('signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name  = $('signupName').value.trim();
  const email = $('signupEmail').value.trim();
  const pw    = $('signupPw').value;
  const pw2   = $('signupPw2').value;
  const role  = $('signupRole').value;
  let valid = true;
  if(!name){$('signupName').classList.add('error');valid=false;}
  if(!email.includes('@')){$('signupEmail').classList.add('error');valid=false;}
  if(pw.length<8){$('signupPw').classList.add('error');valid=false;}
  if(pw!==pw2){$('signupPw2').classList.add('error');valid=false;}
  if(!role){valid=false;}
  if(!valid)return;

  $('signupSpinner').style.display='inline';
  $('signupLabel').textContent='Creating account…';
  $('btnSignup').disabled=true;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: pw,
    options: {
      data: {
        name: name,
        role: role
      }
    }
  });

  if (error) {
    alert(error.message);
    $('signupSpinner').style.display='none';
    $('signupLabel').textContent='Create Account';
    $('btnSignup').disabled=false;
    return;
  }

  // Check if we need to verify email
  if (data.user && data.user.identities && data.user.identities.length === 0) {
      alert("This email is already registered. Please log in.");
      switchMode('login');
      $('signupSpinner').style.display='none';
      $('signupLabel').textContent='Create Account';
      $('btnSignup').disabled=false;
      return;
  }

  // Insert into users table
  if (data.user) {
    const { error: dbError } = await supabase.from('users').insert({
      id: data.user.id,
      username: name,
      role_focus: role
    });
    if (dbError) {
      console.error("Error creating user profile in db:", dbError);
    }
  }

  alert('Account created! If email confirmation is enabled, please check your inbox. Otherwise, you can now log in.');
  switchMode('login');
  $('signupSpinner').style.display='none';
  $('signupLabel').textContent='Create Account';
  $('btnSignup').disabled=false;
});


