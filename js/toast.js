/**
 * Toast Notification System
 * Displays toast messages to users
 */

const ToastSystem = {
    container: null,
    maxToasts: 5,

    /**
     * Initialize toast container
     */
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Show toast message
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'success', duration = 3000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toast.innerHTML = `
            <i class="fas fa-${icons[type] || icons.success}"></i>
            <span></span>
            <button type="button" class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;
        toast.querySelector('span').textContent = message;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        this.container.appendChild(toast);

        // Keep at most maxToasts visible
        while (this.container.children.length > this.maxToasts) {
            this.container.firstElementChild.remove();
        }

        requestAnimationFrame(() => toast.classList.add('toast-show'));

        setTimeout(() => this.dismiss(toast), duration);

        return toast;
    },

    /**
     * Dismiss toast
     * @param {HTMLElement} toast - Toast element to dismiss
     */
    dismiss(toast) {
        if (!toast || !toast.parentElement || toast.dataset.dismissed) return;
        toast.dataset.dismissed = 'true';

        toast.classList.add('toast-hide');
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) toast.remove();
        });
        // Fallback in case transitionend doesn't fire
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    },

    /**
     * Clear all toasts
     */
    clearAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    },

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => ToastSystem.init());

// Convenience function used across modules
function showToast(message, type = 'success') {
    ToastSystem.show(message, type);
}

// Export
window.ToastSystem = ToastSystem;
window.showToast = showToast;
