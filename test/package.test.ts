/**
 * What the package ships: what an application imports from it, and what that needs at run time. The build and the
 * gallery are the repository's own tools, run from a checkout; they are not published.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('every export is a file the package ships, and the build is not one', () => {
  const shipped = (path: string) => pkg.files.some((folder: string) => path.replace(/^\.\//, '').startsWith(folder));
  for (const [name, path] of Object.entries<string>(pkg.exports)) assert.ok(shipped(path), `${name} → ${path} is not in files`);
  assert.ok(!pkg.files.includes('scripts/'), 'scripts/ is the repository’s, not the package’s');
  assert.equal(pkg.exports['./build.mjs'], undefined);
});

test('a runtime dependency is one the shipped source imports', () => {
  const source = readdirSync(new URL('../src/', import.meta.url), { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'))
    .join('\n');
  for (const name of Object.keys(pkg.dependencies ?? {}))
    assert.match(source, new RegExp(`from '${name}`), `${name} is a dependency that src/ never imports`);
});
