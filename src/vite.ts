import fs from 'node:fs';
import path from 'node:path';

export interface PaperfitVitePluginOptions {
  outDir?: string;
  copyJsonSchema?: boolean;
}

export function paperfitVitePlugin(options?: PaperfitVitePluginOptions): any {
  const opts = options ?? {};
  return {
    name: 'paperfit',
    config() {
      return {
        base: './',
        build: {
          rollupOptions: {
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: '[name].js',
              assetFileNames: '[name][extname]',
            },
          },
        },
      };
    },
    closeBundle() {
      if (opts.copyJsonSchema === false) {
        return;
      }
      const schemaPath = path.resolve(process.cwd(), 'json_schema.json');
      if (!fs.existsSync(schemaPath)) {
        return;
      }
      const outDir = path.resolve(process.cwd(), opts.outDir ?? 'dist');
      fs.mkdirSync(outDir, { recursive: true });
      fs.copyFileSync(schemaPath, path.join(outDir, 'json_schema.json'));
    },
  };
}
