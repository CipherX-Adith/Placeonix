// Recruiter Dashboard Logic for Placeonix (Light Mode & State Machine Enhanced)

const VALID_TRANSITIONS = {
  applied:      ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted:  ['interview', 'rejected'],
  interview:    ['selected', 'rejected'],
  selected:     [],
  rejected:     [],
  withdrawn:    [],
};

const Recruiter = {
  currentProfile: null,
  activeJobs: [],
  selectedJobId: null,
  selectedApplicationId: null,
  currentAppStatus: null,

  async init() {
    if (!Auth.checkAuth('recruiter')) return;

    this.updateHeaderUI();
    this.initNotifications();
    this.setupTabNavigation();
    this.setupEventListeners();

    // Initial loads
    await this.loadProfile();
    await this.loadDashboardSummary();
    await this.loadMyJobs();
    await this.loadDrivesForSelect();
  },

  updateHeaderUI() {
    const user = Auth.getUser();
    if (!user) return;
    const nameEl = document.getElementById('sidebar-rec-name');
    const avatarEl = document.getElementById('sidebar-rec-avatar');
    if (nameEl) nameEl.textContent = user.name || 'Recruiter';
    if (avatarEl) avatarEl.textContent = (user.name || 'R')[0].toUpperCase();
  },

  initNotifications() {
    const btn = document.getElementById('rec-notif-btn');
    const panel = document.getElementById('rec-notif-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) this.loadNotificationsList();
    });

    document.addEventListener('click', () => panel.classList.remove('open'));
    panel.addEventListener('click', (e) => e.stopPropagation());
  },

  async loadNotificationsList() {
    const list = document.getElementById('rec-notif-list');
    if (!list) return;
    list.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
    try {
      const res = await apiFetch('/notifications');
      if (!res.success || !res.notifications.length) {
        list.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--gray-400);font-size:var(--text-sm);">No notifications</div>';
        return;
      }
      const unread = res.notifications.filter((n) => !n.isRead).length;
      const dot = document.getElementById('rec-notif-dot');
      if (dot) {
        if (unread > 0) dot.classList.remove('hidden');
        else dot.classList.add('hidden');
      }
      list.innerHTML = res.notifications.slice(0, 10).map((n) => `
        <div class="notif-item ${n.isRead ? '' : 'unread'}">
          <div class="notif-dot"></div>
          <div class="notif-body">
            <div class="notif-text">${n.message}</div>
            <div class="notif-time">${new Date(n.createdAt).toLocaleDateString()}</div>
          </div>
        </div>`).join('');
    } catch (e) {
      list.innerHTML = '<div style="padding:var(--space-4);color:var(--danger);font-size:var(--text-sm);">Failed to load</div>';
    }
  },

  setupTabNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    const bottomItems = document.querySelectorAll('.bottom-nav-item[data-tab]');

    const handleTabClick = (targetTab) => {
      this.switchTab(targetTab);
    };

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        handleTabClick(link.getAttribute('data-tab'));
      });
    });

    bottomItems.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleTabClick(btn.getAttribute('data-tab'));
      });
    });

    document.getElementById('recruiter-logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  },

  switchTab(targetTab) {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    const bottomItems = document.querySelectorAll('.bottom-nav-item[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navLinks.forEach((l) => l.classList.remove('active'));
    bottomItems.forEach((b) => b.classList.remove('active'));
    tabPanes.forEach((p) => (p.style.display = 'none'));

    document.querySelector(`.sidebar-nav .nav-item[data-tab="${targetTab}"]`)?.classList.add('active');
    document.querySelector(`.bottom-nav-item[data-tab="${targetTab}"]`)?.classList.add('active');

    const activePane = document.getElementById(`tab-${targetTab}`);
    if (activePane) activePane.style.display = 'block';

    if (targetTab === 'jobs') this.loadMyJobs();
    if (targetTab === 'candidates') this.loadCandidates();
    if (targetTab === 'company') this.loadProfile();

    window.scrollTo(0, 0);
  },

  setupEventListeners() {
    // Recruiter & Company profile update form
    const profileForm = document.getElementById('recruiter-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleProfileUpdate();
      });
    }

    // New Job Posting form
    const newJobForm = document.getElementById('create-job-form');
    if (newJobForm) {
      newJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleCreateJob();
      });
    }

    // Candidate Status Update form
    const statusForm = document.getElementById('candidate-status-form');
    if (statusForm) {
      statusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleStatusUpdate();
      });
    }

    // Candidate search filters
    ['candidate-search-skills', 'candidate-search-branch', 'candidate-search-min-cgpa'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => this.filterCandidates());
    });
  },

  async loadDashboardSummary() {
    try {
      const res = await apiFetch('/recruiter/dashboard-summary');
      if (res.success) {
        const { metrics } = res;
        document.getElementById('rec-metric-active-jobs').textContent = metrics.activeJobs || 0;
        document.getElementById('rec-metric-applications').textContent = metrics.totalApplications || 0;
        document.getElementById('rec-metric-shortlisted').textContent = metrics.shortlistedCandidates || 0;
        document.getElementById('rec-metric-hired').textContent = metrics.hiredCandidates || 0;

        // Company verification banner
        const verifyBanner = document.getElementById('company-verification-banner');
        if (verifyBanner) {
          const status = res.profile?.company?.verifiedStatus;
          if (status === 'pending') {
            verifyBanner.style.background = 'var(--warning-bg)';
            verifyBanner.style.border = '1px solid var(--warning-border)';
            verifyBanner.style.color = 'var(--warning)';
            verifyBanner.innerHTML = '⏳ <strong>Company Verification In-Progress:</strong> Your company profile is awaiting admin approval before jobs appear in full drive listings.';
            verifyBanner.style.display = 'block';
          } else if (status === 'verified') {
            verifyBanner.style.background = 'var(--success-bg)';
            verifyBanner.style.border = '1px solid var(--success-border)';
            verifyBanner.style.color = 'var(--success)';
            verifyBanner.innerHTML = '✓ <strong>Verified Company Partner:</strong> Your organization is officially recognized for campus recruitment.';
            verifyBanner.style.display = 'block';
          } else if (status === 'rejected') {
            verifyBanner.style.background = 'var(--danger-bg)';
            verifyBanner.style.border = '1px solid var(--danger-border)';
            verifyBanner.style.color = 'var(--danger)';
            verifyBanner.innerHTML = '⚠️ <strong>Company Verification Action Needed:</strong> Please review your company information or contact the placement cell.';
            verifyBanner.style.display = 'block';
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async loadProfile() {
    try {
      const res = await apiFetch('/recruiter/profile');
      if (res.success && res.profile) {
        this.currentProfile = res.profile;
        this.populateProfileForm(res.profile);
      }
    } catch (err) {
      console.error(err);
    }
  },

  populateProfileForm(profile) {
    if (!profile) return;
    const setValue = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setValue('rec-name', profile.user?.name);
    setValue('rec-email', profile.user?.email);
    setValue('rec-designation', profile.designation);
    setValue('rec-phone', profile.phone);

    if (profile.company) {
      setValue('comp-name', profile.company.name);
      setValue('comp-website', profile.company.website);
      setValue('comp-industry', profile.company.industry);
      setValue('comp-location', profile.company.location);
      setValue('comp-description', profile.company.description);

      const compSidebar = document.getElementById('sidebar-rec-company');
      if (compSidebar) compSidebar.textContent = profile.company.name;

      const statusBadge = document.getElementById('company-status-badge');
      if (statusBadge) {
        const s = profile.company.verifiedStatus;
        statusBadge.className = `status-badge ${s === 'verified' ? 'selected' : s === 'rejected' ? 'rejected' : 'under-review'}`;
        statusBadge.textContent = s.toUpperCase();
      }
    }
  },

  async handleProfileUpdate() {
    const btn = document.getElementById('rec-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      const data = {
        designation: document.getElementById('rec-designation').value,
        phone: document.getElementById('rec-phone').value,
        companyName: document.getElementById('comp-name').value,
        website: document.getElementById('comp-website').value,
        industry: document.getElementById('comp-industry').value,
        location: document.getElementById('comp-location').value,
        description: document.getElementById('comp-description').value,
      };

      const res = await apiFetch('/recruiter/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (res.success) {
        showToast('Company & profile details saved!', 'success');
        this.loadProfile();
        this.loadDashboardSummary();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save Profile Details'; }
    }
  },

  async loadDrivesForSelect() {
    const select = document.getElementById('job-drive-select');
    if (!select) return;

    try {
      const res = await apiFetch('/admin/drives');
      if (res.success && res.drives) {
        select.innerHTML = '<option value="">-- Standalone Opening (No Drive) --</option>' +
          res.drives.map(d => `<option value="${d._id}">${d.title} (${d.academicYear})</option>`).join('');
      }
    } catch (e) {
      console.warn(e);
    }
  },

  async handleCreateJob() {
    try {
      const branchCheckboxes = document.querySelectorAll('input[name="eligibleBranches"]:checked');
      const branches = Array.from(branchCheckboxes).map(c => c.value);

      const data = {
        title: document.getElementById('job-title').value,
        role: document.getElementById('job-role').value,
        jobType: document.getElementById('job-type').value,
        packageCtc: document.getElementById('job-package').value,
        location: document.getElementById('job-location').value,
        minCgpa: document.getElementById('job-min-cgpa').value,
        maxBacklogs: document.getElementById('job-max-backlogs').value,
        eligibleBranches: branches,
        deadline: document.getElementById('job-deadline').value,
        driveId: document.getElementById('job-drive-select')?.value || null,
        skillsRequired: document.getElementById('job-skills').value,
        requirements: document.getElementById('job-requirements').value,
        description: document.getElementById('job-description').value,
      };

      const res = await apiFetch('/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success) {
        showToast('New Job Opening Published Successfully!', 'success');
        document.getElementById('create-job-form').reset();
        this.closeModal('create-job-modal');
        this.loadMyJobs();
        this.loadDashboardSummary();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async loadMyJobs() {
    const container = document.getElementById('recruiter-jobs-table-body');
    const overviewContainer = document.getElementById('overview-jobs-list');

    try {
      const res = await apiFetch('/recruiter/jobs');
      if (res.success) {
        this.activeJobs = res.jobs;

        if (overviewContainer) {
          if (this.activeJobs.length === 0) {
            overviewContainer.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--gray-400);">No job postings yet. Click "+ Post New Job" to create your first listing.</div>';
          } else {
            overviewContainer.innerHTML = this.activeJobs.slice(0, 4).map(job => `
              <div class="card p-4" style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:700;font-size:var(--text-sm);">${job.title}</div>
                  <div style="font-size:var(--text-xs);color:var(--gray-500);">${job.role} · ₹${job.packageCtc} LPA · Min ${job.minCgpa} CGPA</div>
                </div>
                <div style="display:flex;align-items:center;gap:var(--space-3);">
                  <button class="btn btn-sm btn-primary" onclick="Recruiter.viewApplicants('${job._id}')">
                    👥 ${job.stats?.totalApplicants || 0} Candidates
                  </button>
                </div>
              </div>
            `).join('');
          }
        }

        if (container) {
          if (this.activeJobs.length === 0) {
            container.innerHTML = `
              <tr>
                <td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--gray-400);">
                  No job postings created yet. Click "+ Post New Job" to begin hiring.
                </td>
              </tr>
            `;
            return;
          }

          container.innerHTML = this.activeJobs
            .map(
              (job) => `
            <tr>
              <td>
                <strong>${job.title}</strong>
                <div style="font-size: var(--text-xs); color: var(--gray-500);">${job.role} • ${job.jobType}</div>
              </td>
              <td><strong>₹${job.packageCtc} LPA</strong></td>
              <td><span class="skill-chip">CGPA ≥ ${job.minCgpa}</span></td>
              <td>${new Date(job.deadline).toLocaleDateString()}</td>
              <td>
                <span class="status-badge ${job.status === 'active' ? 'selected' : 'rejected'}">
                  ${job.status.toUpperCase()}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="Recruiter.viewApplicants('${job._id}')">
                  👥 ${job.stats?.totalApplicants || 0} Applicants
                </button>
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="Recruiter.toggleJobStatus('${job._id}', '${job.status}')">
                  ${job.status === 'active' ? 'Close' : 'Reactivate'}
                </button>
              </td>
            </tr>
          `
            )
            .join('');
        }
      }
    } catch (err) {
      if (container) container.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  },

  async toggleJobStatus(jobId, currentStatus) {
    try {
      const newStatus = currentStatus === 'active' ? 'closed' : 'active';
      const res = await apiFetch(`/recruiter/jobs/${jobId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.success) {
        showToast(`Job status updated to ${newStatus}`, 'info');
        this.loadMyJobs();
        this.loadDashboardSummary();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async viewApplicants(jobId) {
    this.selectedJobId = jobId;
    const modal = document.getElementById('applicants-review-modal');
    const tbody = document.getElementById('applicants-modal-table-body');
    const jobTitleEl = document.getElementById('applicants-modal-job-title');

    modal.classList.add('open');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--space-6);"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

    try {
      const res = await apiFetch(`/recruiter/jobs/${jobId}/applicants`);
      if (res.success) {
        jobTitleEl.textContent = `${res.job?.title || 'Job'} (${res.applicants?.length || 0} total applicants)`;

        if (!res.applicants || res.applicants.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: var(--space-8); color: var(--gray-400);">
                No applications received yet for this position.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = res.applicants
          .map((app) => {
            const stu = app.student;
            const prof = app.studentProfile;
            const statusMap = {
              applied: 'applied',
              under_review: 'under-review',
              shortlisted: 'shortlisted',
              interview: 'interview',
              selected: 'selected',
              rejected: 'rejected',
              withdrawn: 'withdrawn',
            };

            return `
            <tr>
              <td>
                <strong>${stu?.name || 'N/A'}</strong>
                <div style="font-size: var(--text-xs); color: var(--gray-500);">${stu?.email || ''}</div>
              </td>
              <td>${prof?.rollNo || 'N/A'}</td>
              <td>${prof?.branch || 'N/A'}</td>
              <td><strong>${prof?.cgpa || 0}</strong></td>
              <td>
                <span class="status-badge ${statusMap[app.status] || 'applied'}">
                  ${app.status.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:var(--space-2);align-items:center;">
                  ${
                    prof?.resumeUrl
                      ? `<a href="${prof.resumeUrl}" target="_blank" class="btn btn-sm btn-secondary">📄 Resume</a>`
                      : '<span style="font-size:var(--text-xs);color:var(--gray-400);">No Resume</span>'
                  }
                  <button class="btn btn-sm btn-primary" onclick="Recruiter.openStatusModal('${app._id}', '${app.status}', '${(stu?.name || 'Candidate').replace(/'/g, "\\'")}')">
                    Update Stage
                  </button>
                </div>
              </td>
            </tr>
          `;
          })
          .join('');
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  },

  openStatusModal(appId, currentStatus, studentName) {
    this.selectedApplicationId = appId;
    this.currentAppStatus = currentStatus;
    document.getElementById('status-modal-candidate-name').textContent = `Candidate: ${studentName} · Current: ${currentStatus.replace('_', ' ').toUpperCase()}`;
    document.getElementById('update-feedback-input').value = '';
    document.getElementById('update-notes-input').value = '';
    document.getElementById('update-interview-date').value = '';
    document.getElementById('update-interview-mode').value = '';
    document.getElementById('update-interview-link').value = '';

    const statusSelect = document.getElementById('update-status-select');
    const hintEl = document.getElementById('status-transition-hint');
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (allowed.length === 0) {
      statusSelect.innerHTML = `<option value="">Terminal state (${currentStatus}) – no transitions</option>`;
      statusSelect.disabled = true;
      document.getElementById('save-status-submit-btn').disabled = true;
      hintEl.textContent = 'This application is in a terminal status and cannot be transitioned further.';
    } else {
      statusSelect.disabled = false;
      document.getElementById('save-status-submit-btn').disabled = false;
      statusSelect.innerHTML = allowed.map((s) => {
        const labels = {
          under_review: 'Under Review',
          shortlisted:  'Shortlisted for Next Round',
          interview:    'Schedule Interview',
          selected:     'Select / Offer Extended 🎉',
          rejected:     'Not Selected (Reject)',
        };
        return `<option value="${s}">${labels[s] || s}</option>`;
      }).join('');
      hintEl.textContent = `Allowed transitions from '${currentStatus}': ${allowed.join(', ')}`;
    }

    const interviewGroup = document.getElementById('interview-schedule-fields');
    const toggleInterview = () => {
      interviewGroup.style.display = statusSelect.value === 'interview' ? 'block' : 'none';
    };
    statusSelect.onchange = toggleInterview;
    toggleInterview();

    const modal = document.getElementById('candidate-status-modal');
    modal.classList.add('open');
  },

  async handleStatusUpdate() {
    if (!this.selectedApplicationId) return;
    const btn = document.getElementById('save-status-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      const status = document.getElementById('update-status-select').value;
      const feedback = document.getElementById('update-feedback-input').value;
      const recruiterNotes = document.getElementById('update-notes-input').value;
      const interviewDate = document.getElementById('update-interview-date').value;
      const interviewMode = document.getElementById('update-interview-mode').value;
      const interviewLink = document.getElementById('update-interview-link').value;

      if (!status) {
        showToast('Please select a valid target status.', 'warning');
        return;
      }

      const res = await apiFetch(`/recruiter/applications/${this.selectedApplicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          feedback,
          recruiterNotes,
          interviewDate: interviewDate || undefined,
          interviewMode: interviewMode || undefined,
          interviewLink: interviewLink || undefined,
        }),
      });

      if (res.success) {
        showToast(`Candidate stage updated to '${status.replace('_', ' ').toUpperCase()}'!`, 'success');
        this.closeModal('candidate-status-modal');
        if (this.selectedJobId) {
          this.viewApplicants(this.selectedJobId);
        }
        this.loadMyJobs();
        this.loadDashboardSummary();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Stage Transition';
    }
  },

  allCandidates: [],
  async loadCandidates() {
    const list = document.getElementById('candidates-directory-list');
    list.innerHTML = '<div class="loading-state" style="grid-column:1/-1;"><div class="spinner"></div></div>';
    try {
      const res = await apiFetch('/admin/users?role=student');
      if (res.success && res.users) {
        this.allCandidates = res.users;
        this.filterCandidates();
      }
    } catch (e) {
      list.innerHTML = `<div style="grid-column:1/-1;color:var(--gray-400);text-align:center;">Could not load student candidates.</div>`;
    }
  },

  filterCandidates() {
    const list = document.getElementById('candidates-directory-list');
    const skillsQuery = (document.getElementById('candidate-search-skills')?.value || '').toLowerCase().trim();
    const branchFilter = document.getElementById('candidate-search-branch')?.value || '';
    const minCgpa = parseFloat(document.getElementById('candidate-search-min-cgpa')?.value || '0');

    let filtered = this.allCandidates.filter(u => {
      const p = u.studentProfile || {};
      if (branchFilter && p.branch !== branchFilter) return false;
      if (minCgpa > 0 && (p.cgpa || 0) < minCgpa) return false;
      if (skillsQuery) {
        const sList = (p.skills || []).map(s => s.toLowerCase());
        const match = sList.some(s => s.includes(skillsQuery));
        if (!match) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--gray-400);padding:var(--space-8);">No candidate profiles found matching search criteria.</div>';
      return;
    }

    list.innerHTML = filtered.map(u => {
      const p = u.studentProfile || {};
      const initials = (u.name || 'S')[0].toUpperCase();
      return `
        <div class="card p-4">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
            <div class="user-avatar" style="background:#0891b2;">${initials}</div>
            <div>
              <div style="font-weight:700;font-size:var(--text-sm);">${u.name}</div>
              <div style="font-size:var(--text-xs);color:var(--gray-500);">${p.branch || 'Branch N/A'} · Batch ${p.passingYear || 2026}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:var(--space-3);">
            <span>CGPA: <strong>${p.cgpa || '—'}</strong></span>
            <span>Backlogs: <strong>${p.backlogs ?? 0}</strong></span>
          </div>
          <div class="job-skills mb-4" style="margin-bottom:var(--space-3);">
            ${(p.skills || []).slice(0, 4).map(s => `<span class="skill-chip">${s}</span>`).join('')}
          </div>
          ${p.resumeUrl ? `<a href="${p.resumeUrl}" target="_blank" class="btn btn-secondary btn-sm btn-full">📄 View Student Resume</a>` : '<div style="font-size:var(--text-xs);color:var(--gray-400);text-align:center;">No resume uploaded</div>'}
        </div>
      `;
    }).join('');
  },

  openCreateJobModal() {
    document.getElementById('create-job-modal').classList.add('open');
  },

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('open');
  },
};

window.Recruiter = Recruiter;
