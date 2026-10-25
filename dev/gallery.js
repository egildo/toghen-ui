// The gallery: every component, with every variant, size, tone and state that can be shown on a static
// page (an ARIA attribute or `disabled` stands for a state). Hover, pressed and focus work live: use the
// pointer and the Tab key. The switch at the top sets `data-theme` on <html>.

import '/src/elements.js';
import { GLYPHS, ACTIONS, iconMarkup } from '/src/icons.js';

const page = document.getElementById('page');
const toc = document.getElementById('toc');

/** @param {string} id @param {string} title @param {string} lede @param {[string, string][]} cases @param {{wide?: boolean, block?: boolean}} [options] */
function section(id, title, lede, cases, { wide = false, block = false } = {}) {
  const el = document.createElement('section');
  el.className = 'component';
  el.id = id;
  el.innerHTML =
    `<h2>${title}</h2><p>${lede}</p><div class="cases${wide ? ' wide' : ''}">` +
    cases
      .map(
        ([caption, markup]) =>
          `<div class="case"><div class="specimen${block ? ' block' : ''}">${markup}</div><div class="caption">${caption}</div></div>`,
      )
      .join('') +
    `</div>`;
  page.append(el);
  toc.insertAdjacentHTML('beforeend', `<a class="tg-button" data-variant="link" href="#${id}">${title}</a>`);
}

const icon = (name, options) => iconMarkup(name, options);

// ── icon ────────────────────────────────────────────────────────────────
section(
  'icon',
  'Icon',
  'The Phosphor icon font, regular weight: <code>&lt;i class="tg-icon ph ph-name"&gt;</code>. Tone and size are data attributes.',
  [
    ['default (12 px, inherits colour)', icon('token')],
    ['data-size="sm"', icon('token', { size: 'sm' })],
    ['data-size="lg"', icon('token', { size: 'lg' })],
    ['data-size="xl"', icon('token', { size: 'xl' })],
    ['data-tone="muted"', icon('collection', { tone: 'muted' })],
    ['data-tone="faint"', icon('collection', { tone: 'faint' })],
  ],
);

// ── dot ─────────────────────────────────────────────────────────────────
section(
  'dot',
  'Dot',
  'Six states of a thing the screen watches, two for a process, and silence. The element gives each its spoken label (see the accessibility tree).',
  ['drifted', 'upstream', 'absent', 'unread', 'connected', 'busy', 'idle', 'error']
    .map((state) => [`data-state="${state}"`, `<tg-dot data-state="${state}"></tg-dot>`])
    .concat([['no state: silence', '<tg-dot></tg-dot>']]),
);

// ── swatch, monogram, divider ───────────────────────────────────────────
section('swatch', 'Swatch', 'A colour, as a small square. The fill is data: an inline <code>background-color</code>.', [
  ['sm', '<span class="tg-swatch" data-size="sm" style="background-color:#0c8ce9"></span>'],
  ['md (default)', '<span class="tg-swatch" style="background-color:#0c8ce9"></span>'],
  ['lg', '<span class="tg-swatch" data-size="lg" style="background-color:#0c8ce9"></span>'],
  ['light fill, edge shows', '<span class="tg-swatch" data-size="lg" style="background-color:#ffffff"></span>'],
  ['data-variant="empty"', '<span class="tg-swatch" data-variant="empty" data-size="lg"></span>'],
]);

section(
  'monogram',
  'Monogram',
  'Initials on a hue. The hue is data (<code>--hue</code>); lightness and text colour change with the theme.',
  [
    ['md (default)', '<span class="tg-monogram" style="--hue:210">AB</span>'],
    ['md, hue 20', '<span class="tg-monogram" style="--hue:20">CD</span>'],
    ['md, hue 140', '<span class="tg-monogram" style="--hue:140">EF</span>'],
    ['md, hue 300', '<span class="tg-monogram" style="--hue:300">GH</span>'],
    ['data-size="lg"', '<span class="tg-monogram" data-size="lg" style="--hue:210">AB</span>'],
  ],
);

section(
  'divider',
  'Divider',
  'A hairline between two blocks.',
  [['hr.tg-divider', '<div style="width:100%"><span>Above</span><hr class="tg-divider" /><span>Below</span></div>']],
  { block: true },
);

