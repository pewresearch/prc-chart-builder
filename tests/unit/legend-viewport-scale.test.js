/**
 * @jest-environment jsdom
 */

/** Inline mirror of scale helpers from charting-library Legend.tsx */
function getLegendPositioningScale(context, legendScale) {
	if (context === 'inner') {
		return {
			widthRatio: legendScale.innerWidthRatio,
			heightRatio: legendScale.innerHeightRatio,
			originX: legendScale.paddingLeft,
			originY: legendScale.paddingTop,
		};
	}

	return {
		widthRatio: legendScale.widthRatio,
		heightRatio: legendScale.heightRatio,
		originX: 0,
		originY: 0,
	};
}

function scaleLegendPositionToDisplay(x, y, scale) {
	return {
		x: scale.originX + x * scale.widthRatio,
		y: scale.originY + y * scale.heightRatio,
	};
}

function scaleLegendPositionToLayout(x, y, scale) {
	return {
		x:
			scale.widthRatio > 0
				? (x - scale.originX) / scale.widthRatio
				: x - scale.originX,
		y:
			scale.heightRatio > 0
				? (y - scale.originY) / scale.heightRatio
				: y - scale.originY,
	};
}

const chartLegendScale = {
	widthRatio: 0.5,
	heightRatio: 0.5,
	paddingLeft: 40,
	paddingTop: 30,
	innerWidthRatio: 0.5,
	innerHeightRatio: 0.5,
};

describe('detached legend viewport scaling', () => {
	test('scales chart-context coordinates to display pixels and back', () => {
		const scale = getLegendPositioningScale('chart', chartLegendScale);
		const layout = { x: 200, y: 120 };

		const display = scaleLegendPositionToDisplay(layout.x, layout.y, scale);
		expect(display).toEqual({ x: 100, y: 60 });

		expect(
			scaleLegendPositionToLayout(display.x, display.y, scale)
		).toEqual(layout);
	});

	test('scales inner-context coordinates with padding origin offset', () => {
		const scale = getLegendPositioningScale('inner', chartLegendScale);
		const layout = { x: 100, y: 80 };

		const display = scaleLegendPositionToDisplay(layout.x, layout.y, scale);
		expect(display).toEqual({ x: 90, y: 70 });

		expect(
			scaleLegendPositionToLayout(display.x, display.y, scale)
		).toEqual(layout);
	});

	test('uses identity mapping when ratios are 1', () => {
		const identityScale = getLegendPositioningScale('chart', {
			widthRatio: 1,
			heightRatio: 1,
			paddingLeft: 0,
			paddingTop: 0,
			innerWidthRatio: 1,
			innerHeightRatio: 1,
		});
		const coords = { x: 48, y: 16 };

		expect(
			scaleLegendPositionToDisplay(coords.x, coords.y, identityScale)
		).toEqual(coords);
		expect(
			scaleLegendPositionToLayout(coords.x, coords.y, identityScale)
		).toEqual(coords);
	});
});
