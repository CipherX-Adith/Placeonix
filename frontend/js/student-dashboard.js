/**
 * student-dashboard.js
 * Controls all student dashboard pages: Home, Discover, Applications, Preparation, Profile
 */

/* ── AUTH GUARD ─────────────────────────────────────────────── */
if (window.Auth && !Auth.checkAuth('student')) {
  // Redirection handled by checkAuth
}

let user = Auth ? Auth.getUser() : JSON.parse(localStorage.getItem('placeonix_user') || 'null');
let token = Auth ? Auth.getToken() : localStorage.getItem('placeonix_token');

/* ── STATE ──────────────────────────────────────────────────── */
let allJobs = [];
let myApplications = [];
let activePage = 'home';
let selectedJobForModal = null;
let matchBreakdownByJob = {};

/* ── HELPERS ────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const fmt = (n) => (n === undefined || n === null ? '—' : n);

function getHour() { return new Date().getHours(); }
function greeting() {
  const h = getHour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function companyColor(name = '') {
  const colors = ['#1A56DB','#057A55','#7c3aed','#c2410c','#0891b2','#b45309'];
  let idx = 0;
  for (const c of name) idx = (idx + c.charCodeAt(0)) % colors.length;
  return colors[idx];
}

function matchPillClass(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function statusLabel(s) {
  const map = {
    applied: 'Applied',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    selected: 'Selected 🎉',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn',
  };
  return map[s] || s;
}

function statusClass(s) {
  const map = {
    applied: 'applied',
    under_review: 'under-review',
    shortlisted: 'shortlisted',
    interview: 'interview',
    selected: 'selected',
    rejected: 'rejected',
    withdrawn: 'withdrawn',
  };
  return map[s] || 'applied';
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function toast(msg, type = 'success') {
  const container = $('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon"></span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ── NAVIGATION ─────────────────────────────────────────────── */
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach((el) => el.classList.remove('active'));

  const pages = ['home', 'discover', 'applications', 'preparation', 'profile'];
  pages.forEach((p) => {
    const el = $(`page-${p}`);
    if (el) el.style.display = p === page ? '' : 'none';
  });

  const navEl = $(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  document.querySelectorAll(`.bottom-nav-item[data-page="${page}"]`).forEach((el) =>
    el.classList.add('active')
  );

  activePage = page;

  if (page === 'home') loadHomeDashboard();
  if (page === 'discover') loadDiscover();
  if (page === 'applications') loadApplications();
  if (page === 'preparation') loadPreparation();
  if (page === 'profile') loadProfile();

  window.scrollTo(0, 0);
}

/* ── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (window.Auth && !Auth.checkAuth('student')) return;
  user = Auth.getUser();
  token = Auth.getToken();

  setupNav();
  loadHomeDashboard();
  initNotifications();
  setupSearch();
  setupMatchExplainer();
});

/* ── SIDEBAR + BOTTOM NAV ───────────────────────────────────── */
function setupNav() {
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });

  $('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.Auth) {
      Auth.logout();
    } else {
      localStorage.clear();
      window.location.href = 'login.html';
    }
  });

  $('profile-card-logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.Auth) {
      Auth.logout();
    } else {
      localStorage.clear();
      window.location.href = 'login.html';
    }
  });
}

/* ── HOME DASHBOARD ─────────────────────────────────────────── */
async function loadHomeDashboard() {
  const currentUser = (window.Auth && Auth.getUser()) || user || {};
  // Greeting
  const name = currentUser.name ? currentUser.name.split(' ')[0] : 'there';
  if ($('greeting-text')) $('greeting-text').textContent = `${greeting()}, ${name}! 👋`;
  if ($('greeting-sub')) $('greeting-sub').textContent = `Here's your placement snapshot for ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.`;

  // Sidebar user
  if ($('sidebar-avatar')) $('sidebar-avatar').textContent = (currentUser.name || 'S')[0].toUpperCase();
  if ($('sidebar-name')) $('sidebar-name').textContent = currentUser.name || 'Student';

  const [dashResult, jobsResult, drivesResult, appsResult] = await Promise.allSettled([
    API.get('/student/dashboard-summary'),
    API.get('/student/jobs'),
    API.get('/drives'),
    API.get('/student/applications'),
  ]);

  if (dashResult.status === 'fulfilled' && dashResult.value.success) {
    const dashRes = dashResult.value;
    renderSnapshot(dashRes.metrics || {});
    const pct = computeProfileStrength(dashRes.profile, dashRes.metrics);
    if ($('sidebar-profile-pct')) $('sidebar-profile-pct').textContent = `${pct}%`;
    if ($('sidebar-profile-fill')) $('sidebar-profile-fill').style.width = `${pct}%`;
  }

  if (jobsResult.status === 'fulfilled' && jobsResult.value.success) {
    allJobs = jobsResult.value.jobs || [];
    renderPlacementOffers(allJobs);
    renderTopMatches(allJobs.slice(0, 6));
    if ($('match-explain-section')) $('match-explain-section').style.display = '';
  } else {
    renderPlacementOffers([]);
    renderTopMatches([]);
  }

  if (appsResult.status === 'fulfilled' && appsResult.value.success) {
    myApplications = appsResult.value.applications || [];
    renderAttentionList(myApplications);
    renderJourneyMini(myApplications);
  } else {
    renderAttentionList([]);
  }

  if (drivesResult.status === 'fulfilled' && drivesResult.value.success) {
    renderDrives(drivesResult.value.drives || []);
  }
}

function computeProfileStrength(profile, metrics) {
  if (!profile) return 0;
  let score = 0;
  if (profile.rollNo)    score += 15;
  if (profile.phone)     score += 15;
  if (profile.branch)    score += 10;
  if (profile.cgpa)      score += 20;
  if (profile.skills && profile.skills.length > 0) score += 20;
  if (metrics && metrics.hasResume) score += 20;
  return score;
}

/* ── SNAPSHOT ───────────────────────────────────────────────── */
function renderSnapshot(m) {
  $('snap-jobs').textContent = fmt(m.totalJobs);
  $('snap-applied').textContent = fmt(m.totalApplied);
  $('snap-interviews').textContent = fmt(m.interviewsCount);
  $('snap-offers').textContent = fmt(m.offersCount);

  if (m.shortlistedCount > 0)
    $('snap-applied-sub').textContent = `${m.shortlistedCount} shortlisted →`;
  if (m.interviewsCount > 0)
    $('snap-interviews-sub').textContent = `${m.interviewsCount} upcoming`;
  if (m.offersCount > 0)
    $('snap-offers-sub').textContent = `${m.offersCount} offers received →`;
}

