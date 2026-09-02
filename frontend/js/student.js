// Student Dashboard Logic for Placeonix

const Student = {
  currentProfile: null,
  jobsList: [],

  async init() {
    if (!Auth.checkAuth('student')) return;

    Auth.updateHeaderUI();
    Notifications.init();
    this.setupTabNavigation();
    this.setupEventListeners();

    // Initial load
    await this.loadProfile();
    await this.loadDashboardSummary();
    await this.loadJobs();
    await this.loadApplications();
  },

  setupTabNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-link[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = link.getAttribute('data-tab');

        navLinks.forEach((l) => l.classList.remove('active'));
        tabPanes.forEach((p) => (p.style.display = 'none'));

        link.classList.add('active');
        const activePane = document.getElementById(`tab-${targetTab}`);
        if (activePane) activePane.style.display = 'block';

        if (targetTab === 'jobs') this.loadJobs();
        if (targetTab === 'applications') this.loadApplications();
      });
    });
  },

  setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('student-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleProfileUpdate();
      });
    }

    // Resume upload form
    const resumeForm = document.getElementById('resume-upload-form');
    if (resumeForm) {
      resumeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleResumeUpload();
      });
    }

    // Job search filter input
    const jobKeywordInput = document.getElementById('job-keyword-filter');
    if (jobKeywordInput) {
      jobKeywordInput.addEventListener('input', () => this.filterJobsLocally());
    }

    const jobEligibilityFilter = document.getElementById('job-eligibility-filter');
    if (jobEligibilityFilter) {
      jobEligibilityFilter.addEventListener('change', () => this.filterJobsLocally());
    }
  },

  async loadDashboardSummary() {
    try {
      const res = await apiFetch('/student/dashboard-summary');
      if (res.success) {
        const { metrics } = res;
        document.getElementById('metric-total-jobs').textContent = metrics.totalJobs || 0;
        document.getElementById('metric-total-applied').textContent = metrics.totalApplied || 0;
        document.getElementById('metric-shortlisted').textContent = metrics.shortlistedCount || 0;
        document.getElementById('metric-offers').textContent = metrics.offersCount || 0;

        // Profile completion warning banner
        const warningBanner = document.getElementById('profile-completion-banner');
        if (warningBanner) {
          if (!metrics.isProfileComplete || !metrics.hasResume) {
            warningBanner.style.display = 'block';
          } else {
            warningBanner.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async loadProfile() {
    try {
      const res = await apiFetch('/student/profile');
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

    setValue('profile-name', profile.user?.name);
    setValue('profile-email', profile.user?.email);
    setValue('profile-rollno', profile.rollNo);
    setValue('profile-phone', profile.phone);
    setValue('profile-branch', profile.branch);
    setValue('profile-cgpa', profile.cgpa);
    setValue('profile-passingyear', profile.passingYear);
    setValue('profile-backlogs', profile.backlogs);
    setValue('profile-skills', (profile.skills || []).join(', '));
    setValue('profile-linkedin', profile.linkedin);
    setValue('profile-github', profile.github);
    setValue('profile-bio', profile.bio);

    // Update resume status display
    const resumeStatusEl = document.getElementById('resume-status-display');
    if (resumeStatusEl) {
      if (profile.resumeUrl) {
        resumeStatusEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="badge badge-success">✓ Uploaded</span>
            <a href="${window.CONFIG.UPLOADS_BASE_URL}${profile.resumeUrl}" target="_blank" class="btn btn-sm btn-outline">
              📄 View Resume (${profile.resumeOriginalName || 'Download'})
            </a>
          </div>
        `;
      } else {
        resumeStatusEl.innerHTML = `
          <span class="badge badge-warning">⚠️ No Resume Uploaded Yet</span>
        `;
      }
    }
  },

  async handleProfileUpdate() {
    try {
      const data = {
        name: document.getElementById('profile-name').value,
        rollNo: document.getElementById('profile-rollno').value,
        phone: document.getElementById('profile-phone').value,
        branch: document.getElementById('profile-branch').value,
        cgpa: document.getElementById('profile-cgpa').value,
        passingYear: document.getElementById('profile-passingyear').value,
        backlogs: document.getElementById('profile-backlogs').value,
        skills: document.getElementById('profile-skills').value,
        linkedin: document.getElementById('profile-linkedin').value,
        github: document.getElementById('profile-github').value,
        bio: document.getElementById('profile-bio').value,
      };

      const res = await apiFetch('/student/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (res.success) {
        showToast('Academic & personal profile updated successfully!', 'success');
        this.currentProfile = res.profile;
        this.loadDashboardSummary();
        this.loadJobs();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async handleResumeUpload() {
    const fileInput = document.getElementById('resume-file-input');
    if (!fileInput || !fileInput.files[0]) {
      showToast('Please choose a file to upload', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('resume', fileInput.files[0]);

    try {
      showToast('Uploading resume...', 'info');
      const res = await apiFetch('/student/resume', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        showToast('Resume uploaded and verified successfully!', 'success');
        this.loadProfile();
        this.loadDashboardSummary();
        fileInput.value = '';
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async loadJobs() {
    const container = document.getElementById('jobs-feed-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 3rem;"><p>Loading verified job postings...</p></div>`;

    try {
      const res = await apiFetch('/student/jobs');
      if (res.success) {
        this.jobsList = res.jobs;
        this.renderJobs(this.jobsList);
      }
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 2rem;">Error loading jobs: ${err.message}</div>`;
    }
  },

  renderJobs(jobs) {
    const container = document.getElementById('jobs-feed-container');
    if (!container) return;

    if (!jobs || jobs.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 3rem; text-align: center;">
          <h3>No matching job openings found</h3>
          <p style="color: var(--text-secondary);">Check back soon as new companies register campus drives.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs
      .map((job) => {
        const isEligible = job.isEligible;
        const hasApplied = job.hasApplied;
        const isPastDeadline = job.isPastDeadline;

        return `
        <div class="glass-card job-card">
          <div class="job-header">
            <div class="job-company-badge">
              <div class="company-logo-placeholder">
                ${job.company?.name ? job.company.name.charAt(0) : '🏢'}
              </div>
              <div>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.2rem;">${job.title}</h3>
                <div style="font-size: 0.9rem; color: var(--accent-secondary); font-weight: 600;">
                  ${job.company?.name || 'Company'} • <span style="color: var(--text-secondary);">${job.location}</span>
                </div>
              </div>
            </div>
            <div>
              ${
                isEligible
                  ? `<span class="badge badge-success">✓ Eligible</span>`
                  : `<span class="badge badge-warning" title="${(job.eligibilityReasons || []).join(' | ')}">⚠️ Not Eligible</span>`
              }
            </div>
          </div>

          <div class="job-meta">
            <div class="job-meta-item">💰 <strong>${job.packageCtc}</strong></div>
            <div class="job-meta-item">💼 <strong>${job.jobType}</strong></div>
            <div class="job-meta-item">🎯 Min CGPA: <strong>${job.minCgpa}</strong></div>
            <div class="job-meta-item">📅 Deadline: <strong>${new Date(job.deadline).toLocaleDateString()}</strong></div>
          </div>

          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            ${job.description.substring(0, 180)}...
          </p>

          <div class="skills-tags">
            ${(job.skillsRequired || []).map((s) => `<span class="skill-tag">${s}</span>`).join('')}
          </div>

          ${
            !isEligible && job.eligibilityReasons && job.eligibilityReasons.length > 0
              ? `
              <div style="font-size: 0.8rem; color: var(--warning); background: var(--warning-bg); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm);">
                <strong>Eligibility Notice:</strong> ${job.eligibilityReasons.join(' • ')}
              </div>
            `
              : ''
          }

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
            ${
              hasApplied
                ? `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.8;">✓ Applied (${job.applicationInfo?.status.toUpperCase()})</button>`
                : isPastDeadline
                ? `<button class="btn btn-secondary btn-sm" disabled>Deadline Passed</button>`
                : `
                  <button 
                    class="btn btn-primary btn-sm" 
                    onclick="Student.handleApply('${job._id}')"
                    ${!isEligible ? 'disabled style="opacity: 0.5; cursor: not-allowed;" title="You do not meet the minimum eligibility requirements"' : ''}
                  >
                    🚀 Apply Now
                  </button>
                `
            }
          </div>
        </div>
      `;
      })
      .join('');
  },

  filterJobsLocally() {
    const keyword = (document.getElementById('job-keyword-filter')?.value || '').toLowerCase();
    const eligibilityFilter = document.getElementById('job-eligibility-filter')?.value || 'all';

    let filtered = this.jobsList;

    if (keyword) {
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(keyword) ||
          j.company?.name?.toLowerCase().includes(keyword) ||
          (j.skillsRequired || []).some((s) => s.toLowerCase().includes(keyword))
      );
    }

    if (eligibilityFilter === 'eligible') {
      filtered = filtered.filter((j) => j.isEligible);
    } else if (eligibilityFilter === 'not-eligible') {
      filtered = filtered.filter((j) => !j.isEligible);
    }

    this.renderJobs(filtered);
  },

  async handleApply(jobId) {
    if (!this.currentProfile || !this.currentProfile.resumeUrl) {
      showToast('Please upload your resume in the Profile tab before applying.', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to submit your application for this position?')) {
      return;
    }

    try {
      const res = await apiFetch(`/student/apply/${jobId}`, {
        method: 'POST',
      });

      if (res.success) {
        showToast('Application submitted successfully!', 'success');
        this.loadJobs();
        this.loadApplications();
        this.loadDashboardSummary();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async loadApplications() {
    const container = document.getElementById('applications-list-container');
    if (!container) return;

    try {
      const res = await apiFetch('/student/applications');
      if (res.success) {
        const apps = res.applications;

        if (!apps || apps.length === 0) {
          container.innerHTML = `
            <div class="glass-card" style="padding: 3rem; text-align: center;">
              <h3>No active applications</h3>
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">Browse open job positions and apply to track them here.</p>
            </div>
          `;
          return;
        }

        const statusSteps = ['applied', 'shortlisted', 'interview_scheduled', 'selected'];

        container.innerHTML = apps
          .map((app) => {
            const currentStepIdx = statusSteps.indexOf(app.status);
            const isRejected = app.status === 'rejected';

            return `
            <div class="glass-card" style="padding: 1.75rem; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem;">${app.job?.title || 'Job Title'}</h3>
                  <div style="color: var(--accent-secondary); font-weight: 600;">
                    ${app.job?.company?.name || 'Company'} • <span style="color: var(--text-secondary); font-size: 0.88rem;">Applied on ${new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  ${
                    isRejected
                      ? `<span class="badge badge-danger">Not Selected</span>`
                      : app.status === 'selected'
                      ? `<span class="badge badge-success">🎉 Selected / Offered</span>`
                      : `<span class="badge badge-info">${app.status.toUpperCase()}</span>`
                  }
                </div>
              </div>

              ${
                !isRejected
                  ? `
                <div class="timeline">
                  <div class="timeline-step ${currentStepIdx >= 0 ? 'completed' : ''}">
                    <div class="timeline-circle">1</div>
                    <div class="timeline-label">Applied</div>
                  </div>
                  <div class="timeline-step ${currentStepIdx >= 1 ? 'completed' : currentStepIdx === 0 ? 'active' : ''}">
                    <div class="timeline-circle">2</div>
                    <div class="timeline-label">Shortlisted</div>
                  </div>
                  <div class="timeline-step ${currentStepIdx >= 2 ? 'completed' : currentStepIdx === 1 ? 'active' : ''}">
                    <div class="timeline-circle">3</div>
                    <div class="timeline-label">Interview</div>
                  </div>
                  <div class="timeline-step ${currentStepIdx === 3 ? 'completed' : ''}">
                    <div class="timeline-circle">4</div>
                    <div class="timeline-label">Offer</div>
                  </div>
                </div>
              `
                  : ''
              }

              ${
                app.interviewDate
                  ? `
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid var(--info); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-top: 1rem;">
                  <strong style="color: #60a5fa;">📅 Interview Details:</strong> ${new Date(app.interviewDate).toLocaleString()} 
                  (${app.interviewMode || 'Online'})
                </div>
              `
                  : ''
              }

              ${
                app.feedback
                  ? `
                <div style="background: var(--bg-glass); border: 1px solid var(--border-glass); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-top: 0.75rem; font-size: 0.88rem;">
                  <strong>Recruiter Feedback / Notes:</strong> ${app.feedback}
                </div>
              `
                  : ''
              }

              ${
                app.status === 'applied'
                  ? `
                <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
                  <button class="btn btn-outline btn-sm" onclick="Student.handleWithdraw('${app._id}')" style="color: var(--danger); border-color: var(--danger);">
                    Withdraw Application
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          `;
          })
          .join('');
      }
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger);">Error loading applications: ${err.message}</div>`;
    }
  },

  async handleWithdraw(appId) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const res = await apiFetch(`/student/applications/${appId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('Application withdrawn successfully', 'info');
        this.loadApplications();
        this.loadJobs();
        this.loadDashboardSummary();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },
};

window.Student = Student;
