/* auth.js — Handles global authentication state & navbar */

document.addEventListener('DOMContentLoaded', () => {
  const userJson = localStorage.getItem('iprep_user');
  const navActions = document.querySelector('.nav-actions');

  // 1. Update Navbar if logged in
  if (userJson && navActions) {
    try {
      const user = JSON.parse(userJson);
      const name = user.name || (user.email ? user.email.split('@')[0] : 'User');
      
      navActions.innerHTML = `
        <a href="profile.html" class="btn-nav-ghost" style="display:flex; align-items:center; gap:8px;">
          <i class="ph-fill ph-user-circle" style="font-size:1.2rem; color:var(--cyan)"></i>
          ${name}
        </a>
        <button id="btnLogout" class="btn-nav-ghost" style="color: #ff4d6d; border-color: rgba(255, 77, 109, 0.3);">
          Logout
        </button>
      `;

      document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('iprep_user');
        window.location.href = 'index.html';
      });
    } catch (e) {
      console.error("Failed to parse user session", e);
    }
  }

  // 2. Protect routes
  const path = window.location.pathname;
  const isProtected = ['/practice.html', '/progress.html', '/profile.html'].some(p => path.endsWith(p));
  const isAuthPage = path.endsWith('/login.html');

  if (isProtected && !userJson) {
    // Redirect unauthenticated users trying to access protected pages
    window.location.href = 'login.html';
  } else if (isAuthPage && userJson) {
    // Redirect authenticated users away from the login page
    window.location.href = 'practice.html';
  }
});