/* ── PLACEMENT ALERT RAIL ───────────────────────────────────── */
function renderPlacementOffers(jobs) {
  const track = $('placement-alert-track');
  const spotlight = $('offer-spotlight');
  const activeJobs = (jobs || []).filter((job) => !job.isPastDeadline);
  const eligibleJobs = activeJobs.filter((job) => job.isEligible && !job.hasApplied);
  const offers = eligibleJobs.length ? eligibleJobs : activeJobs;

  if (!offers.length) {
    if (track) track.innerHTML = '<span class="placement-alert-empty">No open placement offers right now — we’ll keep this rail updated.</span>';
    if (spotlight) {
      $('offer-spotlight-company').textContent = 'Placement desk';
      $('offer-spotlight-title').textContent = 'New opportunities will appear here';
      $('offer-spotlight-meta').textContent = 'Keep your profile and resume updated so you are ready when the next drive opens.';
      $('offer-spotlight-actions').innerHTML = '<button class="offer-secondary-btn" type="button" data-page="profile">Complete profile</button>';
      $('offer-spotlight-actions').querySelector('[data-page]')?.addEventListener('click', () => navigateTo('profile'));
    }
    return;
  }

  const tickerItems = offers.slice(0, 6).map((job) => {
    const company = job.company?.name || 'Campus recruiter';
    const deadline = daysUntil(job.deadline);
    const urgency = deadline <= 2 ? `Closes ${deadline === 0 ? 'today' : `in ${deadline}d`}` : `Apply by ${formatDate(job.deadline)}`;
    return `<button class="placement-alert-item" type="button" data-job-id="${job._id}">
      <span class="placement-alert-type">OPEN</span>
      <span><strong>${company}</strong> is hiring for ${job.title}</span>
      <span class="placement-alert-divider">///</span>
      <span class="placement-alert-deadline">${urgency}</span>
    </button>`;
  }).join('');

  // Duplicate the short stream so its CSS animation loops without a visible jump.
  if (track) {
    track.innerHTML = tickerItems + tickerItems;
    track.querySelectorAll('.placement-alert-item').forEach((item) => {
      item.addEventListener('click', () => openJobModal(item.dataset.jobId));
    });
  }

  const featured = offers[0];
  const featuredCompany = featured.company?.name || 'Campus recruiter';
  $('offer-spotlight-company').textContent = featuredCompany.toUpperCase();
  $('offer-spotlight-title').textContent = featured.title;
  $('offer-spotlight-meta').textContent = `${featured.location || 'Campus placement'} · ${featured.jobType || 'Full-time'} · ${featured.packageCtc ? `₹${featured.packageCtc} LPA` : 'Package details available'} · ${featured.matchScore ?? 0}% match`;
  $('offer-spotlight-actions').innerHTML = `
    <button class="offer-primary-btn" type="button" data-featured-apply="${featured._id}" ${!featured.isEligible || featured.hasApplied ? 'disabled' : ''}>${featured.hasApplied ? 'Applied ✓' : featured.isEligible ? 'Apply now' : 'View eligibility'}</button>
    <button class="offer-secondary-btn" type="button" data-featured-view="${featured._id}">View offer</button>`;
  $('offer-spotlight-actions').querySelector('[data-featured-apply]')?.addEventListener('click', () => {
    if (featured.isEligible && !featured.hasApplied) handleApply(featured._id);
    else openJobModal(featured._id);
  });
  $('offer-spotlight-actions').querySelector('[data-featured-view]')?.addEventListener('click', () => openJobModal(featured._id));
}

/* ── TOP JOB MATCHES ────────────────────────────────────────── */
function renderTopMatches(jobs) {
  const container = $('top-matches-list');
  if (!jobs || jobs.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No active jobs found. Check back soon.</p></div>';
    return;
  }

  container.innerHTML = jobs.map((job) => buildJobCard(job, true)).join('');
  container.querySelectorAll('.job-card').forEach((card) => {
    const jobId = card.dataset.jobId;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.apply-btn') || e.target.closest('.bookmark-btn')) return;
      openJobModal(jobId);
    });
    card.querySelector('.apply-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleApply(jobId, card);
    });
  });

  // Store breakdowns for explainer panel
  jobs.forEach((job) => {
    if (job.matchBreakdown) matchBreakdownByJob[job._id] = { breakdown: job.matchBreakdown, totalScore: job.matchScore, job };
  });
}

