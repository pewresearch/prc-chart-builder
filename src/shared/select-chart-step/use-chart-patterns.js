/**
 * Shared pattern-library fetch + filter for Select Chart (admin wizard + CPT shell).
 *
 * Patterns are cached at module scope for the lifetime of the admin/editor page
 * so remounting the wizard (modal close/reopen, library ↔ create) does not
 * refetch. Call {@link invalidateChartPatternsCache} after creating or updating
 * a chart pattern in-session.
 */
import { parse } from '@wordpress/blocks';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const INDEX_STORAGE_KEY = 'prcChartBuilderPatternIndex';

/** @type {null|{ patterns: Object[], counts: Object.<string,number>, version: string }} */
let indexCache = null;
/** @type {Promise<{ patterns: Object[], counts: Object.<string,number>, version: string }>|null} */
let indexInflight = null;

/**
 * Drop the in-memory pattern library so the next consumer refetches.
 */
export function invalidateChartPatternsCache() {
	indexCache = null;
	indexInflight = null;
	try {
		window.sessionStorage.removeItem(INDEX_STORAGE_KEY);
	} catch (_) {
		// sessionStorage unavailable.
	}
}

/**
 * @return {boolean} Whether a successful index fetch is already cached.
 */
export function hasChartPatternsCache() {
	return indexCache !== null;
}

/**
 * @return {{ restUrl: string, nonce: string }} REST base URL and nonce.
 */
function getRestConfig() {
	const restUrl = (window?.prcChartBuilderLibrary?.restUrl || '').replace(
		/\/$/,
		''
	);
	const nonce = window?.prcChartBuilderLibrary?.nonce || '';
	return { restUrl, nonce };
}

/**
 * @param {string} url
 * @param {Object} headers
 * @return {Promise<{ data: *, response: Response }>} Parsed JSON and response.
 */
async function fetchJson(url, headers) {
	const response = await fetch(url, { headers });
	if (!response.ok) {
		let message = `${response.status} ${response.statusText}`;
		try {
			const body = await response.json();
			if (body?.message) {
				message = `${message} — ${body.message}`;
			}
		} catch (_) {
			// Non-JSON error body; ignore.
		}
		const err = new Error(`${message} (${url})`);
		err.status = response.status;
		throw err;
	}
	return { data: await response.json(), response };
}

/**
 * Read index from sessionStorage when version matches.
 *
 * @param {string} version Server version hash.
 * @return {Object|null} Cached index or null when stale/missing.
 */
function readIndexFromSession(version) {
	try {
		const raw = window.sessionStorage.getItem(INDEX_STORAGE_KEY);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw);
		if (parsed?.version === version && parsed?.patterns) {
			return parsed;
		}
	} catch (_) {
		// Ignore parse / storage errors.
	}
	return null;
}

/**
 * Persist index to sessionStorage.
 *
 * @param {Object} index Index payload.
 */
function writeIndexToSession(index) {
	try {
		window.sessionStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(index));
	} catch (_) {
		// sessionStorage unavailable or quota exceeded.
	}
}

/**
 * Map a pattern index row to a wizard picker item with pre-parsed blocks.
 *
 * @param {Object} row Pattern row from the index endpoint.
 * @return {Object} DataViews item.
 */
export function mapPatternRowToPickerItem(row) {
	const content = row.content || '';
	const blocks = content
		? parse(content, { __unstableSkipMigrationLogs: true })
		: [];

	return {
		name: `wp-block-${row.id}`,
		title: row.title || '',
		description: row.excerpt || '',
		content,
		blocks,
	};
}

/**
 * Fetch the pattern library (metadata + content) from the custom REST endpoint.
 *
 * @return {Promise<{ patterns: Object[], counts: Object.<string,number>, version: string }>} Pattern index payload.
 */
async function fetchPatternIndex() {
	const { restUrl, nonce } = getRestConfig();
	if (!restUrl) {
		throw new Error(
			__('Chart builder REST URL is not available.', 'prc-chart-builder')
		);
	}

	const headers = { 'X-WP-Nonce': nonce };
	const { data } = await fetchJson(
		`${restUrl}/prc-chart-builder/v1/chart-patterns`,
		headers
	);

	const index = {
		patterns: Array.isArray(data?.patterns) ? data.patterns : [],
		counts:
			data?.counts && typeof data.counts === 'object' ? data.counts : {},
		version: typeof data?.version === 'string' ? data.version : '',
	};

	const fromSession = readIndexFromSession(index.version);
	if (fromSession) {
		return fromSession;
	}

	writeIndexToSession(index);
	return index;
}

/**
 * Fetch (or return cached) chart-builder pattern index.
 *
 * @return {Promise<{ patterns: Object[], counts: Object.<string,number>, version: string }>} Pattern index payload.
 */
export function loadChartPatternsLibrary() {
	if (indexCache) {
		return Promise.resolve(indexCache);
	}
	if (indexInflight) {
		return indexInflight;
	}

	indexInflight = fetchPatternIndex()
		.then((result) => {
			indexCache = result;
			indexInflight = null;
			return result;
		})
		.catch((err) => {
			indexInflight = null;
			throw err;
		});

	return indexInflight;
}

/**
 * Warm the cache without waiting (fire-and-forget). Safe to call early on
 * admin/editor boot so the wizard opens against a hot cache.
 */
export function prefetchChartPatternsLibrary() {
	loadChartPatternsLibrary().catch(() => {
		// Prefetch failures are surfaced when a consumer actually needs data.
	});
}

/**
 * Load wp_block patterns tagged with prc-chart-builder-* categories, expose
 * per-type counts, and filter the list when a chart type is selected.
 *
 * @param {Object|null} selectedType Chart type term (`{ slug, label }`) or null.
 * @return {{
 *   patterns: Object[],
 *   patternsLoading: boolean,
 *   patternCounts: Object.<string, number>,
 *   patternsError: string|null,
 * }} Hook state for pattern library UI.
 */
export default function useChartPatterns(selectedType) {
	const [indexPatterns, setIndexPatterns] = useState(
		() => indexCache?.patterns || []
	);
	const [patternCounts, setPatternCounts] = useState(
		() => indexCache?.counts || {}
	);
	const [patternsLoading, setPatternsLoading] = useState(
		() => !hasChartPatternsCache()
	);
	const [patternsError, setPatternsError] = useState(null);

	useEffect(() => {
		let cancelled = false;

		if (!hasChartPatternsCache()) {
			setPatternsLoading(true);
		}

		loadChartPatternsLibrary()
			.then((result) => {
				if (cancelled) {
					return;
				}
				setIndexPatterns(result.patterns);
				setPatternCounts(result.counts);
				setPatternsError(null);
			})
			.catch((err) => {
				if (cancelled) {
					return;
				}
				// eslint-disable-next-line no-console
				console.error(
					'[prc-chart-builder] Failed to load pattern library:',
					err
				);
				setPatternsError(
					err?.message ||
						__(
							'Failed to load the pattern library.',
							'prc-chart-builder'
						)
				);
			})
			.finally(() => {
				if (!cancelled) {
					setPatternsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const patterns = useMemo(() => {
		if (!selectedType?.slug) {
			return [];
		}
		return indexPatterns
			.filter((p) => p.typeSlug === selectedType.slug)
			.map(mapPatternRowToPickerItem);
	}, [selectedType, indexPatterns]);

	return {
		patterns,
		patternsLoading,
		patternCounts,
		patternsError,
	};
}
