/**
 * Defines every custom element of the design system. Import it once.
 *
 *   <tg-dot> <tg-chip> <tg-segmented> <tg-tabs> <tg-callout> <tg-card> <tg-row> <tg-list>
 *
 * The elements are light DOM, with no shadow root: the stylesheet
 * (`@toghen/ui/styles.css`) styles them, script only sets the roles, labels and
 * keys the platform does not give them. Where a component needs no script (a
 * button, a field, a select, a checkbox) it is a native element with a class,
 * and there is nothing to define.
 */

import './components/dot.js';
import './components/chip.js';
import './components/segmented.js';
import './components/tabs.js';
import './components/callout.js';
import './components/card.js';
import './components/row.js';
import './components/list.js';
