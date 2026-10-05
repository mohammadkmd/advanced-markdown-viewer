/**
 * Editor Enhancements Module
 * Formatting toolbar commands, smart list continuation, Tab indent,
 * line numbers, live statistics (incl. reading time, cursor position)
 * and editor→preview scroll sync.
 */

const EditorEnhancer = {
    elements: null,

    // Scroll-sync coordination
    _syncLockUntil: 0,    // pause editor→preview sync until this timestamp
    _anchorUntil: 0,      // an anchor-jump animation is running — ignore pv events
    _pvGestureUntil: 0,   // the user is driving the preview — mirror to editor
    _selfScroll: false,   // true while the scroll echo of our own sync is expected
    _echoTimer: 0,
    _anchorTimer: 0,

    init(elements) {
        this.elements = elements;
    },

    /**
     * Pause editor→preview syncing for a short grace period
     * (used right after anchor jumps so they are not undone).
     * @param {number} ms
     */
    holdSync(ms) {
        this._syncLockUntil = Math.max(this._syncLockUntil, Date.now() + ms);
    },

    /* ================= Text manipulation helpers ================= */

    /**
     * Insert text at the cursor preserving the native undo stack
     * @param {string} text
     */
    insertText(text) {
        const ta = this.elements.markdownInput;
        ta.focus();
        let ok = false;
        try {
            ok = document.execCommand('insertText', false, text);
        } catch (e) {
            ok = false;
        }
        if (!ok) {
            ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },

    /**
     * Replace a range of the textarea
     */
    replaceRange(text, start, end, selectStart) {
        const ta = this.elements.markdownInput;
        ta.focus();
        ta.setRangeText(text, start, end, 'end');
        if (selectStart != null) {
            ta.setSelectionRange(selectStart, selectStart);
        }
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /* ================= Formatting commands ================= */

    /**
     * Execute a toolbar command
     * @param {string} cmd
     */
    format(cmd) {
        const ta = this.elements.markdownInput;
        if (!ta) return;
        ta.focus();

        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = ta.value.slice(start, end);

        switch (cmd) {
            case 'bold':      return this.wrap('**', '**', 'bold text');
            case 'italic':    return this.wrap('*', '*', 'italic text');
            case 'strike':    return this.wrap('~~', '~~', 'strikethrough');
            case 'mark':      return this.wrap('==', '==', 'highlight');
            case 'inlinecode':return this.wrap('`', '`', 'code');
            case 'h1':        return this.toggleLinePrefix('# ');
            case 'h2':        return this.toggleLinePrefix('## ');
            case 'h3':        return this.toggleLinePrefix('### ');
            case 'quote':     return this.toggleLinePrefix('> ');
            case 'ul':        return this.toggleListMarker('ul');
            case 'ol':        return this.toggleListMarker('ol');
            case 'task':      return this.toggleListMarker('task');
            case 'codeblock':  return this.wrapBlock('```\n', '\n```', selected || '// code');
            case 'math':       return this.wrapBlock('$$\n', '\n$$', 'E = mc^2');
            case 'link':       return this.insertLink();
            case 'image':      return this.insertImage();
            case 'table':      return this.insertTable();
            case 'hr':         return this.insertText('\n---\n');
        }
    },

    /**
     * Wrap the selection (or a placeholder) with markers
     */
    wrap(before, after, placeholder) {
        const ta = this.elements.markdownInput;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = ta.value.slice(start, end);
        const inner = selected || placeholder;

        ta.focus();
        let ok = false;
        try {
            ok = document.execCommand('insertText', false, before + inner + after);
        } catch (e) { ok = false; }

        if (!ok) {
            ta.setRangeText(before + inner + after, start, end, 'end');
        }

        if (selected) {
            ta.setSelectionRange(start + before.length, start + before.length + inner.length);
        } else {
            ta.setSelectionRange(start + before.length, start + before.length + placeholder.length);
        }
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /**
     * Wrap the selection as a block with newlines
     */
    wrapBlock(before, after, placeholder) {
        const ta = this.elements.markdownInput;
        const start = ta.selectionStart;
        const selected = ta.value.slice(start, ta.selectionEnd);
        const padStart = start > 0 && ta.value[start - 1] !== '\n' ? '\n' : '';
        const inner = selected || placeholder;
        this.insertText(`${padStart}${before}${inner}${after}`);
    },

    /**
     * Toggle a line prefix (headings, quote) on the current/selected lines
     */
    toggleLinePrefix(prefix) {
        const ta = this.elements.markdownInput;
        const value = ta.value;
        const { lineStart, lineEnd } = this.getSelectionLines(value, ta.selectionStart, ta.selectionEnd);
        const block = value.slice(lineStart, lineEnd);
        const trimmed = prefix.trim();

        const lines = block.split('\n');
        const allHave = lines.every((l) => {
            const re = new RegExp(`^(\\s*)${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s`);
            return re.test(l) || l.trimStart().startsWith(trimmed + ' ');
        });

        const updated = lines.map((line) => {
            const stripped = line.replace(
                new RegExp(`^(\\s*)${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s`),
                '$1'
            ).replace(new RegExp(`^(\\s*)${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\S)`), '$1');
            return allHave ? stripped : prefix + stripped;
        }).join('\n');

        this.replaceRange(updated, lineStart, lineEnd);
    },

    /**
     * Toggle list markers (bullet / ordered / task) on the current/selected lines
     */
    toggleListMarker(type) {
        const ta = this.elements.markdownInput;
        const value = ta.value;
        const { lineStart, lineEnd } = this.getSelectionLines(value, ta.selectionStart, ta.selectionEnd);
        const lines = value.slice(lineStart, lineEnd).split('\n');

        const listRe = /^(\s*)(?:[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+)/;
        const allHave = lines.every((l) => listRe.test(l));

        let num = 1;
        const updated = lines.map((line) => {
            if (allHave) {
                return line.replace(listRe, '$1');
            }
            const stripped = line.replace(listRe, '$1');
            if (type === 'ul') return stripped.replace(/^(\s*)/, '$1- ');
            if (type === 'ol') return stripped.replace(/^(\s*)/, `$1${num++}. `);
            return stripped.replace(/^(\s*)/, '$1- [ ] ');
        }).join('\n');

        this.replaceRange(updated, lineStart, lineEnd);
    },

    /**
     * Insert a [text](url) link
     */
    insertLink() {
        const ta = this.elements.markdownInput;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = ta.value.slice(start, end);
        const text = selected || 'link text';
        this.insertText(`[${text}](https://)`);
        if (!selected) {
            ta.setSelectionRange(start + text.length + 3, start + text.length + 11);
        }
    },

    /**
     * Insert an ![alt](url) image
     */
    insertImage() {
        const ta = this.elements.markdownInput;
        const start = ta.selectionStart;
        this.insertText(`![${'alt text'}](https://)`);
        ta.setSelectionRange(start + 2, start + 10);
    },

    /**
     * Insert a 3-column table template
     */
    insertTable() {
        const ta = this.elements.markdownInput;
        const start = ta.selectionStart;
        const pad = start > 0 && ta.value[start - 1] !== '\n' ? '\n' : '';
        const table = `${pad}| Header | Header | Header |\n|--------|:------:|--------|\n| Cell   | Cell   | Cell   |\n| Cell   | Cell   | Cell   |\n`;
        this.insertText(table);
    },

    /* ================= Key behaviors ================= */

    /**
     * Tab / Shift+Tab: indent or outdent lines
     */
    handleTab(e) {
        const ta = this.elements.markdownInput;
        const value = ta.value;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;

        const multiline = value.slice(start, end).includes('\n');

        if (!multiline && !e.shiftKey) {
            e.preventDefault();
            this.insertText('  ');
            return;
        }

        const { lineStart, lineEnd } = this.getSelectionLines(value, start, end);
        const lines = value.slice(lineStart, lineEnd).split('\n');

        e.preventDefault();
        const updated = lines
            .map((line) => (e.shiftKey ? line.replace(/^(\t| {1,2})/, '') : '  ' + line))
            .join('\n');
        this.replaceRange(updated, lineStart, lineEnd);
    },

    /**
     * Enter: continue lists automatically, exit empty list items
     */
    handleEnter(e) {
        const ta = this.elements.markdownInput;
        const value = ta.value;
        const cursor = ta.selectionStart;
        if (ta.selectionStart !== ta.selectionEnd) return;

        const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
        const currentLine = value.slice(lineStart, cursor);

        const match = /^(\s*)([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+)(.*)$/.exec(currentLine);
        if (!match) return;

        e.preventDefault();

        const [, indent, marker, content] = match;

        // Empty item → exit the list (marker removed, cursor on the empty line)
        if (!content.trim()) {
            this.replaceRange('', lineStart, cursor);
            return;
        }

        let nextMarker = marker;
        const ordered = /^(\d+)\.\s+$/.exec(marker);
        if (ordered) {
            nextMarker = `${Number(ordered[1]) + 1}. `;
        }
        if (/\[[xX]\]/.test(marker)) {
            nextMarker = marker.replace(/\[[xX]\]/, '[ ]');
        }

        this.insertText('\n' + indent + nextMarker);
    },

    /* ================= Statistics & line numbers ================= */

    updateLineNumbers() {
        const { markdownInput, lineNumbers } = this.elements;
        if (!markdownInput || !lineNumbers) return;

        const count = markdownInput.value.split('\n').length;
        const current = lineNumbers.childElementCount;

        if (current !== count) {
            const frag = document.createDocumentFragment();
            for (let i = 1; i <= count; i++) {
                const span = document.createElement('span');
                span.className = 'line-number';
                span.textContent = i;
                frag.appendChild(span);
            }
            lineNumbers.textContent = '';
            lineNumbers.appendChild(frag);
        }
    },

    updateStats() {
        const { markdownInput } = this.elements;
        if (!markdownInput) return;

        const text = markdownInput.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text ? text.split('\n').length : 1;
        const minutes = words > 0 ? Math.max(1, Math.round(words / 200)) : 0;

        const fmt = formatNumber;
        const isFa = window.currentLang === 'fa';

        const charCount = document.getElementById('charCount');
        const wordCount = document.getElementById('wordCount');
        const lineCount = document.getElementById('lineCount');
        const readingTime = document.getElementById('readingTime');

        if (charCount) charCount.textContent = `${fmt(chars)} ${t('characters')}`;
        if (wordCount) wordCount.textContent = `${fmt(words)} ${t('words')}`;
        if (lineCount) lineCount.textContent = `${fmt(lines)} ${t('lines')}`;
        if (readingTime) {
            readingTime.textContent = minutes > 0
                ? (isFa ? `~${fmt(minutes)} دقیقه مطالعه` : `~${minutes} min read`)
                : '';
        }

        this.updateCursorPos();
    },

    updateCursorPos() {
        const { markdownInput } = this.elements;
        const cursorPos = document.getElementById('cursorPos');
        if (!markdownInput || !cursorPos) return;

        const upto = markdownInput.value.slice(0, markdownInput.selectionStart);
        const line = upto.split('\n').length;
        const col = upto.length - upto.lastIndexOf('\n');
        cursorPos.textContent = window.currentLang === 'fa'
            ? `خط ${formatNumber(line)}, ستون ${formatNumber(col)}`
            : `Ln ${line}, Col ${col}`;
    },

    /**
     * Set a pane's scrollTop while marking the resulting scroll event
     * as our own. The flag is cleared on a short timeout — NOT in a
     * rAF — because scroll events fire after rAF callbacks, and an
     * early reset would make our own echo look like a user scroll.
     */
    _setScrollSilently(el, top) {
        this._selfScroll = true;
        el.scrollTop = top;
        clearTimeout(this._echoTimer);
        this._echoTimer = setTimeout(() => { this._selfScroll = false; }, 120);
    },

    /**
     * Register an anchor jump inside the preview (footnote refs, heading
     * links, outline). While the smooth animation runs, neither sync
     * direction may touch the panes; once it settles the editor is
     * re-baselined ONCE to the preview's landing position — so the jump
     * is never undone by a following editor scroll.
     */
    onAnchorJump() {
        this._anchorUntil = Date.now() + 1000;
        this._syncLockUntil = Math.max(this._syncLockUntil, Date.now() + 1100);
        clearTimeout(this._anchorTimer);
        this._anchorTimer = setTimeout(() => this.syncEditorFromPreview(), 1050);
    },

    /**
     * Called from the preview's scroll listener (rAF-throttled).
     * Intent model: while the user drives the preview, the editor is
     * glued to it; the moment the user returns to the editor, the
     * editor drives the preview again — from the reconciled position.
     */
    onPreviewScrollEvent() {
        const now = Date.now();

        // Our own sync echo or an anchor animation — not user intent
        if (this._selfScroll || now < this._anchorUntil) return;

        if (now < this._pvGestureUntil) {
            // Ongoing preview gesture: keep the editor glued
            this.syncEditorFromPreview();
            return;
        }

        // New preview gesture starts: re-baseline the editor, then glue
        this._pvGestureUntil = now + 300;
        this.syncEditorFromPreview();
    },

    /**
     * Editor → preview scroll sync (ratio based).
     * Skipped while the user is driving the preview or right after an
     * anchor jump, so the pane the user is reading is never yanked.
     */
    syncPreviewScroll() {
        const { markdownInput, markdownPreview } = this.elements;
        if (!markdownInput || !markdownPreview) return;
        if (!(window.AppState && window.AppState.syncScroll)) return;
        if (Date.now() < this._syncLockUntil) return;
        if (Date.now() < this._pvGestureUntil) return;
        if (this._selfScroll) return;

        const taScrollable = markdownInput.scrollHeight - markdownInput.clientHeight;
        const pvScrollable = markdownPreview.scrollHeight - markdownPreview.clientHeight;
        if (taScrollable <= 0 || pvScrollable <= 0) return;

        const ratio = markdownInput.scrollTop / taScrollable;
        const target = Math.max(0, Math.min(ratio * pvScrollable, pvScrollable));

        if (Math.abs(markdownPreview.scrollTop - target) > 1) {
            this._setScrollSilently(markdownPreview, target);
        }
    },

    /**
     * Preview → editor sync (one shot): re-baseline the editor to the
     * preview's current ratio.
     */
    syncEditorFromPreview() {
        const { markdownInput, markdownPreview, lineNumbers } = this.elements;
        if (!markdownInput || !markdownPreview) return;
        if (!(window.AppState && window.AppState.syncScroll)) return;
        if (this._selfScroll) return;

        const pvScrollable = markdownPreview.scrollHeight - markdownPreview.clientHeight;
        const taScrollable = markdownInput.scrollHeight - markdownInput.clientHeight;
        if (pvScrollable <= 0 || taScrollable <= 0) return;

        const ratio = markdownPreview.scrollTop / pvScrollable;
        const target = Math.max(0, Math.min(ratio * taScrollable, taScrollable));

        if (Math.abs(markdownInput.scrollTop - target) > 1) {
            this._setScrollSilently(markdownInput, target);
            if (lineNumbers) {
                lineNumbers.scrollTop = target;
            }
        }
    },

    /**
     * Compute the start/end offsets of the lines touching the selection
     */
    getSelectionLines(value, start, end) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const nextBreak = value.indexOf('\n', end);
        const lineEnd = nextBreak === -1 ? value.length : nextBreak;
        return { lineStart, lineEnd };
    }
};

// Export
window.EditorEnhancer = EditorEnhancer;
