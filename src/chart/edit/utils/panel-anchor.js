/**
 * Anchor drawings/annotations to small-multiples panel cells so they survive restack.
 *
 * New overlays are often created in global `inner` / `chart` space. On restack the
 * SVG grows and panel cells move, so global coords drift. Panel-local frames
 * (`panel` / `panel-inner` + panelKey) re-resolve against live panelRects.
 */

import {
	getPositioningScale,
	scalePositionToDisplay,
	scalePositionToLayout,
} from '../../../../../prc-charting-library/src/lib/overlays/getPositioningScale';

/**
 * @param {string|undefined} context
 * @return {boolean}
 */
export function isPanelPositioningContext(context) {
	return context === 'panel' || context === 'panel-inner';
}

/**
 * Whether an overlay still uses legacy global chart/inner anchoring.
 *
 * @param {Object|null|undefined} item
 * @return {boolean}
 */
export function needsPanelAnchorMigration(item) {
	return !isPanelPositioningContext(item?.positioningContext);
}

/**
 * Hit-test a point in full-SVG (chart) display space against panel cells.
 *
 * @param {number} chartX
 * @param {number} chartY
 * @param {Object} geometry - smDrawingGeometry from SmallMultiples
 * @return {string|null} panel key
 */
export function findPanelKeyAtPoint(chartX, chartY, geometry) {
	if (!geometry?.panels?.length || !geometry?.panelRects?.length) {
		return null;
	}
	const gridX = geometry.gridOffset?.x ?? 0;
	const gridY = geometry.gridOffset?.y ?? 0;

	for (let i = 0; i < geometry.panels.length; i++) {
		const rect = geometry.panelRects[i];
		const panel = geometry.panels[i];
		if (!rect || !panel?.key) {
			continue;
		}
		const left = gridX + rect.x;
		const top = gridY + rect.y;
		if (
			chartX >= left &&
			chartX <= left + rect.width &&
			chartY >= top &&
			chartY <= top + rect.height
		) {
			return String(panel.key);
		}
	}
	return null;
}

/**
 * Build scale args shared by panel-anchor helpers.
 *
 * @param {Object} geometry
 * @param {string} context
 * @param {string|null} panelKey
 */
function scaleArgs(geometry, context, panelKey = null) {
	return {
		context,
		panelKey,
		layout: geometry.layout,
		chartWidth: geometry.chartWidth,
		chartHeight: geometry.chartHeight,
		panels: geometry.panels,
		panelRects: geometry.panelRects,
		designPanelRects: geometry.designPanelRects,
		gridOffset: geometry.gridOffset,
		titlePad: geometry.titlePad,
		leftInset: geometry.leftInset,
		bottomInset: geometry.bottomInset,
	};
}

/**
 * Normalize geometry to design-time size.
 *
 * Drawings/annotations store coordinates in layout/reference space (DrawingOverlay
 * `toRefCoords`). Hit-testing and conversion must use designPanelRects at
 * layout-sized chart dimensions — not the live restacked rects — or we lock in
 * already-drifted positions.
 *
 * @param {Object} geometry
 * @return {Object}
 */
export function toDesignGeometry(geometry) {
	if (!geometry?.layout) {
		return geometry;
	}
	const designRects =
		geometry.designPanelRects?.length > 0
			? geometry.designPanelRects
			: geometry.panelRects;
	if (!designRects?.length) {
		return geometry;
	}
	return {
		...geometry,
		// Match DrawingOverlay reference space: stored global coords are in
		// layout-inner units, so keep chart size === layout size (scale 1:1).
		chartWidth: geometry.layout.width,
		chartHeight: geometry.layout.height,
		panelRects: designRects,
		designPanelRects: designRects,
	};
}

/**
 * Convert a point from one positioning context to another via display space.
 *
 * @param {number} x
 * @param {number} y
 * @param {Object} geometry
 * @param {string} fromContext
 * @param {string} toContext
 * @param {string|null} fromPanelKey
 * @param {string|null} toPanelKey
 */
