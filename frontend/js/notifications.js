// In-App Notification Manager for Placeonix

const Notifications = {
  async init() {
    const bellBtn = document.getElementById('notification-bell-btn');
    const dropdown = document.getElementById('notification-dropdown');

    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        this.fetchNotifications();
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== bellBtn) {
          dropdown.classList.remove('open');
        }
      });
    }

    // Initial fetch
    if (window.Auth && window.Auth.isAuthenticated()) {
      await this.fetchNotifications();
    }
  },

  async fetchNotifications() {
    try {
      const res = await apiFetch('/notifications');
      if (res.success) {
        this.renderBadge(res.unreadCount);
        this.renderDropdown(res.notifications);
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err.message);
    }
  },

  renderBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  },

  renderDropdown(notifications) {
    const listContainer = document.getElementById('notification-list');
    if (!listContainer) return;

    if (!notifications || notifications.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
          No notifications yet.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = notifications
      .map(
        (n) => `
        <div class="notification-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
            <strong style="font-size: 0.88rem; color: var(--text-primary);">${n.title}</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">
              ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">${n.message}</p>
        </div>
      `
      )
      .join('');

    // Attach click listeners to mark as read
    listContainer.querySelectorAll('.notification-item').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = el.getAttribute('data-id');
        try {
          await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
          el.classList.remove('unread');
          this.fetchNotifications();
        } catch (e) {
          console.error(e);
        }
      });
    });
  },

  async markAllRead() {
    try {
      await apiFetch('/notifications/mark-all-read', { method: 'PUT' });
      showToast('All notifications marked as read', 'info');
      this.fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  },
};

window.Notifications = Notifications;
