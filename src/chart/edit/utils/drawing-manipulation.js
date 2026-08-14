/**
 * Pure drawing geometry updates for editor selection handles.
 */

import { translateDrawing } from './drawing-utils';

export { translateDrawing };

export function moveLineEndpoint(drawing, endpoint, newX, newY) {
	if (endpoint === 'start') {
		return {
			...drawing,
			x1: newX,
			y1: newY,
		};
	}
	return {
		...drawing,
		x2: newX,
		y2: newY,
	};
}

export function moveBend(drawing, newX, newY) {
	return {
		...drawing,
		bendX: newX,
		bendY: newY,
		lineMode: 'curved',
	};
}

export function moveBreakpoint(drawing, breakpointIdx, newX, newY) {
	if (!drawing.breakpoints || breakpointIdx >= drawing.breakpoints.length) {
		return drawing;
	}
	const newBreakpoints = [...drawing.breakpoints];
	newBreakpoints[breakpointIdx] = { x: newX, y: newY };
	return {
		...drawing,
		breakpoints: newBreakpoints,
	};
}

export function addBreakpoint(drawing, afterIdx, x, y) {
	const breakpoints = drawing.breakpoints || [];
	const newBreakpoints = [...breakpoints];
	newBreakpoints.splice(afterIdx + 1, 0, { x, y });
	return {
		...drawing,
		breakpoints: newBreakpoints,
		lineMode: 'angled',
	};
}

export function removeBreakpoint(drawing, breakpointIdx) {
	if (!drawing.breakpoints || breakpointIdx >= drawing.breakpoints.length) {
		return drawing;
	}
	const newBreakpoints = drawing.breakpoints.filter(
		(_, i) => i !== breakpointIdx
	);
	const updated = {
		...drawing,
		breakpoints: newBreakpoints,
	};
	if (newBreakpoints.length === 0) {
		updated.lineMode = 'straight';
		delete updated.breakpoints;
	}
	return updated;
}

export function resizeDrawing(drawing, corner, newX, newY) {
	switch (drawing.type) {
		case 'circle': {
			const cx = drawing.cx;
			const cy = drawing.cy;
			const dx = newX - cx;
			const dy = newY - cy;
			const newRadius = Math.max(5, Math.sqrt(dx * dx + dy * dy));
			return {
				...drawing,
				r: newRadius,
			};
		}
		case 'rect': {
			let x = drawing.x;
			let y = drawing.y;
			let width = drawing.width;
			let height = drawing.height;

			if (corner === 'nw') {
				width = drawing.x + drawing.width - newX;
				height = drawing.y + drawing.height - newY;
				x = newX;
				y = newY;
			} else if (corner === 'ne') {
				width = newX - drawing.x;
				height = drawing.y + drawing.height - newY;
				y = newY;
			} else if (corner === 'sw') {
				width = drawing.x + drawing.width - newX;
				height = newY - drawing.y;
				x = newX;
			} else if (corner === 'se') {
				width = newX - drawing.x;
				height = newY - drawing.y;
			}

			width = Math.max(10, width);
			height = Math.max(10, height);

			return {
				...drawing,
				x,
				y,
				width,
				height,
			};
		}
		default:
			return drawing;
	}
}

export function findClickedSegment(drawing, clickX, clickY, threshold = 15) {
	const points = [
		{ x: drawing.x1, y: drawing.y1 },
		...(drawing.breakpoints || []),
		{ x: drawing.x2, y: drawing.y2 },
	];

	for (let i = 0; i < points.length - 1; i++) {
		const p1 = points[i];
		const p2 = points[i + 1];
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const lengthSq = dx * dx + dy * dy;

		if (lengthSq === 0) {
			continue;
		}

		let t = ((clickX - p1.x) * dx + (clickY - p1.y) * dy) / lengthSq;
		t = Math.max(0, Math.min(1, t));

		const closestX = p1.x + t * dx;
		const closestY = p1.y + t * dy;
		const distance = Math.sqrt(
			(clickX - closestX) ** 2 + (clickY - closestY) ** 2
		);

		if (distance < threshold) {
			return i - 1;
		}
	}

	return null;
}

export function isLineTypeDrawing(drawing) {
	return ['line', 'arrow', 'lollipop'].includes(drawing?.type);
}

export function getDrawingBounds(drawing) {
	switch (drawing.type) {
		case 'line':
		case 'arrow':
		case 'lollipop': {
			let minX = Math.min(drawing.x1, drawing.x2);
			let maxX = Math.max(drawing.x1, drawing.x2);
			let minY = Math.min(drawing.y1, drawing.y2);
			let maxY = Math.max(drawing.y1, drawing.y2);

			if (drawing.breakpoints?.length) {
				for (const bp of drawing.breakpoints) {
					minX = Math.min(minX, bp.x);
					maxX = Math.max(maxX, bp.x);
					minY = Math.min(minY, bp.y);
					maxY = Math.max(maxY, bp.y);
				}
			}

			if (drawing.bendX !== undefined && drawing.bendY !== undefined) {
				minX = Math.min(minX, drawing.bendX);
				maxX = Math.max(maxX, drawing.bendX);
				minY = Math.min(minY, drawing.bendY);
				maxY = Math.max(maxY, drawing.bendY);
			}

			return {
				x: minX,
				y: minY,
				width: maxX - minX || 10,
				height: maxY - minY || 10,
			};
		}
		case 'circle':
			return {
				x: drawing.cx - drawing.r,
				y: drawing.cy - drawing.r,
				width: drawing.r * 2,
				height: drawing.r * 2,
			};
		case 'rect':
			return {
				x: drawing.x,
				y: drawing.y,
				width: drawing.width,
				height: drawing.height,
			};
		case 'path': {
			const matches = drawing.d.matchAll(
				/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi
			);
			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			for (const match of matches) {
				const x = parseFloat(match[2]);
				const y = parseFloat(match[3]);
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			}

			if (minX === Infinity) {
				return { x: 0, y: 0, width: 20, height: 20 };
			}

			return {
				x: minX,
				y: minY,
				width: maxX - minX || 10,
				height: maxY - minY || 10,
			};
		}
		default:
			return { x: 0, y: 0, width: 20, height: 20 };
	}
}
