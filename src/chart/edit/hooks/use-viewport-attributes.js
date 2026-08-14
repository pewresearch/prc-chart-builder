/**
 * Custom hook for viewport-aware attribute management
 * Provides helpers for getting/setting attributes based on WordPress device preview mode
 */

// TODO: add to prc scripts so that it's available to all components
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Get the current device type from WordPress editor
 * @return {string} 'desktop' | 'tablet' | 'mobile'
 */
export function useDeviceType() {
	const deviceType = useSelect((select) => {
		// Admin wizard / non-editor hosts may not register core/editor.
		const editor = select(editorStore);
		const type = editor?.getDeviceType?.();
		return type ? type.toLowerCase() : 'desktop';
	}, []);

	return deviceType || 'desktop';
}

/**
 * Hook that provides viewport-aware attribute helpers
 * @param {Object}   attributes    - Block attributes
 * @param {Function} setAttributes - Block setAttributes function
 * @return {Object} Helper functions for viewport-aware attribute management
 */
export function useViewportAttributes(attributes, setAttributes) {
	const deviceType = useDeviceType();

	/**
	 * Get current value for an attribute, checking viewport override first
	 * @param {string} attributeGroup - The attribute group (e.g., 'metadata', 'layout')
	 * @param {string} attributeKey   - The specific attribute key (e.g., 'title')
	 * @return {*} The current value (viewport override if exists, otherwise default)
	 */
	const getCurrentValue = (attributeGroup, attributeKey) => {
		// If not desktop and viewport override exists, use it
		if (
			deviceType !== 'desktop' &&
			attributes[deviceType]?.[attributeGroup]?.[attributeKey] !==
				undefined
		) {
			return attributes[deviceType][attributeGroup][attributeKey];
		}

		// If only attributeGroup is requested, return the merged group
		if (!attributeKey) {
			const baseGroup = attributes[attributeGroup] || {};
			const viewportOverrides =
				attributes[deviceType]?.[attributeGroup] || {};
			return { ...baseGroup, ...viewportOverrides };
		}

		// Otherwise, fall back to default attribute
		return attributes[attributeGroup]?.[attributeKey];
	};

	/**
	 * Update attribute for the current device
	 * Routes updates to viewport override (mobile/tablet) or default attributes (desktop)
	 * @param {string} attributeGroup - The attribute group (e.g., 'metadata', 'layout')
	 * @param {Object} updates        - Key-value pairs of attributes to update
	 */
	const updateAttributeForDevice = (attributeGroup, updates) => {
		if (deviceType === 'desktop' || !deviceType) {
			// Desktop: update default attributes
			setAttributes({
				[attributeGroup]: {
					...attributes[attributeGroup],
					...updates,
				},
			});
		} else {
			// Mobile/Tablet: update viewport-specific overrides
			const currentViewportOverrides = attributes[deviceType] || {};
			const currentGroupOverrides =
				currentViewportOverrides[attributeGroup] || {};

			setAttributes({
				[deviceType]: {
					...currentViewportOverrides,
					[attributeGroup]: {
						...currentGroupOverrides,
						...updates,
					},
				},
			});
		}
	};

	return {
		deviceType,
		getCurrentValue,
		updateAttributeForDevice,
	};
}
