/**
 * Fixture Format Schema Validation Helper
 *
 * Validates test fixtures against the defined schema structure to ensure consistency
 * and correctness across all fixture files used for block deprecation testing.
 *
 * @see specs/issue-1386/contracts/fixture-format-schema.json
 */

/**
 * Validates a fixture object against the expected schema
 *
 * @param {Object} fixture - The fixture object to validate
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 */
export function validateFixture(fixture) {
	const errors = [];

	// Required fields
	if (!fixture.name) {
		errors.push('Missing required field: name');
	} else if (!/^v[0-9]+-[a-z0-9-]+$/.test(fixture.name)) {
		errors.push(
			'Invalid name format. Expected pattern: v{number}-{slug} (e.g., v1-basic-bar-chart)'
		);
	}

	if (!fixture.description) {
		errors.push('Missing required field: description');
	}

	if (!fixture.blockVersion) {
		errors.push('Missing required field: blockVersion');
	} else if (!['v1', 'v2'].includes(fixture.blockVersion)) {
		errors.push('Invalid blockVersion. Must be "v1" or "v2"');
	}

	if (!fixture.serializedContent) {
		errors.push('Missing required field: serializedContent');
	} else if (
		!/^<!-- wp:prc-chart-builder\/chart/.test(fixture.serializedContent)
	) {
		errors.push(
			'Invalid serializedContent format. Must start with WordPress block comment'
		);
	}

	if (!fixture.expectedMigratedAttributes) {
		errors.push('Missing required field: expectedMigratedAttributes');
	} else {
		// Validate nested structure
		if (!fixture.expectedMigratedAttributes._version) {
			errors.push(
				'expectedMigratedAttributes missing required field: _version'
			);
		} else if (fixture.expectedMigratedAttributes._version !== 'v2') {
			errors.push('expectedMigratedAttributes._version must be "v2"');
		}
	}

	// Optional but validated if present
	if (fixture.chartType) {
		const validChartTypes = [
			'bar',
			'diverging-bar',
			'line',
			'area',
			'pie',
			'dot-plot',
			'stacked-bar',
			'grouped-bar',
			'exploded-bar',
			'map-usa',
			'map-usa-counties',
			'map-world',
		];
		if (!validChartTypes.includes(fixture.chartType)) {
			errors.push(
				`Invalid chartType: ${fixture.chartType}. Must be one of: ${validChartTypes.join(', ')}`
			);
		}
	}

	if (fixture.featureTags && !Array.isArray(fixture.featureTags)) {
		errors.push('featureTags must be an array');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Validates that migrated attributes match expected structure
 *
 * @param {Object} migrated - Actual migrated attributes from deprecation
 * @param {Object} expected - Expected attributes from fixture
 * @returns {Object} Validation result with { match: boolean, differences: string[] }
 */
export function validateMigration(migrated, expected) {
	const differences = [];

	// Check _version
	if (migrated._version !== expected._version) {
		differences.push(
			`_version mismatch: got "${migrated._version}", expected "${expected._version}"`
		);
	}

	// Check for data loss - all expected top-level keys should exist
	const expectedKeys = Object.keys(expected);
	const migratedKeys = Object.keys(migrated);

	expectedKeys.forEach((key) => {
		if (!migratedKeys.includes(key)) {
			differences.push(`Missing expected key: ${key}`);
		}
	});

	// Deep comparison helper
	function deepCompare(obj1, obj2, path = '') {
		if (obj1 === null || obj2 === null) {
			if (obj1 !== obj2) {
				differences.push(`${path}: null/value mismatch`);
			}
			return;
		}

		if (typeof obj1 !== typeof obj2) {
			differences.push(
				`${path}: type mismatch (${typeof obj1} vs ${typeof obj2})`
			);
			return;
		}

		if (typeof obj1 === 'object' && !Array.isArray(obj1)) {
			Object.keys(obj2).forEach((key) => {
				deepCompare(
					obj1[key],
					obj2[key],
					path ? `${path}.${key}` : key
				);
			});
		} else if (Array.isArray(obj1)) {
			if (obj1.length !== obj2.length) {
				differences.push(
					`${path}: array length mismatch (${obj1.length} vs ${obj2.length})`
				);
			}
		}
	}

	// Compare nested structures
	expectedKeys.forEach((key) => {
		if (key !== '_version' && migrated[key] && expected[key]) {
			deepCompare(migrated[key], expected[key], key);
		}
	});

	return {
		match: differences.length === 0,
		differences,
	};
}

/**
 * Checks for data loss by ensuring no attributes from original are missing in migrated
 *
 * @param {Object} original - Original flat attributes
 * @param {Object} migrated - Migrated nested attributes
 * @param {string[]} expectedLegacyKeys - Keys expected to be in _legacy object
 * @returns {Object} Result with { noDataLoss: boolean, lostAttributes: string[], preservedInLegacy: string[] }
 */
export function checkDataLoss(original, migrated, expectedLegacyKeys = []) {
	const lostAttributes = [];
	const preservedInLegacy = [];

	// Get all keys from original (excluding _version which is new)
	const originalKeys = Object.keys(original).filter(
		(key) => key !== '_version'
	);

	// Check if each original key is mapped somewhere in nested structure or _legacy
	originalKeys.forEach((key) => {
		// Skip if it's a known IO attribute
		const ioKeys = [
			'id',
			'isConvertedChart',
			'isStaticChart',
			'isFreeformChart',
			'staticImageUrl',
			'staticImageId',
			'chartConverted',
			'lock',
			'defaultShouldRender',
		];
		if (
			ioKeys.includes(key) &&
			migrated.io &&
			migrated.io[key] !== undefined
		) {
			return; // Found in io
		}

		// Check if mapped to any nested object
		const nestedObjects = [
			'layout',
			'metadata',
			'colors',
			'plotBands',
			'independentAxis',
			'dependentAxis',
			'tooltip',
			'legend',
			'labels',
			'bar',
			'line',
			'dotPlot',
			'explodedBar',
			'pie',
			'nodes',
			'map',
			'divergingBar',
			'diffColumn',
			'annotations',
			'dataRender',
			'animate',
		];

		let found = false;
		for (const obj of nestedObjects) {
			if (
				migrated[obj] &&
				JSON.stringify(migrated[obj]).includes(
					JSON.stringify(original[key])
				)
			) {
				found = true;
				break;
			}
		}

		if (!found) {
			// Check if preserved in _legacy
			if (migrated._legacy && migrated._legacy[key] !== undefined) {
				preservedInLegacy.push(key);
				if (!expectedLegacyKeys.includes(key)) {
					// This is unexpected - might indicate missing mapping
					lostAttributes.push(key);
				}
			} else {
				lostAttributes.push(key);
			}
		}
	});

	return {
		noDataLoss: lostAttributes.length === 0,
		lostAttributes,
		preservedInLegacy,
	};
}

/**
 * Utility to load and parse a fixture file
 *
 * @param {string} fixturePath - Path to fixture JSON file
 * @returns {Promise<Object>} Parsed fixture object
 */
export async function loadFixture(fixturePath) {
	const fs = await import('fs/promises');
	const content = await fs.readFile(fixturePath, 'utf-8');
	return JSON.parse(content);
}

/**
 * Validates all fixtures in a directory
 *
 * @param {string} fixturesDir - Path to fixtures directory
 * @returns {Promise<Object>} Summary of validation results
 */
export async function validateAllFixtures(fixturesDir) {
	const fs = await import('fs/promises');
	const path = await import('path');

	const files = await fs.readdir(fixturesDir);
	const jsonFiles = files.filter((f) => f.endsWith('.json'));

	const results = {
		total: jsonFiles.length,
		valid: 0,
		invalid: 0,
		fixtures: [],
	};

	for (const file of jsonFiles) {
		const filePath = path.join(fixturesDir, file);
		try {
			const fixture = await loadFixture(filePath);
			const validation = validateFixture(fixture);

			results.fixtures.push({
				file,
				...validation,
			});

			if (validation.valid) {
				results.valid++;
			} else {
				results.invalid++;
			}
		} catch (error) {
			results.fixtures.push({
				file,
				valid: false,
				errors: [`Failed to load: ${error.message}`],
			});
			results.invalid++;
		}
	}

	return results;
}
