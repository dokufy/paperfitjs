#!/usr/bin/env node
import { compilePaperfitBuild } from './compiler.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      'Usage: paperfit-build [inputDir] [--output <outputDir>] [--inline]',
    );
    process.exit(0);
  }

  let inputDir = process.cwd();
  let outputDir: string | undefined;
  let inline = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] as string;
    if (arg === '--inline') {
      inline = true;
    } else if (arg === '--output' || arg === '-o') {
      outputDir = args[i + 1] as string;
      i += 1;
    } else if (arg === '--input' || arg === '-i') {
      inputDir = args[i + 1] as string;
      i += 1;
    } else if (!arg.startsWith('-')) {
      inputDir = arg;
    }
  }

  try {
    const result = compilePaperfitBuild({ inputDir, outputDir, inline });
    console.log(`paperfit build compiled to ${result.outputDir}`);
    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.warn(warning);
      }
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

main();
