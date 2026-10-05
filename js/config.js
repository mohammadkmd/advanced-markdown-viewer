/**
 * Configuration and Constants
 * Contains all application settings and constants
 */

// Application State
const AppState = {
    isRTL: false,
    isCodeRTL: false,
    theme: 'dark',
    accent: 'indigo',
    syncScroll: true,
    isFullscreen: false,
    mobileView: 'editor'
};

// marked.js base configuration
const MarkedConfig = {
    breaks: true,
    gfm: true,
    mangle: false,
    smartypants: false
};

// GitHub-style alert types
const AlertTypes = {
    NOTE:      { icon: 'fa-circle-info',        className: 'md-alert-note' },
    TIP:       { icon: 'fa-lightbulb',          className: 'md-alert-tip' },
    IMPORTANT: { icon: 'fa-circle-comment',     className: 'md-alert-important' },
    WARNING:   { icon: 'fa-triangle-exclamation', className: 'md-alert-warning' },
    CAUTION:   { icon: 'fa-octagon-exclamation',  className: 'md-alert-caution' }
};

// Sample Markdown Content (English & Persian)
const SampleMarkdown = {
    en: `# Advanced Markdown Showcase 🚀

Welcome to the **feature tour**. Everything below renders *live* — edit the text on the left and watch it update instantly.

## Table of Contents

- [Text Formatting](#text-formatting)
- [Lists & Tasks](#lists--tasks)
- [Tables](#tables)
- [Code Blocks](#code-blocks)
- [Math Formulas](#math-formulas)
- [Diagrams](#diagrams)
- [Alerts & Quotes](#alerts--quotes)
- [Extras](#extras)

## Text Formatting

This is **bold**, *italic*, ***bold italic***, ~~strikethrough~~ and ==highlighted text==.

Inline \`console.log('Hello')\` plus a [link](https://github.com "GitHub") and an emoji: :rocket: :heart: :tada:

## Lists & Tasks

1. First step
2. Second step
   1. Nested detail
   2. Another detail
3. Third step

- [x] Ship the viewer
- [ ] Write documentation
- [ ] Add more themes

## Tables

| Feature | Status | Notes |
|---------|:------:|-------|
| RTL support | ✅ | Full right-to-left pipeline |
| Math | ✅ | KaTeX rendering |
| Diagrams | ✅ | Mermaid integration |

## Code Blocks

\`\`\`javascript
// A tiny memoized fibonacci
const memo = new Map();
function fib(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const value = fib(n - 1) + fib(n - 2);
  memo.set(n, value);
  return value;
}
console.log(fib(40)); // 102334155
\`\`\`

\`\`\`python
def greet(name: str) -> str:
    """Return a friendly greeting."""
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

## Math Formulas

Inline math like $E = mc^2$ flows inside text.

$$\\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}$$

$$e^{i\\pi} + 1 = 0$$

## Diagrams

\`\`\`mermaid
graph LR
  A[Markdown] --> B{Viewer}
  B -->|live preview| C[HTML]
  B -->|export| D[Standalone file]
  C --> E((Done!))
\`\`\`

## Alerts & Quotes

> [!NOTE]
> GitHub-style alerts are fully supported.

> [!WARNING]
> Alerts adapt to both light and dark themes.

> A regular blockquote for highlighting sayings.
> It can span multiple lines.

## Extras

<details>
<summary>Click to reveal a secret</summary>

Hidden content lives here — native HTML5 details work inside markdown.

</details>

A footnote reference[^1] for academic writing.

[^1]: This is the footnote text. It appears at the bottom of the document.

---

**End of sample** — enjoy writing! :sparkles:`,

    fa: `# نمایش قابلیت‌های پیشرفته 🚀

به **تور امکانات** خوش آمدید. همه‌چیز به‌صورت *زنده* رندر می‌شود — متن سمت چپ را ویرایش کنید و نتیجه را فوراً ببینید.

## فهرست مطالب

- [قالب‌بندی متن](#قالب‌بندی-متن)
- [لیست‌ها و وظایف](#لیست‌ها-و-وظایف)
- [جدول‌ها](#جدول‌ها)
- [بلوک‌های کد](#بلوک‌های-کد)
- [فرمول‌های ریاضی](#فرمول‌های-ریاضی)
- [نمودارها](#نمودارها)
- [هشدارها و نقل‌قول](#هشدارها-و-نقل-قول)

## قالب‌بندی متن

این یک **متن پررنگ**، این *متن کج*، این ~~خط‌خورده~~ و این ==متن هایلایت‌شده== است.

کد درون‌خطی \`console.log('سلام')\` و یک [لینک](https://github.com) و ایموجی: :rocket: :heart: :tada:

## لیست‌ها و وظایف

1. مرحله اول
2. مرحله دوم
   1. جزئیات تودرتو
   2. جزئیات بیشتر
3. مرحله سوم

- [x] تحویل نمایشگر
- [ ] نوشتن مستندات
- [ ] افزودن تم‌های بیشتر

## جدول‌ها

| قابلیت | وضعیت | توضیحات |
|---------|:------:|---------|
| پشتیبانی راست‌چین | ✅ | خط کامل راست به چپ |
| فرمول ریاضی | ✅ | رندر با KaTeX |
| نمودار | ✅ | یکپارچه‌سازی Mermaid |

## بلوک‌های کد

\`\`\`javascript
// تابع فاکتوریل
function factorial(n) {
  // این یک کامنت فارسی است
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
console.log(factorial(5)); // خروجی: 120
\`\`\`

\`\`\`python
def greet(name: str) -> str:
    """سلام دوستانه برمی‌گرداند."""
    return f"سلام، {name}!"

print(greet("دنیا"))
\`\`\`

## فرمول‌های ریاضی

فرمول درون‌خطی مثل $E = mc^2$ در دل متن می‌نشیند.

$$\\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}$$

$$e^{i\\pi} + 1 = 0$$

## نمودارها

\`\`\`mermaid
graph RL
  A[مارک‌داون] --> B{نمایشگر}
  B -->|پیش‌نمایش زنده| C[HTML]
  B -->|خروجی| D[فایل مستقل]
  C --> E((تمام!))
\`\`\`

## هشدارها و نقل‌قول

> [!NOTE]
> هشدارهای سبک گیت‌هاب به‌طور کامل پشتیبانی می‌شوند.

> [!WARNING]
> هشدارها با هر دو تم روشن و تاریک سازگارند.

> یک نقل‌قول معمولی برای برجسته کردن گفته‌ها.
> می‌تواند چند خطی باشد.

## موارد تکمیلی

<details>
<summary>برای دیدن راز کلیک کنید</summary>

محتوای مخفی اینجاست — تگ‌های HTML5 داخل مارک‌داون کار می‌کنند.

</details>

یک ارجاع پاورقی[^1] برای نوشتار علمی.

[^1]: این متن پاورقی است. در پایین سند نمایش داده می‌شود.

---

**پایان نمونه** — از نوشتن لذت ببرید! :sparkles:`
};

// Get sample markdown based on current language
function getSampleMarkdown() {
    return SampleMarkdown[window.currentLang] || SampleMarkdown.en;
}

// Export for use in other modules
window.AppState = AppState;
window.MarkedConfig = MarkedConfig;
window.AlertTypes = AlertTypes;
window.SampleMarkdown = SampleMarkdown;
window.getSampleMarkdown = getSampleMarkdown;
