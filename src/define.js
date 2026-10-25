/**
 * Defines a custom element once, so a module imported twice does not throw.
 *
 * `build` returns the class, and is called only where there is a registry: the
 * class extends `HTMLElement`, which a test running in Node does not have, and
 * the pure functions beside it should still be importable there.
 *
 * @param {string} name
 * @param {() => CustomElementConstructor} build
 */
export function define(name, build) {
  if (typeof customElements === 'undefined' || customElements.get(name)) return;
  customElements.define(name, build());
}
