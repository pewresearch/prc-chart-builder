/**
 * useTooltipCustomizations Hook
 *
 * Manages state and handlers for per-element tooltip customization in the
 * popover (both ShapePanel and LabelPanel share this).
 *
 * Writes to the top-level `customTooltips` block attribute keyed by
 * generateElementKey(x, category, groupValue):
 *
 *   customTooltips: {
 *     [elementKey]: {
 *       body?: string,            // HTML (bold / italic RichText output)
 *       header?: string,  // plain text
 *     }
 *   }
 *
 * Empty strings collapse the corresponding field, and an entry is removed
 * entirely when both fields are empty so the fallback cascade
 * (data-model __tooltips -> default format) continues to win.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Hook to manage tooltip customization state and handlers.
 *
 * @param {string}   tooltipKey            - The unique key for this element
 * @param {Object}   currentCustomizations - Current customTooltips map from attrs
 * @param {Function} onUpdate              - Callback { customTooltips } -> void
 * @return {Object} State values and handlers
 */
export function useTooltipCustomizations(
	tooltipKey,
	currentCustomizations,
	onUpdate
) {
	const currentEntry =
		currentCustomizations?.customTooltips?.[tooltipKey] || {};

	const [body, setBody] = useState(currentEntry.body || '');
	const [header, setheader] = useState(currentEntry.header || '');

	// Sync state when currentEntry changes (e.g. key changes or external edit).
	useEffect(() => {
		setBody(currentEntry.body || '');
		setheader(currentEntry.header || '');
		// Intentional dependency: stringified entry so we react to content swaps.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tooltipKey, currentEntry.body, currentEntry.header]);

	/**
	 * Update a single tooltip field. Writes (or clears) the entry for the
	 * current key in the `customTooltips` attribute.
	 */
	const handleChange = useCallback(
		(property, value) => {
			if (property === 'body') setBody(value);
			if (property === 'header') setheader(value);

			const nextBody = property === 'body' ? value : body;
			const nextHeader = property === 'header' ? value : header;

			const updated = {
				...(currentCustomizations?.customTooltips || {}),
			};

			const hasBody = typeof nextBody === 'string' && nextBody.length > 0;
			const hasHeader =
				typeof nextHeader === 'string' && nextHeader.length > 0;

			if (!hasBody && !hasHeader) {
				delete updated[tooltipKey];
			} else {
				updated[tooltipKey] = {
					...(hasBody ? { body: nextBody } : {}),
					...(hasHeader ? { header: nextHeader } : {}),
				};
			}

			onUpdate({ customTooltips: updated });
		},
		[
			body,
			header,
			currentCustomizations?.customTooltips,
			tooltipKey,
			onUpdate,
		]
	);

	const handleReset = useCallback(() => {
		setBody('');
		setheader('');

		const updated = { ...(currentCustomizations?.customTooltips || {}) };
		delete updated[tooltipKey];
		onUpdate({ customTooltips: updated });
	}, [currentCustomizations?.customTooltips, tooltipKey, onUpdate]);

	const hasCustomizations =
		(typeof body === 'string' && body.length > 0) ||
		(typeof header === 'string' && header.length > 0);

	return {
		body,
		header,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useTooltipCustomizations;
