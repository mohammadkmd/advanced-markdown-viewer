/**
 * Mermaid Diagram Renderer
 * Lazily loads mermaid.js only when a ```mermaid block is present,
 * renders diagrams theme-aware and replaces their code blocks.
 */

const MermaidRenderer = {
    _loadPromise: null,
    _initializedTheme: null,
    _counter: 0,

    /**
     * Load mermaid.js from CDN on first use
     * @returns {Promise<void>}
     */
    ensureLoaded() {
        if (window.mermaid) return Promise.resolve();
        if (!this._loadPromise) {
            this._loadPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js';
                script.onload = resolve;
                script.onerror = () => {
                    this._loadPromise = null;
                    reject(new Error('Failed to load mermaid.js'));
                };
                document.head.appendChild(script);
            });
        }
        return this._loadPromise;
    },

    /**
     * Render every mermaid code block inside the container
     * @param {HTMLElement} container - Element containing rendered markdown
     */
    async render(container) {
        const blocks = container.querySelectorAll('pre code.language-mermaid');
        if (!blocks.length) return;

        try {
            await this.ensureLoaded();
        } catch (e) {
            console.error('Mermaid load error:', e);
            blocks.forEach((codeEl) => this._showError(codeEl, 'mermaid.js could not be loaded'));
            return;
        }

        const isDark = (window.AppState && window.AppState.theme === 'dark');
        if (this._initializedTheme !== isDark) {
            window.mermaid.initialize({
                startOnLoad: false,
                securityLevel: 'strict',
                theme: isDark ? 'dark' : 'neutral',
                fontFamily: getComputedStyle(document.body).fontFamily
            });
            this._initializedTheme = isDark;
        }

        for (const codeEl of blocks) {
            const source = codeEl.textContent;
            const holder = document.createElement('div');
            holder.className = 'mermaid-block';

            const wrapper = codeEl.closest('.code-block-wrapper');
            (wrapper || codeEl).replaceWith(holder);

            try {
                const id = `mermaid-${Date.now()}-${this._counter++}`;
                const { svg } = await window.mermaid.render(id, source);
                holder.innerHTML = svg;
            } catch (err) {
                console.error('Mermaid render error:', err);
                this._showError(holder, (err && err.message) || 'Diagram render failed');
            }
        }
    },

    /**
     * Replace an element with a styled error message
     * @param {HTMLElement} el
     * @param {string} message
     */
    _showError(el, message) {
        const holder = el.closest('.code-block-wrapper') || el;
        const div = document.createElement('div');
        div.className = 'mermaid-block';
        div.innerHTML = `<div class="mermaid-error"><i class="fas fa-triangle-exclamation"></i><span></span></div>`;
        div.querySelector('span').textContent = message;
        holder.replaceWith(div);
    }
};

window.MermaidRenderer = MermaidRenderer;
