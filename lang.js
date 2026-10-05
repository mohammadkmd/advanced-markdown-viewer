// Language System for Advanced Markdown Viewer
const translations = {
    en: {
        // Header
        'app-title': 'Advanced Markdown Viewer',
        'app-subtitle': 'Professional markdown processor with advanced features',

        // Buttons & Labels
        'theme-toggle': 'Toggle Theme',
        'lang-toggle': 'Change Language',
        'settings-btn': 'Settings',
        'open-btn': 'Open file',
        'close-btn': 'Close',
        'rtl-label': 'RTL Text',
        'code-rtl-label': 'RTL Code Comments',
        'sync-scroll-label': 'Sync Scroll',
        'accent-label': 'Accent Color',

        // Mobile tabs
        'tab-editor': 'Write',
        'tab-preview': 'Preview',

        // Editor Section
        'editor-title': 'Markdown Editor',
        'clear-btn': 'Clear',
        'copy-btn': 'Copy',
        'placeholder': 'Write your Markdown content here...',

        // Toolbar
        'tb-bold': 'Bold (Ctrl+B)',
        'tb-italic': 'Italic (Ctrl+I)',
        'tb-strike': 'Strikethrough',
        'tb-mark': 'Highlight',
        'tb-h1': 'Heading 1',
        'tb-h2': 'Heading 2',
        'tb-h3': 'Heading 3',
        'tb-quote': 'Quote',
        'tb-ul': 'Bullet list',
        'tb-ol': 'Numbered list',
        'tb-task': 'Task list',
        'tb-inline-code': 'Inline code',
        'tb-code-block': 'Code block',
        'tb-link': 'Link (Ctrl+K)',
        'tb-image': 'Image',
        'tb-table': 'Table',
        'tb-math': 'Math block',
        'tb-hr': 'Divider',
        'tb-emoji': 'Emoji',

        // Emoji picker
        'emoji-search': 'Search emoji...',
        'emoji-no-results': 'No emoji found',

        // Status Bar
        'characters': 'characters',
        'words': 'words',
        'lines': 'lines',

        // Preview Section
        'preview-title': 'Preview',
        'fullscreen-btn': 'Fullscreen',
        'outline-btn': 'Outline',
        'outline-title': 'Outline',
        'outline-empty': 'No headings yet — add some markdown headings to build the outline.',

        // Export
        'export-btn': 'Export',
        'export-html': 'Download HTML',
        'export-md': 'Download Markdown',
        'export-copy-html': 'Copy HTML',
        'export-print': 'Print / Save as PDF',

        // States
        'empty-title': 'Waiting for content...',
        'empty-desc': 'Start typing or drop a Markdown file anywhere',
        'error-title': 'Error processing content',
        'drop-overlay-text': 'Drop your Markdown file to open it',

        // Alerts
        'alert-note': 'Note',
        'alert-tip': 'Tip',
        'alert-important': 'Important',
        'alert-warning': 'Warning',
        'alert-caution': 'Caution',

        // Modals
        'modal-title': 'Sample Markdown Content',
        'modal-body': 'Would you like to load sample Markdown content?',
        'modal-cancel': 'Cancel',
        'modal-confirm': 'Yes, Load Sample',
        'confirm-title': 'Are you sure?',
        'confirm-ok': 'Confirm',

        // Print / PDF
        'print-continued': '(continued)',
        'toast-print-preparing': 'Preparing document for print…',
        'toast-print-error': 'Print failed',

        // Footer
        'footer-credit': 'Crafted by Mohammad Kafshgar',

        // Toast Messages
        'toast-file-loaded': 'File loaded successfully!',
        'toast-content-copied': 'Content copied!',
        'toast-content-cleared': 'Content cleared!',
        'toast-sample-loaded': 'Sample content loaded!',
        'toast-html-downloaded': 'HTML file downloaded successfully!',
        'toast-md-downloaded': 'Markdown file downloaded successfully!',
        'toast-html-copied': 'HTML copied to clipboard!',
        'toast-no-content': 'No content to process!',
        'toast-copy-error': 'Error copying content!',
        'toast-invalid-file': 'Please select a valid Markdown file!',
        'toast-clear-confirm': 'Are you sure you want to clear the content?',
        'toast-fullscreen-error': 'Fullscreen is not available'
    },

    fa: {
        // Header
        'app-title': 'نمایشگر Markdown پیشرفته',
        'app-subtitle': 'پردازشگر حرفه‌ای فایل‌های مارک‌داون با قابلیت‌های پیشرفته',

        // Buttons & Labels
        'theme-toggle': 'تغییر تم',
        'lang-toggle': 'تغییر زبان',
        'settings-btn': 'تنظیمات',
        'open-btn': 'باز کردن فایل',
        'close-btn': 'بستن',
        'rtl-label': 'متن راست‌چین',
        'code-rtl-label': 'کامنت کد راست‌چین',
        'sync-scroll-label': 'اسکرول همزمان',
        'accent-label': 'رنگ اصلی',

        // Mobile tabs
        'tab-editor': 'نوشتن',
        'tab-preview': 'پیش‌نمایش',

        // Editor Section
        'editor-title': 'ویرایشگر Markdown',
        'clear-btn': 'پاک کردن',
        'copy-btn': 'کپی',
        'placeholder': 'محتوای Markdown خود را اینجا بنویسید...',

        // Toolbar
        'tb-bold': 'پررنگ (Ctrl+B)',
        'tb-italic': 'کج (Ctrl+I)',
        'tb-strike': 'خط‌خورده',
        'tb-mark': 'هایلایت',
        'tb-h1': 'تیتر ۱',
        'tb-h2': 'تیتر ۲',
        'tb-h3': 'تیتر ۳',
        'tb-quote': 'نقل قول',
        'tb-ul': 'لیست نقطه‌ای',
        'tb-ol': 'لیست شماره‌دار',
        'tb-task': 'لیست وظایف',
        'tb-inline-code': 'کد درون‌خطی',
        'tb-code-block': 'بلوک کد',
        'tb-link': 'لینک (Ctrl+K)',
        'tb-image': 'تصویر',
        'tb-table': 'جدول',
        'tb-math': 'بلوک ریاضی',
        'tb-hr': 'خط جداکننده',
        'tb-emoji': 'ایموجی',

        // Emoji picker
        'emoji-search': 'جستجوی ایموجی...',
        'emoji-no-results': 'ایموجی پیدا نشد',

        // Status Bar
        'characters': 'کاراکتر',
        'words': 'کلمه',
        'lines': 'خط',

        // Preview Section
        'preview-title': 'پیش‌نمایش',
        'fullscreen-btn': 'تمام صفحه',
        'outline-btn': 'فهرست مطالب',
        'outline-title': 'فهرست مطالب',
        'outline-empty': 'هنوز تیتری وجود ندارد — برای ساختن فهرست، تیتر مارک‌داون اضافه کنید.',

        // Export
        'export-btn': 'خروجی',
        'export-html': 'دانلود HTML',
        'export-md': 'دانلود Markdown',
        'export-copy-html': 'کپی HTML',
        'export-print': 'چاپ / ذخیره PDF',

        // States
        'empty-title': 'در انتظار محتوا...',
        'empty-desc': 'شروع به نوشتن کنید یا فایل Markdown را اینجا رها کنید',
        'error-title': 'خطا در پردازش محتوا',
        'drop-overlay-text': 'فایل Markdown را رها کنید تا باز شود',

        // Alerts
        'alert-note': 'یادداشت',
        'alert-tip': 'پیشنهاد',
        'alert-important': 'مهم',
        'alert-warning': 'هشدار',
        'alert-caution': 'احتیاط',

        // Modals
        'modal-title': 'نمونه محتوای Markdown',
        'modal-body': 'آیا می‌خواهید نمونه محتوای Markdown بارگذاری شود؟',
        'modal-cancel': 'انصراف',
        'modal-confirm': 'بله، بارگذاری کن',
        'confirm-title': 'آیا مطمئن هستید؟',
        'confirm-ok': 'تأیید',

        // Print / PDF
        'print-continued': '(ادامه)',
        'toast-print-preparing': 'در حال آماده‌سازی سند برای چاپ…',
        'toast-print-error': 'چاپ ناموفق بود',

        // Footer
        'footer-credit': 'ساخته شده توسط محمد کفشگر',

        // Toast Messages
        'toast-file-loaded': 'فایل با موفقیت بارگذاری شد!',
        'toast-content-copied': 'محتوا کپی شد!',
        'toast-content-cleared': 'محتوا پاک شد!',
        'toast-sample-loaded': 'محتوای نمونه بارگذاری شد!',
        'toast-html-downloaded': 'فایل HTML با موفقیت دانلود شد!',
        'toast-md-downloaded': 'فایل Markdown با موفقیت دانلود شد!',
        'toast-html-copied': 'HTML در کلیپ‌بورد کپی شد!',
        'toast-no-content': 'محتوایی برای پردازش وجود ندارد!',
        'toast-copy-error': 'خطا در کپی کردن!',
        'toast-invalid-file': 'لطفاً فایل Markdown معتبر انتخاب کنید!',
        'toast-clear-confirm': 'آیا از پاک کردن محتوا مطمئن هستید؟',
        'toast-fullscreen-error': 'حالت تمام صفحه در دسترس نیست'
    }
};

