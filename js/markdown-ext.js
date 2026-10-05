/**
 * Markdown Extensions for marked.js
 * - ==mark==        → <mark>highlight</mark>
 * - [^id] footnotes → numbered footnote section (GitHub style)
 */

(function () {
    'use strict';

    // Footnote state, reset before every parse via the preprocess hook
    const footnoteState = {
        defs: new Map(),     // id -> parsed inline HTML
        refOrder: [],        // ids in order of first reference
        refSeen: new Set()
    };

    function resetFootnoteState() {
        footnoteState.defs = new Map();
        footnoteState.refOrder = [];
        footnoteState.refSeen = new Set();
    }

    // ---------- ==mark== ----------
    const markExtension = {
        name: 'mark',
        level: 'inline',

        start(src) {
            const idx = src.indexOf('==');
            return idx === -1 ? undefined : idx;
        },

        tokenizer(src) {
            const match = /^==(?=\S)([\s\S]*?\S)==/.exec(src);
            if (match) {
                return {
                    type: 'mark',
                    raw: match[0],
                    tokens: this.lexer.inlineTokens(match[1])
                };
            }
        },

        renderer(token) {
            return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;
        }
    };

    // ---------- Footnote reference: [^id] ----------
    const footnoteRefExtension = {
        name: 'footnoteRef',
        level: 'inline',

        start(src) {
            const idx = src.indexOf('[^');
            return idx === -1 ? undefined : idx;
        },

        tokenizer(src) {
            const match = /^\[\^([^\]\s]+)\](?!:)/.exec(src);
            if (match) {
                const id = match[1];
                if (!footnoteState.refSeen.has(id)) {
                    footnoteState.refSeen.add(id);
                    footnoteState.refOrder.push(id);
                }
                const n = footnoteState.refOrder.indexOf(id) + 1;
                return {
                    type: 'footnoteRef',
                    raw: match[0],
                    id,
                    n
                };
            }
        },

        renderer(token) {
            return `<sup class="footnote-ref" id="fnref-${token.n}">` +
                   `<a href="#fn-${token.n}">[${token.n}]</a></sup>`;
        }
    };

    // ---------- Footnote definition: [^id]: text ----------
    const footnoteDefExtension = {
        name: 'footnoteDef',
        level: 'block',

        start(src) {
            const match = /^\[\^([^\]\s]+)\]:/.exec(src);
            return match ? 0 : undefined;
        },

        tokenizer(src) {
            // Definition body: until a blank line or the next definition
            const match = /^\[\^([^\]\s]+)\]:[ \t]*([\s\S]*?)(?=\n\n+|\n\[\^|$)/.exec(src);
            if (match) {
                const id = match[1];
                const content = match[2].replace(/\s+/g, ' ').trim();
                return {
                    type: 'footnoteDef',
                    raw: match[0],
                    id,
                    tokens: this.lexer.inlineTokens(content)
                };
            }
        },

        renderer(token) {
            // The definition itself disappears from the flow; it is
            // re-emitted inside the footnotes section by postprocess.
            footnoteState.defs.set(token.id, this.parser.parseInline(token.tokens));
            return '';
        }
    };

    // ---------- Footnotes section (after the whole document) ----------
    const footnoteHooks = {
        preprocess(markdown) {
            resetFootnoteState();
            return markdown;
        },

        postprocess(html) {
            if (footnoteState.defs.size === 0) return html;

            let items = '';
            let n = 0;
            for (const id of footnoteState.refOrder) {
                if (!footnoteState.defs.has(id)) continue;
                n++;
                items += `<li id="fn-${n}">${footnoteState.defs.get(id)}` +
                         `<a href="#fnref-${n}" class="footnote-backref" aria-label="Back to content">↩</a></li>`;
            }

            if (n === 0) return html;

            return html + `<section class="md-footnotes"><hr><ol>${items}</ol></section>`;
        }
    };

    // Register with marked
    if (typeof marked !== 'undefined') {
        marked.use({
            extensions: [markExtension, footnoteRefExtension, footnoteDefExtension],
            hooks: footnoteHooks
        });
    } else {
        console.error('markdown-ext: marked.js is not loaded');
    }
})();
