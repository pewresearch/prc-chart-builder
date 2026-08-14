/**
 * Per-drawing coordinate transforms for the editor selection overlay.
 * Maps stored layout-space coords to display pixels inside the padded inner chart area.
 */
import { getPositioningScale } from '../../../../../prc-charting-library/src/lib/overlays/getPositioningScale';

/**
 * @param {Object} drawing
 * @param {Object} options
 * @param {{ left: number, right: number, top: number, bottom: number }} options.padding
 * @param {number} options.chartWidth
 * @param {number} options.chartHeight
 * @param {{ width: number, height: number, padding: Object }} options.layoutDimensions
 * @param {Object|null} options.smallMultiplesGeometry
 * @return {{ toDisplayCoords: Function, toRefCoords: Function }}
 */
export function createDrawingCoordTransform(
	drawing,
	{
		padding,
		chartWidth,
		chartHeight,
		layoutDimensions,
		smallMultiplesGeometry = null,
	}
) {
	const refLayout = layoutDimensions;
	const padL = padding?.left ?? 0;
	const padT = padding?.top ?? 0;
	const padR = padding?.right ?? 0;
	const padB = padding?.bottom ?? 0;

	const innerWidth = chartWidth - padL - padR;
	const innerHeight = chartHeight - padT - padB;
	const refInnerWidth =
		refLayout.width - refLayout.padding.left - refLayout.padding.right;
	const refInnerHeight =
		refLayout.height - refLayout.padding.top - refLayout.padding.bottom;

	const context = drawing.positioningContext || 'inner';

	if (
		(context === 'panel' || context === 'panel-inner') &&
		smallMultiplesGeometry &&
		drawing.panelKey
	) {
		const scale = getPositioningScale({
			context,
			panelKey: drawing.panelKey,
			layout: smallMultiplesGeometry.layout,
			chartWidth: smallMultiplesGeometry.chartWidth,
			chartHeight: smallMultiplesGeometry.chartHeight,
			panels: smallMultiplesGeometry.panels,
			panelRects: smallMultiplesGeometry.panelRects,
			designPanelRects: smallMultiplesGeometry.designPanelRects,
			gridOffset: smallMultiplesGeometry.gridOffset,
			titlePad: smallMultiplesGeometry.titlePad,
			leftInset: smallMultiplesGeometry.leftInset,
			bottomInset: smallMultiplesGeometry.bottomInset,
		});

		return {
			toDisplayCoords(x, y) {
				const chartX = scale.originX + x * scale.widthRatio;
				const chartY = scale.originY + y * scale.heightRatio;
				return { x: chartX - padL, y: chartY - padT };
			},
			toRefCoords(x, y) {
				const chartX = x + padL;
				const chartY = y + padT;
				return {
					x:
						scale.widthRatio > 0
							? (chartX - scale.originX) / scale.widthRatio
							: chartX - scale.originX,
					y:
						scale.heightRatio > 0
							? (chartY - scale.originY) / scale.heightRatio
							: chartY - scale.originY,
				};
			},
		};
	}

	if (context === 'chart') {
		const refW = refLayout.width;
		const refH = refLayout.height;
		return {
			toDisplayCoords(x, y) {
				const chartX = refW > 0 ? (x * chartWidth) / refW : x;
				const chartY = refH > 0 ? (y * chartHeight) / refH : y;
				return { x: chartX - padL, y: chartY - padT };
			},
			toRefCoords(x, y) {
				const chartX = x + padL;
				const chartY = y + padT;
				return {
					x: chartWidth > 0 ? (chartX * refW) / chartWidth : chartX,
					y: chartHeight > 0 ? (chartY * refH) / chartHeight : chartY,
				};
			},
		};
	}

	return {
		toDisplayCoords(x, y) {
			return {
				x: refInnerWidth > 0 ? (x * innerWidth) / refInnerWidth : x,
				y: refInnerHeight > 0 ? (y * innerHeight) / refInnerHeight : y,
			};
		},
		toRefCoords(x, y) {
			return {
				x: innerWidth > 0 ? (x * refInnerWidth) / innerWidth : x,
				y: innerHeight > 0 ? (y * refInnerHeight) / innerHeight : y,
			};
		},
	};
}
