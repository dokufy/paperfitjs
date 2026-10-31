import fs from 'node:fs';
import path from 'node:path';

export interface CompileOptions {
  inputDir: string;
  outputDir?: string;
  inline?: boolean;
  flatten?: boolean;
}

export interface CompileResult {
  outputDir: string;
  files: string[];
  warnings: string[];
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(current: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function posixRel(p: string): string {
  return p.split(path.sep).join('/');
}

export function compilePaperfitBuild(options: CompileOptions): CompileResult {
  const inputDir = path.resolve(options.inputDir);
  const outputDir = path.resolve(options.outputDir ?? options.inputDir);
  const inline = Boolean(options.inline);
  const warnings: string[] = [];

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`);
  }
  const indexHtmlPath = path.join(inputDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('index.html is missing in the build output directory');
  }

  const allFiles = collectFiles(inputDir);
  const relativeFiles = allFiles.map((f) =>
    posixRel(path.relative(inputDir, f)),
  );
  const sorted = [...relativeFiles].sort();

  const used = new Set<string>();
  const mapping = new Map<string, string>();
  for (const rel of sorted) {
    let base = path.basename(rel);
    if (used.has(base)) {
      const ext = path.extname(base);
      const name = path.basename(base, ext);
      let i = 1;
      while (used.has(`${name}_${i}${ext}`)) {
        i += 1;
      }
      base = `${name}_${i}${ext}`;
    }
    used.add(base);
    mapping.set(rel, base);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const inPlace = outputDir === inputDir;

  for (const rel of sorted) {
    const srcPath = path.join(inputDir, rel);
    const flatName = mapping.get(rel) as string;
    const destPath = path.join(outputDir, flatName);
    const buffer = fs.readFileSync(srcPath);
    fs.writeFileSync(destPath, buffer);

    if (inPlace && path.dirname(rel) !== '.') {
      try {
        fs.unlinkSync(srcPath);
      } catch {
        // ignore
      }
    }
  }

  if (inPlace) {
    const removeEmptyDirs = (dir: string): void => {
      if (dir === inputDir) {
        return;
      }
      if (!fs.existsSync(dir)) {
        return;
      }
      const entries = fs.readdirSync(dir);
      if (entries.length === 0) {
        fs.rmdirSync(dir);
        return;
      }
      for (const entry of entries) {
        removeEmptyDirs(path.join(dir, entry));
      }
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    };
    for (const entry of fs.readdirSync(inputDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        removeEmptyDirs(path.join(inputDir, entry.name));
      }
    }
  }

  const schemaPath = path.join(inputDir, 'json_schema.json');
  if (fs.existsSync(schemaPath)) {
    try {
      JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    } catch (err) {
      warnings.push(`Invalid json_schema.json: ${(err as Error).message}`);
    }
  }

  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const rewritePaths = (text: string): string => {
    const keys = [...mapping.keys()].sort((a, b) => b.length - a.length);
    if (keys.length === 0) {
      return text;
    }
    const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp('(?:\\./|/)?(' + escaped.join('|') + ')', 'g');
    return text.replace(pattern, (_match: string, key: string) => {
      const flat = mapping.get(key);
      return flat ? `./${flat}` : _match;
    });
  };

  indexHtml = rewritePaths(indexHtml);

  const cssFiles = relativeFiles.filter((r) => r.endsWith('.css'));
  for (const cssRel of cssFiles) {
    const flatName = mapping.get(cssRel) as string;
    const cssPath = path.join(outputDir, flatName);
    if (!fs.existsSync(cssPath)) {
      continue;
    }
    let css = fs.readFileSync(cssPath, 'utf8');
    css = css.replace(
      /url\(\s*['"]?([^'")]+)['"]?\s*\)/g,
      (match: string, url: string) => {
        const trimmed = String(url).trim();
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:') ||
          trimmed.startsWith('#')
        ) {
          return match;
        }
        const cssDir = path.posix.dirname(cssRel);
        const resolved = path.posix.normalize(path.posix.join(cssDir, trimmed));
        const flat = mapping.get(resolved);
        if (flat) {
          return `url(./${flat})`;
        }
        return `url(./${path.basename(trimmed)})`;
      },
    );
    fs.writeFileSync(cssPath, css);
  }

  const jsFiles = relativeFiles.filter((r) => r.endsWith('.js'));
  for (const jsRel of jsFiles) {
    const flatName = mapping.get(jsRel) as string;
    const jsPath = path.join(outputDir, flatName);
    if (!fs.existsSync(jsPath)) {
      continue;
    }
    let js = fs.readFileSync(jsPath, 'utf8');
    js = rewritePaths(js);
    fs.writeFileSync(jsPath, js);
  }

  if (inline) {
    indexHtml = indexHtml.replace(
      /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
      (match: string, href: string) => {
        const flat = String(href).replace(/^\.\//, '');
        const filePath = path.join(outputDir, flat);
        if (fs.existsSync(filePath)) {
          const css = fs
            .readFileSync(filePath, 'utf8')
            .replace(new RegExp('</style', 'gi'), '<\\/style');
          return `<style>\n${css}\n</style>`;
        }
        return match;
      },
    );
    indexHtml = indexHtml.replace(
      /<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
      (match: string, src: string) => {
        const flat = String(src).replace(/^\.\//, '');
        const filePath = path.join(outputDir, flat);
        if (fs.existsSync(filePath)) {
          const js = fs
            .readFileSync(filePath, 'utf8')
            .replace(new RegExp('</script', 'gi'), '<\\/script');
          return `<script>\n${js}\n</script>`;
        }
        return match;
      },
    );
  }

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);

  return {
    outputDir,
    files: fs.readdirSync(outputDir),
    warnings,
  };
}