function buildJobCard(job, compact = false) {
  const company = job.company || {};
  const color = companyColor(company.name || job.title);
  const logoLetter = (company.name || 'C')[0].toUpperCase();
  const scoreClass = matchPillClass(job.matchScore || 0);
  const isEligible = job.isEligible;
  const deadlineDays = daysUntil(job.deadline);
  const applied = job.hasApplied;

  return `
    <div class="job-card" data-job-id="${job._id}">
      <div class="job-card-header">
        <div style="display:flex;align-items:flex-start;gap:var(--space-3);flex:1;min-width:0;">
          <div class="company-logo" style="background:${color};">${logoLetter}</div>
          <div style="min-width:0;">
            <div class="job-title">${job.title}</div>
            <div class="job-company">${company.name || '—'}</div>
          </div>
        </div>
        <button class="bookmark-btn" title="Save job">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg>
        </button>
      </div>
      <div class="job-meta-row">
        <span class="job-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>
          ${company.location || job.location || 'On-site'}
        </span>
        <span class="job-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"/></svg>
          ${job.jobType || 'Full-time'}
        </span>
        ${deadlineDays > 0 ? `<span class="job-meta-item" style="color:${deadlineDays <= 3 ? 'var(--danger)' : 'var(--gray-500)'};">⏰ ${deadlineDays}d left</span>` : '<span class="job-meta-item" style="color:var(--danger);">Deadline passed</span>'}
      </div>
      <div class="job-salary">₹${job.packageCtc || '—'} LPA</div>
      <div class="job-match-row">
        <span class="match-pill ${scoreClass}">⚡ ${job.matchScore ?? '—'}% match</span>
        ${isEligible
          ? `<span class="eligible-pill yes"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg> Eligible</span>`
          : `<span class="eligible-pill no" title="${(job.eligibilityReasons || []).join('; ')}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg> Not Eligible</span>`
        }
      </div>
      ${(job.skillsRequired || []).length > 0 ? `
      <div class="job-skills">
        ${job.skillsRequired.slice(0, 5).map((s) => `<span class="skill-chip">${s}</span>`).join('')}
        ${job.skillsRequired.length > 5 ? `<span class="skill-chip">+${job.skillsRequired.length - 5}</span>` : ''}
      </div>` : ''}
      <div class="job-card-footer">
        <span class="view-role-btn" data-job-id="${job._id}">
          View role
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
        </span>
        <button class="apply-btn${applied ? ' applied' : ''}" ${!isEligible || applied || deadlineDays <= 0 ? 'disabled' : ''}>
          ${applied ? 'Applied ✓' : !isEligible ? 'Not Eligible' : 'Quick Apply'}
        </button>
      </div>
    </div>`;
}

/* ── ATTENTION LIST ─────────────────────────────────────────── */
function renderAttentionList(apps) {
  const container = $('attention-list');
  // Items that need action: interview upcoming, shortlisted (next step pending)
  const attention = apps.filter((a) =>
    ['shortlisted', 'interview'].includes(a.status)
  );

  if (attention.length === 0) {
    container.innerHTML = `<div style="color:var(--gray-400);font-size:var(--text-sm);padding:var(--space-4);text-align:center;">No actions required right now. Keep applying!</div>`;
    return;
  }

  container.innerHTML = attention.map((app) => {
    const job = app.job || {};
    const company = job.company || {};
    const color = companyColor(company.name || job.title || '');
    const isInterview = app.status === 'interview';
    const actionText = isInterview
      ? `📅 Interview${app.interviewDate ? ' on ' + formatDate(app.interviewDate) : ''}`
      : '🎉 Shortlisted — check for next steps';

    return `
      <div class="attention-card" onclick="navigateTo('applications')">
        <div class="attention-company-logo" style="background:${color};">${(company.name || 'C')[0].toUpperCase()}</div>
        <div class="attention-body">
          <div class="attention-role">${job.title || '—'}</div>
          <div class="attention-company">${company.name || '—'}</div>
          <div class="attention-action" style="color:${isInterview ? 'var(--warning)' : 'var(--success)'};">${actionText}</div>
        </div>
        <span class="status-badge ${statusClass(app.status)}">${statusLabel(app.status)}</span>
        <span class="cta-link">
          View
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:12px;height:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
        </span>
      </div>`;
  }).join('');
}

/* ── DRIVES ─────────────────────────────────────────────────── */
function renderDrives(drives) {
  const container = $('drives-list');
  if (!drives || drives.length === 0) {
    container.innerHTML = `<div style="color:var(--gray-400);font-size:var(--text-sm);padding:var(--space-4);text-align:center;">No drives scheduled yet.</div>`;
    return;
  }

  container.innerHTML = drives.slice(0, 4).map((drive) => {
    const d = new Date(drive.startDate);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
    const daysLeft = daysUntil(drive.startDate);
    const urgency = daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'soon' : 'normal';
    const countdownText = daysLeft <= 0 ? 'Today!' : `in ${daysLeft}d`;

    return `
      <div class="drive-row">
        <div class="drive-date-badge">
          <div class="drive-date-day">${day}</div>
          <div class="drive-date-month">${month}</div>
        </div>
        <div class="drive-info">
          <div class="drive-name">${drive.title}</div>
          <div class="drive-location">${drive.location || drive.venue || 'College Campus'}</div>
        </div>
        <span class="drive-countdown ${urgency}">${countdownText}</span>
      </div>`;
  }).join('');
}

/* ── JOURNEY MINI ───────────────────────────────────────────── */
function renderJourneyMini(apps) {
  const counts = { applied: 0, under_review: 0, shortlisted: 0, interview: 0, selected: 0 };
  apps.forEach((a) => {
    if (counts[a.status] !== undefined) counts[a.status]++;
  });

  $('jc-applied').textContent = counts.applied;
  $('jc-review').textContent = counts.under_review;
  $('jc-shortlisted').textContent = counts.shortlisted;
  $('jc-interview').textContent = counts.interview;
  $('jc-selected').textContent = counts.selected;

  // Highlight the furthest stage reached
  const steps = ['applied', 'under_review', 'shortlisted', 'interview', 'selected'];
  const ids = ['jc-applied', 'jc-review', 'jc-shortlisted', 'jc-interview', 'jc-selected'];
  const circles = document.querySelectorAll('#journey-steps .journey-circle');
  const labels = document.querySelectorAll('#journey-steps .journey-step');

  let furthest = -1;
  steps.forEach((s, i) => { if (counts[s] > 0) furthest = i; });

  labels.forEach((step, i) => {
    step.classList.remove('done', 'active');
    if (i < furthest) step.classList.add('done');
    else if (i === furthest) step.classList.add('active');
  });

  circles.forEach((c, i) => {
    if (i <= furthest) {
      c.textContent = i < furthest ? '✓' : (counts[steps[i]] || '•');
    } else {
      c.textContent = '○';
    }
  });
}

/* ── MATCH EXPLAINER ────────────────────────────────────────── */
function setupMatchExplainer() {
  $('match-explain-toggle').addEventListener('click', () => {
    const body = $('match-explain-body');
    const chevron = $('explain-chevron');
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    chevron.style.transform = open ? '' : 'rotate(180deg)';
  });
}

function showMatchBreakdown(jobData) {
  const { breakdown, totalScore, job } = jobData;
  if (!breakdown) return;

  const bd = $('match-breakdown-content');
  const company = job.company || {};

  bd.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);padding:var(--space-3) 0;border-bottom:1px solid var(--gray-100);">
      <div class="company-logo" style="background:${companyColor(company.name || '')};width:32px;height:32px;font-size:var(--text-sm);">${(company.name || 'C')[0]}</div>
      <div>
        <div style="font-size:var(--text-sm);font-weight:700;">${job.title}</div>
        <div style="font-size:var(--text-xs);color:var(--gray-500);">${company.name || ''}</div>
      </div>
      <div style="margin-left:auto;">
        <span class="match-pill ${matchPillClass(totalScore)}">⚡ ${totalScore}% match</span>
      </div>
    </div>
    ${Object.entries(breakdown).map(([key, comp]) => {
      const labels = {
        skills: 'Skills Match',
        eligibility: 'Eligibility',
        academics: 'Academics',
        preferences: 'Preferences',
        experience: 'Experience',
      };
      const pct = Math.round((comp.score / comp.max) * 100);
      const extra = key === 'skills' && comp.matched.length > 0
        ? `<div style="font-size:var(--text-xs);color:var(--gray-500);margin-top:3px;">✓ ${comp.matched.join(', ')}${comp.missing.length ? ` &nbsp;✗ ${comp.missing.join(', ')}` : ''}</div>`
        : key === 'eligibility' && !comp.passed
        ? `<div style="font-size:var(--text-xs);color:var(--danger);margin-top:3px;">${comp.reasons.join(' • ')}</div>`
        : '';
      return `
        <div class="match-component">
          <div class="match-comp-label">${labels[key] || key}</div>
          <div class="match-comp-bar"><div class="match-comp-fill" style="width:${pct}%;background:${comp.passed === false ? 'var(--danger)' : 'var(--primary)'}"></div></div>
          <div class="match-comp-score">${comp.score}/${comp.max}</div>
          <div class="match-comp-weight">${comp.weight}</div>
        </div>${extra}`;
    }).join('')}`;

  // Open panel if closed
  const body = $('match-explain-body');
  if (body.style.display === 'none') {
    body.style.display = '';
    $('explain-chevron').style.transform = 'rotate(180deg)';
  }
  body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── DISCOVER PAGE ──────────────────────────────────────────── */
async function loadDiscover() {
  if (allJobs.length === 0) {
    try {
      const res = await API.get('/student/jobs');
      if (res.success) allJobs = res.jobs;
    } catch (e) { /* ignore */ }
  }
  renderDiscoverJobs(allJobs);
  setupDiscoverFilters();
  setupDiscoverTabs();
}

function setupDiscoverTabs() {
  document.querySelectorAll('.discover-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.discover-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      filterAndRenderJobs();
    });
  });
}

function setupDiscoverFilters() {
  const cgpaSlider = $('filter-cgpa');
  if (cgpaSlider) {
    cgpaSlider.addEventListener('input', () => {
      $('filter-cgpa-val').textContent = parseFloat(cgpaSlider.value).toFixed(1);
    });
  }
  $('apply-filters')?.addEventListener('click', filterAndRenderJobs);
  $('clear-filters')?.addEventListener('click', () => {
    document.querySelectorAll('.filter-type,.filter-branch,.filter-year').forEach((el) => (el.checked = false));
    if (cgpaSlider) cgpaSlider.value = 0;
    $('filter-cgpa-val').textContent = '0.0';
    $('filter-location').value = '';
    filterAndRenderJobs();
  });
  $('discover-sort')?.addEventListener('change', filterAndRenderJobs);
}

