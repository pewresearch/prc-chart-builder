/**
 * useTickLabelCustomizations Hook
 *
 * Manages state and handlers for tick label customization in the popover.
 * Each tick's customization is stored as an object:
 *   { text?, fill?, fontSize?, fontWeight?, fontStyle? }
 *
 * Legacy string values (plain custom text) are handled for backwards compat.
 * Updates are merged into customTickLabels[axisKey][tickValue].
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Normalise a stored entry to a style object, handling the legacy string format.
 *
 * @param {string|Object|undefined} entry
 * @return {Object}
 */
function normalizeEntry( entry ) {
	if ( ! entry ) return {};
	if ( typeof entry === 'string' ) return { text: entry };
	return entry;
}

/**
 * Returns true if an object has at least one meaningful value.
 *
 * @param {Object} obj
 * @return {boolean}
 */
function hasAnyValue( obj ) {
	return Object.values( obj ).some(
		( v ) => v !== undefined && v !== null && v !== ''
	);
}

/**
 * Hook to manage tick label customization state and handlers.
 *
 * @param {string}   axisKey              - 'independent' or 'dependent'
 * @param {unknown}  tickValue            - The raw tick value (used as key)
 * @param {string}   defaultLabel         - The default/formatted label
 * @param {Object}   currentCustomizations - Current customTickLabels from block attrs
 * @param {Function} onUpdate             - Callback: receives { [axisKey]: { [tickValue]: object } }
 * @return {Object} State values and handlers
 */
export function useTickLabelCustomizations(
	axisKey,
	tickValue,
	defaultLabel,
	currentCustomizations,
	onUpdate
) {
	const axisLabels = currentCustomizations?.[ axisKey ] || {};
	const rawEntry = axisLabels[ String( tickValue ) ];
	const savedEntry = normalizeEntry( rawEntry );

	const [ styles, setStyles ] = useState( savedEntry );

	// Sync when the popover reopens on a different tick
	useEffect( () => {
		setStyles( normalizeEntry( rawEntry ) );
	}, [ rawEntry, tickValue ] );

	/**
	 * Update a single field in the style object.
	 *
	 * @param {string} field
	 * @param {*}      value
	 */
	const handleChange = useCallback(
		( field, value ) => {
			const next = { ...styles, [ field ]: value };
			setStyles( next );

			const updated = { ...axisLabels };
			if ( ! hasAnyValue( next ) ) {
				delete updated[ String( tickValue ) ];
			} else {
				updated[ String( tickValue ) ] = next;
			}
			onUpdate( { [ axisKey ]: updated } );
		},
		[ axisKey, axisLabels, tickValue, styles, onUpdate ]
	);

	/**
	 * Remove all customizations for this tick.
	 */
	const handleReset = useCallback( () => {
		setStyles( {} );
		const updated = { ...axisLabels };
		delete updated[ String( tickValue ) ];
		onUpdate( { [ axisKey ]: updated } );
	}, [ axisKey, axisLabels, tickValue, onUpdate ] );

	const hasCustomizations = hasAnyValue( styles );

	return {
		text: styles.text ?? '',
		fill: styles.fill ?? '',
		fontSize: styles.fontSize ?? null,
		fontWeight: styles.fontWeight ?? '',
		fontStyle: styles.fontStyle ?? '',
		defaultLabel,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useTickLabelCustomizations;