// ── button ──────────────────────────────────────────────────────────────
const buttons = (attrs = '') => `<button type="button" class="tg-button" ${attrs}>Button</button>`;
section(
  'button',
  'Button',
  'A native <code>&lt;button&gt;</code> with a class. Variants, sizes and a square icon-only shape; hover, pressed and focus work live, disabled is shown below.',
  [
    ['default', buttons()],
    ['default, disabled', buttons('disabled')],
    ['data-variant="primary"', buttons('data-variant="primary"')],
    ['primary, disabled', buttons('data-variant="primary" disabled')],
    ['data-variant="quiet"', buttons('data-variant="quiet"')],
    ['quiet, disabled', buttons('data-variant="quiet" disabled')],
    ['data-variant="link"', buttons('data-variant="link"')],
    ['link, disabled', buttons('data-variant="link" disabled')],
    ['data-size="sm"', buttons('data-size="sm"')],
    ['data-size="xs"', buttons('data-size="xs"')],
    ['primary sm', buttons('data-variant="primary" data-size="sm"')],
    ['with an icon', `<button type="button" class="tg-button">${icon('upload')} Load</button>`],
    ['data-shape="icon"', `<button type="button" class="tg-button" data-shape="icon" aria-label="Add">${icon('plus')}</button>`],
    [
      'icon, quiet',
      `<button type="button" class="tg-button" data-shape="icon" data-variant="quiet" aria-label="Close">${icon('close')}</button>`,
    ],
    [
      'icon, quiet, xs',
      `<button type="button" class="tg-button" data-shape="icon" data-variant="quiet" data-size="xs" aria-label="Close">${icon('close')}</button>`,
    ],
    ['aria-disabled="true"', '<button type="button" class="tg-button" aria-disabled="true">Button</button>'],
  ],
);

// ── field, select, checkbox ─────────────────────────────────────────────
section(
  'field',
  'Field',
  'A label around an input, with a leading icon if you like. Focus within draws the ring on the label; click into one.',
  [
    ['default', '<label class="tg-field"><input placeholder="Value" /></label>'],
    ['with a leading icon', `<label class="tg-field">${icon('search', { tone: 'faint' })}<input placeholder="Search tokens" /></label>`],
    ['data-variant="code"', '<label class="tg-field" data-variant="code"><input value="toghen-plugin.tg.bg.base" /></label>'],
    ['disabled', '<label class="tg-field"><input value="Not now" disabled /></label>'],
    ['invalid', '<label class="tg-field"><input value="not a path" aria-invalid="true" /></label>'],
  ],
);

section('select', 'Select', 'A native <code>&lt;select&gt;</code>.', [
  ['default', '<select class="tg-select"><option>Light</option><option>Dark</option></select>'],
  ['data-size="sm"', '<select class="tg-select" data-size="sm"><option>Light</option><option>Dark</option></select>'],
  ['disabled', '<select class="tg-select" disabled><option>Light</option></select>'],
]);

section('checkbox', 'Checkbox', 'A label around a native checkbox. The plain one is a line of words; the boxed one is a control.', [
  ['plain', '<label class="tg-checkbox"><input type="checkbox" /> Allow breaking</label>'],
  ['plain, checked', '<label class="tg-checkbox"><input type="checkbox" checked /> Allow breaking</label>'],
  ['plain, disabled', '<label class="tg-checkbox"><input type="checkbox" disabled /> Allow breaking</label>'],
  ['data-variant="boxed"', '<label class="tg-checkbox" data-variant="boxed"><input type="checkbox" /> Differences</label>'],
  ['boxed, checked', '<label class="tg-checkbox" data-variant="boxed"><input type="checkbox" checked /> Differences</label>'],
  ['boxed, disabled', '<label class="tg-checkbox" data-variant="boxed"><input type="checkbox" disabled /> Differences</label>'],
]);

// ── chip ────────────────────────────────────────────────────────────────
section(
  'chip',
  'Chip',
  'A counter or a tag. Tone, size, a code variant; with <code>aria-pressed</code> it is a toggle (click one, or Tab to it and press Enter).',
  [
    ['plain', '<tg-chip><tg-dot data-state="drifted"></tg-dot> <strong>3</strong> drifted</tg-chip>'],
    ['data-tone="warn"', '<tg-chip data-tone="warn"><strong>3</strong> changed</tg-chip>'],
    ['data-tone="err"', '<tg-chip data-tone="err"><strong>2</strong> missing</tg-chip>'],
    ['data-tone="ok"', '<tg-chip data-tone="ok"><strong>12</strong> in sync</tg-chip>'],
    ['data-size="sm"', '<tg-chip data-size="sm"><strong>3</strong> items</tg-chip>'],
    ['data-variant="code"', '<tg-chip data-variant="code"><strong>tg.bg</strong> .base</tg-chip>'],
    ['toggle, off', '<tg-chip aria-pressed="false">Differences</tg-chip>'],
    ['toggle, on', '<tg-chip aria-pressed="true">Differences</tg-chip>'],
    ['toggle, code, size sm', '<tg-chip aria-pressed="false" data-variant="code" data-size="sm">tg.bg</tg-chip>'],
    ['toggle, disabled', '<tg-chip aria-pressed="false" aria-disabled="true">Differences</tg-chip>'],
  ],
);

