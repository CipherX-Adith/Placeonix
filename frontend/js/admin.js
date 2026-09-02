// Administrator Dashboard Logic for Placeonix (Light Mode & Modern Analytics)

const Admin = {
  analyticsData: null,

  async init() {
    if (!Auth.checkAuth('admin')) return;

    this.updateHeaderUI();
    this.initNotifications();
    this.setupTabNavigation();
    this.setupEventListeners();

    // Initial loads
    await this.loadAnalytics();
    await this.loadCompanies();
    await this.loadUsers();
    await this.loadDrives();
  },

  updateHeaderUI() {
    const user = Auth.getUser();
    if (!user) return;
    const nameEl = document.getElementById('sidebar-adm-name');
    const avatarEl = document.getElementById('sidebar-adm-avatar');
    if (nameEl) nameEl.textContent = user.name || 'Placement Officer';
    if (avatarEl) avatarEl.textContent = (user.name || 'A')[0].toUpperCase();
  },

  initNotifications() {
    const btn = document.getElementById('adm-notif-btn');
    const panel = document.getElementById('adm-notif-panel');
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
    const list = document.getElementById('adm-notif-list');
    if (!list) return;
    list.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
    try {
      const res = await apiFetch('/notifications');
      if (!res.success || !res.notifications.length) {
        list.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--gray-400);font-size:var(--text-sm);">No notifications</div>';
        return;
      }
      const unread = res.notifications.filter((n) => !n.isRead).length;
      const dot = document.getElementById('adm-notif-dot');
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

    document.getElementById('admin-logout-btn')?.addEventListener('click', (e) => {
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

    if (targetTab === 'overview') this.loadAnalytics();
    if (targetTab === 'companies') this.loadCompanies();
    if (targetTab === 'users') this.loadUsers();
    if (targetTab === 'drives') this.loadDrives();
    if (targetTab === 'reports') this.loadReportsPreview();

    window.scrollTo(0, 0);
  },

  setupEventListeners() {
    const driveForm = document.getElementById('create-drive-form');
    if (driveForm) {
      driveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleCreateDrive();
      });
    }

    const companyFilter = document.getElementById('admin-company-filter');
    if (companyFilter) {
      companyFilter.addEventListener('change', () => this.loadCompanies());
    }

    const userRoleFilter = document.getElementById('admin-user-role-filter');
    if (userRoleFilter) {
      userRoleFilter.addEventListener('change', () => this.loadUsers());
    }
  },

  async loadAnalytics() {
    try {
      const res = await apiFetch('/admin/analytics');
      if (res.success) {
        this.analyticsData = res.analytics;
        const a = res.analytics;

        document.getElementById('admin-metric-students').textContent = a.totalStudents || 0;
        document.getElementById('admin-metric-placed').textContent = a.placedStudentsCount || 0;
        document.getElementById('admin-metric-placement-rate').textContent = `${a.placementRate || 0}%`;
        document.getElementById('admin-metric-companies').textContent = a.totalCompanies || 0;
        document.getElementById('admin-metric-pending-verifications').textContent = a.pendingCompanies || 0;
        document.getElementById('admin-metric-jobs').textContent = a.activeJobs || 0;

        // Render Branch Distribution
        this.renderBranchDistribution(a.branchDistribution || []);
      }
    } catch (err) {
      console.error(err);
    }
  },

  renderBranchDistribution(branches) {
    const container = document.getElementById('branch-stats-container');
    if (!container) return;

    if (branches.length === 0) {
      container.innerHTML = `<p style="color:var(--gray-400);padding:var(--space-4);text-align:center;">No student academic records recorded yet.</p>`;
      return;
    }

    const maxStudents = Math.max(...branches.map((b) => b.totalStudents || 1));

    container.innerHTML = branches
      .map((b) => {
        const pct = Math.round(((b.totalStudents || 0) / maxStudents) * 100);
        return `
        <div class="bar-chart-row">
          <div class="bar-chart-label" title="${b._id || 'Unassigned'}">
            <strong>${b._id || 'General'}</strong>
            <span style="font-size:var(--text-xs);color:var(--gray-500);margin-left:4px;">(Avg ${((b.avgCgpa || 0)).toFixed(1)} CGPA)</span>
          </div>
          <div class="bar-chart-track">
            <div class="bar-chart-fill" style="width: ${Math.max(10, pct)}%;"></div>
          </div>
          <div class="bar-chart-value">${b.totalStudents}</div>
        </div>
      `;
      })
      .join('');
  },

  async loadCompanies() {
    const tbody = document.getElementById('admin-companies-table-body');
    if (!tbody) return;

    const filterVal = document.getElementById('admin-company-filter')?.value || '';
    const query = filterVal ? `?status=${filterVal}` : '';

    try {
      const res = await apiFetch(`/admin/companies${query}`);
      if (res.success) {
        const companies = res.companies;

        if (companies.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: var(--space-8); color: var(--gray-400);">No company partner records found.</td></tr>`;
          return;
        }

        tbody.innerHTML = companies
          .map((c) => {
            const s = c.verifiedStatus;
            const badgeClass = s === 'verified' ? 'selected' : s === 'rejected' ? 'rejected' : 'under-review';

            return `
          <tr>
            <td>
              <strong>${c.name}</strong>
              <div style="font-size: var(--text-xs); color: var(--gray-500);">${c.location || 'Location Not Set'}</div>
            </td>
            <td>${c.industry || 'IT'}</td>
            <td>
              ${c.website ? `<a href="${c.website}" target="_blank" style="color: var(--primary); font-weight: 500;">${c.website}</a>` : '—'}
            </td>
            <td>
              <span class="status-badge ${badgeClass}">
                ${c.verifiedStatus.toUpperCase()}
              </span>
            </td>
            <td>${c.createdBy?.name || 'Recruiter'}</td>
            <td>
              <div style="display: flex; gap: var(--space-2);">
                ${
                  c.verifiedStatus !== 'verified'
                    ? `<button class="btn btn-sm btn-success" onclick="Admin.verifyCompany('${c._id}', 'verified')">✓ Approve</button>`
                    : ''
                }
                ${
                  c.verifiedStatus !== 'rejected'
                    ? `<button class="btn btn-sm btn-danger" onclick="Admin.verifyCompany('${c._id}', 'rejected')">✕ Reject</button>`
                    : ''
                }
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

  async verifyCompany(companyId, status) {
    const notes = prompt(`Enter verification remarks for ${status.toUpperCase()}:`, '');
    if (notes === null) return;

    try {
      const res = await apiFetch(`/admin/companies/${companyId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      });

      if (res.success) {
        showToast(res.message, 'success');
        this.loadCompanies();
        this.loadAnalytics();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async loadUsers() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    const roleFilter = document.getElementById('admin-user-role-filter')?.value || '';
    const query = roleFilter ? `?role=${roleFilter}` : '';

    try {
      const res = await apiFetch(`/admin/users${query}`);
      if (res.success) {
        const users = res.users;

        if (users.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: var(--space-8); color: var(--gray-400);">No user accounts found.</td></tr>`;
          return;
        }

        tbody.innerHTML = users
          .map((u) => {
            const roleBadge = u.role === 'admin' ? 'under-review' : u.role === 'recruiter' ? 'interview' : 'selected';
            return `
          <tr>
            <td>
              <strong>${u.name}</strong>
              <div style="font-size: var(--text-xs); color: var(--gray-500);">${u.email}</div>
            </td>
            <td>
              <span class="status-badge ${roleBadge}">
                ${u.role.toUpperCase()}
              </span>
            </td>
            <td>
              ${
                u.role === 'student'
                  ? `${u.profile?.branch || 'CSE'} (CGPA: ${u.profile?.cgpa || '—'})`
                  : u.role === 'recruiter'
                  ? `${u.profile?.company?.name || 'Company'} (${u.profile?.designation || 'Recruiter'})`
                  : 'Placement Cell Officer'
              }
            </td>
            <td>
              <span class="status-badge ${u.isActive ? 'selected' : 'rejected'}">
                ${u.isActive ? 'Active' : 'Deactivated'}
              </span>
            </td>
            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            <td>
              ${
                u.role !== 'admin'
                  ? `
                <button class="btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}" onclick="Admin.toggleUser('${u._id}')" style="${u.isActive ? 'color:var(--danger);' : ''}">
                  ${u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              `
                  : '<span style="font-size: var(--text-xs); color: var(--gray-400);">Protected</span>'
              }
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

  async toggleUser(userId) {
    try {
      const res = await apiFetch(`/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
      });
      if (res.success) {
        showToast(res.message, 'info');
        this.loadUsers();
        this.loadAnalytics();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async loadDrives() {
    const container = document.getElementById('admin-drives-container');
    if (!container) return;

    try {
      const res = await apiFetch('/admin/drives');
      if (res.success) {
        const drives = res.drives;

        if (drives.length === 0) {
          container.innerHTML = `
            <div class="card p-5" style="grid-column:1/-1;text-align: center; color: var(--gray-400);">
              No recruitment drives created yet. Click "+ Create Drive" above.
            </div>
          `;
          return;
        }

        container.innerHTML = drives
          .map(
            (d) => `
          <div class="card p-5">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3);">
              <div>
                <div style="font-size:var(--text-base);font-weight:700;">${d.title}</div>
                <div style="color:var(--primary);font-size:var(--text-xs);font-weight:600;margin-top:2px;">
                  Academic Year: ${d.academicYear} · Officer: ${d.coordinatorName}
                </div>
              </div>
              <span class="status-badge selected">${d.status.toUpperCase()}</span>
            </div>
            <p style="color:var(--gray-600);font-size:var(--text-sm);line-height:1.5;margin-bottom:var(--space-4);">
              ${d.description || 'No description provided.'}
            </p>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;font-size:var(--text-xs);color:var(--gray-500);border-top:1px solid var(--gray-100);padding-top:var(--space-3);">
              <span>📅 Start: <strong>${new Date(d.startDate).toLocaleDateString()}</strong></span>
              <span>📅 End: <strong>${new Date(d.endDate).toLocaleDateString()}</strong></span>
              <span>🎯 Min CGPA: <strong>${d.minCgpa}</strong></span>
            </div>
          </div>
        `
          )
          .join('');
      }
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async handleCreateDrive() {
    try {
      const data = {
        title: document.getElementById('drive-title').value,
        academicYear: document.getElementById('drive-academic-year').value,
        startDate: document.getElementById('drive-start-date').value,
        endDate: document.getElementById('drive-end-date').value,
        minCgpa: document.getElementById('drive-min-cgpa').value,
        coordinatorName: document.getElementById('drive-coordinator').value,
        description: document.getElementById('drive-description').value,
      };

      const res = await apiFetch('/admin/drives', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success) {
        showToast('Campus Placement Drive created & broadcasted!', 'success');
        document.getElementById('create-drive-form').reset();
        this.closeModal('create-drive-modal');
        this.loadDrives();
        this.loadAnalytics();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async loadReportsPreview() {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: var(--space-8);"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

    try {
      const res = await apiFetch('/admin/reports/placement');
      if (res.success) {
        const report = res.report;
        document.getElementById('report-total-offers').textContent = res.totalSelections || 0;

        if (report.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--gray-400);">No placement selections recorded yet.</td></tr>`;
          return;
        }

        tbody.innerHTML = report
          .map(
            (r) => `
          <tr>
            <td><strong>#${r.slNo}</strong></td>
            <td>
              <strong>${r.studentName}</strong>
              <div style="font-size: var(--text-xs); color: var(--gray-500);">${r.email}</div>
            </td>
            <td>${r.rollNo}</td>
            <td>${r.branch} <span class="skill-chip" style="margin-left:4px;">CGPA ${r.cgpa}</span></td>
            <td><strong>${r.company}</strong></td>
            <td>${r.jobTitle} • <span style="color: var(--success); font-weight:700;">₹${r.packageCtc} LPA</span></td>
            <td>${r.selectionDate}</td>
          </tr>
        `
          )
          .join('');
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
  },

  async exportReportCSV() {
    try {
      const res = await apiFetch('/admin/reports/placement');
      if (!res.success || !res.report || res.report.length === 0) {
        showToast('No placement data available to export.', 'warning');
        return;
      }

      const headers = ['Sl No', 'Student Name', 'Roll No', 'Email', 'Phone', 'Branch', 'CGPA', 'Company', 'Job Title', 'CTC / Package', 'Role', 'Selection Date'];
      const rows = res.report.map((r) => [
        r.slNo,
        `"${r.studentName}"`,
        `"${r.rollNo}"`,
        `"${r.email}"`,
        `"${r.phone}"`,
        `"${r.branch}"`,
        r.cgpa,
        `"${r.company}"`,
        `"${r.jobTitle}"`,
        `"${r.packageCtc}"`,
        `"${r.role}"`,
        `"${r.selectionDate}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Placeonix_Placement_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Placement report downloaded as CSV!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  openCreateDriveModal() {
    document.getElementById('create-drive-modal').classList.add('open');
  },

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('open');
  },
};

window.Admin = Admin;
