export * from './input.js';
export * from './global.js';
export * from './paged.js';
export * from './handlers.js';
export * from './page-css.js';
export * from './components.js';
export * from './frameworks.js';

import * as input from './input.js';
import * as paged from './paged.js';
import * as handlers from './handlers.js';
import * as pageCss from './page-css.js';
import * as components from './components.js';
import * as frameworks from './frameworks.js';

const paperfit = {
  ...input,
  ...paged,
  ...handlers,
  ...pageCss,
  ...components,
  ...frameworks,
};

export default paperfit;