// ── segmented, tabs ─────────────────────────────────────────────────────
section(
  'segmented',
  'Segmented',
  'One of a few choices: a radio group. Click, or Tab in and use the arrow keys (they move and check, and wrap). <span class="events" id="segmented-events"></span>',
  [
    [
      'two',
      '<tg-segmented aria-label="Window"><button type="button" aria-checked="true" data-value="narrow">Narrow</button><button type="button" data-value="wide">Wide</button></tg-segmented>',
    ],
    [
      'three, middle checked',
      '<tg-segmented aria-label="Scope"><button type="button">All</button><button type="button" aria-checked="true">Drifted</button><button type="button">Missing</button></tg-segmented>',
    ],
    [
      'one disabled (skipped by the keys)',
      '<tg-segmented aria-label="Scope"><button type="button" aria-checked="true">All</button><button type="button" aria-disabled="true">Drifted</button><button type="button">Missing</button></tg-segmented>',
    ],
  ],
);

section(
  'tabs',
  'Tabs',
  'Which pane is in front: a tab list. Tab in, then Left, Right, Home and End; a disabled tab is passed over. The second strip waits for Enter (<code>data-activation="manual"</code>).',
  [
    [
      'icons and words, one disabled',
      `<tg-tabs style="width:100%" aria-label="Panes"><button type="button" aria-selected="true">${icon('collection')}<span>System</span></button><button type="button">${icon('token')}<span>Tokens</span></button><button type="button" aria-disabled="true">${icon('layer')}<span>Selection</span></button><button type="button">${icon('template')}<span>Templates</span></button></tg-tabs>`,
    ],
    [
      'manual activation',
      '<tg-tabs style="width:100%" data-activation="manual" aria-label="Views"><button type="button" aria-selected="true">One</button><button type="button">Two</button><button type="button">Three</button></tg-tabs>',
    ],
  ],
  { wide: true, block: true },
);

// ── the markup rows and lists are drawn from ────────────────────────────
const rowParts = (label, value = '') =>
  `<span data-part="leading">${icon('token')}</span><span data-part="label">${label}</span>${value ? `<span data-part="value">${value}</span>` : ''}<span data-part="trailing"><tg-dot data-state="drifted"></tg-dot></span>`;
/** An option of a list: a mark, a name, a count, and a chevron for one that opens something. */
const option = (label, value = '', attrs = '', detail = '') =>
  `<tg-row${attrs ? ` ${attrs}` : ''}><span data-part="leading">${icon('group')}</span><span data-part="label">${label}</span>${value ? `<span data-part="value">${value}</span>` : ''}` +
  `<span data-part="trailing">${icon('chevronRight', { size: 'sm', tone: 'faint' })}</span>${detail ? `<div data-part="detail">${detail}</div>` : ''}</tg-row>`;

// ── callout, card ───────────────────────────────────────────────────────
const callout = (tone, size = '') =>
  `<tg-callout data-tone="${tone}"${size ? ` data-size="${size}"` : ''}><div data-part="text"><span data-part="title">${{ info: 'Nothing loaded yet', warn: '3 values drifted', err: 'Could not reach Figma' }[tone]}</span><span data-part="line">${{ info: 'Choose a design system to begin.', warn: 'Look again before you sync.', err: 'Open the file and try again.' }[tone]}</span></div><button type="button" class="tg-button" data-size="sm">Retry</button></tg-callout>`;
section(
  'callout',
  'Callout',
  'Inform, warn, stop. The mark is chosen by tone inside the element: the info icon, a dot, the warning icon.',
  [
    ['info (default)', callout('info')],
    ['warn', callout('warn')],
    ['err', callout('err')],
    ['info, sm', callout('info', 'sm')],
    ['warn, sm', callout('warn', 'sm')],
    ['err, sm', callout('err', 'sm')],
  ],
  { wide: true, block: true },
);