export function convertPointBetweenContexts(
	x,
	y,
	geometry,
	fromContext,
	toContext,
	fromPanelKey = null,
	toPanelKey = null
) {
	const fromScale = getPositioningScale(
		scaleArgs(geometry, fromContext, fromPanelKey)
	);
	const toScale = getPositioningScale(
		scaleArgs(geometry, toContext, toPanelKey)
	);
	const display = scalePositionToDisplay(x, y, fromScale);
	return scalePositionToLayout(display.x, display.y, toScale);
}

/**
 * Pick a representative point for hit-testing a drawing.
 *
 * @param {Object} drawing
 * @return {{ x: number, y: number }|null}
 */
export function getDrawingAnchorPoint(drawing) {
	if (!drawing) {
		return null;
	}
	switch (drawing.type) {
		case 'line':
		case 'arrow':
		case 'lollipop':
			return {
				x: (Number(drawing.x1) + Number(drawing.x2)) / 2,
				y: (Number(drawing.y1) + Number(drawing.y2)) / 2,
			};
		case 'circle':
			return { x: Number(drawing.cx), y: Number(drawing.cy) };
		case 'rect':
			return {
				x: Number(drawing.x) + Number(drawing.width) / 2,
				y: Number(drawing.y) + Number(drawing.height) / 2,
			};
		case 'path': {
			const matches = String(drawing.d || '').matchAll(
				/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi
			);
			let sumX = 0;
			let sumY = 0;
			let count = 0;
			for (const match of matches) {
				sumX += parseFloat(match[2]);
				sumY += parseFloat(match[3]);
				count += 1;
			}
			if (!count) {
				return null;
			}
			return { x: sumX / count, y: sumY / count };
		}
		default:
			if (
				typeof drawing.x === 'number' &&
				typeof drawing.y === 'number'
			) {
				return { x: drawing.x, y: drawing.y };
			}
			return null;
	}
}

/**
 * Map every numeric coordinate on a drawing through a point converter.
 *
 * @param {Object} drawing
 * @param {(x: number, y: number) => { x: number, y: number }} convertPoint
 * @param {{ widthRatio: number, heightRatio: number }} sizeScale
 */
function mapDrawingCoordinates(drawing, convertPoint, sizeScale) {
	switch (drawing.type) {
		case 'line':
		case 'arrow':
		case 'lollipop': {
			const start = convertPoint(drawing.x1, drawing.y1);
			const end = convertPoint(drawing.x2, drawing.y2);
			const next = {
				...drawing,
				x1: start.x,
				y1: start.y,
				x2: end.x,
				y2: end.y,
			};
			if (drawing.bendX !== undefined && drawing.bendY !== undefined) {
				const bend = convertPoint(drawing.bendX, drawing.bendY);
				next.bendX = bend.x;
				next.bendY = bend.y;
			}
			if (Array.isArray(drawing.breakpoints)) {
				next.breakpoints = drawing.breakpoints.map((bp) =>
					convertPoint(bp.x, bp.y)
				);
			}
			return next;
		}
		case 'circle': {
			const center = convertPoint(drawing.cx, drawing.cy);
			const avgRatio =
				(sizeScale.widthRatio + sizeScale.heightRatio) / 2 || 1;
			return {
				...drawing,
				cx: center.x,
				cy: center.y,
				r: Number(drawing.r) * avgRatio,
			};
		}
		case 'rect': {
			const topLeft = convertPoint(drawing.x, drawing.y);
			const bottomRight = convertPoint(
				drawing.x + drawing.width,
				drawing.y + drawing.height
			);
			return {
				...drawing,
				x: Math.min(topLeft.x, bottomRight.x),
				y: Math.min(topLeft.y, bottomRight.y),
				width: Math.abs(bottomRight.x - topLeft.x),
				height: Math.abs(bottomRight.y - topLeft.y),
			};
		}
		case 'path': {
			const d = String(drawing.d || '').replace(
				/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi,
				(match, command, x, y) => {
					const point = convertPoint(parseFloat(x), parseFloat(y));
					return `${command} ${point.x} ${point.y}`;
				}
			);
			return { ...drawing, d };
		}
		default:
			return drawing;
	}
}

