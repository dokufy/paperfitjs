export type PaperfitPageSize =
  'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | { width: string; height: string };

export interface PaperfitPageConfig {
  size?: PaperfitPageSize;
  orientation?: 'portrait' | 'landscape';
  margin?:
    string | { top: string; right: string; bottom: string; left: string };
  bleed?: string;
  marks?: 'crop' | 'cross' | 'none';
  header?: string | { content?: string; position?: string };
  footer?: string | { content?: string; position?: string };
  runningHeader?: string;
  runningFooter?: string;
  pageNumbers?: boolean | string | { format?: string; position?: string };
  pageNumberFormat?: string;
  pageNumberPosition?: string;
}

const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  A3: { width: '297mm', height: '420mm' },
  A4: { width: '210mm', height: '297mm' },
  A5: { width: '148mm', height: '210mm' },
  Letter: { width: '8.5in', height: '11in' },
  Legal: { width: '8.5in', height: '14in' },
};

export function escapeCssString(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ');
}

export function sanitizeCssValue(val: string): string {
  return val.replace(/[;{}\\<>]/g, '');
}

function pageSizeValue(config: PaperfitPageConfig): string {
  const size = config.size ?? 'A4';
  if (typeof size === 'string') {
    const base = PAGE_SIZES[size];
    if (!base) {
      return sanitizeCssValue(size);
    }
    const portrait = `${base.width} ${base.height}`;
    if (config.orientation === 'landscape') {
      return `${base.height} ${base.width}`;
    }
    return portrait;
  }
  if (config.orientation === 'landscape') {
    return `${sanitizeCssValue(size.height)} ${sanitizeCssValue(size.width)}`;
  }
  return `${sanitizeCssValue(size.width)} ${sanitizeCssValue(size.height)}`;
}

function marginValue(margin: PaperfitPageConfig['margin']): string {
  if (margin === undefined) {
    return '20mm';
  }
  if (typeof margin === 'string') {
    return sanitizeCssValue(margin);
  }
  return `${sanitizeCssValue(margin.top)} ${sanitizeCssValue(margin.right)} ${sanitizeCssValue(margin.bottom)} ${sanitizeCssValue(margin.left)}`;
}

function normalizeHeader(
  header: PaperfitPageConfig['header'],
): { content: string; position: string } | undefined {
  if (header === undefined) {
    return undefined;
  }
  if (typeof header === 'string') {
    return { content: header, position: 'top-center' };
  }
  return {
    content: header.content ?? '',
    position: header.position ?? 'top-center',
  };
}

function defaultFooterPosition(pageNumberPosition?: string): string {
  return pageNumberPosition === 'bottom-right'
    ? 'bottom-left'
    : 'bottom-center';
}

function normalizeFooter(
  footer: PaperfitPageConfig['footer'],
  pageNumberPosition?: string,
): { content: string; position: string } | undefined {
  if (footer === undefined) {
    return undefined;
  }
  const fallback = defaultFooterPosition(pageNumberPosition);
  if (typeof footer === 'string') {
    return { content: footer, position: fallback };
  }
  return {
    content: footer.content ?? '',
    position: footer.position ?? fallback,
  };
}

function positionToAtRule(position: string): string {
  return position;
}

function formatToCss(format: string): string {
  const normalized = format.replace(/\{\{\s*(page|pages)\s*\}\}/g, '{$1}');
  const parts: string[] = [];
  const regex = /\{(page|pages)\}|[^{]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized)) !== null) {
    const token = match[0];
    if (token === '{page}') {
      parts.push('counter(page)');
    } else if (token === '{pages}') {
      parts.push('counter(pages)');
    } else {
      parts.push(`"${token}"`);
    }
  }
  if (parts.length === 0) {
    return 'counter(page)';
  }
  return parts.join(' ');
}

