/**
 * Markdown Renderer Module
 * Handles markdown parsing and rendering with enhanced features:
 * sanitization (DOMPurify), syntax highlighting, GitHub-style alerts,
 * heading anchors with unique slugs, and post-render processing
 * (per-block direction, KaTeX math, Mermaid diagrams).
 */

const MarkdownRenderer = {
    elements: null,
    onRendered: null,   // optional callback fired after every render

    _slugs: new Set(),

    /**
     * Initialize renderer and configure marked.js
     */
    init() {
        this.elements = {
            markdownInput: document.getElementById('markdownInput'),
            markdownPreview: document.getElementById('markdownPreview')
        };

        if (typeof marked === 'undefined') {
            console.error('MarkdownRenderer: marked.js is not available');
            return;
        }

        marked.setOptions({
            breaks: window.MarkedConfig.breaks,
            gfm: window.MarkedConfig.gfm
        });

        const renderer = new marked.Renderer();

        // ---- Code blocks: highlight + line numbers + copy button ----
        renderer.code = (code, infostring) => {
            const lang = (infostring || '').trim().split(/\s+/)[0].toLowerCase();

            // Diagram fences (plantuml / dot / …) become <img> figures —
            // no fetch needed, they survive export and printing.
            if (window.DiagramRenderer && window.DiagramRenderer.isDiagramLanguage(lang)) {
                return window.DiagramRenderer.buildFigure(lang, code);
            }

            const copyLabel = window.currentLang === 'fa' ? 'کپی' : 'Copy';
            const copiedLabel = window.currentLang === 'fa' ? 'کپی شد!' : 'Copied!';

            let highlighted;
            if (typeof hljs !== 'undefined') {
                try {
                    if (lang && hljs.getLanguage(lang)) {
                        highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
                    } else if (code.trim()) {
                        highlighted = hljs.highlightAuto(code).value;
                    } else {
                        highlighted = escapeHtml(code);
                    }
                } catch (e) {
                    highlighted = escapeHtml(code);
                }
            } else {
                highlighted = escapeHtml(code);
            }

            const lines = code.replace(/\n$/, '').split('\n');
            const lineNumbers = lines
                .map((_, i) => `<span class="line-number">${i + 1}</span>`)
                .join('');

            return `
                <div class="code-block-wrapper">
                    <div class="code-block-header">
                        <span class="code-language">${escapeHtml(lang || 'text')}</span>
                        <button type="button" class="code-copy-btn" data-copied="${escapeAttr(copiedLabel)}">
                            <i class="fas fa-copy"></i><span>${copyLabel}</span>
                        </button>
                    </div>
                    <div class="code-block-content">
                        <div class="code-line-numbers" aria-hidden="true">${lineNumbers}</div>
                        <pre><code class="hljs language-${escapeAttr(lang || 'plaintext')}">${highlighted}</code></pre>
                    </div>
                </div>
            `;
        };

        // ---- Tables wrapped for horizontal scrolling ----
        renderer.table = (header, body) => `
            <div class="table-wrapper">
                <table class="markdown-table">
                    <thead>${header}</thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        `;

        // ---- Images as figures with lightbox ----
        renderer.image = (href, title, text) => {
            const safeHref = escapeAttr(href || '');
            const safeAlt = escapeAttr(text || '');
            const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
            const caption = text ? `<figcaption>${text}</figcaption>` : '';
            return `
                <figure class="markdown-figure">
                    <img src="${safeHref}" alt="${safeAlt}"${titleAttr} loading="lazy">
                    ${caption}
                </figure>
            `;
        };

        // ---- Links: safe attrs, external indicator ----
        renderer.link = (href, title, text) => {
            const safeHref = escapeAttr(href || '');
            const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
            const isExternal = /^https?:\/\//i.test(href || '');
            const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            const externalIcon = isExternal ? '<i class="fas fa-external-link-alt"></i>' : '';
            return `<a href="${safeHref}"${titleAttr}${externalAttrs}>${text}${externalIcon}</a>`;
        };

        // ---- Blockquotes + GitHub-style alerts ----
        renderer.blockquote = (quote) => {
            const match = /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.exec(quote);
            if (match) {
                const typeKey = match[1].toLowerCase();
                const meta = (window.AlertTypes && window.AlertTypes[match[1].toUpperCase()]) || window.AlertTypes.NOTE;
                let body = quote.replace(match[0], '');
                // With breaks:true the marker and body share one paragraph,
                // so a stray leading <br> (and whitespace) must be stripped
                // or every alert body starts with a blank line.
                body = body
                    .replace(/^(<p>\s*)(<br\s*\/?>\s*)+/i, '$1')
                    .replace(/^(<p>)\s+/, '$1')
                    .replace(/^\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*/i, '');
                const label = (typeof t === 'function' && t(`alert-${typeKey}`)) || match[1];
                return `
                    <div class="md-alert ${meta.className}">
                        <div class="md-alert-title"><i class="fas ${meta.icon}"></i><span>${escapeHtml(label)}</span></div>
                        ${body}
                    </div>
                `;
            }
            return `<blockquote>${quote}</blockquote>`;
        };

        // ---- Headings with unique anchor slugs ----
        renderer.heading = (text, level, raw) => {
            const base = slugify(raw);
            let id = base;
            let counter = 1;
            while (this._slugs.has(id)) {
                id = `${base}-${++counter}`;
            }
            this._slugs.add(id);

            return `
                <h${level} id="${id}" class="markdown-heading">
                    <span class="heading-text">${text}</span>
                    <a href="#${escapeAttr(id)}" class="heading-anchor" aria-label="Link to section"><i class="fas fa-link"></i></a>
                </h${level}>
            `;
        };

        // ---- Task list items ----
        renderer.listitem = (text, task) => {
            return task
                ? `<li class="task-list-item">${text}</li>`
                : `<li>${text}</li>`;
        };

        marked.use({ renderer });
    },

    /**
     * Render markdown content into the preview pane
     * @param {string} content - Markdown content
     */
    render(content) {
        const preview = this.elements && this.elements.markdownPreview;
        if (!preview) return;

        if (!content || !content.trim()) {
            preview.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3 data-lang="empty-title">${escapeHtml(t('empty-title'))}</h3>
                    <p data-lang="empty-desc">${escapeHtml(t('empty-desc'))}</p>
                </div>
            `;
            if (typeof this.onRendered === 'function') this.onRendered();
            return;
        }

        let html;
        try {
            const processed = window.EmojiProcessor
                ? window.EmojiProcessor.processEmojis(content)
                : content;
            html = marked.parse(processed);
        } catch (error) {
            console.error('Markdown render error:', error);
            preview.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-triangle-exclamation"></i>
                    <h3>${escapeHtml(t('error-title') || 'Error processing content')}</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
            if (typeof this.onRendered === 'function') this.onRendered();
            return;
        }

        // Sanitize the output — raw HTML in markdown must never execute
        if (window.DOMPurify) {
            html = window.DOMPurify.sanitize(html, {
                ADD_TAGS: ['input', 'figure', 'figcaption', 'section', 'details', 'summary', 'mark'],
                ADD_ATTR: ['target', 'rel', 'loading', 'checked', 'disabled', 'type', 'start', 'dir', 'open', 'data-copied']
            });
        } else {
            console.warn('MarkdownRenderer: DOMPurify not loaded — output not sanitized');
        }

        // Preserve the reader's scroll position across re-renders
        // (typing must not snap the preview back to the top)
        const pvScrollable = preview.scrollHeight - preview.clientHeight;
        const prevRatio = pvScrollable > 0 ? preview.scrollTop / pvScrollable : 0;

        preview.innerHTML = html;

        // Restore after layout, and again once async content (mermaid,
        // diagrams, math) has settled and shifted the height
        const restoreScroll = () => {
            const max = preview.scrollHeight - preview.clientHeight;
            if (max > 0 && prevRatio > 0) {
                preview.scrollTop = prevRatio * max;
            }
        };
        requestAnimationFrame(restoreScroll);
        setTimeout(restoreScroll, 400);

        // Container direction
        const isRTL = (window.AppState && window.AppState.isRTL) || false;
        preview.classList.toggle('rtl-content', isRTL);
        preview.classList.toggle('ltr-content', !isRTL);
        preview.classList.toggle('code-rtl-comments', !!(window.AppState && window.AppState.isCodeRTL));

        // Per-block auto direction — the browser's bidi algorithm handles
        // mixed Persian/English paragraphs natively and text-align: start
        // follows each block's own direction.
        preview.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption, dt, dd, summary'
        ).forEach((el) => el.setAttribute('dir', 'auto'));

        // KaTeX math (auto-render skips pre/code blocks)
        if (typeof renderMathInElement === 'function') {
            try {
                renderMathInElement(preview, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false,
                    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
                });
            } catch (e) {
                console.error('Math render error:', e);
            }
        }

        // Mermaid diagrams
        if (window.MermaidRenderer) {
            window.MermaidRenderer.render(preview);
        }

        // PlantUML / GraphViz diagram images: restore source on failure
        if (window.DiagramRenderer) {
            window.DiagramRenderer.attachFallbacks(preview);
        }

        if (typeof this.onRendered === 'function') this.onRendered();
    },

    /**
     * Copy a code block's content to the clipboard
     * @param {HTMLElement} button - Copy button element
     */
    async copyCode(button) {
        const wrapper = button.closest('.code-block-wrapper');
        const code = wrapper && wrapper.querySelector('code');
        if (!code) return;

        const ok = await copyToClipboard(code.textContent);
        if (!ok) {
            showToast(t('toast-copy-error'), 'error');
            return;
        }

        const label = button.querySelector('span');
        if (label) {
            const originalText = label.textContent;
            label.textContent = button.dataset.copied || 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                label.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }
    },

    /**
     * Open an image in a lightbox overlay
     * @param {HTMLElement} img - Image element
     */
    openLightbox(img) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay"></div>
            <div class="lightbox-content">
                <img alt="">
                <button type="button" class="lightbox-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        const lightboxImg = lightbox.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';

        const close = () => {
            document.removeEventListener('keydown', onKey);
            lightbox.remove();
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close();
        };

        lightbox.querySelector('.lightbox-overlay').addEventListener('click', close);
        lightbox.querySelector('.lightbox-close').addEventListener('click', close);
        document.addEventListener('keydown', onKey);
        document.body.appendChild(lightbox);
    },

    /**
     * Extract the heading outline from the current preview
     * @returns {Array<{level: number, text: string, id: string}>}
     */
    getOutline() {
        const preview = this.elements && this.elements.markdownPreview;
        if (!preview) return [];

        return Array.from(preview.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
            level: Number(h.tagName.slice(1)),
            text: h.querySelector('.heading-text')
                ? h.querySelector('.heading-text').textContent
                : h.textContent,
            id: h.id
        }));
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => MarkdownRenderer.init());

// Export
window.MarkdownRenderer = MarkdownRenderer;
window.renderMarkdown = (content) => MarkdownRenderer.render(content);