function filterAndRenderJobs() {
  const activeTab = document.querySelector('.discover-tab.active')?.dataset.tab || 'recommended';
  const types = [...document.querySelectorAll('.filter-type:checked')].map((el) => el.value);
  const branches = [...document.querySelectorAll('.filter-branch:checked')].map((el) => el.value);
  const years = [...document.querySelectorAll('.filter-year:checked')].map((el) => Number(el.value));
  const minCgpa = parseFloat($('filter-cgpa')?.value || '0');
  const location = ($('filter-location')?.value || '').toLowerCase().trim();
  const sort = $('discover-sort')?.value || 'match';

  let filtered = [...allJobs];

  // Tab filter
  if (activeTab === 'eligible') filtered = filtered.filter((j) => j.isEligible);
  if (activeTab === 'closing') {
    filtered = filtered.filter((j) => {
      const d = daysUntil(j.deadline);
      return d > 0 && d <= 7;
    });
    filtered.sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline));
  }

  // Filter panel
  if (types.length) filtered = filtered.filter((j) => types.includes(j.jobType));
  if (branches.length) filtered = filtered.filter((j) =>
    j.eligibleBranches && j.eligibleBranches.some((b) => branches.includes(b))
  );
  if (years.length) filtered = filtered.filter((j) =>
    j.eligiblePassingYears && j.eligiblePassingYears.some((y) => years.includes(y))
  );
  if (minCgpa > 0) filtered = filtered.filter((j) => (j.minCgpa || 0) <= minCgpa);
  if (location) filtered = filtered.filter((j) =>
    (j.location || '').toLowerCase().includes(location) ||
    ((j.company?.location) || '').toLowerCase().includes(location)
  );

  // Sort
  if (sort === 'match' || activeTab === 'recommended') {
    filtered.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      return b.matchScore - a.matchScore;
    });
  } else if (sort === 'date') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'salary') {
    filtered.sort((a, b) => (parseFloat(b.packageCtc) || 0) - (parseFloat(a.packageCtc) || 0));
  } else if (sort === 'deadline') {
    filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  renderDiscoverJobs(filtered);
}

function renderDiscoverJobs(jobs) {
  const container = $('discover-list');
  $('discover-count').textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`;

  if (!jobs.length) {
    container.innerHTML = `<div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
      <h3>No jobs found</h3><p>Try adjusting your filters or check back soon.</p>
    </div>`;
    return;
  }

  // In discover, show horizontal cards (full-width)
  container.innerHTML = jobs.map((job) => {
    const company = job.company || {};
    const color = companyColor(company.name || job.title);
    const scoreClass = matchPillClass(job.matchScore || 0);
    const deadlineDays = daysUntil(job.deadline);
    const applied = job.hasApplied;

    return `
      <div class="card p-5" style="cursor:pointer;transition:border-color .15s,box-shadow .15s;" data-job-id="${job._id}" onmouseenter="this.style.borderColor='var(--primary)'" onmouseleave="this.style.borderColor='var(--gray-200)'">
        <div style="display:flex;align-items:flex-start;gap:var(--space-4);">
          <div class="company-logo" style="background:${color};">${(company.name || 'C')[0].toUpperCase()}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);">
              <div>
                <div style="font-size:var(--text-base);font-weight:700;">${job.title}</div>
                <div style="font-size:var(--text-sm);color:var(--gray-600);">${company.name || '—'} · ${company.location || job.location || 'On-site'} · ${job.jobType || 'Full-time'}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:var(--text-base);font-weight:700;">₹${job.packageCtc || '—'} LPA</div>
                <div style="font-size:var(--text-xs);color:${deadlineDays <= 3 ? 'var(--danger)' : 'var(--gray-400)'};">${deadlineDays > 0 ? `Closes in ${deadlineDays}d` : 'Deadline passed'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-top:var(--space-3);">
              <span class="match-pill ${scoreClass}">⚡ ${job.matchScore ?? '—'}% match</span>
              ${job.isEligible
                ? `<span class="eligible-pill yes">✓ Eligible</span>`
                : `<span class="eligible-pill no" title="${(job.eligibilityReasons || []).join('; ')}">✗ Not Eligible</span>`
              }
              ${(job.skillsRequired || []).slice(0, 4).map((s) => `<span class="skill-chip">${s}</span>`).join('')}
              ${(job.skillsRequired || []).length > 4 ? `<span class="skill-chip">+${job.skillsRequired.length - 4}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-2);flex-shrink:0;">
            <button class="btn btn-primary btn-sm discover-apply-btn" data-job-id="${job._id}" ${!job.isEligible || applied || deadlineDays <= 0 ? 'disabled' : ''}>
              ${applied ? 'Applied ✓' : !job.isEligible ? 'Not Eligible' : 'Apply →'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openJobModal('${job._id}')">Details</button>
          </div>
        </div>
      </div>`;
  }).join('');

  // Attach apply handlers
  container.querySelectorAll('.discover-apply-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleApply(btn.dataset.jobId, btn);
    });
  });
  container.querySelectorAll('[data-job-id]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openJobModal(card.dataset.jobId);
    });
  });
}

