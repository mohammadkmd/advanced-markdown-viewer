/**
 * Event Handlers Module
 * Orchestrates all application events: header controls, editor toolbar,
 * emoji picker, drag & drop, export menu, outline panel, split divider,
 * mobile tabs, keyboard shortcuts and settings persistence.
 */

const EventHandlers = {
    elements: null,
    renderTimeout: null,
    saveTimeout: null,
    syncRaf: null,
    outlineObserver: null,
    dragState: null,

    init() {
        this.cacheElements();
        this.loadSettings();
        this.bindEvents();
        this.loadContent();
        this.initializeApp();
    },

    /* ================= Elements ================= */

    cacheElements() {
        const $ = (id) => document.getElementById(id);
        this.elements = {
            body: document.body,
            html: document.documentElement,

            // Header
            themeToggle: $('themeToggle'),
            themeIcon: $('themeIcon'),
            langToggle: $('langToggle'),
            settingsBtn: $('settingsBtn'),
            settingsPopover: $('settingsPopover'),
            rtlToggle: $('rtlToggle'),
            codeRtlToggle: $('codeRtlToggle'),
            syncScrollToggle: $('syncScrollToggle'),
            accentSwatches: $('accentSwatches'),

            // Mobile tabs
            tabEditor: $('tabEditor'),
            tabPreview: $('tabPreview'),

            // Editor
            markdownInput: $('markdownInput'),
            lineNumbers: $('lineNumbers'),
            editorToolbar: $('editorToolbar'),
            openFileBtn: $('openFileBtn'),
            copyBtn: $('copyBtn'),
            clearBtn: $('clearBtn'),
            fileInput: $('markdownFile'),

            // Emoji picker
            emojiBtn: $('emojiBtn'),
            emojiPopover: $('emojiPopover'),
            emojiSearch: $('emojiSearch'),
            emojiGrid: $('emojiGrid'),

            // Preview
            markdownPreview: $('markdownPreview'),
            previewWrapper: $('previewWrapper'),
            previewPane: $('previewPane'),
            fullscreenBtn: $('fullscreenBtn'),
            outlineBtn: $('outlineBtn'),
            outlinePanel: $('outlinePanel'),
            outlineList: $('outlineList'),
            outlineClose: $('outlineClose'),
            outlineBackdrop: $('outlineBackdrop'),
            exportBtn: $('exportBtn'),
            exportMenu: $('exportMenu'),
            exportHtmlBtn: $('exportHtmlBtn'),
            exportMdBtn: $('exportMdBtn'),
            exportCopyBtn: $('exportCopyBtn'),
            exportPrintBtn: $('exportPrintBtn'),

            // Layout
            workspace: $('workspace'),
            paneDivider: $('paneDivider'),

            // Overlays
            dropOverlay: $('dropOverlay'),
            sampleModal: $('sampleModal'),
            modalClose: $('modalClose'),
            modalCancel: $('modalCancel'),
            modalConfirm: $('modalConfirm'),
            confirmModal: $('confirmModal'),
            confirmBody: $('confirmBody'),
            confirmOk: $('confirmOk'),
            confirmCancel: $('confirmCancel'),
            confirmClose: $('confirmClose'),

            // Misc
            toastContainer: $('toastContainer'),
            highlightThemeDark: $('highlightThemeDark'),
            highlightThemeLight: $('highlightThemeLight')
        };

        // Wire the editor enhancer to the elements it manipulates
        EditorEnhancer.init({
            markdownInput: this.elements.markdownInput,
            lineNumbers: this.elements.lineNumbers,
            previewWrapper: this.elements.previewWrapper,
            markdownPreview: this.elements.markdownPreview
        });
    },

    /* ================= Settings persistence ================= */

    loadSettings() {
        const settings = Storage.get('mdv-settings', {});
        const s = window.AppState;

        s.theme = settings.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        s.accent = settings.accent || 'indigo';
        s.isRTL = !!settings.isRTL;
        s.isCodeRTL = !!settings.isCodeRTL;
        s.syncScroll = settings.syncScroll !== false;

        this.applyTheme();
        this.applyAccent();
        this.applyRTLState();
        this.applySplit(settings.split || 50);
    },

    saveSettings() {
        const s = window.AppState;
        Storage.set('mdv-settings', {
            theme: s.theme,
            accent: s.accent,
            isRTL: s.isRTL,
            isCodeRTL: s.isCodeRTL,
            syncScroll: s.syncScroll,
            split: this.currentSplit || 50
        });
    },

    /* ================= Theme & accent ================= */

    applyTheme() {
        const s = window.AppState;
        this.elements.html.dataset.theme = s.theme;
        this.elements.body.classList.toggle('dark-theme', s.theme === 'dark');

        if (this.elements.themeIcon) {
            this.elements.themeIcon.className = s.theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }

        // Switch highlight.js theme stylesheet
        const { highlightThemeDark, highlightThemeLight } = this.elements;
        if (highlightThemeDark && highlightThemeLight) {
            highlightThemeDark.disabled = s.theme !== 'dark';
            highlightThemeLight.disabled = s.theme === 'dark';
        }

        // Force mermaid to re-initialize with the new theme on next render
        if (window.MermaidRenderer) {
            MermaidRenderer._initializedTheme = null;
        }
    },

    handleThemeToggle() {
        window.AppState.theme = window.AppState.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveSettings();
        if (window.renderMarkdown && this.elements.markdownInput) {
            renderMarkdown(this.elements.markdownInput.value);
        }
    },

    applyAccent() {
        const s = window.AppState;
        this.elements.html.dataset.accent = s.accent;
        if (this.elements.accentSwatches) {
            this.elements.accentSwatches.querySelectorAll('.swatch').forEach((sw) => {
                sw.classList.toggle('active', sw.dataset.accent === s.accent);
            });
        }
    },

    handleAccentSelect(e) {
        const swatch = e.target.closest('.swatch');
        if (!swatch) return;
        window.AppState.accent = swatch.dataset.accent;
        this.applyAccent();
        this.saveSettings();
    },

    /* ================= RTL ================= */

    applyRTLState() {
        const s = window.AppState;
        const { markdownInput, rtlToggle, codeRtlToggle, syncScrollToggle } = this.elements;

        if (rtlToggle) rtlToggle.checked = s.isRTL;
        if (codeRtlToggle) codeRtlToggle.checked = s.isCodeRTL;
        if (syncScrollToggle) syncScrollToggle.checked = s.syncScroll;

        if (markdownInput) {
            markdownInput.classList.toggle('rtl-text', s.isRTL);
        }
    },

    handleRTLToggle(e) {
        window.AppState.isRTL = e.target.checked;
        this.applyRTLState();
        this.saveSettings();
        this.rerender();
    },

    handleCodeRTLToggle(e) {
        window.AppState.isCodeRTL = e.target.checked;
        this.saveSettings();
        this.rerender();
    },

    handleSyncScrollToggle(e) {
        window.AppState.syncScroll = e.target.checked;
        this.saveSettings();
    },

    /* ================= Language ================= */

    handleLanguageToggle() {
        const newLang = window.currentLang === 'en' ? 'fa' : 'en';
        if (window.switchLanguage) {
            switchLanguage(newLang);
        }
        if (window.updateStats) {
            EditorEnhancer.updateStats();
        }
        this.rerender();
    },

    rerender() {
        if (window.renderMarkdown && this.elements.markdownInput) {
            renderMarkdown(this.elements.markdownInput.value);
        }
    },

    /* ================= Event binding ================= */

    bindEvents() {
        const el = this.elements;

        // Header
        el.langToggle.addEventListener('click', () => this.handleLanguageToggle());
        el.themeToggle.addEventListener('click', () => this.handleThemeToggle());
        el.settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopover(el.settingsPopover, el.settingsBtn);
        });
        el.rtlToggle.addEventListener('change', (e) => this.handleRTLToggle(e));
        el.codeRtlToggle.addEventListener('change', (e) => this.handleCodeRTLToggle(e));
        el.syncScrollToggle.addEventListener('change', (e) => this.handleSyncScrollToggle(e));
        el.accentSwatches.addEventListener('click', (e) => this.handleAccentSelect(e));

        // Mobile tabs
        el.tabEditor.addEventListener('click', () => this.setMobileView('editor'));
        el.tabPreview.addEventListener('click', () => this.setMobileView('preview'));

        // Editor input
        el.markdownInput.addEventListener('input', () => this.handleInputChange());
        el.markdownInput.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        el.markdownInput.addEventListener('scroll', () => this.handleEditorScroll());
        el.markdownInput.addEventListener('click', () => EditorEnhancer.updateCursorPos());
        el.markdownInput.addEventListener('keyup', () => EditorEnhancer.updateCursorPos());

        // Toolbar
        el.editorToolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-cmd]');
            if (btn) {
                EditorEnhancer.format(btn.dataset.cmd);
                return;
            }
        });
        el.emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopover(el.emojiPopover, el.emojiBtn);
        });
        el.emojiSearch.addEventListener('input', () => this.renderEmojiGrid(el.emojiSearch.value));
        el.emojiGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.emoji-item');
            if (!item) return;
            EditorEnhancer.insertText(item.dataset.code);
            this.closePopovers();
            el.markdownInput.focus();
        });

        // File handling
        el.openFileBtn.addEventListener('click', () => el.fileInput.click());
        el.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadFile(e.target.files[0]);
            e.target.value = '';
        });
        this.bindDragDrop();

        // Editor actions
        el.clearBtn.addEventListener('click', () => this.handleClear());
        el.copyBtn.addEventListener('click', () => this.handleCopy());

        // Export menu
        el.exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopover(el.exportMenu, el.exportBtn);
        });
        el.exportHtmlBtn.addEventListener('click', () => { this.closePopovers(); HTMLExporter.download(); });
        el.exportMdBtn.addEventListener('click', () => { this.closePopovers(); HTMLExporter.downloadMarkdown(); });
        el.exportCopyBtn.addEventListener('click', () => { this.closePopovers(); HTMLExporter.copyHTML(); });
        el.exportPrintBtn.addEventListener('click', () => { this.closePopovers(); HTMLExporter.print(); });

        // Fullscreen
        el.fullscreenBtn.addEventListener('click', () => this.handleFullscreen());
        document.addEventListener('fullscreenchange', () => {
            const active = document.fullscreenElement === el.previewPane;
            window.AppState.isFullscreen = active;
            el.previewPane.classList.toggle('is-fullscreen', active);
            el.fullscreenBtn.innerHTML = active
                ? '<i class="fas fa-compress"></i>'
                : '<i class="fas fa-expand"></i>';
        });

        // Outline
        el.outlineBtn.addEventListener('click', () => this.toggleOutline());
        el.outlineClose.addEventListener('click', () => this.toggleOutline(false));
        el.outlineBackdrop.addEventListener('click', () => this.toggleOutline(false));
        el.outlineList.addEventListener('click', (e) => {
            const item = e.target.closest('.outline-item');
            if (!item || !item.dataset.target) return;
            const heading = el.markdownPreview.querySelector(`#${CSS.escape(item.dataset.target)}`);
            if (heading) {
                this.scrollPreviewTo(heading);
            }
            if (window.innerWidth < 1024) this.toggleOutline(false);
        });
        el.markdownPreview.addEventListener('scroll', () => {
            // rAF-throttle: one layout read per frame instead of per event
            if (this._pvScrollRaf) return;
            this._pvScrollRaf = requestAnimationFrame(() => {
                this._pvScrollRaf = null;
                this.updateActiveOutlineItem();
                EditorEnhancer.onPreviewScrollEvent();
            });
        }, { passive: true });

        // Markdown preview interactions (event delegation)
        el.markdownPreview.addEventListener('click', (e) => this.handlePreviewClick(e));
        el.markdownPreview.addEventListener('click', (e) => {
            // Anchor navigation for duplicated-id safety stays native
        });

        // Split divider
        this.bindDivider();

        // Modal (sample)
        el.modalClose.addEventListener('click', () => this.closeModal(el.sampleModal));
        el.modalCancel.addEventListener('click', () => this.closeModal(el.sampleModal));
        el.modalConfirm.addEventListener('click', () => this.handleLoadSample());
        el.sampleModal.querySelector('[data-modal-dismiss]').addEventListener('click', () => this.closeModal(el.sampleModal));

        // Confirm modal
        el.confirmCancel.addEventListener('click', () => this.resolveConfirm(false));
        el.confirmClose.addEventListener('click', () => this.resolveConfirm(false));
        el.confirmOk.addEventListener('click', () => this.resolveConfirm(true));
        el.confirmModal.querySelector('[data-modal-dismiss]').addEventListener('click', () => this.resolveConfirm(false));

        // Global events
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        window.addEventListener('beforeunload', () => {
            if (this.elements.markdownInput) {
                localStorage.setItem('markdown-content', this.elements.markdownInput.value);
            }
            this.saveSettings();
        });
    },

    /* ================= Drag & drop ================= */

    bindDragDrop() {
        const el = this.elements;
        let dragDepth = 0;

        window.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragDepth++;
            if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
                el.dropOverlay.hidden = false;
            }
        });

        window.addEventListener('dragover', (e) => e.preventDefault());

        window.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0) el.dropOverlay.hidden = true;
        });

        window.addEventListener('drop', (e) => {
            e.preventDefault();
            dragDepth = 0;
            el.dropOverlay.hidden = true;
            const file = e.dataTransfer && e.dataTransfer.files[0];
            if (!file) return;
            if (/\.(md|markdown|txt)$/i.test(file.name)) {
                this.loadFile(file);
            } else {
                showToast(t('toast-invalid-file'), 'error');
            }
        });
    },

    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.markdownInput.value = e.target.result;
            this.handleInputChange(true);
            if (window.innerWidth < 1024) {
                this.setMobileView('preview');
            }
            showToast(t('toast-file-loaded'));
        };
        reader.readAsText(file, 'UTF-8');
    },

    /* ================= Editor events ================= */

    handleInputChange(immediate = false) {
        EditorEnhancer.updateLineNumbers();
        EditorEnhancer.updateStats();

        clearTimeout(this.renderTimeout);
        if (immediate) {
            this.rerender();
        } else {
            this.renderTimeout = setTimeout(() => this.rerender(), 120);
        }

        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            localStorage.setItem('markdown-content', this.elements.markdownInput.value);
        }, 800);
    },

    handleEditorKeydown(e) {
        // Formatting shortcuts
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            const key = e.key.toLowerCase();
            if (key === 'b') { e.preventDefault(); return EditorEnhancer.format('bold'); }
            if (key === 'i') { e.preventDefault(); return EditorEnhancer.format('italic'); }
            if (key === 'k') { e.preventDefault(); return EditorEnhancer.format('link'); }
        }

        if (e.key === 'Tab') {
            return EditorEnhancer.handleTab(e);
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            return EditorEnhancer.handleEnter(e);
        }
    },

    handleEditorScroll() {
        const { lineNumbers, markdownInput } = this.elements;
        if (lineNumbers && markdownInput) {
            lineNumbers.scrollTop = markdownInput.scrollTop;
        }

        if (this.syncRaf) return;
        this.syncRaf = requestAnimationFrame(() => {
            this.syncRaf = null;
            EditorEnhancer.syncPreviewScroll();
        });
    },

    async handleCopy() {
        const value = this.elements.markdownInput.value;
        if (!value.trim()) {
            showToast(t('toast-no-content'), 'error');
            return;
        }
        const ok = await copyToClipboard(value);
        showToast(ok ? t('toast-content-copied') : t('toast-copy-error'), ok ? 'success' : 'error');
    },

    handleClear() {
        const input = this.elements.markdownInput;
        if (!input.value.trim()) return;

        this.confirm({ bodyKey: 'toast-clear-confirm' }).then((ok) => {
            if (!ok) return;
            input.value = '';
            this.handleInputChange(true);
            showToast(t('toast-content-cleared'));
        });
    },

    handleLoadSample() {
        const sample = window.getSampleMarkdown ? getSampleMarkdown() : '';
        this.elements.markdownInput.value = sample;
        this.closeModal(this.elements.sampleModal);
        this.handleInputChange(true);
        showToast(t('toast-sample-loaded'));
    },

    /* ================= Preview interactions ================= */

    /**
     * Smoothly scroll the preview to an element. If the smooth animation
     * makes no progress within ~120ms (hidden/occluded tab — Chromium
     * skips smooth scrolling there), fall back to an instant jump so the
     * anchor always lands.
     */
    scrollPreviewTo(target) {
        const pv = this.elements.markdownPreview;
        const before = pv.scrollTop;
        EditorEnhancer.onAnchorJump();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            if (Math.abs(pv.scrollTop - before) < 2) {
                target.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
        }, 130);
    },

    handlePreviewClick(e) {
        const copyBtn = e.target.closest('.code-copy-btn');
        if (copyBtn) {
            MarkdownRenderer.copyCode(copyBtn);
            return;
        }

        const figureImg = e.target.closest('.markdown-figure img');
        if (figureImg) {
            MarkdownRenderer.openLightbox(figureImg);
            return;
        }

        const anchor = e.target.closest('a.heading-anchor, a[href^="#"]');
        if (anchor) {
            const id = decodeURIComponent(anchor.getAttribute('href').slice(1));
            const target = this.elements.markdownPreview.querySelector(`#${CSS.escape(id)}`);
            if (target) {
                e.preventDefault();
                this.scrollPreviewTo(target);
                history.replaceState(null, '', `#${id}`);
            }
        }
    },

    /* ================= Fullscreen ================= */

    handleFullscreen() {
        const pane = this.elements.previewPane;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else if (pane.requestFullscreen) {
            // Optimistic icon update; the fullscreenchange listener keeps it authoritative
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            pane.requestFullscreen().catch(() => {
                this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                showToast(t('toast-fullscreen-error'), 'warning');
            });
        }
    },

    /* ================= Outline ================= */

    toggleOutline(force) {
        const el = this.elements;
        const show = force !== undefined ? force : el.outlinePanel.hidden;

        if (show) {
            this.buildOutline();
            el.outlinePanel.hidden = false;
            requestAnimationFrame(() => el.outlinePanel.classList.add('open'));
            if (window.innerWidth < 768) el.outlineBackdrop.hidden = false;
        } else {
            el.outlinePanel.classList.remove('open');
            el.outlineBackdrop.hidden = true;
            if (this.outlineObserver) {
                this.outlineObserver.disconnect();
                this.outlineObserver = null;
            }
            setTimeout(() => { if (!el.outlinePanel.classList.contains('open')) el.outlinePanel.hidden = true; }, 300);
        }
    },

    buildOutline() {
        const el = this.elements;
        const outline = MarkdownRenderer.getOutline();
        el.outlineList.innerHTML = '';

        if (!outline.length) {
            el.outlineList.innerHTML = `<div class="outline-empty">${escapeHtml(t('outline-empty'))}</div>`;
            return;
        }

        const frag = document.createDocumentFragment();
        outline.forEach((item) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'outline-item';
            btn.dataset.target = item.id;
            btn.style.paddingInlineStart = `${0.6 + (item.level - 1) * 0.85}rem`;
            btn.textContent = item.text;
            frag.appendChild(btn);
        });
        el.outlineList.appendChild(frag);
        this.updateActiveOutlineItem();
    },

    updateActiveOutlineItem() {
        const el = this.elements;
        if (!el.outlineList.childElementCount) return;

        const headings = el.markdownPreview.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const scrollTop = el.markdownPreview.scrollTop;
        let currentId = headings.length ? headings[0].id : null;

        headings.forEach((h) => {
            if (h.offsetTop - scrollTop <= 120) currentId = h.id;
        });

        el.outlineList.querySelectorAll('.outline-item').forEach((item) => {
            item.classList.toggle('active', item.dataset.target === currentId);
        });
    },

    /* ================= Split divider ================= */

    bindDivider() {
        const el = this.elements;

        el.paneDivider.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.dragState = {
                startX: e.clientX,
                startSplit: this.currentSplit || 50
            };
            el.paneDivider.classList.add('dragging');
            el.body.classList.add('is-resizing');
            el.paneDivider.setPointerCapture(e.pointerId);
        });

        el.paneDivider.addEventListener('pointermove', (e) => {
            if (!this.dragState) return;
            const rect = el.workspace.getBoundingClientRect();
            const isRTL = el.html.dir === 'rtl';
            const dx = e.clientX - this.dragState.startX;
            const deltaPct = ((isRTL ? -dx : dx) / rect.width) * 100;
            this.applySplit(this.dragState.startSplit + deltaPct);
        });

        const endDrag = (e) => {
            if (!this.dragState) return;
            this.dragState = null;
            el.paneDivider.classList.remove('dragging');
            el.body.classList.remove('is-resizing');
            try { el.paneDivider.releasePointerCapture(e.pointerId); } catch (_) {}
            this.saveSettings();
        };

        el.paneDivider.addEventListener('pointerup', endDrag);
        el.paneDivider.addEventListener('pointercancel', endDrag);
        el.paneDivider.addEventListener('dblclick', () => {
            this.applySplit(50);
            this.saveSettings();
        });
    },

    applySplit(pct) {
        const clamped = Math.min(80, Math.max(20, pct));
        this.currentSplit = clamped;
        this.elements.workspace.style.setProperty('--split', `${clamped}%`);
    },

    /* ================= Mobile view ================= */

    setMobileView(view) {
        window.AppState.mobileView = view;
        this.elements.body.dataset.mobileView = view;
        this.elements.tabEditor.classList.toggle('active', view === 'editor');
        this.elements.tabEditor.setAttribute('aria-selected', view === 'editor');
        this.elements.tabPreview.classList.toggle('active', view === 'preview');
        this.elements.tabPreview.setAttribute('aria-selected', view === 'preview');
    },

    /* ================= Popovers & modals ================= */

    togglePopover(popover, anchor) {
        const isOpen = !popover.hidden;
        this.closePopovers();
        if (!isOpen) {
            popover.hidden = false;
            popover.style.translate = '0 0';
            if (anchor) anchor.setAttribute('aria-expanded', 'true');
            this.clampPopoverToViewport(popover);
            if (popover.id === 'emojiPopover') {
                this.renderEmojiGrid('');
                this.elements.emojiSearch.value = '';
                setTimeout(() => this.elements.emojiSearch.focus(), 30);
            }
        }
    },

    /**
     * Nudge an open popover horizontally so it never leaves its clipping
     * ancestor (.pane) or the viewport — toolbars can wrap and push
     * anchors near either edge.
     */
    clampPopoverToViewport(popover) {
        const rect = popover.getBoundingClientRect();
        if (!rect.width) return;

        const clip = popover.closest('.pane');
        const clipRect = clip ? clip.getBoundingClientRect() : null;
        const leftBound = (clipRect ? clipRect.left : 0) + 8;
        const rightBound = (clipRect ? clipRect.right : innerWidth) - 8;

        let dx = 0;
        if (rect.right > rightBound) {
            dx = rightBound - rect.right;
        }
        if (rect.left + dx < leftBound) {
            dx = leftBound - rect.left;
        }
        popover.style.translate = `${Math.round(dx)}px 0`;
    },

    closePopovers() {
        document.querySelectorAll('.popover:not([hidden])').forEach((p) => {
            p.hidden = true;
            p.style.translate = '';
        });
        [this.elements.settingsBtn, this.elements.exportBtn, this.elements.emojiBtn].forEach((btn) => {
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    },

    handleOutsideClick(e) {
        if (e.target.closest('.popover-anchor')) return;
        this.closePopovers();
    },

    openModal(modal) {
        modal.classList.add('active');
    },

    closeModal(modal) {
        modal.classList.remove('active');
    },

    confirm({ bodyKey, body }) {
        return new Promise((resolve) => {
            this._confirmResolver = resolve;
            this.elements.confirmBody.textContent = bodyKey ? t(bodyKey) : (body || '');
            this.openModal(this.elements.confirmModal);
        });
    },

    resolveConfirm(result) {
        this.closeModal(this.elements.confirmModal);
        if (this._confirmResolver) {
            this._confirmResolver(result);
            this._confirmResolver = null;
        }
    },

    /* ================= Emoji picker ================= */

    renderEmojiGrid(query) {
        const el = this.elements;
        const map = window.EmojiData || {};
        const q = (query || '').trim().toLowerCase();

        el.emojiGrid.innerHTML = '';
        const frag = document.createDocumentFragment();

        let count = 0;
        for (const code of Object.keys(map)) {
            if (q && !code.includes(q)) continue;
            if (!q && count >= 128) break;
            if (count >= 160) break;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'emoji-item';
            btn.dataset.code = code;
            btn.title = code;
            btn.textContent = map[code];
            frag.appendChild(btn);
            count++;
        }

        if (!count) {
            const empty = document.createElement('div');
            empty.className = 'emoji-empty';
            empty.textContent = t('emoji-no-results') || 'No emoji found';
            frag.appendChild(empty);
        }

        el.emojiGrid.appendChild(frag);
    },

    /* ================= Keyboard shortcuts ================= */

    handleKeyboard(e) {
        const el = this.elements;

        // Ctrl/Cmd + S: Download HTML
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            HTMLExporter.download();
            return;
        }

        // Ctrl/Cmd + O: Open file
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            el.fileInput.click();
            return;
        }

        // F11: Fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            this.handleFullscreen();
            return;
        }

        if (e.key === 'Escape') {
            // Priority: popovers → modals → outline → (fullscreen handled by browser)
            const openPopover = document.querySelector('.popover:not([hidden])');
            if (openPopover) {
                this.closePopovers();
                return;
            }
            if (el.confirmModal.classList.contains('active')) {
                this.resolveConfirm(false);
                return;
            }
            if (el.sampleModal.classList.contains('active')) {
                this.closeModal(el.sampleModal);
                return;
            }
            if (!el.outlinePanel.hidden) {
                this.toggleOutline(false);
            }
        }
    },

    /* ================= Init ================= */

    loadContent() {
        const saved = localStorage.getItem('markdown-content');
        if (saved && this.elements.markdownInput) {
            this.elements.markdownInput.value = saved;
        }
    },

    initializeApp() {
        EditorEnhancer.updateLineNumbers();
        EditorEnhancer.updateStats();
        this.rerender();

        // Offer sample content when starting empty
        if (!this.elements.markdownInput.value.trim()) {
            setTimeout(() => this.openModal(this.elements.sampleModal), 600);
        }
    }
};

// Initialize on DOM ready — script order guarantees every module is loaded
document.addEventListener('DOMContentLoaded', () => EventHandlers.init());

// Export
window.EventHandlers = EventHandlers;
