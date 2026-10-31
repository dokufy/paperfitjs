import { describe, it, expect } from 'vitest';
import { generatePageCss, configurePage } from '../src/page-css.js';

describe('page-css', () => {
  it('generates A4 portrait by default', () => {
    const css = generatePageCss({});
    expect(css).toContain('size: 210mm 297mm');
    expect(css).toContain('box-sizing: border-box');
    expect(css).toContain('.paperfit-page-break');
  });

  it('supports landscape and custom margin object', () => {
    const css = generatePageCss({
      size: 'Letter',
      orientation: 'landscape',
      margin: { top: '10mm', right: '20mm', bottom: '10mm', left: '20mm' },
    });
    expect(css).toContain('size: 11in 8.5in');
    expect(css).toContain('margin: 10mm 20mm 10mm 20mm');
  });

  it('supports custom size', () => {
    const css = generatePageCss({ size: { width: '100mm', height: '200mm' } });
    expect(css).toContain('size: 100mm 200mm');
  });

  it('generates running header/footer and page numbers', () => {
    const css = generatePageCss({
      header: 'My Header',
      footer: 'My Footer',
      pageNumbers: 'bottom-right',
      pageNumberFormat: 'Page {page} of {pages}',
    });
    expect(css).toContain('position: running(paperfitHeader)');
    expect(css).toContain('position: running(paperfitFooter)');
    expect(css).toContain('content: "My Header"');
    expect(css).toContain('content: "My Footer"');
    expect(css).toContain('counter(page)');
    expect(css).toContain('counter(pages)');
    expect(css).toContain('@bottom-right');
  });

  it('supports marks and bleed', () => {
    const css = generatePageCss({ bleed: '3mm', marks: 'crop' });
    expect(css).toContain('bleed: 3mm');
    expect(css).toContain('marks: crop');
  });

  it('configurePage injects style', () => {
    const style = configurePage({ size: 'A4' });
    expect(style.tagName).toBe('STYLE');
    expect(document.head.contains(style)).toBe(true);
  });

  it('custom format {{page}} / {{pages}}', () => {
    const css = generatePageCss({
      pageNumbers: {
        format: '{{page}} / {{pages}}',
        position: 'bottom-center',
      },
    });
    expect(css).toContain('@bottom-center');
    expect(css).toContain('counter(page)');
  });
});

import { escapeCssString, sanitizeCssValue } from '../src/page-css.js';

describe('page-css escaping', () => {
  it('escapeCssString escapes backslashes, quotes, newlines', () => {
    expect(escapeCssString('a\\b"c\nd')).toBe('a\\\\b\\"c\\A d');
  });

  it('generatePageCss escapes injection in header content', () => {
    const css = generatePageCss({ header: 'x"; }' });
    expect(css).toContain('x\\"; }');
  });

  it('sanitizeCssValue strips dangerous chars', () => {
    expect(sanitizeCssValue('10mm;}{<>\\')).toBe('10mm');
  });

  it('generatePageCss sanitizes size/margin/bleed', () => {
    const css = generatePageCss({
      size: { width: '10mm; }', height: '20mm' },
      margin: '5mm; {',
      bleed: '3mm; <',
    });
    expect(css).not.toContain('10mm;');
    expect(css).not.toContain('<');
  });
});