/* ── JOB MODAL ──────────────────────────────────────────────── */
function openJobModal(jobId) {
  const job = allJobs.find((j) => j._id === jobId);
  if (!job) return;

  selectedJobForModal = job;
  const company = job.company || {};
  const color = companyColor(company.name || '');
  const deadlineDays = daysUntil(job.deadline);
  const applied = job.hasApplied;

  $('modal-job-title').textContent = job.title;

  $('job-detail-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);">
      <div class="company-logo" style="background:${color};width:48px;height:48px;font-size:var(--text-lg);">${(company.name || 'C')[0]}</div>
      <div>
        <div style="font-size:var(--text-lg);font-weight:700;">${company.name || '—'}</div>
        <div style="font-size:var(--text-sm);color:var(--gray-500);">${company.location || '—'} · ${company.industry || '—'}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4);">
      ${[['Package', `₹${job.packageCtc} LPA`], ['Location', job.location || company.location || '—'], ['Job Type', job.jobType], ['Deadline', formatDate(job.deadline)]].map(([l,v]) =>
        `<div style="background:var(--gray-50);border-radius:var(--radius-md);padding:var(--space-3);">
          <div style="font-size:var(--text-xs);color:var(--gray-500);font-weight:500;">${l}</div>
          <div style="font-size:var(--text-sm);font-weight:700;margin-top:2px;">${v}</div>
        </div>`).join('')}
    </div>

    <div style="margin-bottom:var(--space-4);">
      <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-2);">Eligibility Criteria</div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);font-size:var(--text-sm);">
        <span class="skill-chip" style="background:var(--blue-50);color:var(--primary);">CGPA ≥ ${job.minCgpa || 'Any'}</span>
        <span class="skill-chip" style="background:var(--blue-50);color:var(--primary);">Max Backlogs: ${job.maxBacklogs ?? 0}</span>
        ${(job.eligibleBranches || []).map((b) => `<span class="skill-chip">${b}</span>`).join('')}
      </div>
    </div>

    ${job.matchBreakdown ? `
    <div style="background:var(--gray-50);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-4);">
      <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-3);">Your Match Score</div>
      ${Object.entries(job.matchBreakdown).map(([k, c]) => {
        const labels = { skills: 'Skills', eligibility: 'Eligibility', academics: 'Academics', preferences: 'Preferences', experience: 'Experience' };
        const pct = Math.round((c.score / c.max) * 100);
        return `<div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:8px;">
          <span style="width:90px;font-size:var(--text-xs);color:var(--gray-600);">${labels[k] || k}</span>
          <div style="flex:1;height:5px;background:var(--gray-200);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${c.passed === false ? 'var(--danger)' : 'var(--primary)'};border-radius:4px;"></div></div>
          <span style="font-size:var(--text-xs);font-weight:700;width:40px;text-align:right;">${c.score}/${c.max}</span>
        </div>`;
      }).join('')}
      <div style="font-size:var(--text-sm);font-weight:800;color:var(--primary);margin-top:var(--space-2);">Total: ${job.matchScore}% match · ${job.isEligible ? '✓ Eligible' : '✗ Not Eligible'}</div>
    </div>` : ''}

    ${job.description ? `<div style="margin-bottom:var(--space-4);">
      <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-2);">About the Role</div>
      <div style="font-size:var(--text-sm);color:var(--gray-600);line-height:1.6;">${job.description}</div>
    </div>` : ''}

    ${(job.skillsRequired || []).length ? `<div>
      <div style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-2);">Required Skills</div>
      <div class="job-skills">${job.skillsRequired.map((s) => `<span class="skill-chip">${s}</span>`).join('')}</div>
    </div>` : ''}`;

  const applyBtn = $('modal-apply-btn');
  applyBtn.textContent = applied ? 'Already Applied ✓' : !job.isEligible ? 'Not Eligible' : deadlineDays <= 0 ? 'Deadline Passed' : 'Apply Now';
  applyBtn.disabled = applied || !job.isEligible || deadlineDays <= 0;
  if (applied) applyBtn.className = 'btn btn-success';
  else applyBtn.className = 'btn btn-primary';

  $('job-detail-modal').classList.add('open');

  // Show breakdown on home page too
  if (job.matchBreakdown) {
    matchBreakdownByJob[job._id] = { breakdown: job.matchBreakdown, totalScore: job.matchScore, job };
    showMatchBreakdown(matchBreakdownByJob[job._id]);
  }
}

$('modal-close-btn').addEventListener('click', () => $('job-detail-modal').classList.remove('open'));
$('modal-close-btn2').addEventListener('click', () => $('job-detail-modal').classList.remove('open'));
$('job-detail-modal').addEventListener('click', (e) => {
  if (e.target === $('job-detail-modal')) $('job-detail-modal').classList.remove('open');
});

$('modal-apply-btn').addEventListener('click', () => {
  if (selectedJobForModal) handleApply(selectedJobForModal._id, $('modal-apply-btn'));
});

/* ── APPLY ──────────────────────────────────────────────────── */
async function handleApply(jobId, btn) {
  if (!jobId || !btn) return;
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Applying…';

  try {
    const res = await API.post(`/student/jobs/${jobId}/apply`);
    if (res.success) {
      toast('Application submitted! 🎉', 'success');
      btn.textContent = 'Applied ✓';
      btn.classList.add('applied');
      // Update local state
      const job = allJobs.find((j) => j._id === jobId);
      if (job) { job.hasApplied = true; job.applicationInfo = res.application; }
    } else {
      toast(res.message || 'Could not apply', 'danger');
      btn.disabled = false;
      btn.textContent = origText;
    }
  } catch (err) {
    toast(err.message || 'Error applying. Ensure profile and resume are complete.', 'danger');
    btn.disabled = false;
    btn.textContent = origText;
  }
}

/* ── APPLICATIONS PAGE ──────────────────────────────────────── */
async function loadApplications() {
  const container = $('applications-list');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  try {
    const res = await API.get('/student/applications');
    if (!res.success) throw new Error(res.message);
    myApplications = res.applications;

    renderAppJourneySummary(myApplications);

    // Filter by status
    const statusFilter = $('app-filter-status');
    statusFilter.addEventListener('change', () => renderApplicationsList(myApplications, statusFilter.value));
    renderApplicationsList(myApplications, '');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Could not load applications. ${err.message}</p></div>`;
  }
}

function renderAppJourneySummary(apps) {
  const counts = { applied: 0, under_review: 0, shortlisted: 0, interview: 0, selected: 0 };
  apps.forEach((a) => { if (counts[a.status] !== undefined) counts[a.status]++; });

  $('aj-applied').textContent  = counts.applied;
  $('aj-review').textContent   = counts.under_review;
  $('aj-short').textContent    = counts.shortlisted;
  $('aj-intv').textContent     = counts.interview;
  $('aj-sel').textContent      = counts.selected;

  const steps = ['applied', 'under_review', 'shortlisted', 'interview', 'selected'];
  const circles = ['aj-applied-circle','aj-review-circle','aj-short-circle','aj-intv-circle','aj-sel-circle'];
  let furthest = -1;
  steps.forEach((s, i) => { if (counts[s] > 0) furthest = i; });

  const stepEls = document.querySelectorAll('#app-journey-steps .journey-step');
  stepEls.forEach((el, i) => {
    el.classList.remove('done', 'active');
    if (i < furthest) el.classList.add('done');
    else if (i === furthest && counts[steps[i]] > 0) el.classList.add('active');
  });
  circles.forEach((id, i) => {
    const el = $(id);
    if (el) {
      if (i < furthest) el.textContent = '✓';
      else if (counts[steps[i]] > 0) el.textContent = counts[steps[i]];
      else el.textContent = '○';
    }
  });
}

