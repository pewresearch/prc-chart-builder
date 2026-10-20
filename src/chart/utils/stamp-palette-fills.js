/**
 * Give each unstamped category the fill at its palette slot.
 *
 * @param {string[]} domainKeys   Color domain, in slot order.
 * @param {Object}   seriesStyles Current category styles.
 * @param {string[]} palette      Active palette colors.
 * @return {Object} Series styles with new palette-owned fills.
 */
export function stampPaletteFills(domainKeys, seriesStyles, palette) {
	const next = { ...seriesStyles };
	if (!Array.isArray(palette) || palette.length === 0) {
		return next;
	}

	domainKeys.forEach((key, index) => {
		const current = next[key];
		if (current && current.fillSource !== 'palette') {
			return;
		}
		next[key] = {
			...current,
			fill: palette[index % palette.length],
			fillSource: 'palette',
		};
	});

	return next;
}
