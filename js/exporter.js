/**
 * HTML Export Module
 * Generates standalone HTML files with full styling, KaTeX math,
 * Mermaid/PlantUML/GraphViz diagrams, RTL support and theme colors.
 *
 * PDF/print is engineered on top of the same document: blocks carry
 * break rules, long code blocks are chunked so nothing is sliced
 * mid-block, code wraps instead of clipping, and printing runs in a
 * hidden iframe with @page margins.
 */

const HTMLExporter = {

    /** Max lines of highlighted code per print chunk (fits one A4 page) */
    PRINT_CHUNK_LINES: 30,

    /**
     * Get theme colors based on current theme
     * @returns {Object}
     */
    getThemeColors() {
        const isDark = (window.AppState && window.AppState.theme === 'dark');

        if (isDark) {
            return {
                bg: '#090c12', surface: '#0f131c', elevated: '#151a26',
                text: '#e9ecf3', textSecondary: '#a7afbf', textMuted: '#6d7689',
                accent: '#6366f1', accentSoft: 'rgba(99, 102, 241, 0.14)',
                border: 'rgba(255, 255, 255, 0.09)', borderSubtle: 'rgba(255, 255, 255, 0.07)',
                codeBg: '#0d1117', codeChrome: 'rgba(255, 255, 255, 0.04)',
                codeBorder: 'rgba(255, 255, 255, 0.09)', codeText: '#e6edf3',
                success: '#34d399', warning: '#fbbf24', danger: '#f87171', info: '#60a5fa',
                isDark
            };
        }

        return {
            bg: '#f2f4f8', surface: '#ffffff', elevated: '#f7f8fb',
            text: '#101828', textSecondary: '#475467', textMuted: '#98a2b3',
            accent: '#6366f1', accentSoft: 'rgba(99, 102, 241, 0.12)',
            border: 'rgba(15, 23, 42, 0.14)', borderSubtle: 'rgba(15, 23, 42, 0.08)',
            codeBg: '#f8fafc', codeChrome: 'rgba(15, 23, 42, 0.04)',
            codeBorder: 'rgba(15, 23, 42, 0.1)', codeText: '#1f2937',
            success: '#059669', warning: '#d97706', danger: '#dc2626', info: '#2563eb',
            isDark
        };
    },

    /**
     * Detect whether content contains math that needs KaTeX
     * @param {string} markdown
     * @returns {boolean}
     */
    hasMath(markdown) {
        return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\(|\\\[/.test(markdown || '');
    },

    /**
     * Generate complete CSS for exported HTML
     * @returns {string}
     */
    generateCSS() {
        const c = this.getThemeColors();
        return `
            :root {
                --bg: ${c.bg}; --surface: ${c.surface}; --elevated: ${c.elevated};
                --text: ${c.text}; --text-2: ${c.textSecondary}; --text-muted: ${c.textMuted};
                --accent: ${c.accent}; --accent-soft: ${c.accentSoft};
                --border: ${c.border}; --border-subtle: ${c.borderSubtle};
                --code-bg: ${c.codeBg}; --code-chrome: ${c.codeChrome};
                --code-border: ${c.codeBorder}; --code-text: ${c.codeText};
                --success: ${c.success}; --warning: ${c.warning}; --danger: ${c.danger}; --info: ${c.info};
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }
            html { scroll-behavior: smooth; }

            body {
                font-family: 'Inter', 'Vazirmatn', 'Segoe UI', system-ui, sans-serif;
                font-size: 15.5px;
                line-height: 1.75;
                color: var(--text);
                background: var(--bg);
                padding: 2.5rem 1rem;
                min-height: 100vh;
            }

            [dir='auto'] { text-align: start; unicode-bidi: plaintext; }

            .container {
                max-width: 860px;
                margin: 0 auto;
                background: var(--surface);
                padding: 3rem;
                border-radius: 18px;
                border: 1px solid var(--border-subtle);
                box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,${c.isDark ? '0.4' : '0.08'});
            }

            h1, h2, h3, h4, h5, h6 {
                margin: 1.6em 0 0.55em;
                font-weight: 700;
                line-height: 1.3;
                letter-spacing: -0.015em;
                scroll-margin-top: 24px;
            }
            .container > :first-child { margin-top: 0; }
            h1 { font-size: 1.9em; padding-bottom: 0.35em; border-bottom: 1px solid var(--border-subtle); }
            h2 { font-size: 1.45em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border-subtle); }
            h3 { font-size: 1.22em; } h4 { font-size: 1.08em; }
            h5 { font-size: 0.98em; } h6 { font-size: 0.88em; color: var(--text-muted); }

            p { margin: 0.9em 0; }
            strong, b { font-weight: 650; }

            a { color: var(--accent); text-decoration: none; text-underline-offset: 3px; }
            a:hover { text-decoration: underline; }
            a .fa-external-link-alt { font-size: 0.7em; opacity: 0.6; margin-inline-start: 0.25em; }

            mark { background: var(--accent-soft); color: var(--text); padding: 0.08em 0.3em; border-radius: 4px; }

            kbd {
                display: inline-block; padding: 0.15em 0.45em;
                font-family: 'JetBrains Mono', Consolas, monospace; font-size: 0.82em;
                background: var(--elevated); border: 1px solid var(--border);
                border-bottom-width: 2px; border-radius: 6px;
            }

            ul, ol { margin: 0.9em 0; padding-inline-start: 1.6em; }
            li { margin: 0.32em 0; }
            li::marker { color: var(--accent); font-weight: 600; }

            .task-list-item { list-style: none; margin-inline-start: -1.35em; }
            .task-list-item input[type='checkbox'] {
                width: 1em; height: 1em; margin-inline-end: 0.45em;
                vertical-align: middle; accent-color: var(--accent);
            }

            code {
                font-family: 'JetBrains Mono', Consolas, monospace;
                font-size: 0.86em; padding: 0.15em 0.4em;
                background: var(--elevated); border: 1px solid var(--border-subtle);
                border-radius: 6px; color: var(--text);
            }

            .code-block-wrapper {
                margin: 1.4em 0; border-radius: 14px; overflow: hidden;
                border: 1px solid var(--code-border); background: var(--code-bg);
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                direction: ltr !important; text-align: left !important;
            }
            .code-block-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 0.5rem 0.9rem; background: var(--code-chrome);
                border-bottom: 1px solid var(--code-border);
            }
            .code-language {
                font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.07em; color: var(--accent);
            }
            .code-continued {
                font-size: 0.68rem; font-weight: 600; color: var(--text-muted);
                font-style: italic;
            }
            .code-copy-btn {
                display: inline-flex; align-items: center; gap: 0.45em;
                padding: 0.28rem 0.7rem; border-radius: 6px;
                font-size: 0.72rem; font-weight: 600; color: var(--text-2);
                background: transparent; border: 1px solid var(--code-border);
                cursor: pointer; transition: all 0.15s ease;
            }
            .code-copy-btn:hover { color: var(--text); background: var(--accent-soft); }
            .code-copy-btn.copied { color: var(--success); border-color: var(--success); }
            .code-block-content { display: flex; overflow-x: auto; direction: ltr; text-align: left; }
            .code-line-numbers {
                flex-shrink: 0; display: flex; flex-direction: column;
                padding: 0.9rem 0.75rem; background: var(--code-chrome);
                color: var(--text-muted); font-family: 'JetBrains Mono', Consolas, monospace;
                font-size: 0.78rem; line-height: 1.55rem; text-align: right;
                user-select: none; border-right: 1px solid var(--code-border);
            }
            .code-line-numbers .line-number { height: 1.55rem; min-width: 2ch; }
            .code-block-content pre { flex: 1; margin: 0; padding: 0.9rem 1rem; background: transparent; overflow-x: auto; }
            .code-block-content pre code {
                display: block; background: none; border: none; padding: 0;
                font-family: 'JetBrains Mono', Consolas, monospace;
                font-size: 0.82rem; line-height: 1.55rem; color: var(--code-text); white-space: pre;
            }

            .table-wrapper {
                margin: 1.4em 0; border-radius: 14px; border: 1px solid var(--border-subtle);
                box-shadow: 0 1px 2px rgba(0,0,0,0.06); overflow-x: auto;
            }
            .markdown-table { width: 100%; border-collapse: collapse; font-size: 0.92em; }
            .markdown-table th, .markdown-table td {
                padding: 0.65rem 1rem; border-bottom: 1px solid var(--border-subtle); text-align: start;
            }
            .markdown-table th {
                background: var(--elevated); color: var(--text-2);
                font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid var(--border);
            }
            .markdown-table tbody tr:nth-child(even) { background: var(--elevated); }
            .markdown-table tbody tr:hover { background: var(--accent-soft); }
            .markdown-table tbody tr:last-child td { border-bottom: none; }

            blockquote {
                margin: 1.3em 0; padding: 0.85em 1.2em;
                background: var(--elevated); border-inline-start: 3px solid var(--accent);
                border-radius: 8px; color: var(--text-2);
            }
            blockquote > p { margin: 0.3em 0; }

            .md-alert {
                --alert-color: var(--info);
                margin: 1.3em 0; padding: 0.85em 1.1em;
                background: color-mix(in srgb, var(--alert-color) 7%, transparent);
                border: 1px solid color-mix(in srgb, var(--alert-color) 25%, transparent);
                border-inline-start: 3px solid var(--alert-color); border-radius: 10px;
            }
            .md-alert > :first-child { margin-top: 0; }
            .md-alert > :last-child { margin-bottom: 0; }
            .md-alert-title {
                display: flex; align-items: center; gap: 0.5em;
                font-size: 0.84rem; font-weight: 700; color: var(--alert-color); margin: 0 0 0.35em;
            }
            .md-alert > p { margin: 0.45em 0; }
            .md-alert > p:first-of-type { margin-top: 0.1em; }
            .md-alert > p:last-child { margin-bottom: 0; }
            .md-alert-note { --alert-color: var(--info); }
            .md-alert-tip { --alert-color: var(--success); }
            .md-alert-important { --alert-color: #a855f7; }
            .md-alert-warning { --alert-color: var(--warning); }
            .md-alert-caution { --alert-color: var(--danger); }

            img { max-width: 100%; height: auto; border-radius: 14px; }
            .markdown-figure { margin: 1.5em auto; text-align: center; }
            .markdown-figure img { margin: 0 auto; box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,${c.isDark ? '0.35' : '0.1'}); }
            .markdown-figure figcaption { margin-top: 0.5rem; font-size: 0.82rem; color: var(--text-muted); }

            hr {
                border: none; height: 1px; margin: 2em 0;
                background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
            }

            details {
                margin: 1.2em 0; padding: 0.9em 1.1em;
                background: var(--elevated); border: 1px solid var(--border-subtle); border-radius: 10px;
            }
            summary { cursor: pointer; font-weight: 650; color: var(--accent); user-select: none; }

            .katex { font-size: 1.06em; direction: ltr; }
            .katex-display { margin: 1.2em 0; overflow-x: auto; overflow-y: hidden; direction: ltr; }

            .mermaid-block, .diagram-block {
                direction: ltr;
                margin: 1.5em 0; padding: 1.25rem; display: flex; justify-content: center;
                background: var(--elevated); border: 1px solid var(--border-subtle);
                border-radius: 14px; overflow-x: auto;
            }
            .mermaid-block svg, .diagram-block svg { max-width: 100%; height: auto; }

            .md-footnotes { margin-top: 3em; padding-top: 1em; border-top: 1px solid var(--border-subtle); font-size: 0.86rem; color: var(--text-2); }
            .md-footnotes ol { padding-inline-start: 1.4em; }
            .footnote-backref { text-decoration: none; }

            .heading-anchor { display: none; }

            dt { font-weight: 650; color: var(--accent); margin-top: 0.8em; }
            dd { margin-inline-start: 1.6em; color: var(--text-2); }

            @media (max-width: 640px) {
                body { padding: 0.75rem; }
                .container { padding: 1.5rem; border-radius: 14px; }
                h1 { font-size: 1.6em; } h2 { font-size: 1.3em; } h3 { font-size: 1.15em; }
            }

            /* ============ Print / PDF engineering ============ */
            @media print {
                @page { size: A4; margin: 16mm 14mm; }

                html, body { background: #fff !important; }
                body { padding: 0; color: #111; font-size: 11.5pt; line-height: 1.6; }

                .container {
                    box-shadow: none; border: none; padding: 0;
                    max-width: 100%; border-radius: 0; background: #fff;
                }

                h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; break-inside: avoid; }
                p, li { orphans: 3; widows: 3; }

                .code-block-wrapper, .table-wrapper, .markdown-figure,
                .md-alert, blockquote, details, .md-footnotes,
                .katex-display, .mermaid-block, .diagram-block {
                    break-inside: avoid; page-break-inside: avoid;
                    box-shadow: none;
                }

                .code-copy-btn { display: none !important; }

                /* Code wraps on paper instead of clipping; line numbers
                   would misalign with wrapped lines, so they are dropped. */
                .code-line-numbers { display: none !important; }
                .code-block-content { overflow: visible; }
                .code-block-content pre { overflow: visible; }
                .code-block-content pre code {
                    white-space: pre-wrap !important;
                    word-break: break-word;
                    color: #111;
                }
                pre, .code-block-wrapper, .code-block-content { background: #f6f8fa !important; }

                .markdown-table thead { display: table-header-group; }
                .markdown-table tr { break-inside: avoid; }
                th, td { background: #fff !important; color: #111 !important; border-color: #ddd !important; }
                .markdown-table tbody tr:nth-child(even) { background: #f6f8fa !important; }

                a { color: #4f46e5; text-decoration: underline; }
                img, .mermaid-block svg, .diagram-block svg { max-width: 100%; break-inside: avoid; }
                .mermaid-block, .diagram-block { background: #fff !important; }
                blockquote, .md-alert { background: #f6f8fa !important; color: #111 !important; }
                details { background: #fff !important; }
                kbd, code { background: #f0f2f5 !important; color: #111 !important; }
                hr { background: #ddd !important; }
            }
        `;
    },

    /* ============================================================
       Post-processing pipeline (async: diagrams are fetched)
       ============================================================ */

    /**
     * Split a highlighted-code HTML string into balanced chunks of at
     * most maxLines lines, keeping open tags valid across chunk edges.
     * @param {string} html - highlighted code HTML
     * @param {number} maxLines
     * @returns {string[]}
     */
    splitHighlightedCode(html, maxLines) {
        const lines = html.split('\n');
        if (lines.length <= maxLines) return [html];

        const chunks = [];
        let buffer = '';
        let lineCount = 0;
        let openTags = [];

        const openTagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)>/g;
        const voidTags = new Set(['br', 'img', 'hr', 'input']);

        const emit = () => {
            chunks.push(buffer);
            buffer = '';
            lineCount = 0;
            // re-open surviving tags for the next chunk
            buffer = openTags.map((t) => `<${t.tag}${t.attrs}>`).join('');
        };

        for (const line of lines) {
            let match;
            openTagRe.lastIndex = 0;
            while ((match = openTagRe.exec(line)) !== null) {
                const [, closing, tagRaw, attrs] = match;
                const tag = tagRaw.toLowerCase();
                if (voidTags.has(tag)) continue;
                if (closing) {
                    // pop until matching tag (tolerant)
                    for (let i = openTags.length - 1; i >= 0; i--) {
                        if (openTags[i].tag === tag) {
                            openTags.splice(i, 1);
                            break;
                        }
                    }
                } else if (!match[3].endsWith('/')) {
                    openTags.push({ tag, attrs });
                }
            }

            buffer += (lineCount ? '\n' : '') + line;
            lineCount++;

            if (lineCount >= maxLines) {
                buffer += openTags.map((t) => `</${t.tag}>`).join('');
                emit();
            }
        }

        if (lineCount) chunks.push(buffer);
        return chunks;
    },

    /**
     * Chunk long code blocks so no block is sliced across PDF pages
     * @param {Document} doc
     */
    chunkCodeBlocksForPrint(doc) {
        doc.querySelectorAll('.code-block-wrapper').forEach((wrapper) => {
            const codeEl = wrapper.querySelector('pre code');
            if (!codeEl) return;
            const text = codeEl.textContent.replace(/\n$/, '');
            const lineCount = text.split('\n').length;
            if (lineCount <= this.PRINT_CHUNK_LINES) return;

            const lang = codeEl.className.match(/language-([\w+-]+)/);
            const langLabel = lang ? lang[1] : 'text';
            const continuedLabel = (typeof t === 'function' && t('print-continued')) || '(continued)';
            const originalLineNumbers = wrapper.querySelector('.code-line-numbers');

            const chunks = this.splitHighlightedCode(codeEl.innerHTML, this.PRINT_CHUNK_LINES);
            const frag = doc.createDocumentFragment();
            let startLine = 1;

            chunks.forEach((chunkHtml, idx) => {
                const chunkLines = chunkHtml.split('\n').length;
                const newWrapper = doc.createElement('div');
                newWrapper.className = 'code-block-wrapper';

                const header = doc.createElement('div');
                header.className = 'code-block-header';
                const langSpan = doc.createElement('span');
                langSpan.className = 'code-language';
                langSpan.textContent = langLabel;
                header.appendChild(langSpan);
                if (idx > 0) {
                    const contSpan = doc.createElement('span');
                    contSpan.className = 'code-continued';
                    contSpan.textContent = `${continuedLabel} ${idx + 1}/${chunks.length}`;
                    header.appendChild(contSpan);
                }
                newWrapper.appendChild(header);

                const content = doc.createElement('div');
                content.className = 'code-block-content';
                if (originalLineNumbers) {
                    const nums = doc.createElement('div');
                    nums.className = 'code-line-numbers';
                    for (let n = startLine; n < startLine + chunkLines; n++) {
                        const s = doc.createElement('span');
                        s.className = 'line-number';
                        s.textContent = n;
                        nums.appendChild(s);
                    }
                    content.appendChild(nums);
                }
                const pre = doc.createElement('pre');
                const code = doc.createElement('code');
                code.className = codeEl.className;
                code.innerHTML = chunkHtml;
                pre.appendChild(code);
                content.appendChild(pre);
                newWrapper.appendChild(content);

                frag.appendChild(newWrapper);
                startLine += chunkLines;
            });

            wrapper.replaceWith(frag);
        });
    },

    /**
     * Post-process parsed HTML:
     *  - per-block dir=auto
     *  - inline diagram SVGs (kroki) for plantuml/dot/…
     *  - mermaid: inline render for print, script-driven for export
     *  - chunk long code blocks for print
     * @param {string} html
     * @param {{forPrint?: boolean}} opts
     * @returns {Promise<string>}
     */
    async postProcess(html, opts = {}) {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Per-block auto direction
        doc.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption, dt, dd, summary'
        ).forEach((el) => el.setAttribute('dir', 'auto'));

        // PlantUML / GraphViz diagrams are already <img> figures emitted
        // by the code renderer — they survive sanitization and need no
        // post-processing here.

        // Mermaid: print gets inline SVG (no scripts run before print),
        // HTML export keeps the script-driven approach.
        const mermaidBlocks = Array.from(doc.querySelectorAll('pre code.language-mermaid'));
        if (mermaidBlocks.length) {
            if (opts.forPrint && window.mermaid) {
                const isDark = (window.AppState && window.AppState.theme === 'dark');
                window.mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    theme: isDark ? 'dark' : 'neutral'
                });
                let i = 0;
                for (const codeEl of mermaidBlocks) {
                    try {
                        const id = `print-mmd-${Date.now()}-${i++}`;
                        const { svg } = await window.mermaid.render(id, codeEl.textContent);
                        const holder = doc.createElement('div');
                        holder.className = 'mermaid-block';
                        holder.setAttribute('dir', 'ltr');
                        holder.innerHTML = svg;
                        const wrapper = codeEl.closest('.code-block-wrapper');
                        (wrapper || codeEl).replaceWith(holder);
                    } catch (e) {
                        console.warn('Mermaid print render failed:', e);
                    }
                }
            } else {
                mermaidBlocks.forEach((codeEl) => {
                    const pre = doc.createElement('pre');
                    pre.className = 'mermaid';
                    pre.textContent = codeEl.textContent;
                    const wrapper = codeEl.closest('.code-block-wrapper');
                    (wrapper || codeEl).replaceWith(pre);
                });
            }
        }

        // Print: slice long code blocks into page-sized chunks
        if (opts.forPrint) {
            this.chunkCodeBlocksForPrint(doc);
        }

        return doc.body.innerHTML;
    },

    /* ============================================================
       Document generation
       ============================================================ */

    /**
     * Generate standalone HTML document
     * @param {string} markdownContent
     * @param {{forPrint?: boolean}} opts
     * @returns {Promise<string|null>}
     */
    async generate(markdownContent, opts = {}) {
        if (!markdownContent || !markdownContent.trim()) {
            return null;
        }

        const c = this.getThemeColors();
        const isRTL = (window.AppState && window.AppState.isRTL) || false;
        const dir = isRTL ? 'rtl' : 'ltr';
        const lang = window.currentLang === 'fa' ? 'fa' : 'en';

        const processed = window.EmojiProcessor
            ? window.EmojiProcessor.processEmojis(markdownContent)
            : markdownContent;

        let html;
        try {
            html = marked.parse(processed);
        } catch (e) {
            console.error('Export parse error:', e);
            return null;
        }

        if (window.DOMPurify) {
            html = window.DOMPurify.sanitize(html, {
                ADD_TAGS: ['input', 'figure', 'figcaption', 'section', 'details', 'summary', 'mark'],
                ADD_ATTR: ['target', 'rel', 'loading', 'checked', 'disabled', 'type', 'start', 'dir', 'open', 'data-copied']
            });
        }

        html = await this.postProcess(html, opts);

        // Document title from first heading
        const titleDoc = new DOMParser().parseFromString(html, 'text/html');
        const firstHeading = titleDoc.querySelector('h1 .heading-text, h1');
        const title = (firstHeading ? firstHeading.textContent.trim() : '') || 'Markdown Document';

        const needsMath = this.hasMath(markdownContent);
        const needsMermaid = !opts.forPrint && /class="mermaid"/.test(html);

        const katexLinks = needsMath ? `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"><\/script>
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"><\/script>` : '';

        const mermaidScript = needsMermaid ? `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js"><\/script>
    <script>
        mermaid.initialize({ startOnLoad: true, securityLevel: 'strict', theme: '${c.isDark ? 'dark' : 'neutral'}' });
    <\/script>` : '';

        const mathInit = needsMath ? `
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(document.body, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false,
                    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
                });
            }
        });
    <\/script>` : '';

        return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="generator" content="Advanced Markdown Viewer">
    <meta name="color-scheme" content="${c.isDark ? 'dark' : 'light'}">
    <title>${escapeHtml(title)}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Vazirmatn:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${c.isDark ? 'github-dark' : 'github'}.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">${katexLinks}

    <style>${this.generateCSS()}</style>
</head>
<body>
    <main class="container">
${html}
    </main>

    <script>
        // Copy-to-clipboard for code blocks
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.code-copy-btn');
            if (!btn) return;
            var wrapper = btn.closest('.code-block-wrapper');
            var code = wrapper ? wrapper.querySelector('code') : null;
            if (!code) return;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code.textContent).catch(function () {});
            }
            var span = btn.querySelector('span');
            if (span && btn.dataset.copied) {
                var original = span.textContent;
                span.textContent = btn.dataset.copied;
                btn.classList.add('copied');
                setTimeout(function () {
                    span.textContent = original;
                    btn.classList.remove('copied');
                }, 2000);
            }
        });
    <\/script>${mermaidScript}${mathInit}
