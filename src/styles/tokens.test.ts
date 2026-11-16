import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Every *.module.css under src/, read from disk. */
function moduleCssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return moduleCssFiles(path);
    return name.endsWith('.module.css') ? [path] : [];
  });
}

const SRC = join(__dirname, '..');
const tokens = readFileSync(join(__dirname, 'tokens.css'), 'utf8');
const defined = new Set([...tokens.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]));

describe('design tokens', () => {
  const files = moduleCssFiles(SRC);

  it('finds component stylesheets to check', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [f.replace(SRC, 'src')] as const))(
    '%s uses tokens only: no raw colours or pixel sizes',
    (relative) => {
      const css = readFileSync(relative.replace('src', SRC), 'utf8');
      const problems: string[] = [];
      css.split('\n').forEach((line, index) => {
        // Media queries cannot read custom properties, so breakpoints are written out.
        if (line.trim().startsWith('@media')) return;
        if (/#[0-9a-f]{3,8}\b/i.test(line)) problems.push(`${index + 1}: raw hex colour`);
        if (/\b(rgb|rgba|hsl|hsla)\(/.test(line))
          problems.push(`${index + 1}: raw colour function`);
        if (/\d(px|rem|em|pt)\b/.test(line))
          problems.push(`${index + 1}: raw size "${line.trim()}"`);
      });
      expect(problems).toEqual([]);
    },
  );

  it('only references tokens that exist', () => {
    const missing = new Set<string>();
    for (const file of files) {
      const css = readFileSync(file, 'utf8');
      for (const match of css.matchAll(/var\((--[\w-]+)/g)) {
        if (match[1] && !defined.has(match[1])) missing.add(`${match[1]} in ${file}`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('never uses weight 500 with Crimson Text', () => {
    const textStyles = [...tokens.matchAll(/--type-[\w-]+:\s*(\d+)[^;]*var\(--font-text\)/g)];
    expect(textStyles.length).toBeGreaterThan(0);
    for (const style of textStyles) expect(['400', '600', '700']).toContain(style[1]);
  });

  it('keeps stars ink and error separate from primary', () => {
    expect(tokens).toMatch(/--star-rating:\s*var\(--ink\)/);
    expect(tokens).toMatch(/--primary:\s*#8b1d3b/);
    const error = /--error:\s*(#[0-9a-f]+)/.exec(tokens)?.[1];
    expect(error).toBeDefined();
    expect(error).not.toBe('#8b1d3b');
  });
});
