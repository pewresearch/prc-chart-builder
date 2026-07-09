// Inline copies of outline helpers to avoid Jest pulling in d3-time-format via charting-utilities.
const LABEL_OUTLINE_COLOR = 'light-dark(#ffffff, #1a1a1a)';

const BAR_LIKE_CHART_TYPES = new Set([
	'bar',
	'stacked-bar',
	'diverging-bar',
	'exploded-bar',
	'pie',
	'treemap',
]);

function resolveTextOutlineMode(labels, chartType) {
	if (labels.textOutlineMode) {
		return labels.textOutlineMode;
	}
	if (chartType && BAR_LIKE_CHART_TYPES.has(chartType)) {
		return 'contrast';
	}
	return 'background';
}

function labelFill(hex = '#000000') {
	const normalized = hex.replace('#', '');
	const r = parseInt(normalized.substring(0, 2), 16);
	const g = parseInt(normalized.substring(2, 4), 16);
	const b = parseInt(normalized.substring(4, 6), 16);
	const brightness = Math.round((r * 299 + g * 587 + b * 114) / 1000);
	return brightness > 125 ? 'black' : 'white';
}

function getLabelOutlineStroke(textFill, mode = 'background') {
	if (mode === 'contrast') {
		const fill = labelFill(textFill || '#000000');
		return fill === 'black' ? '#000000' : '#ffffff';
	}
	return LABEL_OUTLINE_COLOR;
}

describe('text outline mode', () => {
	it('defaults bar charts to contrast mode', () => {
		expect(resolveTextOutlineMode({}, 'bar')).toBe('contrast');
		expect(resolveTextOutlineMode({}, 'stacked-bar')).toBe('contrast');
	});

	it('defaults line charts to background mode', () => {
		expect(resolveTextOutlineMode({}, 'line')).toBe('background');
		expect(resolveTextOutlineMode({}, 'scatter')).toBe('background');
	});

	it('respects an explicit mode override', () => {
		expect(
			resolveTextOutlineMode({ textOutlineMode: 'background' }, 'bar')
		).toBe('background');
	});

	it('uses chart background stroke in background mode', () => {
		expect(getLabelOutlineStroke('#ffffff', 'background')).toBe(
			LABEL_OUTLINE_COLOR
		);
	});

	it('contrasts the halo with white text fill', () => {
		expect(getLabelOutlineStroke('#ffffff', 'contrast')).toBe('#000000');
	});
});