</body>
</html>`;
    },

    /**
     * Build export filename from document title + timestamp
     * @param {string} extension - File extension without dot
     * @returns {string}
     */
    buildFilename(extension) {
        const input = document.getElementById('markdownInput');
        const content = input ? input.value : '';
        const h1 = /^#\s+(.+)$/m.exec(content || '');
        const slug = h1
            ? slugify(h1[1]).slice(0, 40).replace(/-+$/, '')
            : 'markdown-document';
        return `${slug || 'markdown-document'}-${getTimestamp()}.${extension}`;
    },

    /* ============================================================
       Export actions
       ============================================================ */

    /**
     * Download the generated HTML file
     */
    async download() {
        const input = document.getElementById('markdownInput');
        const html = await this.generate(input ? input.value : '');

        if (!html) {
            showToast(t('toast-no-content'), 'error');
            return;
        }

        downloadFile(html, this.buildFilename('html'));
        showToast(t('toast-html-downloaded'));
    },

    /**
     * Download the raw markdown content
     */
    downloadMarkdown() {
        const input = document.getElementById('markdownInput');
        const content = input ? input.value : '';

        if (!content.trim()) {
            showToast(t('toast-no-content'), 'error');
            return;
        }

        downloadFile(content, this.buildFilename('md'), 'text/markdown;charset=utf-8');
        showToast(t('toast-md-downloaded'));
    },

    /**
     * Copy the generated HTML to the clipboard
     */
    async copyHTML() {
        const input = document.getElementById('markdownInput');
        const html = await this.generate(input ? input.value : '');

        if (!html) {
            showToast(t('toast-no-content'), 'error');
            return;
        }

        const ok = await copyToClipboard(html);
        showToast(ok ? t('toast-html-copied') : t('toast-copy-error'), ok ? 'success' : 'error');
    },

    /**
     * Print / Save as PDF.
     * Printing ALWAYS produces a light document: if the current theme is
     * dark, the app temporarily switches to light (highlight.js theme,
     * Mermaid re-render, CSS variables), prints, then switches back —
     * the user never sees a broken dark-on-paper result.
     *
     * Before printing, overly long code blocks are chunked in the live
     * preview so nothing is sliced across pages; a re-render after the
     * dialog closes restores everything. No iframe is used, so this
     * works identically on http:// and file://.
     */
    async print() {
        const input = document.getElementById('markdownInput');
        const content = input ? input.value : '';

        if (!content.trim()) {
            showToast(t('toast-no-content'), 'error');
            return;
        }

        const applyTheme = () => {
            if (window.EventHandlers) {
                EventHandlers.applyTheme();
            } else {
                document.documentElement.dataset.theme = window.AppState.theme;
                const { highlightThemeDark, highlightThemeLight } = {
                    highlightThemeDark: document.getElementById('highlightThemeDark'),
                    highlightThemeLight: document.getElementById('highlightThemeLight')
                };
                if (highlightThemeDark && highlightThemeLight) {
                    highlightThemeDark.disabled = window.AppState.theme !== 'dark';
                    highlightThemeLight.disabled = window.AppState.theme === 'dark';
                }
            }
        };

        // 1. Light conversion for printing
        let prevTheme = null;
        if (window.AppState.theme === 'dark') {
            prevTheme = 'dark';
            window.AppState.theme = 'light';
            applyTheme();
            if (window.renderMarkdown) {
                renderMarkdown(content);
            }
            // Wait for the async light re-render (Mermaid/Diagrams) to settle
            const pv = document.getElementById('markdownPreview');
            for (let i = 0; i < 30; i++) {
                if (!pv.querySelector('pre code.language-mermaid')) break;
                await new Promise((r) => setTimeout(r, 100));
            }
            await new Promise((r) => setTimeout(r, 350));
        }

        // 2. Print + restore
        const restore = () => {
            window.removeEventListener('afterprint', restore);
            clearTimeout(this._printRestoreTimer);
            if (prevTheme) {
                window.AppState.theme = prevTheme;
                applyTheme();
            }
            if (window.renderMarkdown) {
                renderMarkdown(document.getElementById('markdownInput').value);
            }
        };

        try {
            // Slice long code blocks into page-sized chunks in place
            this.chunkCodeBlocksForPrint(document);

            window.addEventListener('afterprint', restore);
            this._printRestoreTimer = setTimeout(restore, 120000); // safety net

            window.print();
            // In browsers where print() returns immediately, the dialog
            // still snapshots the current DOM; restore shortly after.
            setTimeout(restore, 1500);
        } catch (e) {
            console.error('Print error:', e);
            showToast(t('toast-print-error'), 'error');
            restore();
        }
    }
};

// Export
window.HTMLExporter = HTMLExporter;
