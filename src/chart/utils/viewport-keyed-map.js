/**
 * Build the setAttributes payload for a keyed map attribute (customLegendLabels,
 * customPanelTitles) edited on the current viewport.
 *
 * `nextMap` is the full map as the viewport sees it: desktop values merged with
 * this viewport's overrides. Desktop stores it as-is. Tablet and mobile store
 * only the entries that differ from desktop, so desktop edits still reach
 * entries the viewport never changed, and a cleared entry falls back to
 * desktop.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} deviceType 'desktop' | 'tablet' | 'mobile'.
 * @param {string} group      Attribute name, e.g. 'customLegendLabels'.
 * @param {Object} nextMap    Next merged map for this viewport.
 * @return {Object} Attributes to pass to setAttributes.
 */
export function viewportKeyedMapUpdate(attributes, deviceType, group, nextMap) {
	if (!deviceType || deviceType === 'desktop') {
		return { [group]: nextMap };
	}

	const base = attributes[group] || {};
	const viewport = attributes[deviceType] || {};
	const overrides = {};

	Object.entries(nextMap || {}).forEach(([key, entry]) => {
		if (JSON.stringify(entry) !== JSON.stringify(base[key])) {
			overrides[key] = entry;
		}
	});

	return {
		[deviceType]: {
			...viewport,
			[group]: overrides,
		},
	};
}