function renderApplicationsList(apps, filterStatus) {
  const container = $('applications-list');
  let filtered = filterStatus ? apps.filter((a) => a.status === filterStatus) : apps;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
      <h3>${filterStatus ? 'No applications at this stage' : 'No applications yet'}</h3>
      <p>${filterStatus ? 'Try a different filter' : 'Browse jobs and apply to get started!'}</p>
    </div>`;
    return;
  }

  container.innerHTML = filtered.map((app) => {
    const job = app.job || {};
    const company = job.company || {};
    const color = companyColor(company.name || '');

    const stages = [
      { key: 'applied',      label: 'Applied',      date: app.appliedAt },
      { key: 'under_review', label: 'Under Review',  date: app.reviewedAt },
      { key: 'shortlisted',  label: 'Shortlisted',   date: app.shortlistedAt },
      { key: 'interview',    label: 'Interview',      date: app.interviewDate },
      { key: 'selected',     label: 'Offer',          date: app.resolvedAt },
    ];

    const currentIdx = stages.findIndex((s) => s.key === app.status);
    const isRejected = app.status === 'rejected';
    const isWithdrawn = app.status === 'withdrawn';

    const rawCtc = job.packageCtc || '—';
    let displayCtc = rawCtc;
    if (!rawCtc.toString().toLowerCase().includes('lpa') && !rawCtc.toString().includes('₹') && !rawCtc.toString().toLowerCase().includes('/mo')) {
      displayCtc = `₹${rawCtc} LPA`;
    } else if (!rawCtc.toString().startsWith('₹')) {
      displayCtc = `₹${rawCtc}`;
    }

    return `
      <div class="card p-5" style="margin-bottom:var(--space-4);">
        <!-- Header -->
        <div style="display:flex;align-items:flex-start;gap:var(--space-3);margin-bottom:var(--space-4);">
          <div class="company-logo" style="background:${color};">${(company.name || 'C')[0].toUpperCase()}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:var(--text-base);font-weight:700;">${job.title || '—'}</div>
            <div style="font-size:var(--text-sm);color:var(--gray-500);">${company.name || '—'} · ${company.location || job.location || '—'}</div>
            <div style="font-size:var(--text-sm);font-weight:600;margin-top:2px;">${displayCtc}</div>
          </div>
          <span class="status-badge ${statusClass(app.status)}">${statusLabel(app.status)}</span>
        </div>

        <!-- Timeline -->
        ${!isRejected && !isWithdrawn ? `
        <div class="app-timeline-tracker">
          ${stages.map((stage, i) => {
            const isDone   = i < currentIdx;
            const isActive = i === currentIdx;
            const hasDate  = stage.date;
            const stepClass = isDone ? 'done' : isActive ? 'active' : '';
            return `
              <div class="app-timeline-step ${stepClass}">
                <div class="app-timeline-circle">${isDone ? '✓' : isActive ? '●' : '○'}</div>
                <div class="app-timeline-label">${stage.label}</div>
                ${hasDate ? `<div class="app-timeline-date">${formatDate(hasDate)}</div>` : ''}
              </div>`;
          }).join('')}
        </div>` : `
        <div style="padding:var(--space-3);background:${isRejected ? 'var(--danger-bg)' : 'var(--gray-100)'};border-radius:var(--radius-md);margin-bottom:var(--space-4);">
          <div style="font-size:var(--text-sm);font-weight:600;color:${isRejected ? 'var(--danger)' : 'var(--gray-500)'};">
            ${isRejected ? '✗ Application closed – not selected' : '✓ Application withdrawn by you'}
          </div>
          ${app.feedback ? `<div style="font-size:var(--text-sm);color:var(--gray-600);margin-top:4px;">${app.feedback}</div>` : ''}
        </div>`}

        <!-- Interview details -->
        ${app.status === 'interview' && app.interviewDate ? `
        <div style="background:var(--warning-bg);border:1px solid var(--warning-border);border-radius:var(--radius-md);padding:var(--space-3);margin-bottom:var(--space-4);">
          <div style="font-size:var(--text-sm);font-weight:700;color:var(--warning);">📅 Interview Scheduled</div>
          <div style="font-size:var(--text-sm);color:var(--gray-700);margin-top:4px;">
            <strong>Date:</strong> ${formatDate(app.interviewDate)} &nbsp;
            ${app.interviewMode ? `<strong>Mode:</strong> ${app.interviewMode}` : ''}
            ${app.interviewLink ? `&nbsp; <a href="${app.interviewLink}" target="_blank" style="color:var(--primary);font-weight:600;">Join Link →</a>` : ''}
          </div>
        </div>` : ''}

        <!-- Applied date + Withdraw -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:var(--space-2);">
          <span style="font-size:var(--text-xs);color:var(--gray-400);">Applied ${formatDate(app.appliedAt)}</span>
          ${['applied','under_review'].includes(app.status) ? `
          <button class="btn btn-sm btn-secondary" onclick="withdrawApp('${app._id}', this)" style="color:var(--danger);">Withdraw</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

async function withdrawApp(appId, btn) {
  if (!confirm('Are you sure you want to withdraw this application?')) return;
  btn.disabled = true;
  btn.textContent = 'Withdrawing…';
  try {
    const res = await API.put(`/student/applications/${appId}/withdraw`);
    if (res.success) {
      toast('Application withdrawn.', 'info');
      loadApplications();
    } else {
      toast(res.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Withdraw';
    }
  } catch (e) {
    toast(e.message, 'danger');
    btn.disabled = false;
    btn.textContent = 'Withdraw';
  }
}

/* ── PREPARATION HUB & SKILL GAP ANALYZER ──────────────────── */
async function loadPreparation() {
  if (allJobs.length === 0) {
    try {
      const res = await API.get('/student/jobs');
      if (res.success) allJobs = res.jobs || [];
    } catch (e) {}
  }

  // Get student profile
  let mySkills = [];
  if (cachedProfileData && cachedProfileData.profile) {
    mySkills = cachedProfileData.profile.skills || [];
  } else {
    try {
      const pRes = await API.get('/student/profile');
      if (pRes.success && pRes.profile) {
        cachedProfileData = { profile: pRes.profile, user: pRes.profile.user };
        mySkills = pRes.profile.skills || [];
      }
    } catch (e) {}
  }

  const mySkillsLower = (mySkills || []).map((s) => s.toLowerCase().trim());

  // Aggregate in-demand skills from all jobs
  const skillFreq = {};
  allJobs.forEach((j) => {
    (j.skillsRequired || []).forEach((s) => {
      const norm = s.trim();
      skillFreq[norm] = (skillFreq[norm] || 0) + 1;
    });
  });

  const sortedSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]);
  const matched = sortedSkills.filter(([s]) =>
    mySkillsLower.some((ms) => ms.includes(s.toLowerCase()) || s.toLowerCase().includes(ms))
  );
  const missing = sortedSkills.filter(([s]) =>
    !mySkillsLower.some((ms) => ms.includes(s.toLowerCase()) || s.toLowerCase().includes(ms))
  );

  const prepSkillsContainer = $('prep-skill-gap-container');
  if (prepSkillsContainer) {
    const readinessScore = sortedSkills.length > 0 ? Math.min(100, Math.round((matched.length / sortedSkills.length) * 100)) : 0;

    prepSkillsContainer.innerHTML = `
      <div style="margin-bottom:var(--space-4);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:var(--text-sm);font-weight:700;color:var(--gray-900);">Campus In-Demand Skill Match</span>
          <span style="font-size:var(--text-sm);font-weight:800;color:var(--primary);">${readinessScore}% Match</span>
        </div>
        <div class="progress-track" style="height:8px;background:var(--gray-200);border-radius:999px;">
          <div class="progress-fill" style="width:${readinessScore}%;background:linear-gradient(90deg, #2563eb, #10b981);"></div>
        </div>
      </div>
      <div style="margin-bottom:var(--space-4);">
        <div style="font-size:var(--text-xs);font-weight:700;color:var(--success);margin-bottom:6px;">✓ IN-DEMAND SKILLS YOU HAVE (${matched.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${matched.length ? matched.slice(0, 10).map(([s, count]) => `<span class="skill-chip" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-weight:600;">✓ ${s} (${count} jobs)</span>`).join('') : '<span style="font-size:var(--text-xs);color:var(--gray-500);">Add skills to your profile to match recruiter requirements.</span>'}
        </div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);font-weight:700;color:#b45309;margin-bottom:6px;">⚡ TOP RECOMMENDED SKILLS TO LEARN (${missing.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${missing.length ? missing.slice(0, 10).map(([s, count]) => `<span class="skill-chip" style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;font-weight:600;">+ ${s} (${count} jobs)</span>`).join('') : '<span style="font-size:var(--text-xs);color:var(--success);">Great job! You have all the primary campus skills.</span>'}
        </div>
      </div>
    `;
  }
}

/* ── PROFILE PAGE & EDIT CONTROLS ──────────────────────────── */
let cachedProfileData = null;
let isProfileEditing = false;

function setProfileEditMode(editing) {
  isProfileEditing = editing;
  const fields = document.querySelectorAll('.pf-field');
  fields.forEach(f => {
    f.disabled = !editing;
    if (editing) {
      f.style.backgroundColor = '#ffffff';
      f.style.borderColor = 'var(--primary)';
    } else {
      f.style.backgroundColor = '';
      f.style.borderColor = '';
    }
  });

  const badge = $('profile-mode-badge');
  if (badge) {
    if (editing) {
      badge.textContent = '✍️ Editing';
      badge.style.background = '#e0e7ff';
      badge.style.color = '#3730a3';
      badge.style.borderColor = '#c7d2fe';
    } else {
      badge.textContent = '🔒 View Only';
      badge.style.background = 'var(--gray-100)';
      badge.style.color = 'var(--gray-600)';
      badge.style.borderColor = 'var(--gray-200)';
    }
  }

  const editActions = $('profile-edit-actions');
  const mainEditBtn = $('profile-main-edit-btn');
  const toggleBtn = $('profile-toggle-edit-btn');
  const headerEditBtn = $('profile-header-edit-btn');

  if (editActions) editActions.style.display = editing ? 'flex' : 'none';
  if (mainEditBtn) mainEditBtn.style.display = editing ? 'none' : 'inline-flex';
  if (toggleBtn) {
    toggleBtn.textContent = editing ? '✕ Cancel' : '✏️ Edit Profile';
    toggleBtn.className = editing ? 'btn btn-secondary btn-sm' : 'btn btn-outline btn-sm';
  }
  if (headerEditBtn) {
    headerEditBtn.textContent = editing ? '✕ Cancel Editing' : '✏️ Edit Profile';
    headerEditBtn.className = editing ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';
  }

  if (editing && fields.length > 0) {
    fields[0].focus();
  }
}

async function loadProfile() {
  try {
    const res = await API.get('/student/profile');
    if (!res.success) return;
    const { profile } = res;
    const p = profile || {};
    const u = p.user || {};
    cachedProfileData = { profile: p, user: u };

    $('profile-name').textContent   = u.name || user.name || '';
    $('profile-email').textContent  = u.email || user.email || '';
    $('profile-avatar').textContent = (u.name || user.name || 'S')[0].toUpperCase();

    $('pf-name').value      = u.name || user.name || '';
    $('pf-roll').value      = p.rollNo || '';
    $('pf-branch').value    = p.branch || 'Computer Science and Engineering';
    $('pf-cgpa').value      = p.cgpa !== undefined && p.cgpa !== null ? p.cgpa : '';
    $('pf-year').value      = p.passingYear || 2026;
    $('pf-backlogs').value  = p.backlogs ?? 0;
    $('pf-phone').value     = p.phone || '';
    $('pf-linkedin').value  = p.linkedin || '';
    $('pf-skills').value    = (p.skills || []).join(', ');
    $('pf-bio').value       = p.bio || '';
    $('pf-pref-loc').value  = (p.preferences?.locations || []).join(', ');
    $('pf-pref-type').value = (p.preferences?.jobTypes  || []).join(', ');
    $('pf-pref-roles').value= (p.preferences?.roles     || []).join(', ');

    // Compute strength
    const strength = computeProfileStrength(p, { hasResume: Boolean(p.resumeUrl) });
    $('profile-strength-pct').textContent  = `${strength}%`;
    $('profile-strength-fill').style.width = `${strength}%`;
    $('sidebar-profile-pct').textContent   = `${strength}%`;
    $('sidebar-profile-fill').style.width  = `${strength}%`;

    // Checklist
    const checks = [
      { label: 'Roll number', done: Boolean(p.rollNo) },
      { label: 'Phone number', done: Boolean(p.phone) },
      { label: 'CGPA entered', done: Boolean(p.cgpa) },
      { label: 'Skills added (≥3)', done: (p.skills || []).length >= 3 },
      { label: 'Resume uploaded', done: Boolean(p.resumeUrl) },
    ];
    $('profile-checklist').innerHTML = checks.map((c) =>
      `<div style="display:flex;align-items:center;gap:8px;color:${c.done ? 'var(--success)' : 'var(--gray-400)'};">
        <span style="font-size:12px;">${c.done ? '✓' : '○'}</span> ${c.label}
      </div>`
    ).join('');

    if (p.resumeUrl) {
      $('profile-save-status').innerHTML = `<span style="color:var(--success);">✓ Resume uploaded (${p.resumeOriginalName || 'Resume'})</span> <a href="${p.resumeUrl}" target="_blank" style="color:var(--primary);margin-left:8px;font-weight:600;">View Resume ↗</a>`;
    }

    setProfileEditMode(false);
  } catch (e) { console.error(e); }
}

function cancelProfileEdit() {
  if (cachedProfileData) {
    const p = cachedProfileData.profile || {};
    const u = cachedProfileData.user || {};
    $('pf-name').value      = u.name || user.name || '';
    $('pf-roll').value      = p.rollNo || '';
    $('pf-branch').value    = p.branch || 'Computer Science and Engineering';
    $('pf-cgpa').value      = p.cgpa !== undefined && p.cgpa !== null ? p.cgpa : '';
    $('pf-year').value      = p.passingYear || 2026;
    $('pf-backlogs').value  = p.backlogs ?? 0;
    $('pf-phone').value     = p.phone || '';
    $('pf-linkedin').value  = p.linkedin || '';
    $('pf-skills').value    = (p.skills || []).join(', ');
    $('pf-bio').value       = p.bio || '';
    $('pf-pref-loc').value  = (p.preferences?.locations || []).join(', ');
    $('pf-pref-type').value = (p.preferences?.jobTypes  || []).join(', ');
    $('pf-pref-roles').value= (p.preferences?.roles     || []).join(', ');
  }
  setProfileEditMode(false);
  toast('Edits discarded', 'info');
}

// Attach Edit mode toggle buttons
$('profile-toggle-edit-btn')?.addEventListener('click', () => {
  if (isProfileEditing) cancelProfileEdit();
  else setProfileEditMode(true);
});

$('profile-header-edit-btn')?.addEventListener('click', () => {
  if (isProfileEditing) cancelProfileEdit();
  else setProfileEditMode(true);
});

$('profile-main-edit-btn')?.addEventListener('click', () => {
  setProfileEditMode(true);
});

$('profile-cancel-btn')?.addEventListener('click', () => {
  cancelProfileEdit();
});

$('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('profile-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const res = await API.put('/student/profile', {
      name:        $('pf-name').value.trim(),
      rollNo:      $('pf-roll').value.trim(),
      branch:      $('pf-branch').value,
      cgpa:        $('pf-cgpa').value,
      passingYear: $('pf-year').value,
      backlogs:    $('pf-backlogs').value,
      phone:       $('pf-phone').value.trim(),
      linkedin:    $('pf-linkedin').value.trim(),
      skills:      $('pf-skills').value,
      bio:         $('pf-bio').value.trim(),
      prefLocations: $('pf-pref-loc').value,
      prefJobTypes:  $('pf-pref-type').value,
      prefRoles:     $('pf-pref-roles').value,
    });
    if (res.success) {
      toast('Profile updated successfully!', 'success');
      // Update user name in storage
      const stored = JSON.parse(localStorage.getItem('placeonix_user') || '{}');
      stored.name = $('pf-name').value.trim();
      localStorage.setItem('placeonix_user', JSON.stringify(stored));
      $('sidebar-name').textContent = stored.name;
      loadProfile();
    } else {
      toast(res.message || 'Save failed', 'danger');
    }
  } catch (err) {
    toast(err.message || 'Save failed', 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save Changes';
  }
});

/* ── AI RESUME AUTO-PARSER HANDLER ──────────────────────────── */
function setupAiResumeParser() {
  const fileInput = $('ai-resume-file');
  const triggerBtns = [$('btn-trigger-ai-upload'), $('ai-upload-btn')];

  triggerBtns.forEach(btn => {
    btn?.addEventListener('click', () => fileInput?.click());
  });

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingBar = $('ai-loading-bar');
    const loadingText = $('ai-loading-text');
    const chipsContainer = $('ai-parse-chips');
    const statusText = $('ai-upload-status');

    if (loadingBar) loadingBar.style.display = 'block';
    if (statusText) statusText.textContent = `Processing ${file.name}...`;

    // Simulated animated progress step for delightful AI UX
    const steps = [
      '📄 Reading document structure...',
      '🧠 AI extracting skills, academic records, and contact details...',
      '✨ Formatting and mapping profile fields...'
    ];
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      if (loadingText) loadingText.textContent = steps[stepIndex];
    }, 700);

    try {
      const res = await API.upload('/student/resume/parse', file);
      clearInterval(progressInterval);
      if (loadingBar) loadingBar.style.display = 'none';

      if (res.success) {
        toast(`✨ AI auto-filled ${res.extractedCount || 'your'} profile details from ${file.name}!`, 'success');
        if (statusText) statusText.innerHTML = `<span style="color:var(--success);font-weight:600;">✓ Auto-filled from ${file.name}</span>`;

        // Render extracted highlights chips
        if (chipsContainer && res.extracted) {
          const ex = res.extracted;
          const chips = [];
          if (ex.name) chips.push(`👤 ${ex.name}`);
          if (ex.rollNo) chips.push(`🆔 ${ex.rollNo}`);
          if (ex.branch) chips.push(`🎓 ${ex.branch.split(' ')[0]}`);
          if (ex.cgpa) chips.push(`⭐ CGPA ${ex.cgpa}`);
          if (ex.passingYear) chips.push(`📅 ${ex.passingYear}`);
          if (ex.skills && ex.skills.length > 0) chips.push(`🛠️ ${ex.skills.length} Skills`);
          if (ex.phone) chips.push(`📞 Phone`);
          if (ex.linkedin) chips.push(`🔗 LinkedIn`);

          chipsContainer.innerHTML = chips.map(c => `
            <span style="background:#e0e7ff;color:#3730a3;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;border:1px solid #c7d2fe;">
              ${c}
            </span>
          `).join('');
          chipsContainer.style.display = 'flex';
        }

        // Reload updated profile and enable edit mode so student can review
        await loadProfile();
        setProfileEditMode(true);
      } else {
        toast(res.message || 'AI parsing encountered an error', 'danger');
        if (statusText) statusText.textContent = 'Supported: PDF, DOC, DOCX';
      }
    } catch (err) {
      clearInterval(progressInterval);
      if (loadingBar) loadingBar.style.display = 'none';
      toast(err.message || 'Failed to parse resume with AI', 'danger');
      if (statusText) statusText.textContent = 'Supported: PDF, DOC, DOCX';
    }

    e.target.value = '';
  });
}

// Standard Resume upload for profile & prep
function setupResumeUpload(inputId, statusId) {
  $(inputId)?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = $(statusId);
    if (statusEl) statusEl.textContent = 'Uploading…';
    try {
      const res = await API.upload('/student/resume', file);
      if (res.success) {
        toast('Resume uploaded!', 'success');
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--success);">✓ ${file.name}</span>`;
        loadProfile();
      } else {
        toast(res.message || 'Upload failed', 'danger');
        if (statusEl) statusEl.textContent = '';
      }
    } catch (err) {
      toast(err.message || 'Upload failed', 'danger');
    }
    e.target.value = '';
  });
}