section(
  'card',
  'Card',
  'A bordered box with an optional label above it (and a note at the label’s end). Loose content is wrapped in a body by the element.',
  [
    [
      'with a label and a note',
      '<tg-card><div data-part="label"><span>Source</span><span data-part="note">looked 2 min ago</span></div><div data-part="body"><tg-row><span data-part="label">Collection</span><span data-part="value">toghen-plugin</span></tg-row><tg-row><span data-part="label">Modes</span><span data-part="value">2</span></tg-row></div></tg-card>',
    ],
    [
      'without a label, loose content (the element adds the body)',
      '<tg-card><tg-row><span data-part="label">Loose content</span></tg-row></tg-card>',
    ],
    [
      'a body of rows is flush: the rows run edge to edge and inset themselves',
      `<tg-card><div data-part="label"><span>Loaded before</span></div><div data-part="body"><tg-row data-density="roomy">${rowParts('toghen-plugin', '2 modes')}</tg-row><tg-row data-density="roomy" data-tone="warn">${rowParts('acme-tokens', 'yesterday')}</tg-row></div></tg-card>`,
    ],
    [
      'a body of one list is flush too',
      `<tg-card><div data-part="label"><span>Groups</span></div><div data-part="body"><tg-list aria-label="Groups">${option('colour', '24', 'aria-selected="true"')}${option('space', '9')}${option('type', '6')}</tg-list></div></tg-card>`,
    ],
    [
      'a body of words keeps the card’s padding',
      '<tg-card><div data-part="label"><span>Note</span></div><div data-part="body"><p style="margin:var(--tg-sp-2) 0">Words and controls are inset by the card; only rows and lists are not.</p></div></tg-card>',
    ],
  ],
  { wide: true, block: true },
);

// ── dropzone ────────────────────────────────────────────────────────────
section(
  'dropzone',
  'Dropzone',
  'A dashed target that is also a button. Drag-over is <code>data-over</code>, set by script; here it is set by hand on the third.',
  [
    ['md', `<button type="button" class="tg-dropzone">${icon('upload', { tone: 'muted' })} Drop a design system</button>`],
    [
      'md, disabled',
      `<button type="button" class="tg-dropzone" disabled>${icon('upload', { tone: 'muted' })} Drop a design system</button>`,
    ],
    ['md, data-over', `<button type="button" class="tg-dropzone" data-over>${icon('upload', { tone: 'muted' })} Drop to load</button>`],
    ['data-size="sm"', `<button type="button" class="tg-dropzone" data-size="sm">${icon('plus')} Add</button>`],
    ['sm, data-over', `<button type="button" class="tg-dropzone" data-size="sm" data-over>${icon('plus')} Add</button>`],
  ],
  { block: true },
);

