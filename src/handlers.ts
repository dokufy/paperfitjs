import { Handler, registerHandlers } from 'pagedjs';

export class RepeatTableHeadersHandler extends Handler {
  constructor(chunker: any, polisher: any, caller: any) {
    super(chunker, polisher, caller);
  }

  afterPageLayout(
    pageElement: any,
    _page: any,
    _breakToken: any,
    _chunker: any,
  ): void {
    const continuations = Array.from(
      pageElement.querySelectorAll('table[data-split-from]'),
    ) as any[];

    for (const table of continuations) {
      const ref = table.dataset.splitFrom;
      const pages = pageElement.parentNode;
      if (!pages) {
        continue;
      }
      const index = Array.prototype.indexOf.call(pages.children, pageElement);
      if (index <= 0) {
        continue;
      }
      const prevPage = pages.children[index - 1];
      if (!prevPage) {
        continue;
      }
      const original =
        (ref
          ? prevPage.querySelector(
              `table[data-ref="${ref}"]:not([data-split-to])`,
            )
          : null) || prevPage.querySelector('table');

      const thead = original?.querySelector('thead');
      if (thead && !table.querySelector('thead')) {
        table.insertBefore(thead.cloneNode(true), table.firstChild);
      }
    }
  }
}

export class PaperfitPageBreakHandler extends Handler {
  constructor(chunker: any, polisher: any, caller: any) {
    super(chunker, polisher, caller);
  }

  afterParsed(parsed: any): void {
    const elements = parsed.querySelectorAll(
      '.paperfit-page-break, paperfit-page-break',
    );
    elements.forEach((el: any) => {
      el.setAttribute('data-break-before', 'page');
    });
  }
}

let registered = false;

export function registerPaperfitHandlers(): void {
  if (registered) {
    return;
  }
  try {
    registerHandlers(RepeatTableHeadersHandler, PaperfitPageBreakHandler);
  } catch {
    // ignore registration errors in non-browser environments
  }
  registered = true;
}