export function generatePageCss(config: PaperfitPageConfig = {}): string {
  const pageRules: string[] = [];
  pageRules.push(`  size: ${pageSizeValue(config)};`);
  pageRules.push(`  margin: ${marginValue(config.margin)};`);
  if (config.bleed) {
    pageRules.push(`  bleed: ${sanitizeCssValue(config.bleed)};`);
  }
  if (config.marks && config.marks !== 'none') {
    pageRules.push(`  marks: ${config.marks};`);
  }

  function pageNumberPositionValue(): string | undefined {
    if (config.pageNumbers === true) {
      return config.pageNumberPosition ?? 'bottom-right';
    }
    if (typeof config.pageNumbers === 'string') {
      return config.pageNumbers;
    }
    if (typeof config.pageNumbers === 'object' && config.pageNumbers !== null) {
      return (
        config.pageNumbers.position ??
        config.pageNumberPosition ??
        'bottom-right'
      );
    }
    if (config.pageNumberPosition) {
      return config.pageNumberPosition;
    }
    return undefined;
  }

  const pageNumberPosition = pageNumberPositionValue();
  const header = normalizeHeader(config.header);
  const footer = normalizeFooter(config.footer, pageNumberPosition);

  if (config.runningHeader) {
    pageRules.push(
      `  @top-center { content: element(paperfitHeader); font-size: 9px; color: #64748b; }`,
    );
  }
  if (header && header.content) {
    pageRules.push(
      `  @${positionToAtRule(header.position)} { content: "${escapeCssString(header.content)}"; font-size: 9px; color: #64748b; }`,
    );
  }
  if (config.runningFooter) {
    pageRules.push(
      `  @bottom-center { content: element(paperfitFooter); font-size: 9px; color: #64748b; }`,
    );
  }
  if (footer && footer.content) {
    pageRules.push(
      `  @${positionToAtRule(footer.position)} { content: "${escapeCssString(footer.content)}"; font-size: 9px; color: #64748b; }`,
    );
  }

  let pageNumbersConfig: { format?: string; position?: string } | undefined;
  if (config.pageNumbers === true) {
    pageNumbersConfig = {
      format: config.pageNumberFormat ?? 'Page {page} of {pages}',
      position: config.pageNumberPosition ?? 'bottom-right',
    };
  } else if (typeof config.pageNumbers === 'string') {
    pageNumbersConfig = {
      format: config.pageNumberFormat ?? 'Page {page} of {pages}',
      position: config.pageNumbers,
    };
  } else if (
    typeof config.pageNumbers === 'object' &&
    config.pageNumbers !== null
  ) {
    pageNumbersConfig = {
      format:
        config.pageNumbers.format ??
        config.pageNumberFormat ??
        'Page {page} of {pages}',
      position:
        config.pageNumbers.position ??
        config.pageNumberPosition ??
        'bottom-right',
    };
  } else if (config.pageNumberPosition || config.pageNumberFormat) {
    pageNumbersConfig = {
      format: config.pageNumberFormat ?? 'Page {page} of {pages}',
      position: config.pageNumberPosition ?? 'bottom-right',
    };
  }

  if (pageNumbersConfig) {
    pageRules.push(
      `  @${pageNumbersConfig.position} { content: ${formatToCss(
        pageNumbersConfig.format ?? 'Page {page} of {pages}',
      )}; font-size: 9px; color: #64748b; }`,
    );
  }

  const css: string[] = [];
  css.push('@page {');
  css.push(pageRules.join('\n'));
  css.push('}');

  const hasHeader = !!(config.runningHeader || (header && header.content));
  const hasFooter = !!(config.runningFooter || (footer && footer.content));
  if (hasHeader) {
    css.push(
      '.paperfit-header, paperfit-header { position: running(paperfitHeader); }',
    );
  }
  if (hasFooter) {
    css.push(
      '.paperfit-footer, paperfit-footer { position: running(paperfitFooter); }',
    );
  }

  css.push('*, *::before, *::after { box-sizing: border-box; }');
  css.push('.pagedjs_page { background-color: #ffffff; }');
  css.push(
    'html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
  );
  css.push(
    '.paperfit-page-break, paperfit-page-break { break-before: page; page-break-before: always; }',
  );
  css.push(
    '.paperfit-avoid-break, paperfit-avoid-break { break-inside: avoid; page-break-inside: avoid; }',
  );
  css.push('.paperfit-page-counter-page::after { content: counter(page); }');
  css.push('.paperfit-page-counter-pages::after { content: counter(pages); }');
  css.push(
    '.pagedjs_margin-top, .pagedjs_margin-bottom, .pagedjs_margin-content, .paperfit-header, .paperfit-footer, paperfit-header, paperfit-footer { font-size: 9px; color: #64748b; }',
  );

  if (config.runningHeader) {
    css.push(
      `.paperfit-running-header-content::before { content: "${escapeCssString(String(config.runningHeader))}"; }`,
    );
  }
  if (header && header.content) {
    css.push(
      `.paperfit-running-header-content::before { content: "${escapeCssString(header.content)}"; }`,
    );
  }

  return css.join('\n');
}

export function configurePage(
  config: PaperfitPageConfig = {},
): HTMLStyleElement {
  const css = generatePageCss(config);
  const style = document.createElement('style');
  style.setAttribute('data-paperfit-page', 'true');
  style.textContent = css;
  if (document.head) {
    document.head.appendChild(style);
  }
  return style;
}
