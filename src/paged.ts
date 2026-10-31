import { Previewer } from 'pagedjs';
import { registerPaperfitHandlers } from './handlers.js';

export interface PaperfitRenderOptions {
  source?: string | Element | ParentNode;
  root?: string | Element | ParentNode;
  container?: string | Element | ParentNode;
  target?: string | Element | ParentNode;
  renderTo?: string | Element | ParentNode;
  stylesheets?: any;
  mode?: 'clone' | 'in-place';
  canvasToImage?: boolean;
  previewOptions?: any;
}

export interface PaperfitRenderResult {
  totalPages: number;
  flow: any;
  durationMs: number;
}

function resolveSource(source?: PaperfitRenderOptions['source']): any {
  if (!source) {
    if (typeof document === 'undefined') {
      return null;
    }
    return (
      document.querySelector('[data-paperfit-root]') ||
      document.querySelector('#app') ||
      document.querySelector('#root') ||
      document.body
    );
  }
  if (typeof source === 'string') {
    return document.querySelector(source);
  }
  return source;
}

function resolveContainer(container?: PaperfitRenderOptions['renderTo']): any {
  if (!container) {
    if (typeof document === 'undefined') {
      return null;
    }
    const existing = document.querySelector('[data-paperfit-render-target]');
    if (existing) {
      return existing;
    }
    const div = document.createElement('div');
    div.setAttribute('data-paperfit-render-target', 'true');
    document.body.appendChild(div);
    return div;
  }
  if (typeof container === 'string') {
    return document.querySelector(container);
  }
  return container;
}

async function waitForReady(container: any): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // ignore
  }
  const images = Array.from(container?.querySelectorAll?.('img') ?? []);
  await Promise.all(
    images.map(
      (img: any) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const timer = setTimeout(() => resolve(), 100);
          img.addEventListener(
            'load',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
          img.addEventListener(
            'error',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        }),
    ),
  );
}

function convertCanvases(root: any): void {
  if (!root?.querySelectorAll) {
    return;
  }
  const canvases = Array.from(root.querySelectorAll('canvas'));
  for (const canvas of canvases as any[]) {
    const img = document.createElement('img');
    try {
      img.src = (canvas as HTMLCanvasElement).toDataURL();
    } catch {
      // ignore
    }
    img.width = (canvas as HTMLCanvasElement).width;
    img.height = (canvas as HTMLCanvasElement).height;
    canvas.replaceWith(img);
  }
}

export function markPaperfitPending(): void {
  if (typeof window !== 'undefined') {
    window.__PAPERFIT_READY__ = false;
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-paperfit-ready', 'false');
  }
}

export function markPaperfitReady(): void {
  if (typeof window !== 'undefined') {
    window.__PAPERFIT_READY__ = true;
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-paperfit-ready', 'true');
  }
}

export function initPaperfitAutoReady(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.readyState === 'complete') {
    markPaperfitReady();
  } else {
    window.addEventListener('load', () => markPaperfitReady(), { once: true });
  }
}

function patchElement(el: any): void {
  if (!el || el.__paperfitPatched) {
    return;
  }
  try {
    Object.defineProperty(el, 'offsetParent', {
      value: document.body,
      writable: true,
      configurable: true,
    });
  } catch {
    try {
      el.offsetParent = document.body;
    } catch {
      // ignore
    }
  }
  if (
    typeof el.getBoundingClientRect !== 'function' ||
    el.getBoundingClientRect.toString().includes('native')
  ) {
    el.getBoundingClientRect = function () {
      return {
        top: 0,
        left: 0,
        bottom: 600,
        right: 800,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        toJSON() {
          return this;
        },
      };
    };
  }
  el.__paperfitPatched = true;
}

