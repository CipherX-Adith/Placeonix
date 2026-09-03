// Authentication Management for Placeonix (Strict Guard, Inactivity Auto-Logout & Session Lifecycle)

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity

const Auth = {
  _inactivityTimer: null,
  _lastRecordTime: 0,

  getToken() {
    return localStorage.getItem('placeonix_token');
  },

  getUser() {
    const userStr = localStorage.getItem('placeonix_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  saveSession(token, user) {
    localStorage.setItem('placeonix_token', token);
    localStorage.setItem('placeonix_user', JSON.stringify(user));
    localStorage.setItem('placeonix_last_active', Date.now().toString());
  },

  clearSession() {
    localStorage.removeItem('placeonix_token');
    localStorage.removeItem('placeonix_user');
    localStorage.removeItem('placeonix_last_active');
  },

  recordActivity() {
    const now = Date.now();
    if (now - this._lastRecordTime > 5000) {
      this._lastRecordTime = now;
      if (this.isAuthenticated()) {
        localStorage.setItem('placeonix_last_active', now.toString());
      }
    }
  },

  isInactive() {
    const lastActiveStr = localStorage.getItem('placeonix_last_active');
    if (!lastActiveStr) return false;
    const lastActive = parseInt(lastActiveStr, 10);
    if (isNaN(lastActive) || lastActive <= 0) return false;
    return (Date.now() - lastActive) > INACTIVITY_TIMEOUT_MS;
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return Boolean(token && user && token !== 'demo_token');
  },

  // Check authentication & strictly protect dashboard routes
  checkAuth(expectedRole = null) {
    const token = this.getToken();
    const user = this.getUser();

    // 1. If not logged in or has invalid demo token, redirect to login
    if (!token || !user || token === 'demo_token') {
      this.clearSession();
      sessionStorage.setItem('placeonix_notice', 'Please sign in to access your dashboard.');
      window.location.replace('login.html');
      return false;
    }

    // 2. Check for session inactivity timeout
    if (this.isInactive()) {
      this.clearSession();
      sessionStorage.setItem('placeonix_notice', 'Your session expired due to inactivity. Please sign in again.');
      window.location.replace('login.html');
      return false;
    }

    // 3. Verify user role match
    if (expectedRole && user.role !== expectedRole) {
      if (user.role === 'student') window.location.replace('student-dashboard.html');
      else if (user.role === 'recruiter') window.location.replace('recruiter-dashboard.html');
      else if (user.role === 'admin') window.location.replace('admin-dashboard.html');
      else window.location.replace('login.html');
      return false;
    }

    // 4. Update activity timestamp & activate inactivity tracking
    this.recordActivity();
    this.initInactivityTracker();

    // 5. Validate active session in background
    this.validateSession().catch(() => {});

    return true;
  },

  initInactivityTracker() {
    if (this._inactivityTimer) return;

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const onUserActivity = () => this.recordActivity();

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

    // Check every 15 seconds for inactivity expiration
    this._inactivityTimer = setInterval(() => {
      if (!this.isAuthenticated()) {
        clearInterval(this._inactivityTimer);
        this._inactivityTimer = null;
        return;
      }
      if (this.isInactive()) {
        clearInterval(this._inactivityTimer);
        this._inactivityTimer = null;
        this.logout({
          notice: 'Your session expired due to inactivity. Please sign in again.',
          redirect: 'login.html',
        });
      }
    }, 15000);
  },

  async validateSession() {
    try {
      const res = await apiFetch('/auth/me');
      if (res && res.user) {
        localStorage.setItem('placeonix_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Session verification notice:', err);
    }
  },

  async login(email, password, role = null) {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (res.success) {
        this.saveSession(res.token, res.user);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        
        // Redirect according to role
        setTimeout(() => {
          if (res.user.role === 'student') {
            window.location.href = 'student-dashboard.html';
          } else if (res.user.role === 'recruiter') {
            window.location.href = 'recruiter-dashboard.html';
          } else if (res.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 500);
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Login failed. Please verify credentials.', 'danger');
      throw err;
    }
  },

  async register(formData) {
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        this.saveSession(res.token, res.user);
        showToast(res.message || 'Account created successfully!', 'success');
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'danger');
      throw err;
    }
  },

  async verifyEmail(email, code) {
    try {
      const res = await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      if (res.success) {
        const user = this.getUser() || {};
        user.isEmailVerified = true;
        localStorage.setItem('placeonix_user', JSON.stringify(user));
        showToast('Email verified successfully!', 'success');
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Verification failed. Invalid code.', 'danger');
      throw err;
    }
  },

  async resendVerification(email) {
    try {
      const res = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        showToast(res.message || 'Verification code resent!', 'info');
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Could not resend verification code.', 'danger');
      throw err;
    }
  },

  async loginWithGoogle(payload) {
    try {
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        this.saveSession(res.token, res.user);
        showToast(res.message || `Connected with Google as ${res.user.name}`, 'success');

        setTimeout(() => {
          if (res.user.role === 'student') {
            window.location.href = 'student-dashboard.html';
          } else if (res.user.role === 'recruiter') {
            window.location.href = 'recruiter-dashboard.html';
          } else if (res.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 500);
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Google sign-in failed', 'danger');
      throw err;
    }
  },

  logout(options = {}) {
    this.clearSession();
    if (this._inactivityTimer) {
      clearInterval(this._inactivityTimer);
      this._inactivityTimer = null;
    }
    const notice = options.notice || 'You have been signed out successfully.';
    sessionStorage.setItem('placeonix_notice', notice);
    showToast(notice, 'info');
    setTimeout(() => {
      window.location.href = options.redirect || 'login.html';
    }, 300);
  },

  updateHeaderUI() {
    const user = this.getUser();
    if (!user) return;

    const userNameEls = document.querySelectorAll('.user-name-display');
    const userRoleEls = document.querySelectorAll('.user-role-display');
    const userAvatarEls = document.querySelectorAll('.user-avatar-display');

    userNameEls.forEach((el) => (el.textContent = user.name));
    userRoleEls.forEach((el) => (el.textContent = user.role.toUpperCase()));
    userAvatarEls.forEach((el) => {
      el.textContent = user.name.charAt(0).toUpperCase();
    });
  },
};

window.Auth = Auth;
