/**
 * Emoji Processing Module
 * Converts :emoji: shortcodes to Unicode emojis using the full
 * GitHub gemoji database (js/emoji-data.js, ~1900 shortcodes).
 */

const EMOJI_SHORTCODE_RE = /:[a-zA-Z0-9_+-]+:/g;

/**
 * Process emoji shortcodes in text
 * Single-pass token replacement — fast even for large documents.
 * @param {string} text - Text containing emoji shortcodes
 * @returns {string} - Text with emojis converted
 */
function processEmojis(text) {
    if (!text) return text;
    const map = window.EmojiData;
    if (!map) return text;

    return text.replace(EMOJI_SHORTCODE_RE, (token) => {
        return map[token] || map[token.toLowerCase()] || token;
    });
}

// Export
window.EmojiProcessor = {
    EmojiMap: window.EmojiData || {},
    processEmojis
};