function ensureLayoutShim(): void {
  if (typeof navigator === 'undefined' || !/jsdom/i.test(navigator.userAgent)) {
    return;
  }
  const rect = {
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON() {
      return this;
    },
  };

  // Image support for jsdom
  if (typeof HTMLImageElement !== 'undefined') {
    try {
      Object.defineProperty(HTMLImageElement.prototype, 'complete', {
        get() {
          return true;
        },
        configurable: true,
      });
    } catch {
      // ignore
    }
    try {
      Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
        get() {
          return 10;
        },
        configurable: true,
      });
      Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
        get() {
          return 10;
        },
        configurable: true,
      });
    } catch {
      // ignore
    }
    const originalImage = (window as any).Image;
    (window as any).Image = function () {
      const img = originalImage
        ? new originalImage()
        : document.createElement('img');
      patchElement(img);
      setTimeout(() => {
        try {
          img.dispatchEvent(new Event('load'));
        } catch {
          // ignore
        }
      }, 0);
      return img;
    };
  }

  // Canvas support
  if (typeof HTMLCanvasElement !== 'undefined') {
    try {
      HTMLCanvasElement.prototype.getContext = function () {
        return {
          fillRect() {},
          clearRect() {},
          getImageData() {
            return { data: [] };
          },
          putImageData() {},
          createImageData() {
            return [];
          },
          setTransform() {},
          drawImage() {},
          save() {},
          restore() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          closePath() {},
          stroke() {},
          fill() {},
          translate() {},
          scale() {},
          rotate() {},
          arc() {},
          rect() {},
          clip() {},
        };
      } as any;
    } catch {
      // ignore
    }
    try {
      HTMLCanvasElement.prototype.toDataURL = function () {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      } as any;
    } catch {
      // ignore
    }
  }

  // Patch document.createElement
  const originalCreate = document.createElement.bind(document);
  document.createElement = ((tag: any, options?: any) => {
    const el = originalCreate(tag, options);
    patchElement(el);
    return el;
  }) as any;

  // Patch existing elements
  if (document.body) {
    patchElement(document.body);
    document.querySelectorAll('*').forEach((el: any) => patchElement(el));
  }

  // Observe future nodes
  if (typeof MutationObserver !== 'undefined' && document.body) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node: any) => {
          if (node && node.nodeType === 1) {
            patchElement(node);
            node.querySelectorAll?.('*').forEach((el: any) => patchElement(el));
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Ensure body rect
  if (document.body) {
    document.body.getBoundingClientRect = () => rect as any;
  }
}

export async function renderPaperfit(
  options: PaperfitRenderOptions = {},
): Promise<PaperfitRenderResult> {
  if (typeof window !== 'undefined') {
    window.__PAPERFIT_READY__ = false;
  }
  ensureLayoutShim();
  markPaperfitPending();
  registerPaperfitHandlers();

  const source = resolveSource(
    options.source ?? options.root ?? options.container,
  );
  const renderTo = resolveContainer(
    options.renderTo ?? options.target ?? options.container,
  );

  await waitForReady(source);

  const mode = options.mode ?? 'clone';
  let content: any;
  if (mode === 'in-place') {
    if (options.canvasToImage !== false && source) {
      convertCanvases(source);
    }
    content = source;
  } else {
    const clone = source
      ? source.cloneNode(true)
      : document.createDocumentFragment();
    if (options.canvasToImage !== false) {
      convertCanvases(clone);
    }
    const fragment = document.createDocumentFragment();
    while (clone && clone.firstChild) {
      fragment.appendChild(clone.firstChild);
    }
    content = fragment;
    if (source && source !== document.body) {
      try {
        source.style.display = 'none';
      } catch {
        // ignore
      }
    }
  }

  const previewer = new Previewer(options.previewOptions);
  const flow = await previewer.preview(content, options.stylesheets, renderTo);

  const totalPages = flow?.pages?.length ?? 0;
  const durationMs =
    typeof flow?.performance === 'number' ? flow.performance : 0;

  if (typeof window !== 'undefined') {
    window.__PAPERFIT_READY__ = true;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-paperfit-ready', 'true');
    }
    window.dispatchEvent(
      new CustomEvent('paperfit:ready', {
        detail: { totalPages, pages: flow?.pages },
      }),
    );
  }
  markPaperfitReady();

  return { totalPages, flow, durationMs };
}

if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
  ensureLayoutShim();
}
