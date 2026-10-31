# paperfit.js

Build HTML templates that accept input variables and render them to PDF with [paperfit](https://github.com/dokufy/paperfit).

paperfit passes the input variables from each render request into the template, and paperfit.js makes them available to your code or binds them directly into the HTML.
This lets one layout produce a personalized invoice, report, contract, or letter for each request.

paperfit.js also handles page configuration, pagination, and rendering through Paged.js.

## Highlights

- **Input variables**: Read the injected object with `getPaperfitInput()`, or bind it into the markup with `data-paperfit-*` attributes.
- **HTML-first layout**: Build the document with normal HTML and CSS.
- **Pagination**: Add page breaks, running headers, footers, and page numbers.
- **Framework support**: Use it with Vanilla JavaScript, React, Vue, or Angular.

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

### Input variables

paperfit accepts input variables with each render request and injects them into `window.__PAPERFIT_INPUT__`.
paperfit.js exposes that object through `getPaperfitInput()` and can bind it directly into the HTML.

Given this input object:

```json
{
  "title": "Invoice",
  "customer": { "name": "Ada" },
  "items": [{ "name": "Widget", "qty": 2, "price": "10.00" }]
}
```

Read it in JavaScript:

```js
import { getPaperfitInput } from 'paperfit.js';

const input = getPaperfitInput();
console.log(input.customer.name); // Ada
```

Bind it directly into the markup:

```html
<h1 data-paperfit-text="title"></h1>
<p>Billed to <span data-paperfit-text="customer.name"></span></p>
```

`setPaperfitDefaultInput()` provides fallback values when paperfit does not inject input, for example during local development.

### HTML template layout

A paperfit template is a regular HTML document.
The content and layout live in normal HTML and CSS, while JavaScript supplies the input data, configures the page, and starts rendering.

A complete template looks like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Invoice</title>
  </head>
  <body>
    <main id="app">
      <h1 data-paperfit-text="title"></h1>
      <p>Billed to <span data-paperfit-text="customer.name"></span></p>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody data-paperfit-each="items">
          <template>
            <tr>
              <td data-paperfit-text="name"></td>
              <td data-paperfit-text="qty"></td>
              <td data-paperfit-text="price"></td>
            </tr>
          </template>
        </tbody>
      </table>

      <section data-paperfit-if="notes">
        <h2>Notes</h2>
        <p data-paperfit-text="notes"></p>
      </section>

      <paperfit-page-break></paperfit-page-break>

      <section>
        <h2>Terms</h2>
        <p>Payment is due within 30 days.</p>
      </section>
    </main>

    <script type="module" src="/main.js"></script>
  </body>
</html>
```

The `data-paperfit-*` attributes connect the markup to the input object:

| Attribute                     | Effect                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `data-paperfit-text="path"`   | Sets the element's text content.                                                                                                 |
| `data-paperfit-html="path"`   | Sets the element's inner HTML. Only use this with trusted input.                                                                 |
| `data-paperfit-if="path"`     | Hides the element when the value is falsy and shows it when the value is truthy.                                                 |
| `data-paperfit-each="path"`   | Renders the inner `<template>` once for every item in an array. Paths inside the template are resolved against the current item. |
| `data-paperfit-root`          | Marks the element to render when `renderPaperfit()` is called without a `source`.                                                |
| `data-paperfit-render-target` | Marks the element that receives the rendered pages.                                                                              |

Paths use dot notation, so `customer.name` reads `input.customer.name`.
Inside `data-paperfit-each`, paths are relative to the current item.

Paged.js flows the content into pages, while paperfit.js adds elements that control pagination:

- `<paperfit-page-break>` starts a new page.
- `<paperfit-avoid-break>` keeps its content together on one page.
- `<paperfit-page-number>` renders the current page number and supports `{page}` and `{pages}` placeholders.
- `<paperfit-header>` and `<paperfit-footer>` mark content as running elements that you can place in `@page` margin boxes.

### Vanilla HTML / JavaScript

```html
<!-- index.html -->
<main id="app">
  <h1 data-paperfit-text="title"></h1>
  <p data-paperfit-text="customer.name"></p>
</main>

<div data-paperfit-render-target></div>
<script type="module" src="/main.js"></script>
```

```js
// main.js
import {
  setPaperfitDefaultInput,
  getPaperfitInput,
  bindPaperfitVariables,
  configurePage,
  renderPaperfit,
} from 'paperfit.js';

configurePage({ size: 'A4', margin: '20mm', pageNumbers: 'bottom-right' });

const defaultInput = { title: 'Hello', customer: { name: 'Ada' } };
setPaperfitDefaultInput(defaultInput);

const input = getPaperfitInput();
bindPaperfitVariables(document, input);

renderPaperfit({ source: '#app' });
```

### React

```html
<!-- index.html -->
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

```tsx
import { createRoot } from 'react-dom/client';
import { renderAfterFrameworkMount } from 'paperfit.js';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
renderAfterFrameworkMount(undefined, { source: '#root' });
```

`App` renders the layout with the same HTML elements and `data-paperfit-*` attributes shown above.

### Vue

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
```

```ts
import { createApp } from 'vue';
import { renderAfterFrameworkMount } from 'paperfit.js';

const app = createApp(App);
app.mount('#app');
renderAfterFrameworkMount(undefined, { source: '#app' });
```

`App` renders the layout with the same HTML elements and `data-paperfit-*` attributes shown above.

### Angular

```html
<!-- src/index.html -->
<app-root></app-root>
```

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { renderAfterFrameworkMount } from 'paperfit.js';

bootstrapApplication(AppComponent).then(() => {
  renderAfterFrameworkMount(undefined, { source: 'app-root' });
});
```

`AppComponent` renders the layout with the same HTML elements and `data-paperfit-*` attributes shown above.

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

The same page size, orientation, and margins can be set as attributes on `<paperfit-document>` in HTML.

### Custom elements

Importing `paperfit.js` registers these elements automatically.
`<paperfit-document>` applies its page settings and renders itself unless `auto-render="false"` is set.

```html
<paperfit-document
  size="A4"
  orientation="portrait"
  margin="20mm"
  auto-render="true"
>
  <paperfit-header>Header</paperfit-header>
  <paperfit-footer>
    <paperfit-page-number
      format="Page {page} of {pages}"
    ></paperfit-page-number>
  </paperfit-footer>
  <paperfit-page-break></paperfit-page-break>
  <paperfit-avoid-break>Keep together</paperfit-avoid-break>
</paperfit-document>
```

`<paperfit-header>` and `<paperfit-footer>` are running elements, so place them in `@page` margin boxes:

```css
@page {
  @top-center {
    content: element(paperfitHeader);
  }
  @bottom-center {
    content: element(paperfitFooter);
  }
}
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
