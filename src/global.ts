declare global {
  interface Window {
    __PAPERFIT_INPUT__: any;
  }
}

export function setPaperfitDefaultInput<T>(input: T): void {
  if (window.__PAPERFIT_INPUT__) {
    console.debug('paperfit input already set, it cannot be overridden');
  } else {
    window.__PAPERFIT_INPUT__ = input;
  }
}

export function getPaperfitInput<T>(): T {
  const input = window.__PAPERFIT_INPUT__;

  if (input) {
    return input as T;
  } else {
    throw new Error(
      'No paperfit input found! Use setPaperfitDefaultInput to set default values.',
    );
  }
}

export {};
