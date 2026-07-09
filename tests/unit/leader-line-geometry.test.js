import {
	computeLeaderLineEndpoints,
	rectEdgeTowardPoint,
} from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/leaderLineGeometry';

describe('leaderLineGeometry', () => {
	const bbox = { width: 40, height: 12, offsetX: -20, offsetY: -6 };

	it('places label endpoint on the bbox edge toward the anchor', () => {
		const edge = rectEdgeTowardPoint(100, 50, bbox, 0, 50);
		expect(edge.x).toBeCloseTo(80, 0);
		expect(edge.y).toBeCloseTo(50, 0);
	});

	it('offsets anchor endpoint by node radius and label endpoint inward from edge', () => {
		const endpoints = computeLeaderLineEndpoints({
			anchorX: 0,
			anchorY: 50,
			labelCenterX: 100,
			labelCenterY: 50,
			bbox,
			anchorRadius: 4,
			edgeBuffer: 3,
		});

		expect(endpoints.x1).toBeCloseTo(4, 0);
		expect(endpoints.y1).toBeCloseTo(50, 0);
		expect(endpoints.x2).toBeCloseTo(77, 0);
		expect(endpoints.y2).toBeCloseTo(50, 0);
		expect(endpoints.distance).toBeCloseTo(100, 0);
	});

	it('returns zero distance when label sits on anchor', () => {
		const endpoints = computeLeaderLineEndpoints({
			anchorX: 10,
			anchorY: 10,
			labelCenterX: 10,
			labelCenterY: 10,
			bbox,
		});

		expect(endpoints.distance).toBe(0);
	});

	it('chooses top/bottom edge when label is above anchor', () => {
		const endpoints = computeLeaderLineEndpoints({
			anchorX: 50,
			anchorY: 80,
			labelCenterX: 50,
			labelCenterY: 20,
			bbox,
			anchorRadius: 0,
			edgeBuffer: 0,
		});

		expect(endpoints.y2).toBeCloseTo(26, 0);
		expect(endpoints.x2).toBeCloseTo(50, 0);
	});
});
