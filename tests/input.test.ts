import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPaperfitDefaultInput,
  getPaperfitInput,
  hasPaperfitInput,
  bindPaperfitVariables,
} from '../src/input.js';

describe('input', () => {
  beforeEach(() => {
    (window as any).__PAPERFIT_INPUT__ = undefined;
    (window as any).__PAPERFIT_DEFAULT_INPUT__ = undefined;
  });

  it('throws when no input', () => {
    expect(() => getPaperfitInput()).toThrow('No paperfit input found!');
  });

  it('reads window.__PAPERFIT_INPUT__', () => {
    (window as any).__PAPERFIT_INPUT__ = { name: 'Alice' };
    expect(getPaperfitInput<{ name: string }>()).toEqual({ name: 'Alice' });
  });

  it('setPaperfitDefaultInput sets default when not injected', () => {
    setPaperfitDefaultInput({ name: 'Default' });
    expect(getPaperfitInput<{ name: string }>()).toEqual({ name: 'Default' });
    expect(hasPaperfitInput()).toBe(true);
  });

  it('does not override injected input', () => {
    (window as any).__PAPERFIT_INPUT__ = { name: 'Injected' };
    setPaperfitDefaultInput({ name: 'Default' });
    expect(getPaperfitInput<{ name: string }>()).toEqual({ name: 'Injected' });
  });

  it('getPaperfitInput with default value merges', () => {
    (window as any).__PAPERFIT_INPUT__ = { name: 'Injected' };
    const result = getPaperfitInput<{ name: string; age: number }>({ age: 30 });
    expect(result).toEqual({ name: 'Injected', age: 30 });
  });

  it('getPaperfitInput with default value when no injected', () => {
    const result = getPaperfitInput<{ name: string }>({ name: 'Fallback' });
    expect(result).toEqual({ name: 'Fallback' });
  });

  it('hasPaperfitInput false when empty', () => {
    expect(hasPaperfitInput()).toBe(false);
  });

  it('bindPaperfitVariables text/html/if/each', () => {
    document.body.innerHTML = `
      <div>
        <span data-paperfit-text="title"></span>
        <div data-paperfit-html="html"></div>
        <p data-paperfit-if="show">shown</p>
        <ul data-paperfit-each="items">
          <template><li data-paperfit-text="name"></li></template>
        </ul>
      </div>
    `;
    bindPaperfitVariables(document, {
      title: 'Hello',
      html: '<b>bold</b>',
      show: true,
      items: [{ name: 'A' }, { name: 'B' }],
    });
    expect(document.querySelector('span')?.textContent).toBe('Hello');
    expect(document.querySelector('div[data-paperfit-html]')?.innerHTML).toBe(
      '<b>bold</b>',
    );
    const lis = document.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe('A');
    expect(lis[1].textContent).toBe('B');
  });

  it('bindPaperfitVariables if false hides', () => {
    document.body.innerHTML = `<p data-paperfit-if="show">x</p>`;
    bindPaperfitVariables(document, { show: false });
    const p = document.querySelector('p') as HTMLElement;
    expect(p.style.display).toBe('none');
  });
});

describe('input null and deep merge', () => {
  beforeEach(() => {
    (window as any).__PAPERFIT_INPUT__ = undefined;
    (window as any).__PAPERFIT_DEFAULT_INPUT__ = undefined;
  });

  it('hasPaperfitInput false when null', () => {
    (window as any).__PAPERFIT_INPUT__ = null;
    expect(hasPaperfitInput()).toBe(false);
    expect(getPaperfitInput({ a: 1 })).toEqual({ a: 1 });
  });

  it('deep merge in getPaperfitInput with merge', () => {
    (window as any).__PAPERFIT_INPUT__ = { nested: { b: 2, c: 3 } };
    const result = getPaperfitInput({ nested: { a: 1, c: 9 } } as any, {
      merge: true,
    });
    expect(result).toEqual({ nested: { a: 1, b: 2, c: 3 } });
  });

  it('deep merge in setPaperfitDefaultInput', () => {
    setPaperfitDefaultInput({ nested: { a: 1 } } as any);
    setPaperfitDefaultInput({ nested: { b: 2 } } as any, { merge: true });
    const stored = (window as any).__PAPERFIT_DEFAULT_INPUT__;
    expect(stored).toEqual({ nested: { a: 1, b: 2 } });
  });

  it('resolvePath blocks prototype/constructor/__proto__', () => {
    const data = { a: { b: 1 } };
    // @ts-ignore
    expect((window as any).__proto__).toBeDefined();
    // use bindPaperfitVariables indirect? test via resolvePath not exported; use bindPaperfitVariables with malicious path
    document.body.innerHTML = `<span data-paperfit-text="__proto__.toString"></span>`;
    bindPaperfitVariables(document, data as any);
    expect(document.querySelector('span')?.textContent).toBe('');
  });
});
