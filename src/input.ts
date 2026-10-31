declare global {
  interface Window {
    __PAPERFIT_INPUT__?: any;
    __PAPERFIT_DEFAULT_INPUT__?: any;
    __PAPERFIT_READY__?: boolean;
  }
}

function getInjectedInput(): any {
  if (typeof window === 'undefined') {
    return undefined;
  }
  if (window.__PAPERFIT_INPUT__ != null) {
    return window.__PAPERFIT_INPUT__;
  }
  return undefined;
}

function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target: any, source: any): any {
  if (isPlainObject(target) && isPlainObject(source)) {
    const result: Record<string, any> = { ...target };
    for (const key of Object.keys(source)) {
      result[key] = deepMerge(result[key], source[key]);
    }
    return result;
  }
  return source === undefined ? target : source;
}

export function setPaperfitDefaultInput<T>(
  input: T,
  options?: { merge?: boolean },
): void {
  const injected = getInjectedInput();
  if (injected != null) {
    console.debug('paperfit input already set, it cannot be overridden');
  }

  const storedDefault =
    typeof window !== 'undefined'
      ? window.__PAPERFIT_DEFAULT_INPUT__
      : undefined;

  let nextDefault = input;
  if (options?.merge && storedDefault !== undefined) {
    nextDefault = deepMerge(storedDefault, input);
  }

  if (typeof window !== 'undefined') {
    window.__PAPERFIT_DEFAULT_INPUT__ = nextDefault;
    if (injected == null) {
      window.__PAPERFIT_INPUT__ = nextDefault;
    }
  }
}

export function getPaperfitInput<T>(
  defaultValue?: Partial<T>,
  options?: { merge?: boolean },
): T {
  const injected = getInjectedInput();
  const storedDefault =
    typeof window !== 'undefined'
      ? window.__PAPERFIT_DEFAULT_INPUT__
      : undefined;

  if (injected != null) {
    if (defaultValue !== undefined || options?.merge) {
      let result: any = {};
      if (storedDefault != null) {
        result = deepMerge(result, storedDefault);
      }
      if (defaultValue !== undefined) {
        result = deepMerge(result, defaultValue);
      }
      result = deepMerge(result, injected);
      return result as T;
    }
    return injected as T;
  }

  if (defaultValue !== undefined) {
    if (storedDefault != null) {
      return deepMerge(storedDefault, defaultValue) as T;
    }
    return defaultValue as T;
  }

  if (storedDefault !== undefined) {
    return storedDefault as T;
  }

  throw new Error(
    'No paperfit input found! Use setPaperfitDefaultInput to set default values.',
  );
}

export function hasPaperfitInput(): boolean {
  const injected = getInjectedInput();
  const storedDefault =
    typeof window !== 'undefined'
      ? window.__PAPERFIT_DEFAULT_INPUT__
      : undefined;

  return injected != null || storedDefault != null;
}

function resolvePath(data: any, path: string): any {
  if (data == null) {
    return undefined;
  }
  const parts = path.split('.');
  let current = data;
  for (const part of parts) {
    if (
      part === '__proto__' ||
      part === 'prototype' ||
      part === 'constructor'
    ) {
      return undefined;
    }
    if (current == null) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

export function bindPaperfitVariables(
  root?: ParentNode,
  data?: Record<string, any>,
): void {
  const scope =
    root ??
    (typeof document !== 'undefined'
      ? (document as unknown as ParentNode)
      : undefined);
  if (!scope) {
    return;
  }

  let resolvedData: any;
  try {
    resolvedData = data ?? getPaperfitInput();
  } catch {
    resolvedData = data ?? {};
  }

  const textNodes = Array.from(
    scope.querySelectorAll?.('[data-paperfit-text]') ?? [],
  );
  for (const el of textNodes) {
    const path = el.getAttribute('data-paperfit-text');
    if (!path) {
      continue;
    }
    const value = resolvePath(resolvedData, path);
    el.textContent = value == null ? '' : String(value);
  }

  const htmlNodes = Array.from(
    scope.querySelectorAll?.('[data-paperfit-html]') ?? [],
  );
  for (const el of htmlNodes) {
    const path = el.getAttribute('data-paperfit-html');
    if (!path) {
      continue;
    }
    const value = resolvePath(resolvedData, path);
    el.innerHTML = value == null ? '' : String(value);
  }

  const ifNodes = Array.from(
    scope.querySelectorAll?.('[data-paperfit-if]') ?? [],
  );
  for (const el of ifNodes) {
    const path = el.getAttribute('data-paperfit-if');
    if (!path) {
      continue;
    }
    const value = resolvePath(resolvedData, path);
    const truthy = Boolean(value);
    if (el instanceof HTMLElement) {
      el.style.display = truthy ? '' : 'none';
      if (truthy) {
        el.removeAttribute('hidden');
      } else {
        el.setAttribute('hidden', '');
      }
    }
  }

  const eachNodes = Array.from(
    scope.querySelectorAll?.('[data-paperfit-each]') ?? [],
  );
  for (const container of eachNodes) {
    const path = container.getAttribute('data-paperfit-each');
    if (!path) {
      continue;
    }
    const items = resolvePath(resolvedData, path);
    if (!Array.isArray(items)) {
      continue;
    }

    const template =
      container instanceof HTMLTemplateElement
        ? container
        : container.querySelector('template');

    if (!template) {
      continue;
    }

    Array.from(container.children).forEach((child) => {
      if (child !== template) {
        child.remove();
      }
    });

    for (const item of items) {
      const fragment = (
        template instanceof HTMLTemplateElement ? template.content : template
      ).cloneNode(true) as DocumentFragment;
      bindPaperfitVariables(fragment as unknown as ParentNode, item as any);
      container.appendChild(fragment);
    }
  }
}
