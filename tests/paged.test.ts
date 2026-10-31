import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderPaperfit,
  markPaperfitPending,
  markPaperfitReady,
} from '../src/paged.js';

describe('paged', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (window as any).__PAPERFIT_READY__ = false;
  });

  it('sets ready lifecycle', async () => {
    document.body.innerHTML = '<div id="content"><p>Hello</p></div>';
    const readyEvents: any[] = [];
    window.addEventListener('paperfit:ready', (e: any) =>
      readyEvents.push(e.detail),
    );
    const result = await renderPaperfit({ source: '#content' });
    expect((window as any).__PAPERFIT_READY__).toBe(true);
    expect(document.documentElement.getAttribute('data-paperfit-ready')).toBe(
      'true',
    );
    expect(readyEvents.length).toBe(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
    expect(typeof result.durationMs).toBe('number');
  });

  it('converts canvas to image', async () => {
    document.body.innerHTML =
      '<div id="content"><canvas width="10" height="10"></canvas></div>';
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    ctx?.fillRect(0, 0, 10, 10);
    await renderPaperfit({ source: '#content' });
    const img = document.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.src).toContain('data:image/png');
  });

  it('markPaperfitPending/Ready', () => {
    markPaperfitPending();
    expect((window as any).__PAPERFIT_READY__).toBe(false);
    expect(document.documentElement.getAttribute('data-paperfit-ready')).toBe(
      'false',
    );
    markPaperfitReady();
    expect((window as any).__PAPERFIT_READY__).toBe(true);
    expect(document.documentElement.getAttribute('data-paperfit-ready')).toBe(
      'true',
    );
  });

  it('in-place mode', async () => {
    document.body.innerHTML = '<div id="content"><p>In place</p></div>';
    const result = await renderPaperfit({
      source: '#content',
      mode: 'in-place',
    });
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });
});