section(
  'row',
  'Row',
  'The signature of the screen: leading, label, value, trailing, detail. Three densities, a toned gutter, and states. A row with a detail is a disclosure: the element provides a summary button (leading, label and value), the trailing part stays outside it, and the button opens the detail (click it, or Tab to it and press Enter or Space). A row with a <code>tabindex</code> answers the pointer. <span class="events" id="row-events"></span>',
  [
    ['dense (22)', `<tg-row data-density="dense">${rowParts('tg.bg.base', '#f2f2f2')}</tg-row>`],
    ['regular (28, default)', `<tg-row>${rowParts('tg.bg.base', '#f2f2f2')}</tg-row>`],
    ['roomy (36)', `<tg-row data-density="roomy">${rowParts('tg.bg.base', '#f2f2f2')}</tg-row>`],
    ['interactive (tabindex): hover, press, Tab', `<tg-row tabindex="0">${rowParts('tg.bg.card', '#ffffff')}</tg-row>`],
    ['aria-selected="true"', `<tg-row tabindex="0" aria-selected="true">${rowParts('tg.bg.card', '#ffffff')}</tg-row>`],
    ['disabled', `<tg-row tabindex="0" aria-disabled="true">${rowParts('tg.bg.card', '#ffffff')}</tg-row>`],
    ['data-tone="warn"', `<tg-row data-tone="warn">${rowParts('tg.text.2', '#6b6b6b')}</tg-row>`],
    ['data-tone="err"', `<tg-row data-tone="err">${rowParts('tg.text.3', '#a3a3a3')}</tg-row>`],
    [
      'a disclosure, closed',
      `<tg-row>${rowParts('tg.accent.text', '#0a6fb8')}<div data-part="detail">Accent text, for links and the info mark.</div></tg-row>`,
    ],
    [
      'a disclosure, open (aria-expanded="true" written on the host starts it open)',
      `<tg-row aria-expanded="true">${rowParts('tg.accent.bg', '#0c8ce9')}<div data-part="detail">The accent. Used by the primary button, the active tab and the focus ring.</div></tg-row>`,
    ],
    [
      'open with a warn gutter',
      `<tg-row data-tone="warn" aria-expanded="true">${rowParts('tg.status.warn.dot', '#d97706')}<div data-part="detail">The warn dot.</div></tg-row>`,
    ],
    [
      'a detail that holds controls, and a trailing action outside the button',
      `<tg-row data-density="roomy" aria-expanded="true"><span data-part="leading">${icon('set')}</span><span data-part="label">Button</span><span data-part="value">3 variants</span><span data-part="trailing"><button type="button" class="tg-button" data-variant="quiet" data-size="sm">Forget</button></span><div data-part="detail"><p style="margin:0 0 var(--tg-sp-2)">Reaches Figma as a component set.</p><button type="button" class="tg-button" data-size="sm">Plan build</button> <button type="button" class="tg-button" data-variant="primary" data-size="sm">Build</button></div></tg-row>`,
    ],
    [
      'a summary the page writes: the line loads, Forget is beside it',
      `<tg-row data-density="roomy"><button type="button" data-part="summary"><span data-part="leading">${icon('collection')}</span><span data-part="label">toghen-plugin</span><span data-part="value">yesterday</span></button><span data-part="trailing"><button type="button" class="tg-button" data-shape="icon" data-variant="quiet" data-size="xs" aria-label="Forget toghen-plugin">${icon('close', { size: 'sm' })}</button></span></tg-row>`,
    ],
    [
      'two lines: roomy',
      `<tg-row data-density="roomy"><span data-part="label" style="display:flex;flex-direction:column;align-items:flex-start;white-space:normal;line-height:var(--tg-lh-tight)"><strong>toghen-plugin</strong><span style="color:var(--tg-text-2)">2 modes, 143 tokens</span></span><span data-part="value">2 min ago</span></tg-row>`,
    ],
  ],
  { block: true },
);

// ── list ────────────────────────────────────────────────────────────────
section(
  'list',
  'List',
  'One row chosen out of several: a listbox, its rows the options. Tab in, then Up and Down, Home and End; Space chooses (<code>tg-change</code>), Enter activates (<code>tg-activate</code>), and so does a click on the option that is already chosen. <span class="events" id="list-events"></span>',
  [
    [
      'three options, one selected',
      `<tg-list aria-label="Groups">${option('colour', '24', 'aria-selected="true"')}${option('space', '9')}${option('type', '6')}</tg-list>`,
    ],
    [
      'data-selection="follows-focus": the arrows choose',
      `<tg-list aria-label="Groups" data-selection="follows-focus">${option('colour', '24')}${option('space', '9', 'aria-selected="true"')}${option('type', '6')}</tg-list>`,
    ],
    [
      'one disabled (skipped by the keys)',
      `<tg-list aria-label="Groups">${option('colour', '24', 'aria-selected="true"')}${option('space', '9', 'aria-disabled="true"')}${option('type', '6')}</tg-list>`,
    ],
    [
      'aria-orientation="horizontal": Left and Right',
      `<tg-list aria-label="Groups" aria-orientation="horizontal">${option('colour')}${option('space', '', 'aria-selected="true"')}${option('type')}</tg-list>`,
    ],
    [
      'an option with a detail shows it while selected',
      `<tg-list aria-label="Tokens">${option('base', '#f2f2f2', 'aria-selected="true" data-density="roomy"', 'The page background. Clicks in here do not choose another option.')}${option('card', '#ffffff', 'data-density="roomy"', 'The card surface.')}${option('sunken', '#ebebeb', 'data-density="roomy"', 'An open row.')}</tg-list>`,
    ],
    [
      'dense, with a toned gutter',
      `<tg-list aria-label="Checks">${option('names', '', 'data-density="dense"')}${option('values', '', 'data-density="dense" data-tone="warn"')}${option('modes', '', 'data-density="dense" data-tone="err"')}</tg-list>`,
    ],
  ],
  { block: true },
);

// ── table ───────────────────────────────────────────────────────────────
const table = (density = '') =>
  `<table class="tg-table"${density ? ` data-density="${density}"` : ''} style="width:100%"><thead><tr><th>Mode</th><th>Value</th><th>State</th></tr></thead><tbody><tr><td>light</td><td>#f2f2f2</td><td>in sync</td></tr><tr><td>dark</td><td>#1f1f1f</td><td data-tone="warn">drifted</td></tr><tr><td>contrast</td><td>#000000</td><td data-tone="err">missing</td></tr></tbody></table>`;
