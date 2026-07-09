import { createLeaderLineStore } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/leaderLineStore';

const sampleEntry = {
	id: 'series-0-point-1',
	anchorX: 10,
	anchorY: 20,
	labelCenterX: 50,
	labelCenterY: 30,
	text: '42%',
	fontSize: 12,
	fontFamily: 'franklin-gothic-urw, sans-serif',
};

describe('leaderLineStore', () => {
	it('isolates registrations per store instance', () => {
		const storeA = createLeaderLineStore();
		const storeB = createLeaderLineStore();

		storeA.register(sampleEntry);

		expect(Array.from(storeA.getLines())).toHaveLength(1);
		expect(Array.from(storeB.getLines())).toHaveLength(0);
	});

	it('allows the same label id in separate store instances', () => {
		const storeA = createLeaderLineStore();
		const storeB = createLeaderLineStore();

		storeA.register({ ...sampleEntry, anchorX: 1 });
		storeB.register({ ...sampleEntry, anchorX: 99 });

		expect(Array.from(storeA.getLines())[0].anchorX).toBe(1);
		expect(Array.from(storeB.getLines())[0].anchorX).toBe(99);
	});

	it('unregisters only within its own store', () => {
		const storeA = createLeaderLineStore();
		const storeB = createLeaderLineStore();

		storeA.register(sampleEntry);
		storeB.register(sampleEntry);

		storeA.unregister(sampleEntry.id);

		expect(Array.from(storeA.getLines())).toHaveLength(0);
		expect(Array.from(storeB.getLines())).toHaveLength(1);
	});
});
