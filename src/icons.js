/**
 * The icon map: every glyph the plugin's screen draws by hand, and the Phosphor
 * icon that replaces it.
 *
 * Phosphor (regular weight) is an icon font, so an icon is `<i class="tg-icon
 * ph ph-<name>">`. The build embeds the font and writes a rule for each name in
 * this file, so an icon that is not listed here has no rule: add it here.
 *
 * `GLYPHS` say what a thing is (the entity glyphs of the plugin's `glyphs.js`);
 * `ACTIONS` say what a control does (its `icons.js`); `MARKS` are the two the
 * design system draws itself, in a callout.
 */

/** The entity glyphs: one for each kind of thing the screen names. */
export const GLYPHS = {
  token: 'diamond',
  variable: 'hexagon',
  collection: 'stack',
  mode: 'circle-half',
  style: 'text-t',
  group: 'folder',
  set: 'squares-four',
  layer: 'square',
  template: 'file-text',
  sheet: 'table',
  'command-line': 'terminal',
  conventions: 'text-align-left',
  'look-again': 'arrow-clockwise',
  search: 'magnifying-glass',
  info: 'info',
  warning: 'warning',
  engine: 'gear',
};

/** The action icons: what a control does. */
export const ACTIONS = {
  chevronUp: 'caret-up',
  chevronDown: 'caret-down',
  chevronRight: 'caret-right',
  close: 'x',
  upload: 'upload-simple',
  export: 'download-simple',
  plus: 'plus',
  windowNarrow: 'device-mobile',
  windowWide: 'rectangle',
};

/** Every icon the design system knows, by the name the plugin used. */
export const ICONS = { ...GLYPHS, ...ACTIONS };

/** The Phosphor names the build writes a rule for. */
export const PHOSPHOR_NAMES = [...new Set(Object.values(ICONS))];

/**
 * The markup for one icon: by the plugin's name (`token`, `chevronDown`) or by
 * a Phosphor name that is in the map.
 *
 * @param {string} name
 * @param {{ tone?: 'muted' | 'faint', size?: 'sm' | 'lg' | 'xl' }} [options]
 */
export function iconMarkup(name, { tone, size } = {}) {
  const phosphor = ICONS[name] ?? name;
  return (
    `<i class="tg-icon ph ph-${phosphor}"${tone ? ` data-tone="${tone}"` : ''}${size ? ` data-size="${size}"` : ''}` +
    ` aria-hidden="true"></i>`
  );
}
