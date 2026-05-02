/**
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';

/**
 * Translate a DataViews view object into WP REST API query args.
 *
 * @param {Object} view The DataViews view state.
 * @return {Object} Query args for the REST API.
 */
function viewToQueryArgs(view) {
	const args = {
		per_page: view.perPage || 20,
		page: view.page || 1,
		context: 'edit',
		_embed: 'author,wp:featuredmedia,wp:term',
		// Include publish, draft, and private by default; filters can narrow this.
		status: 'publish,draft,private',
	};

	// Search.
	if (view.search) {
		args.search = view.search;
	}

	// Sorting.
	if (view.sort?.field) {
		const fieldToOrderby = {
			title: 'title',
			date: 'date',
			modified: 'modified',
			author: 'author',
		};
		args.orderby = fieldToOrderby[view.sort.field] || 'date';
		args.order = view.sort.direction || 'desc';
	} else {
		args.orderby = 'date';
		args.order = 'desc';
	}

		// Filters.
		if (view.filters?.length) {
			view.filters.forEach((filter) => {
				const values = Array.isArray(filter.value)
					? filter.value
					: [filter.value];
				const joined = values.filter(Boolean).join(',');
				if (!joined) {
					return;
				}
			if (filter.field === 'chartType') {
				args.chart_type_slug = joined;
			}
				if (filter.field === 'status') {
					args.status = joined;
				}
			});
		}

	return args;
}

/**
 * Hook to fetch charts from the REST API with server-side pagination,
 * filtering, sorting, and search derived from the DataViews view state.
 *
 * @param {Object} view The DataViews view state object.
 * @return {{ charts: Array, paginationInfo: Object, isLoading: boolean, error: string|null, refresh: Function }} Chart data, pagination info, loading/error state, and a refresh callback.
 */
export const useCharts = (view) => {
	const [charts, setCharts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [paginationInfo, setPaginationInfo] = useState({
		totalItems: 0,
		totalPages: 1,
	});

	// Use a counter to trigger manual refreshes (e.g., after create/delete).
	const [refreshToken, setRefreshToken] = useState(0);
	const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

	// Cancel in-flight requests when the view changes.
	const abortRef = useRef(null);

	useEffect(() => {
		if (abortRef.current) {
			abortRef.current.abort();
		}
		const controller = new AbortController();
		abortRef.current = controller;

		setIsLoading(true);
		setError(null);

		const queryArgs = viewToQueryArgs(view);
		const path = addQueryArgs('/wp/v2/chart', queryArgs);

		apiFetch({ path, signal: controller.signal, parse: false })
			.then(async (response) => {
				const total = parseInt(
					response.headers.get('X-WP-Total') || '0',
					10
				);
				const totalPages = parseInt(
					response.headers.get('X-WP-TotalPages') || '1',
					10
				);
				const data = await response.json();
				setCharts(data);
				setPaginationInfo({ totalItems: total, totalPages });
			})
			.catch((err) => {
				if (err.name !== 'AbortError') {
					setError(err.message || 'Failed to load charts.');
					setCharts([]);
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			});

		return () => controller.abort();
	}, [view, refreshToken]);

	return { charts, paginationInfo, isLoading, error, refresh };
};

export default useCharts;
