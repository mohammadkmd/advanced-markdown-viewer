/**
 * Diagram Renderer — multi-format support
 * Detects diagram code fences that LLMs commonly emit and renders them:
 *   - mermaid            → rendered locally by js/mermaid.js
 *   - plantuml/puml/uml  → PlantUML server via hex-encoded image URL
 *   - dot/graphviz/viz   → QuickChart GraphViz via encoded image URL
 *
 * Diagrams are plain <img> elements — no fetch, no CORS, they survive
 * HTML export and printing. If a diagram service is unreachable, the
 * original code block is restored so content is never lost. Diagrams
 * always read LTR, even inside RTL documents.
 */

const DiagramRenderer = {

    // fence language → public rendering service
    formats: {
        plantuml: { label: 'PlantUML', url: (src) => `https://www.plantuml.com/plantuml/svg/~h${DiagramRenderer.toHex(src)}` },
        puml:     { label: 'PlantUML', url: (src) => `https://www.plantuml.com/plantuml/svg/~h${DiagramRenderer.toHex(src)}` },
        uml:      { label: 'PlantUML', url: (src) => `https://www.plantuml.com/plantuml/svg/~h${DiagramRenderer.toHex(src)}` },
        dot:      { label: 'GraphViz', url: (src) => `https://quickchart.io/graphviz?format=svg&graph=${encodeURIComponent(src)}` },
        graphviz: { label: 'GraphViz', url: (src) => `https://quickchart.io/graphviz?format=svg&graph=${encodeURIComponent(src)}` },
        viz:      { label: 'GraphViz', url: (src) => `https://quickchart.io/graphviz?format=svg&graph=${encodeURIComponent(src)}` }
    },

    /**
     * UTF-8 hex encoding used by the PlantUML server (~h form)
     * @param {string} text
     * @returns {string}
     */
    toHex(text) {
        const bytes = new TextEncoder().encode(text);
        let hex = '';
        for (const b of bytes) {
            hex += b.toString(16).padStart(2, '0');
        }
        return hex;
    },

    isDiagramLanguage(lang) {
        return !!this.formats[(lang || '').toLowerCase()];
    },

    /**
     * Build the <figure> markup emitted by the code renderer.
     * The raw source rides along in a data attribute so the image can
     * fall back to a plain code block if the service is unreachable.
     * @param {string} lang - normalized fence language
     * @param {string} source - diagram source code
     * @returns {string}
     */
    buildFigure(lang, source) {
        const format = this.formats[lang];
        if (!format) return '';
        return `
            <figure class="diagram-block" dir="ltr" data-diagram-lang="${escapeAttr(lang)}" data-diagram-src="${escapeAttr(source)}">
                <img class="diagram-img" src="${escapeAttr(format.url(source))}"
                     alt="${escapeAttr(format.label)} diagram" loading="lazy">
            </figure>
        `;
    },

    /**
     * Attach error fallbacks: if a diagram service is unreachable,
     * swap the empty figure back for a plain code block with the
     * original source, so nothing is lost.
     * @param {HTMLElement} container - rendered preview container
     */
    attachFallbacks(container) {
        container.querySelectorAll('figure.diagram-block img.diagram-img').forEach((img) => {
            img.addEventListener('error', () => {
                const figure = img.closest('figure.diagram-block');
                if (!figure) return;
                const lang = figure.dataset.diagramLang || 'text';
                const source = figure.dataset.diagramSrc || '';
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                wrapper.innerHTML =
                    `<div class="code-block-header">` +
                    `<span class="code-language">${escapeHtml(lang)}</span>` +
                    `<span class="diagram-fallback-note"></span>` +
                    `</div>` +
                    `<div class="code-block-content">` +
                    `<pre><code class="hljs language-${escapeAttr(lang)}">${escapeHtml(source)}</code></pre>` +
                    `</div>`;
                wrapper.querySelector('.diagram-fallback-note').textContent =
                    window.currentLang === 'fa' ? '(سرویس نمودار در دسترس نیست)' : '(diagram service unavailable)';
                figure.replaceWith(wrapper);
            });
        });
    }
};

window.DiagramRenderer = DiagramRenderer;