/**
 * Re-express a drawing in `panel-inner` space for the panel under its centroid.
 * No-op when already panel-anchored, or when geometry/panel can't be resolved.
 *
 * @param {Object} drawing
 * @param {Object|null} geometry
 * @param {string} [targetContext='panel-inner']
 * @param {Object} [options]
 * @param {boolean} [options.useDesignGeometry=true] - true for migrating
 *   layout-space overlays; false when coords were just captured against the
 *   live SM SVG (DrawingOverlay using smDrawingGeometry dimensions).
 * @return {Object}
 */
export function anchorDrawingToPanel(
	drawing,
	geometry,
	targetContext = 'panel-inner',
	options = {}
) {
	if (!drawing || !geometry?.layout) {
		return drawing;
	}
	if (
		isPanelPositioningContext(drawing.positioningContext) &&
		drawing.panelKey
	) {
		return drawing;
	}

	const { useDesignGeometry = true } = options;
	const activeGeometry = useDesignGeometry
		? toDesignGeometry(geometry)
		: geometry;
	const fromContext = drawing.positioningContext || 'inner';
	const anchor = getDrawingAnchorPoint(drawing);
	if (!anchor) {
		return drawing;
	}

	const fromScale = getPositioningScale(
		scaleArgs(activeGeometry, fromContext, drawing.panelKey || null)
	);
	const display = scalePositionToDisplay(anchor.x, anchor.y, fromScale);
	const panelKey = findPanelKeyAtPoint(display.x, display.y, activeGeometry);
	if (!panelKey) {
		return drawing;
	}

	const toScale = getPositioningScale(
		scaleArgs(activeGeometry, targetContext, panelKey)
	);
	// Preserve on-screen size: displayR = r * fromRatio → r' = displayR / toRatio.
	const sizeScale = {
		widthRatio:
			toScale.widthRatio > 0
				? fromScale.widthRatio / toScale.widthRatio
				: 1,
		heightRatio:
			toScale.heightRatio > 0
				? fromScale.heightRatio / toScale.heightRatio
				: 1,
	};

	const convertPoint = (x, y) =>
		convertPointBetweenContexts(
			x,
			y,
			activeGeometry,
			fromContext,
			targetContext,
			drawing.panelKey || null,
			panelKey
		);

	return {
		...mapDrawingCoordinates(drawing, convertPoint, sizeScale),
		positioningContext: targetContext,
		panelKey,
	};
}

/**
 * Re-express a drawing in a new positioning context while preserving on-screen
 * placement (used by the drawing inspector when authors switch context/panel).
 *
 * @param {Object} drawing
 * @param {Object|null} geometry
 * @param {string} targetContext
 * @param {string|null} [targetPanelKey=null]
 * @param {Object} [options]
 * @param {boolean} [options.useDesignGeometry=false]
 * @return {Object}
 */
export function repositionDrawingToContext(
	drawing,
	geometry,
	targetContext,
	targetPanelKey = null,
	options = {}
) {
	if (!drawing || !geometry?.layout) {
		return drawing;
	}

	const fromContext = drawing.positioningContext || 'inner';
	const fromPanelKey = drawing.panelKey || null;
	const toPanelContext = isPanelPositioningContext(targetContext);
	let panelKey = toPanelContext ? targetPanelKey || fromPanelKey : null;

	if (
		fromContext === targetContext &&
		String(fromPanelKey || '') === String(panelKey || '')
	) {
		return drawing;
	}

	const { useDesignGeometry = false } = options;
	const activeGeometry = useDesignGeometry
		? toDesignGeometry(geometry)
		: geometry;

	if (toPanelContext && !panelKey) {
		const anchor = getDrawingAnchorPoint(drawing);
		if (anchor) {
			const fromScale = getPositioningScale(
				scaleArgs(activeGeometry, fromContext, fromPanelKey)
			);
			const display = scalePositionToDisplay(
				anchor.x,
				anchor.y,
				fromScale
			);
			panelKey =
				findPanelKeyAtPoint(display.x, display.y, activeGeometry) ||
				String(activeGeometry.panels?.[0]?.key || '');
		}
	}

	const fromScale = getPositioningScale(
		scaleArgs(activeGeometry, fromContext, fromPanelKey)
	);
	const toScale = getPositioningScale(
		scaleArgs(
			activeGeometry,
			targetContext,
			toPanelContext ? panelKey : null
		)
	);
	const sizeScale = {
		widthRatio:
			toScale.widthRatio > 0
				? fromScale.widthRatio / toScale.widthRatio
				: 1,
		heightRatio:
			toScale.heightRatio > 0
				? fromScale.heightRatio / toScale.heightRatio
				: 1,
	};

	const convertPoint = (x, y) =>
		convertPointBetweenContexts(
			x,
			y,
			activeGeometry,
			fromContext,
			targetContext,
			fromPanelKey,
			toPanelContext ? panelKey : null
		);

	return {
		...mapDrawingCoordinates(drawing, convertPoint, sizeScale),
		positioningContext: targetContext,
		panelKey: toPanelContext ? panelKey : '',
	};
}

