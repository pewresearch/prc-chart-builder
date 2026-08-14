/**
 * Shared drawing geometry helpers for editor selection + drag persistence.
 */

/**
 * Transform a drawing by offset (move entire shape) in layout coordinates.
 *
 * @param {Object} drawing - The drawing object
 * @param {number} dx      - X offset
 * @param {number} dy      - Y offset
 * @return {Object} Transformed drawing
 */
export function translateDrawing(drawing, dx, dy) {
	switch (drawing.type) {
		case 'line':
		case 'arrow':
		case 'lollipop': {
			const updated = {
				...drawing,
				x1: drawing.x1 + dx,
				y1: drawing.y1 + dy,
				x2: drawing.x2 + dx,
				y2: drawing.y2 + dy,
			};
			if (drawing.bendX !== undefined && drawing.bendY !== undefined) {
				updated.bendX = drawing.bendX + dx;
				updated.bendY = drawing.bendY + dy;
			}
			if (drawing.breakpoints && drawing.breakpoints.length > 0) {
				updated.breakpoints = drawing.breakpoints.map((bp) => ({
					x: bp.x + dx,
					y: bp.y + dy,
				}));
			}
			return updated;
		}
		case 'circle':
			return {
				...drawing,
				cx: drawing.cx + dx,
				cy: drawing.cy + dy,
			};
		case 'rect':
			return {
				...drawing,
				x: drawing.x + dx,
				y: drawing.y + dy,
			};
		case 'path': {
			const newD = drawing.d.replace(
				/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi,
				(match, command, x, y) => {
					const newX = parseFloat(x) + dx;
					const newY = parseFloat(y) + dy;
					return `${command} ${newX} ${newY}`;
				}
			);
			return {
				...drawing,
				d: newD,
			};
		}
		default:
			return drawing;
	}
}
