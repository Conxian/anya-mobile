import { Buffer } from 'buffer';

/**
 * 🎨 Palette: Initializer for UI enhancements that should run as early as possible.
 */

// Ensure Buffer is available globally as early as possible.
if (typeof window !== 'undefined') (window as any).Buffer = Buffer;
if (typeof globalThis !== 'undefined') (globalThis as any).Buffer = Buffer;

export function setupPasswordToggle(inputId: string, buttonId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const button = document.getElementById(buttonId);
  if (input && button) {
    button.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.innerText = isPassword ? '🙈' : '👁️';
      button.setAttribute(
        'aria-label',
        isPassword ? 'Hide PIN' : 'Show PIN'
      );
    });
  }
}

export function initPalette() {
  setupPasswordToggle('pinInput', 'togglePin');
}

// Initialize immediately if DOM is ready, or wait
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPalette);
  } else {
    initPalette();
  }
}
