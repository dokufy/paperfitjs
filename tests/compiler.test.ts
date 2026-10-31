import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compilePaperfitBuild } from '../src/compiler.js';
import { paperfitVitePlugin } from '../src/vite.js';

describe('compiler', () => {
  it('flattens nested assets and rewrites html/css', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfit-'));
    const assets = path.join(root, 'assets');
    fs.mkdirSync(assets);
    fs.writeFileSync(
      path.join(assets, 'main.css'),
      'body { background: url("../images/bg.png"); }',
    );
    const images = path.join(root, 'images');
    fs.mkdirSync(images);
    fs.writeFileSync(path.join(images, 'bg.png'), 'PNG');
    fs.writeFileSync(path.join(assets, 'app.js'), 'console.log("hi");');
    fs.writeFileSync(
      path.join(root, 'index.html'),
      '<!DOCTYPE html><html><head><link rel="stylesheet" href="/assets/main.css"></head><body><script src="assets/app.js"></script><img src="assets/missing.png"></body></html>',
    );

    const result = compilePaperfitBuild({ inputDir: root });
    expect(result.files).toContain('main.css');
    expect(result.files).toContain('app.js');
    expect(result.files).toContain('bg.png');
    expect(fs.existsSync(path.join(root, 'assets'))).toBe(false);

    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('main.css');
    expect(html).toContain('app.js');

    const css = fs.readFileSync(path.join(root, 'main.css'), 'utf8');
    expect(css).toContain('bg.png');
  });

  it('inline mode inlines css and js', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfit-'));
    fs.writeFileSync(path.join(root, 'main.css'), 'body{color:red;}');
    fs.writeFileSync(path.join(root, 'app.js'), 'console.log(1);');
    fs.writeFileSync(
      path.join(root, 'index.html'),
      '<html><head><link rel="stylesheet" href="./main.css"></head><body><script src="./app.js"></script></body></html>',
    );
    compilePaperfitBuild({ inputDir: root, inline: true });
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('body{color:red;}');
    expect(html).toContain('console.log(1);');
  });

  it('validates json_schema', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfit-'));
    fs.writeFileSync(path.join(root, 'json_schema.json'), '{invalid');
    fs.writeFileSync(path.join(root, 'index.html'), '<html></html>');
    const result = compilePaperfitBuild({ inputDir: root });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('throws when index.html missing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfit-'));
    expect(() => compilePaperfitBuild({ inputDir: root })).toThrow(
      'index.html is missing in the build output directory',
    );
  });

  it('vite plugin returns config', () => {
    const plugin = paperfitVitePlugin();
    expect(plugin.name).toBe('paperfit');
    const cfg = plugin.config();
    expect(cfg.base).toBe('./');
    expect(cfg.build.rollupOptions.output.entryFileNames).toBe('[name].js');
  });
});

describe('compiler inline escaping', () => {
  it('escapes </script> and </style> when inlining', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperfit-'));
    fs.writeFileSync(path.join(root, 'main.css'), 'a</style>b');
    fs.writeFileSync(path.join(root, 'app.js'), 'a</script>b');
    fs.writeFileSync(
      path.join(root, 'index.html'),
      '<html><head><link rel="stylesheet" href="./main.css"></head><body><script src="./app.js"></script></body></html>',
    );
    compilePaperfitBuild({ inputDir: root, inline: true });
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('<\\/style');
    expect(html).toContain('<\\/script');
    expect(html).not.toContain('a</style>b');
    expect(html).not.toContain('a</script>b');
  });
});
