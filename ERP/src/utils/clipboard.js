/**
 * Safe clipboard writer with a legacy fallback.
 *
 * `navigator.clipboard` is only available in secure contexts (HTTPS or
 * localhost) and can be missing in embedded/sandboxed iframes, which caused
 * "Cannot read properties of undefined (reading 'clipboard')" crashes at every
 * copy button. This guards availability and falls back to a hidden textarea
 * + `document.execCommand('copy')`.
 *
 * Resolves `true` when the text was copied; rejects when neither path works.
 *
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fall through to the legacy path (e.g. permission denied).
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    const ok = document.execCommand('copy');
    if (ok) return true;
    throw new Error('Legacy copy command was rejected by the browser');
  } finally {
    document.body.removeChild(textarea);
  }
};

export default copyToClipboard;