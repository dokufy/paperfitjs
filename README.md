# paperfit.js

Build HTML templates ready for PDF conversion using [paperfit](https://github.com/dokufy/paperfit).

This library provides helper functions that facilitate the proper configuration of an HTML template for PDF conversion.

Using this library to generate PDFs with [paperfit](https://github.com/dokufy/paperfit) is not strictly necessary but is highly recommended.

paperfit makes input variables available in `window.__PAPERFIT_INPUT__`.

## Getting started

### Installation

```sh
# npm
npm install paperfit.js

# pnpm
pnpm add paperfit.js

# yarn
yarn add paperfit.js

# bun
bun add paperfit.js
```

The package is published as an ES module. The CLI and build integrations require Node.js 22.12 or newer.

### Vanilla HTML / JavaScript

```js
import {
  setPaperfitDefaultInput,
  getPaperfitInput,
  bindPaperfitVariables,
  configurePage,
  renderPaperfit,
} from 'paperfit.js';

configurePage({ size: 'A4', margin: '20mm', pageNumbers: 'bottom-right' });

const defaultInput = { title: 'Hello' };
setPaperfitDefaultInput(defaultInput);

const input = getPaperfitInput();
bindPaperfitVariables(document, input);

renderPaperfit({ source: '#app' });
```

### React

```tsx
import { createRoot } from 'react-dom/client';
import { renderAfterFrameworkMount } from 'paperfit.js';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
renderAfterFrameworkMount(undefined, { source: '#root' });
```

### Vue

```ts
import { createApp } from 'vue';
import { renderAfterFrameworkMount } from 'paperfit.js';

const app = createApp(App);
app.mount('#app');
renderAfterFrameworkMount(undefined, { source: '#app' });
```

### Angular

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { renderAfterFrameworkMount } from 'paperfit.js';

bootstrapApplication(AppComponent).then(() => {
  renderAfterFrameworkMount(undefined, { source: 'app-root' });
});
```

### Paged.js layout configuration

Use `configurePage` or the `<paperfit-document>` custom element to define `@page` rules.

```ts
import { configurePage } from 'paperfit.js';

configurePage({
  size: 'A4',
  orientation: 'portrait',
  margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
  header: 'My Header',
  footer: 'My Footer',
  pageNumbers: { format: 'Page {page} of {pages}', position: 'bottom-right' },
});
```

### Custom elements

```html
<paperfit-document
  size="A4"
  orientation="portrait"
  margin="20mm"
  page-numbers="bottom-right"
  auto-render="true"
>
  <paperfit-header>Header</paperfit-header>
  <paperfit-footer>Footer</paperfit-footer>
  <paperfit-page-break></paperfit-page-break>
  <paperfit-avoid-break>Keep together</paperfit-avoid-break>
  <paperfit-page-number format="Page {page} of {pages}"></paperfit-page-number>
</paperfit-document>
```

### Build flattener (paperfit-build)

```sh
npx paperfit-build ./dist --inline
```

The CLI flattens nested build output into a single root directory and rewrites references.

### Vite plugin

```ts
import { paperfitVitePlugin } from 'paperfit.js/vite';

export default {
  plugins: [paperfitVitePlugin()],
};
```

## API overview

- `setPaperfitDefaultInput(input, options?)`
- `getPaperfitInput(defaultValue?, options?)`
- `hasPaperfitInput()`
- `bindPaperfitVariables(root?, data?)`
- `renderPaperfit(options?)`
- `configurePage(config)`
- `generatePageCss(config)`
- `registerPaperfitComponents()`
- `renderAfterFrameworkMount(fn?, options?)`
- `createPaperfitTemplate(config)`

The Node.js-only entry points are available as subpath exports:

- `paperfit.js/compiler`: `compilePaperfitBuild(options)`
- `paperfit.js/vite`: `paperfitVitePlugin(options?)`

## Releasing

Releases are published to npm by GitHub Actions when a version tag is pushed.

1. Add an `NPM_TOKEN` repository secret in GitHub containing an npm granular access token with publish rights for this package.
2. Bump the version and push the tag:

   ```sh
   npm version patch # or minor / major
   git push --follow-tags
   ```

3. The `Verify` job runs formatting checks, linting, tests, and the build. Once it passes, the `Publish to npm` job publishes the package.

## License

MIT
