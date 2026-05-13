/* auth.js — Global authentication state & navbar injection */

document.addEventListener('DOMContentLoaded', () => {
  const userJson   = localStorage.getItem('iprep_user');
  const navActions = document.querySelector('.nav-actions');

  /* ── Logged-in state ── */
  if (userJson && navActions) {
    try {
      const user = JSON.parse(userJson);
      const name = user.name || (user.email ? user.email.split('@')[0] : 'User');
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

      document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('iprep_user');
        window.location.href = 'index.html';
      });

    } catch (e) {
      console.error('Failed to parse user session', e);
    }
  }

  /* ── Route protection ── */
  const path        = window.location.pathname;
  const isProtected = ['/practice.html', '/progress.html', '/profile.html']
                        .some(p => path.endsWith(p));
  const isAuthPage  = path.endsWith('/login.html');

  if (isProtected && !userJson) {
    window.location.href = 'login.html';
  } else if (isAuthPage && userJson) {
    window.location.href = 'practice.html';
  }
});