section(
  'table',
  'Table',
  'Names and values in the code face. A key and its value is a two-column table.',
  [
    ['dense', table('dense')],
    ['regular (default)', table()],
    ['roomy', table('roomy')],
  ],
  { wide: true, block: true },
);

// ── contexts nest ───────────────────────────────────────────────────────
section(
  'contexts',
  'Contexts nest',
  'The theme is a context on an element, not a mode of the build: a dark island inside a light page (or the reverse) is right with nothing written for it. The islands below set <code>data-theme</code> themselves.',
  [
    [
      'dark island',
      `<div class="island" data-theme="dark"><button type="button" class="tg-button" data-variant="primary">Primary</button><button type="button" class="tg-button">Default</button><tg-chip data-tone="warn"><strong>3</strong> changed</tg-chip><span class="tg-monogram" style="--hue:210">AB</span><tg-dot data-state="connected"></tg-dot></div>`,
    ],
    [
      'light island',
      `<div class="island" data-theme="light"><button type="button" class="tg-button" data-variant="primary">Primary</button><button type="button" class="tg-button">Default</button><tg-chip data-tone="warn"><strong>3</strong> changed</tg-chip><span class="tg-monogram" style="--hue:210">AB</span><tg-dot data-state="connected"></tg-dot></div>`,
    ],
  ],
  { wide: true, block: true },
);

// ── the icon map ────────────────────────────────────────────────────────
const mapRows = (map) =>
  Object.entries(map)
    .map(
      ([from, to]) =>
        `<div>${icon(from)}<span><code>${from}</code> <span style="color:var(--tg-text-3)">→</span> <code>ph-${to}</code></span></div>`,
    )
    .join('');
const mapSection = document.createElement('section');
mapSection.className = 'component';
mapSection.id = 'icon-map';
mapSection.innerHTML =
  `<h2>Icon map</h2><p>Every glyph and icon the plugin draws by hand, and the Phosphor icon (regular) that replaces it. The map is exported as <code>@toghen/ui/icons.js</code>.</p>` +
  `<h3 style="margin:var(--tg-sp-2) 0 0;font:var(--tg-text-label);color:var(--tg-text-2)">Entity glyphs (glyphs.js)</h3><div class="icons">${mapRows(GLYPHS)}</div>` +
  `<h3 style="margin:var(--tg-sp-2) 0 0;font:var(--tg-text-label);color:var(--tg-text-2)">Action icons (icons.js)</h3><div class="icons">${mapRows(ACTIONS)}</div>`;
page.append(mapSection);
toc.insertAdjacentHTML('beforeend', `<a class="tg-button" data-variant="link" href="#icon-map">Icon map</a>`);

// ── wiring ──────────────────────────────────────────────────────────────
// The theme switch.
document.getElementById('theme').addEventListener('tg-change', (event) => {
  document.documentElement.dataset.theme = event.detail.value;
});

// Toggle chips are the page's to flip: the element only makes them buttons.
page.addEventListener('click', (event) => {
  const chip = event.target.closest('tg-chip[aria-pressed]');
  if (chip && chip.getAttribute('aria-disabled') !== 'true')
    chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
});

// Show what a list and a row say.
const say = (id, text) => {
  document.getElementById(id).textContent = text;
};
const named = (event) => event.detail.item?.querySelector('[data-part="label"]')?.textContent ?? '';
const section_ = (id) => document.getElementById(id);
section_('list').addEventListener('tg-change', (event) => say('list-events', ` tg-change: ${named(event)} (#${event.detail.index})`));
section_('list').addEventListener('tg-activate', (event) => say('list-events', ` tg-activate: ${named(event)} (#${event.detail.index})`));
section_('row').addEventListener('tg-toggle', (event) =>
  say(
    'row-events',
    ` tg-toggle: ${event.target.querySelector('[data-part="label"]')?.textContent} ${event.detail.expanded ? 'opened' : 'closed'}`,
  ),
);

// Show the segmented control's event.
const events = document.getElementById('segmented-events');
document.getElementById('segmented').addEventListener('tg-change', (event) => {
  if (event.target.id === 'theme') return;
  events.textContent = ` tg-change: ${event.detail.value ?? event.detail.item.textContent} (#${event.detail.index})`;
});
