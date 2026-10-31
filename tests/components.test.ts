import { describe, it, expect } from 'vitest';
import { registerPaperfitComponents } from '../src/components.js';

describe('components', () => {
  it('registers custom elements', () => {
    registerPaperfitComponents();
    expect(customElements.get('paperfit-document')).toBeTruthy();
    expect(customElements.get('paperfit-page-break')).toBeTruthy();
    expect(customElements.get('paperfit-page-number')).toBeTruthy();
  });

  it('paperfit-page-break has class', () => {
    document.body.innerHTML = '<paperfit-page-break></paperfit-page-break>';
    const el = document.querySelector('paperfit-page-break') as HTMLElement;
    expect(el.classList.contains('paperfit-page-break')).toBe(true);
  });

  it('paperfit-page-number renders spans', () => {
    document.body.innerHTML =
      '<paperfit-page-number format="Page {page} of {pages}"></paperfit-page-number>';
    const el = document.querySelector('paperfit-page-number') as HTMLElement;
    expect(el.innerHTML).toContain('paperfit-page-counter-page');
    expect(el.innerHTML).toContain('paperfit-page-counter-pages');
  });
});
