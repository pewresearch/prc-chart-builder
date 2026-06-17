/**
 * Slice 4 (PRC-17) store-action merge semantics for the chart Interactivity
 * store.
 *
 * These helpers are pure and mutate the `target`/`slice` object in place. At
 * runtime the target is a deepSignal proxy from `@wordpress/interactivity`;
 * assigning into it is what fires the path-level signal subscribers that
 * `useChartStore` listens on. So the merge MUST mutate in place rather than
 * returning a fresh object — returning a new object would replace the whole
 * slice and blow away every other subscriber's path. In tests the target is a
 * plain object, which behaves identically for assignment.
 */

/**
 * @param {*} value Candidate.
 * @return {boolean} True for a non-null, non-array object literal.
 */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge `partial` into `target`, mutating `target` in place.
 *
 * - **Object branches merge per-key** (recurse), so sibling keys survive a
 *   partial patch (e.g. `{ axis: { x: { tickFormat: '%Y' } } }` preserves
 *   `axis.y`).
 * - **Arrays and primitives replace wholesale** — positional semantics for
 *   lockstep arrays (`dataRender.categories`, `colors`, `series`,
 *   `divergingBar.positive/negativeCategories`). Patching a category array
 *   therefore means resending its companion arrays in the same patch.
 * - **Exception: `annotations.items`** — when the parent branch is
 *   `annotations`, each array index is deep-merged into the existing item
 *   (skip `null`/`undefined` slots). This matches how authors think about
 *   `setConfig({ annotations: { items: [,,,{ text: '2030' }] } })` without
 *   resending every annotation.
 * - Keys absent from `target` are assigned directly (fallback safety: a patch
 *   never throws on a missing branch).
 *
 * @param {Object}      target   Object to mutate (signal proxy or plain object).
 * @param {Object}      partial  Patch to apply.
 * @param {string|null} parentKey Parent property name (for merge rules).
 * @return {Object} The mutated `target`.
 */
export function applyDeepPatch(target, partial, parentKey = null) {
	if (!isPlainObject(target) || !isPlainObject(partial)) {
		return target;
	}
	for (const key of Object.keys(partial)) {
		const nextValue = partial[key];
		const currentValue = target[key];

		// Per-index merge for annotation items (not wholesale array replace).
		if (
			key === 'items' &&
			parentKey === 'annotations' &&
			Array.isArray(nextValue) &&
			Array.isArray(currentValue)
		) {
			mergeAnnotationItemsInPlace(currentValue, nextValue);
			continue;
		}

		if (isPlainObject(nextValue) && isPlainObject(currentValue)) {
			applyDeepPatch(currentValue, nextValue, key);
		} else {
			// Arrays, primitives, and previously-unset branches replace.
			target[key] = nextValue;
		}
	}
	return target;
}

/**
 * Deep-merge each provided index into `targetItems` in place. Omitted slots
 * (`null` / `undefined`) leave that index unchanged. New indices can be added
 * when the patch is longer than the live array.
 *
 * @param {Object[]} targetItems Live `annotations.items` (mutated in place).
 * @param {Array}    partialItems Patch array (sparse allowed).
 */
function mergeAnnotationItemsInPlace(targetItems, partialItems) {
	for (let i = 0; i < partialItems.length; i++) {
		const patch = partialItems[i];
		if (patch === undefined || patch === null) {
			continue;
		}
		const existing = targetItems[i];
		if (isPlainObject(patch) && isPlainObject(existing)) {
			applyDeepPatch(existing, patch);
		} else {
			targetItems[i] = patch;
		}
	}
}

/**
 * Apply an atomic chart patch to a single chart slice, in place.
 *
 * Field semantics (the data↔config coupling contract):
 * - `data`      → replaced wholesale.
 * - `tableData` → replaced wholesale.
 * - `config`    → deep-merged via {@link applyDeepPatch} (object-merge,
 *                 array-replace) so unrelated config branches survive a
 *                 partial patch; when no config exists yet it is assigned.
 *
 * All provided fields are written synchronously before the caller's action
 * returns. Because every write happens in one synchronous pass, the signal
 * subscribers collapse the change into a single `useSyncExternalStore`
 * re-render — the atomicity guarantee that keeps a dataset swap with a
 * different category universe from ever exposing a torn
 * `(data, categories, colors)` triple mid-render.
 *
 * @param {Object} slice             Chart slice to mutate.
 * @param {Object} [patch]           Patch.
 * @param {*}      [patch.data]      Replacement data array.
 * @param {Object} [patch.config]    Partial config (deep-merged).
 * @param {*}      [patch.tableData] Replacement table data.
 * @return {Object} The mutated `slice`.
 */
export function applyChartPatch(slice, patch = {}) {
	if (!isPlainObject(slice) || !isPlainObject(patch)) {
		return slice;
	}
	const { data, config, tableData } = patch;
	if (data !== undefined) {
		slice.data = data;
	}
	if (tableData !== undefined) {
		slice.tableData = tableData;
	}
	if (config !== undefined) {
		if (isPlainObject(slice.config) && isPlainObject(config)) {
			applyDeepPatch(slice.config, config);
		} else {
			slice.config = config;
		}
	}
	return slice;
}