// Current language (default: English)
let currentLang = 'en';

// Function to get translation
function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

// Function to update all translations in DOM
function updateTranslations() {
    document.querySelectorAll('[data-lang]').forEach((element) => {
        element.textContent = t(element.getAttribute('data-lang'));
    });

    document.querySelectorAll('[data-lang-title]').forEach((element) => {
        element.title = t(element.getAttribute('data-lang-title'));
    });

    document.querySelectorAll('[data-lang-placeholder]').forEach((element) => {
        element.placeholder = t(element.getAttribute('data-lang-placeholder'));
    });
}

// Function to switch language
function switchLanguage(lang) {
    currentLang = lang;
    window.currentLang = lang;

    // Update HTML lang and direction
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

    // UI typography follows the UI language
    document.documentElement.dataset.uiLang = lang;

    // Update language button label
    const langCode = document.querySelector('.lang-code');
    if (langCode) {
        langCode.textContent = lang === 'fa' ? 'FA' : 'EN';
    }

    // Save preference
    localStorage.setItem('markdown-viewer-lang', lang);

    // Apply all translations
    updateTranslations();
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('markdown-viewer-lang') || 'en';
    switchLanguage(savedLang);
});

// Export functions for use in other modules
window.t = t;
window.switchLanguage = switchLanguage;
window.updateTranslations = updateTranslations;
window.currentLang = currentLang;