/**
 * Re-express an annotation (x/y) in panel-inner space.
 *
 * @param {Object} annotation
 * @param {Object|null} geometry
 * @param {string} [targetContext='panel-inner']
 * @param {Object} [options]
 * @param {boolean} [options.useDesignGeometry=true]
 * @return {Object}
 */
export function anchorAnnotationToPanel(
	annotation,
	geometry,
	targetContext = 'panel-inner',
	options = {}
) {
	if (!annotation || !geometry?.layout) {
		return annotation;
	}
	if (
		isPanelPositioningContext(annotation.positioningContext) &&
		annotation.panelKey
	) {
		return annotation;
	}

	const { useDesignGeometry = true } = options;
	const activeGeometry = useDesignGeometry
		? toDesignGeometry(geometry)
		: geometry;
	const fromContext = annotation.positioningContext || 'chart';
	const fromScale = getPositioningScale(
		scaleArgs(activeGeometry, fromContext, annotation.panelKey || null)
	);
	const display = scalePositionToDisplay(
		Number(annotation.x),
		Number(annotation.y),
		fromScale
	);
	const panelKey = findPanelKeyAtPoint(display.x, display.y, activeGeometry);
	if (!panelKey) {
		return annotation;
	}

	const local = convertPointBetweenContexts(
		Number(annotation.x),
		Number(annotation.y),
		activeGeometry,
		fromContext,
		targetContext,
		annotation.panelKey || null,
		panelKey
	);

	return {
		...annotation,
		x: local.x,
		y: local.y,
		positioningContext: targetContext,
		panelKey,
	};
}

/**
 * Anchor every unanchored drawing/annotation that falls inside a panel.
 *
 * @param {Object[]} items
 * @param {Object|null} geometry
 * @param {'drawing'|'annotation'} kind
 * @param {Object} [options]
 * @return {{ items: Object[], changed: boolean }}
 */
export function anchorItemsToPanels(
	items,
	geometry,
	kind = 'drawing',
	options = {}
) {
	if (!Array.isArray(items) || !items.length || !geometry) {
		return { items: items || [], changed: false };
	}
	const anchor =
		kind === 'annotation' ? anchorAnnotationToPanel : anchorDrawingToPanel;
	let changed = false;
	const next = items.map((item) => {
		const anchored = anchor(item, geometry, 'panel-inner', options);
		if (
			anchored !== item &&
			(anchored.positioningContext !== item.positioningContext ||
				anchored.panelKey !== item.panelKey ||
				anchored.x !== item.x ||
				anchored.y !== item.y ||
				anchored.x1 !== item.x1)
		) {
			changed = true;
		}
		return anchored;
	});
	return { items: next, changed };
}

/**
 * Whether any overlay in the lists still needs global → panel migration.
 *
 * @param {Object[]} drawings
 * @param {Object[]} annotations
 * @return {boolean}
 */
export function hasOverlaysNeedingPanelAnchor(drawings, annotations) {
	return (
		(drawings || []).some(needsPanelAnchorMigration) ||
		(annotations || []).some(needsPanelAnchorMigration)
	);
}
