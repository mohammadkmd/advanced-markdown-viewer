/**
 * Utility Functions
 * Helper functions used throughout the application
 */

/**
 * Check if text contains Persian/Arabic script characters
 * @param {string} text - Text to check
 * @returns {boolean}
 */
function containsPersian(text) {
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return persianRegex.test(text || '');
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function}
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

/**
 * Escape a string for safe use inside a double-quoted HTML attribute
 * @param {string} text
 * @returns {string}
 */
function escapeAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Generate unique ID
 * @returns {string}
 */
function generateId() {
    return '_' + Math.random().toString(36).slice(2, 11);
}

/**
 * Format number with locale
 * @param {number} num - Number to format
 * @returns {string}
 */
function formatNumber(num) {
    const locale = window.currentLang === 'fa' ? 'fa-IR' : 'en-US';
    return num.toLocaleString(locale);
}

/**
 * Copy text to clipboard with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch (e) {
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

/**
 * Download content as a file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType = 'text/html;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Get timestamp for filenames
 * @returns {string}
 */
function getTimestamp() {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

/**
 * Build a URL-safe slug from heading text
 * @param {string} text - Raw heading text (markdown source)
 * @returns {string}
 */
function slugify(text) {
    return (text || '')
        .toLowerCase()
        .trim()
        .replace(/<[^>]*>/g, '')
        .replace(/[[\]()!`*_~~=]/g, '')
        .replace(/[^\w\u0600-\u06FF]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
}

/**
 * Local storage helper with error handling
 */
const Storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? defaultValue : JSON.parse(value);
        } catch (e) {
            console.warn(`Error reading from localStorage: ${key}`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`Error writing to localStorage: ${key}`, e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn(`Error removing from localStorage: ${key}`, e);
            return false;
        }
    }
};

// Export functions
window.Utils = {
    containsPersian,
    debounce,
    throttle,
    escapeHtml,
    escapeAttr,
    generateId,
    formatNumber,
    copyToClipboard,
    downloadFile,
    getTimestamp,
    slugify,
    Storage
};
