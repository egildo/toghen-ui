/**
 * Builds `dist/toghen-ui.css`: the design system's stylesheet, written by Toghen.
 *
 * `src/index.css` names the layers and imports each stylesheet into one; this
 * script inlines the imports, runs the result through `@toghen/postcss` with the
 * resolver document's tokens (which writes the token layer and the mixins), then
 * through the CSS mixins polyfill (which expands each `@apply`), and embeds the
 * fonts (Geist, Geist Mono and Phosphor's regular weight) as data URIs. The
 * nesting stays native: the stylesheet ships nested.
 *
 *   node scripts/build.mjs
 *
 * `onUnresolved: 'throw'`: a broken token fails the build rather than ship a
 * stylesheet with a literal `@toghen` in it.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import toghenPostcss from '@toghen/postcss';
import postcssMixins from '@csstools/postcss-mixins';
import { Resolver, load } from '@toghen/lib';
import { PHOSPHOR_NAMES } from '../src/icons.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const at = (...parts) => resolve(root, ...parts);

const PHOSPHOR = at('node_modules/@phosphor-icons/web/src/regular');
const GEIST = at('node_modules/geist/dist/fonts');

/** The layers, in the order the cascade ranks them. */
export const LAYERS = ['tg.tokens', 'tg.base', 'tg.components'];

/** The resolved design system: the sum of every context of every modifier. */
export async function loadSystem() {
  const { document } = await load(at('tokens/toghen-plugin.resolver.json'), { read: (path) => readFile(path, 'utf8') });
  return new Resolver(document).resolveContextsToDesignSystem();
}

/**
 * Inlines `@import './file.css' layer(name);` as `@layer name { …file… }`, the file indented one step: PostCSS
 * indents the rules the mixins write by the indentation it reads in the sheet, and a file at column 0 inside a layer
 * reads as none.
 */
function inlineImports(entry) {
  const dir = dirname(entry);
  const source = readFileSync(entry, 'utf8');
  const indented = (text) => text.replace(/^(?=.)/gm, '  ');
  return source.replace(
    /@import\s+['"]([^'"]+)['"]\s+layer\(([^)]+)\)\s*;/g,
    (_, file, layer) => `@layer ${layer} {\n${indented(readFileSync(resolve(dir, file), 'utf8'))}\n}`,
  );
}

/** `.ph-<name>::before { content }` for each icon the map names, read from Phosphor's own stylesheet. */
function phosphorRules() {
  const css = readFileSync(`${PHOSPHOR}/style.css`, 'utf8');
  const rules = PHOSPHOR_NAMES.map((name) => {
    const match = css.match(new RegExp(`\\.ph-${name.replace(/[-]/g, '\\-')}:before\\s*\\{\\s*content:\\s*"([^"]+)"`));
    if (!match) throw new Error(`Phosphor has no icon named "${name}" (named in src/icons.js)`);
    return `.ph-${name}::before { content: "${match[1]}"; }`;
  });
  return rules.join('\n');
}

const dataUri = (file) => `data:font/woff2;base64,${readFileSync(file).toString('base64')}`;

/** The font files and what they weigh, for the report. */
export const FONTS = {
  geistSans: `${GEIST}/geist-sans/Geist-Variable.woff2`,
  geistMono: `${GEIST}/geist-mono/GeistMono-Variable.woff2`,
  phosphor: `${PHOSPHOR}/Phosphor.woff2`,
};

/** Builds the stylesheet and returns it; `build()` also writes it. */
export async function buildCss() {
  const system = await loadSystem();
  // Functions as replacements: a `$&` in the rules would otherwise be a pattern.
  const input = inlineImports(at('src/index.css')).replace('/*PHOSPHOR_ICONS*/', () => phosphorRules());
  // One pipeline: Toghen writes the mixins and the tokens, the polyfill expands each `@apply`.
  const { css } = await postcss([
    toghenPostcss({ system, onUnresolved: 'throw', references: 'var', typography: 'font' }),
    postcssMixins(),
    // The sources explain themselves; the stylesheet that ships does not need to.
    { postcssPlugin: 'strip-comments', Once: (root) => root.walkComments((comment) => comment.remove()) },
  ]).process(input, { from: at('src/index.css') });

  return css
    .replace('url(GEIST_SANS)', () => `url(${dataUri(FONTS.geistSans)})`)
    .replace('url(GEIST_MONO)', () => `url(${dataUri(FONTS.geistMono)})`)
    .replace('url(PHOSPHOR)', () => `url(${dataUri(FONTS.phosphor)})`);
}

export async function build() {
  const css = await buildCss();
  mkdirSync(at('dist'), { recursive: true });
  writeFileSync(at('dist/toghen-ui.css'), css, 'utf8');
  return css;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = await build();
  console.log(`dist/toghen-ui.css  ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`);
}
