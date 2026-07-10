/**
 * Promote legacy sibling *Mobile / *OnMobile attributes into viewport overrides.
 *
 * Before viewport attributes, mobile-specific values lived inline on the base
 * object (e.g. labels.labelCutoffMobile, tooltip.activeOnMobile). After merge,
 * the universal key (labels.labelCutoff, tooltip.active) is authoritative.
 *
 * @param {Object} attributes Raw block attributes (not yet viewport-merged).
 * @return {Object} Attributes with legacy keys stripped and mobile.* populated.
 */
export function migrateLegacyMobileAttributes(attributes) {
	if (!attributes || typeof attributes !== 'object') {
		return attributes;
	}

	const migrated = { ...attributes };
	let mobile = migrated.mobile ? { ...migrated.mobile } : {};
	let mobileChanged = false;

	if (migrated.labels?.labelCutoffMobile != null) {
		const desktopCutoff = migrated.labels.labelCutoff ?? 0;
		const mobileCutoff = migrated.labels.labelCutoffMobile;

		if (mobileCutoff !== desktopCutoff) {
			mobile = {
				...mobile,
				labels: {
					...mobile.labels,
					labelCutoff: mobileCutoff,
				},
			};
			mobileChanged = true;
		}

		const { labelCutoffMobile, ...labels } = migrated.labels;
		migrated.labels = labels;
	}

	if (migrated.tooltip?.activeOnMobile !== undefined) {
		const { activeOnMobile, ...tooltip } = migrated.tooltip;
		migrated.tooltip = tooltip;

		if (tooltip.active && activeOnMobile === false) {
			mobile = {
				...mobile,
				tooltip: {
					...mobile.tooltip,
					active: false,
				},
			};
			mobileChanged = true;
		}
	}

	if (migrated.annotations?.activeOnMobile !== undefined) {
		// Strip the legacy group-level key only. Unlike tooltip.activeOnMobile,
		// this flag was never consulted at render — the old mobile gate lived on
		// each annotation item (items[].activeOnMobile), and the group-level key
		// defaulted to false. Promoting that dormant default into a mobile
		// override would hide annotations on mobile for every previously-saved
		// chart, so we discard it without producing a viewport override.
		const { activeOnMobile, ...annotations } = migrated.annotations;
		migrated.annotations = annotations;
	}

	if (Array.isArray(migrated.annotations?.items)) {
		const items = migrated.annotations.items.map((item) => {
			if (!item || item.activeOnMobile === undefined) {
				return item;
			}
			const { activeOnMobile, ...rest } = item;
			return rest;
		});

		if (
			items.some(
				(item, index) => item !== migrated.annotations.items[index]
			)
		) {
			migrated.annotations = {
				...migrated.annotations,
				items,
			};
		}
	}

	if (mobileChanged || migrated.mobile) {
		migrated.mobile = mobile;
	}

	return migrated;
}
