/* auth.js — Global authentication state & navbar injection */

async function handleSession(session) {
  const navActions = document.querySelector('.nav-actions');
  const path        = window.location.pathname;
  const isProtected = ['/practice.html', '/progress.html', '/profile.html'].some(p => path.endsWith(p) || p === '/practice.html' && path === '/'); // Handle root if needed
  const isAuthPage  = path.endsWith('/login.html');

  if (session) {
    if (navActions) {
      const user = session.user;
      const name = user.user_metadata?.name || user.email.split('@')[0];
      const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

      navActions.innerHTML = `
        <a href="profile.html" class="nav-user-pill" id="navUserPill" title="${name}">
          <span class="nav-user-avatar">${initials}</span>
          <span class="nav-user-name">${name.split(' ')[0]}</span>
        </a>
        <button id="btnLogout" class="btn-signout btn-icon-only" title="Sign out">
          <i class="ph ph-sign-out"></i>
        </button>
      `;

      document.getElementById('btnLogout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
      });
    }

    if (isAuthPage) {
      window.location.href = 'practice.html';
    }
  } else {
    if (isProtected) {
      window.location.href = 'login.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure supabase is loaded
  if (typeof supabase === 'undefined') return;

  const { data: { session } } = await supabase.auth.getSession();
  handleSession(session);

  supabase.auth.onAuthStateChange((_event, session) => {
    handleSession(session);
  });
});