$('profile-upload-resume-btn')?.addEventListener('click', () => $('profile-resume-file').click());
$('prep-upload-resume')?.addEventListener('click', () => $('resume-file-input').click());
setupResumeUpload('profile-resume-file', 'profile-save-status');
setupResumeUpload('resume-file-input', 'resume-upload-status');
setupAiResumeParser();

/* ── GLOBAL SEARCH ──────────────────────────────────────────── */
function setupSearch() {
  const input = $('global-search');
  if (!input) return;
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      const matches = allJobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.company?.name || '').toLowerCase().includes(q) ||
          (j.skillsRequired || []).some((s) => s.toLowerCase().includes(q))
      );
      navigateTo('discover');
      renderDiscoverJobs(matches);
      $('discover-count').textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''} for "${q}"`;
    }, 300);
  });
}

/* ── NOTIFICATIONS ──────────────────────────────────────────── */
function initNotifications() {
  const btn = $('notif-btn');
  const panel = $('notif-panel');
  if (!btn || !panel) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) loadNotifications();
  });

  document.addEventListener('click', () => panel.classList.remove('open'));
  panel.addEventListener('click', (e) => e.stopPropagation());

  $('mark-all-read')?.addEventListener('click', markAllRead);
}

async function loadNotifications() {
  const list = $('notif-list');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  try {
    const res = await API.get('/notifications');
    if (!res.success || !res.notifications.length) {
      list.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--gray-400);font-size:var(--text-sm);">No notifications</div>';
      return;
    }
    const unread = res.notifications.filter((n) => !n.isRead).length;
    if (unread > 0) {
      $('notif-dot').classList.remove('hidden');
    }
    list.innerHTML = res.notifications.slice(0, 10).map((n) => `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}">
        <div class="notif-dot"></div>
        <div class="notif-body">
          <div class="notif-text">${n.message}</div>
          <div class="notif-time">${formatDate(n.createdAt)}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = '<div style="padding:var(--space-4);color:var(--danger);font-size:var(--text-sm);">Failed to load</div>';
  }
}

async function markAllRead() {
  try {
    await API.put('/notifications/mark-read');
    $('notif-dot').classList.add('hidden');
    loadNotifications();
  } catch (e) { /* ignore */ }
}
