import { setPaperfitDefaultInput, getPaperfitInput } from './input.js';
import { configurePage } from './page-css.js';
import { renderPaperfit, type PaperfitRenderOptions } from './paged.js';

export async function renderAfterFrameworkMount(
  fn?: () => void | Promise<void>,
  options?: PaperfitRenderOptions,
): Promise<any> {
  if (fn) {
    await fn();
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
  if (typeof requestAnimationFrame !== 'undefined') {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  return renderPaperfit(options);
}

export async function createPaperfitTemplate<TInput>(config: {
  defaultInput?: TInput;
  page?: any;
  render?: (input: TInput) => void | Promise<void>;
  pagedOptions?: PaperfitRenderOptions;
}): Promise<any> {
  if (config.defaultInput !== undefined) {
    setPaperfitDefaultInput(config.defaultInput);
  }
  if (config.page) {
    configurePage(config.page);
  }
  const input = getPaperfitInput<TInput>(config.defaultInput as any);
  if (config.render) {
    await config.render(input);
  }
  return renderPaperfit(config.pagedOptions);
}
