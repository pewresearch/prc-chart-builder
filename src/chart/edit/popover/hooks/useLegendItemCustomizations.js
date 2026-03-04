/**
 * useLegendItemCustomizations Hook
 *
 * Manages state and handlers for legend item label customization in the popover.
 * Each item's customization is stored as an object: { text? }
 * keyed by the category/domain value in customLegendLabels.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

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
 * Hook to manage legend item label customization state and handlers.
 *
 * @param {string}   categoryValue        - The category/domain value (used as key)
 * @param {string}   defaultLabel         - The default rendered label text
 * @param {Object}   currentCustomizations - Current customLegendLabels from block attrs
 * @param {Function} onUpdate             - Callback: receives { customLegendLabels: { ... } }
 * @return {Object} State values and handlers
 */
export function useLegendItemCustomizations(
	categoryValue,
	defaultLabel,
	currentCustomizations,
	onUpdate
) {
	const key = String( categoryValue );
	const savedEntry = currentCustomizations?.[ key ] || {};

	const [ styles, setStyles ] = useState( savedEntry );

	// Sync when the popover reopens on a different legend item
	useEffect( () => {
		setStyles( currentCustomizations?.[ key ] || {} );
	}, [ key, currentCustomizations ] );

	/**
	 * Update a single field in the customization object.
	 *
	 * @param {string} field
	 * @param {*}      value
	 */
	const handleChange = useCallback(
		( field, value ) => {
			const next = { ...styles, [ field ]: value };
			setStyles( next );

			const updated = { ...( currentCustomizations || {} ) };
			if ( ! hasAnyValue( next ) ) {
				delete updated[ key ];
			} else {
				updated[ key ] = next;
			}
			onUpdate( { customLegendLabels: updated } );
		},
		[ key, currentCustomizations, styles, onUpdate ]
	);

	/**
	 * Remove all customizations for this legend item.
	 */
	const handleReset = useCallback( () => {
		setStyles( {} );
		const updated = { ...( currentCustomizations || {} ) };
		delete updated[ key ];
		onUpdate( { customLegendLabels: updated } );
	}, [ key, currentCustomizations, onUpdate ] );

	const hasCustomizations = hasAnyValue( styles );

	return {
		text: styles.text ?? '',
		defaultLabel,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useLegendItemCustomizations;
