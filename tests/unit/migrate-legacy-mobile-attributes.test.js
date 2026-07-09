import { migrateLegacyMobileAttributes } from '../../src/chart/utils/migrate-legacy-mobile-attributes';

describe('migrateLegacyMobileAttributes', () => {
	test('promotes labelCutoffMobile into mobile.labels.labelCutoff when values differ', () => {
		const result = migrateLegacyMobileAttributes({
			labels: { labelCutoff: 10, labelCutoffMobile: 5 },
		});

		expect(result.labels).toEqual({ labelCutoff: 10 });
		expect(result.mobile).toEqual({
			labels: { labelCutoff: 5 },
		});
	});

	test('strips labelCutoffMobile without override when it matches desktop', () => {
		const result = migrateLegacyMobileAttributes({
			labels: { labelCutoff: 0, labelCutoffMobile: 0 },
		});

		expect(result.labels).toEqual({ labelCutoff: 0 });
		expect(result.mobile).toBeUndefined();
	});

	test('promotes tooltip.activeOnMobile=false into mobile.tooltip.active', () => {
		const result = migrateLegacyMobileAttributes({
			tooltip: { active: true, activeOnMobile: false },
		});

		expect(result.tooltip).toEqual({ active: true });
		expect(result.mobile).toEqual({
			tooltip: { active: false },
		});
	});

	test('strips tooltip.activeOnMobile when mobile matches desktop default', () => {
		const result = migrateLegacyMobileAttributes({
			tooltip: { active: true, activeOnMobile: true },
		});

		expect(result.tooltip).toEqual({ active: true });
		expect(result.mobile).toBeUndefined();
	});

	test('promotes annotations.activeOnMobile=false into mobile.annotations.active', () => {
		const result = migrateLegacyMobileAttributes({
			annotations: { active: true, activeOnMobile: false, items: [] },
		});

		expect(result.annotations).toEqual({ active: true, items: [] });
		expect(result.mobile).toEqual({
			annotations: { active: false },
		});
	});

	test('strips per-item activeOnMobile from annotation items', () => {
		const result = migrateLegacyMobileAttributes({
			annotations: {
				active: true,
				items: [{ text: 'Note', activeOnMobile: false }],
			},
		});

		expect(result.annotations.items).toEqual([{ text: 'Note' }]);
	});
});
