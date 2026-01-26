/**
 * Migration logging utility to compare original vs migrated attributes
 * Accounts for key remapping from flat v1 structure to nested v2 structure
 *
 * @param {Object} originalAttrs - Original v1 attributes
 * @param {Object} migratedAttrs - Migrated v2 attributes
 * @param {string} chartId       - Chart ID for logging
 */
export function logMigrationComparison(originalAttrs, migratedAttrs, chartId) {
	// eslint-disable-next-line no-console
	if (!originalAttrs || !migratedAttrs) {
		// eslint-disable-next-line no-console
		console.warn(`[Migration Log] Missing attributes for chart ${chartId}`);
		return;
	}

	// eslint-disable-next-line no-console
	console.group(`🔍 [Migration Log] Chart: ${chartId}`);

	// Log original attributes
	// eslint-disable-next-line no-console
	console.log('📥 Original Attributes (v1):', originalAttrs);
	// eslint-disable-next-line no-console
	console.log('📤 Migrated Attributes (v2):', migratedAttrs);

	// Extract _v1Original if present (this is the preserved original)
	const v1Original = migratedAttrs._v1Original || originalAttrs;
	const version = migratedAttrs._version || 'unknown';
	const migrationMeta = migratedAttrs._migrationMeta || {};

	// eslint-disable-next-line no-console
	console.log('📋 Migration Info:', {
		version,
		migratedAt: migrationMeta.migratedAt,
		migrationVersion: migrationMeta.migrationVersion,
		hasV1Original: !!migratedAttrs._v1Original,
	});

	// Compare key differences accounting for remapping
	const differences = {
		removedFlatKeys: [],
		addedNestedKeys: [],
		valueChanges: [],
	};

	// Check for flat keys that should have been migrated to nested
	const flatKeysToCheck = [
		// Layout keys
		'width',
		'height',
		'paddingTop',
		'paddingLeft',
		'paddingBottom',
		'paddingRight',
		'overflowX',
		'horizontalRules',
		'mobileBreakpoint',
		// Metadata keys
		'metaTextActive',
		'metaTitle',
		'metaSubtitle',
		'metaNote',
		'metaSource',
		'metaTag',
		'metaAlt',
		// Independent axis keys
		'xAxisActive',
		'xLabel',
		'xScale',
		'xDateFormat',
		'xMinDomain',
		'xMaxDomain',
		'xLabelPadding',
		'xTickMarksActive',
		// Dependent axis keys
		'yAxisActive',
		'yLabel',
		'yScale',
		'yMinDomain',
		'yMaxDomain',
		'yTickMarksActive',
		// Tooltip keys
		'tooltipActive',
		'tooltipActiveOnMobile',
		'tooltipFormat',
		// Legend keys
		'legendActive',
		'legendOrientation',
		// Labels keys
		'labelsActive',
		'labelColor',
		// Bar keys
		'barPadding',
		'barGroupPadding',
		// Line keys
		'lineInterpolation',
		'lineStrokeWidth',
		'lineNodes',
	];

	// Check which flat keys still exist in migrated (should be minimal)
	flatKeysToCheck.forEach((key) => {
		if (key in migratedAttrs && !(key in v1Original)) {
			differences.addedNestedKeys.push({
				key,
				value: migratedAttrs[key],
				note: 'Still present as flat key (may be intentional for compatibility)',
			});
		}
	});

	// Check nested structure exists
	const nestedStructures = [
		'layout',
		'metadata',
		'independentAxis',
		'dependentAxis',
		'tooltip',
		'legend',
		'labels',
		'bar',
		'line',
		'io',
	];

	nestedStructures.forEach((nestedKey) => {
		if (!(nestedKey in migratedAttrs)) {
			differences.removedFlatKeys.push({
				key: nestedKey,
				note: 'Missing nested structure',
			});
		}
	});

	// Compare specific nested values vs original flat values
	const valueComparisons = [];

	// Layout comparison
	if (v1Original.paddingTop !== undefined) {
		const migratedPadding = migratedAttrs.layout?.padding?.top;
		if (v1Original.paddingTop !== migratedPadding) {
			valueComparisons.push({
				original: { key: 'paddingTop', value: v1Original.paddingTop },
				migrated: {
					key: 'layout.padding.top',
					value: migratedPadding,
				},
			});
		}
	}

	// Metadata comparison
	if (v1Original.metaTextActive !== undefined) {
		const migratedActive = migratedAttrs.metadata?.active;
		if (v1Original.metaTextActive !== migratedActive) {
			valueComparisons.push({
				original: {
					key: 'metaTextActive',
					value: v1Original.metaTextActive,
				},
				migrated: { key: 'metadata.active', value: migratedActive },
			});
		}
	}

	// Independent axis comparison
	if (v1Original.xTickMarksActive !== undefined) {
		const migratedTickMarks =
			migratedAttrs.independentAxis?.tickMarksActive;
		if (v1Original.xTickMarksActive !== migratedTickMarks) {
			valueComparisons.push({
				original: {
					key: 'xTickMarksActive',
					value: v1Original.xTickMarksActive,
				},
				migrated: {
					key: 'independentAxis.tickMarksActive',
					value: migratedTickMarks,
				},
			});
		}
	}

	// Log differences
	if (differences.removedFlatKeys.length > 0) {
		// eslint-disable-next-line no-console
		console.warn(
			'⚠️ Missing nested structures:',
			differences.removedFlatKeys
		);
	}

	if (differences.addedNestedKeys.length > 0) {
		// eslint-disable-next-line no-console
		console.info(
			'ℹ️ Flat keys still present (may be intentional):',
			differences.addedNestedKeys
		);
	}

	if (valueComparisons.length > 0) {
		// eslint-disable-next-line no-console
		console.log('🔄 Value comparisons:', valueComparisons);
	} else {
		// eslint-disable-next-line no-console
		console.log('✅ No value differences detected in sampled keys');
	}

	// Log key counts
	const originalKeyCount = Object.keys(v1Original).length;
	const migratedKeyCount = Object.keys(migratedAttrs).length;
	// eslint-disable-next-line no-console
	console.log('📊 Key counts:', {
		original: originalKeyCount,
		migrated: migratedKeyCount,
		difference: migratedKeyCount - originalKeyCount,
	});

	// eslint-disable-next-line no-console
	console.groupEnd();
}
