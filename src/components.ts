import { configurePage } from './page-css.js';
import { renderPaperfit } from './paged.js';

const BaseHTMLElement: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as any);

function normalizeConfig(el: HTMLElement): any {
  const size = el.getAttribute('size') ?? 'A4';
  const orientation = el.getAttribute('orientation') ?? 'portrait';
  const margin = el.getAttribute('margin') ?? '20mm';
  const pageNumbers = el.getAttribute('page-numbers');
  const config: any = {
    size,
    orientation,
    margin,
  };
  if (pageNumbers) {
    config.pageNumbers = pageNumbers;
  }
  return config;
}

class PaperfitDocument extends BaseHTMLElement {
  connectedCallback(): void {
    configurePage(normalizeConfig(this));
    const autoRender = this.getAttribute('auto-render');
    if (autoRender !== 'false') {
      requestAnimationFrame(() => {
        renderPaperfit({ source: this }).catch(() => {
          // ignore
        });
      });
    }
  }
}

class PaperfitHeader extends BaseHTMLElement {
  connectedCallback(): void {
    this.classList.add('paperfit-header');
    this.style.position = 'running(paperfitHeader)';
  }
}

class PaperfitFooter extends BaseHTMLElement {
  connectedCallback(): void {
    this.classList.add('paperfit-footer');
    this.style.position = 'running(paperfitFooter)';
  }
}

class PaperfitPageBreak extends BaseHTMLElement {
  connectedCallback(): void {
    this.classList.add('paperfit-page-break');
    this.style.breakBefore = 'page';
  }
}

class PaperfitAvoidBreak extends BaseHTMLElement {
  connectedCallback(): void {
    this.classList.add('paperfit-avoid-break');
    this.style.breakInside = 'avoid';
  }
}

class PaperfitPageNumber extends BaseHTMLElement {
  connectedCallback(): void {
    const format = this.getAttribute('format') ?? 'Page {page} of {pages}';
    this.innerHTML = format
      .replace(/\{page\}/g, '<span class="paperfit-page-counter-page"></span>')
      .replace(
        /\{pages\}/g,
        '<span class="paperfit-page-counter-pages"></span>',
      );
  }
}

export function registerPaperfitComponents(): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  const define = (name: string, ctor: CustomElementConstructor): void => {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  };
  define('paperfit-document', PaperfitDocument);
  define('paperfit-header', PaperfitHeader);
  define('paperfit-footer', PaperfitFooter);
  define('paperfit-page-break', PaperfitPageBreak);
  define('paperfit-avoid-break', PaperfitAvoidBreak);
  define('paperfit-page-number', PaperfitPageNumber);

  if (
    typeof document !== 'undefined' &&
    !document.getElementById('paperfit-component-styles')
  ) {
    const style = document.createElement('style');
    style.id = 'paperfit-component-styles';
    style.textContent =
      '.paperfit-page-counter-page::after { content: counter(page); }\n' +
      '.paperfit-page-counter-pages::after { content: counter(pages); }';
    document.head?.appendChild(style);
  }
}

if (typeof customElements !== 'undefined') {
  registerPaperfitComponents();
}
