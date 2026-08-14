/**
 * Create → chart CPT editor handoff (PRC-527 Phase 0/1).
 *
 * After the admin wizard creates a draft, it redirects to post.php with
 * `chart_flow=create`. The editor consumes that one-shot flag (strips it from
 * the URL), stashes it in sessionStorage for the Controller wizard host, and
 * can show Step-4 continuity chrome.
 */

export const CHART_FLOW_QUERY_PARAM = 'chart_flow';
export const CHART_FLOW_CREATE = 'create';
export const CHART_FLOW_SESSION_KEY = 'prcChartFlow';

/**
 * Build the chart CPT edit URL, optionally tagging a create handoff.
 *
 * @param {number|string} postId
 * @param {Object}        [options]
 * @param {string|null}   [options.chartFlow] e.g. `'create'`.
 * @param {string}        [options.href]      Base href (defaults to location).
 * @return {string} Absolute edit URL.
 */
export function buildChartEditUrl(
	postId,
	{
		chartFlow = null,
		href = typeof window !== 'undefined'
			? window.location.href
			: 'https://example.com/wp-admin/',
	} = {}
) {
	const url = new URL(href);
	url.pathname = url.pathname.replace(/\/wp-admin\/.*/, '/wp-admin/post.php');
	url.search = '';
	url.searchParams.set('post', String(postId));
	url.searchParams.set('action', 'edit');
	if (chartFlow) {
		url.searchParams.set(CHART_FLOW_QUERY_PARAM, chartFlow);
	}
	return url.toString();
}

/**
 * @param {string} [search] `location.search` including `?`.
 * @return {string|null} The chart_flow value, if any.
 */
export function peekChartFlowFromUrl(search = '') {
	return new URLSearchParams(search).get(CHART_FLOW_QUERY_PARAM);
}

/**
 * One-shot consume of `chart_flow=create`: strip from the address bar and
 * persist to sessionStorage for the Controller host.
 *
 * @param {Object}        [deps] Injectable deps for unit tests.
 * @param {string}        [deps.search]
 * @param {Function|null} [deps.replaceState]
 * @param {Storage|null}  [deps.sessionStorage]
 * @param {Pick<Location,'pathname'|'hash'>|null} [deps.location]
 * @return {boolean} True when a create handoff was consumed.
 */
export function consumeChartFlowCreate({
	search = typeof window !== 'undefined' ? window.location.search : '',
	replaceState = typeof window !== 'undefined'
		? window.history.replaceState.bind(window.history)
		: null,
	sessionStorage = typeof window !== 'undefined'
		? window.sessionStorage
		: null,
	location = typeof window !== 'undefined' ? window.location : null,
} = {}) {
	const params = new URLSearchParams(search);
	if (params.get(CHART_FLOW_QUERY_PARAM) !== CHART_FLOW_CREATE) {
		return false;
	}

	params.delete(CHART_FLOW_QUERY_PARAM);

	if (replaceState && location) {
		const query = params.toString();
		const next = `${location.pathname}${query ? `?${query}` : ''}${location.hash || ''}`;
		replaceState({}, '', next);
	}

	sessionStorage?.setItem(CHART_FLOW_SESSION_KEY, CHART_FLOW_CREATE);
	return true;
}

/**
 * @param {Storage|null} [sessionStorage]
 * @return {string|null}
 */
export function peekChartFlowSession(
	sessionStorage = typeof window !== 'undefined'
		? window.sessionStorage
		: null
) {
	return sessionStorage?.getItem(CHART_FLOW_SESSION_KEY) ?? null;
}

/**
 * @param {Storage|null} [sessionStorage]
 */
export function clearChartFlowSession(
	sessionStorage = typeof window !== 'undefined'
		? window.sessionStorage
		: null
) {
	sessionStorage?.removeItem(CHART_FLOW_SESSION_KEY);
}

/**
 * Whether the Controller host should land on Style Chart design mode (step 3)
 * after create. Does not clear the session flag — call {@link clearChartFlowSession}
 * once the host has applied the landing step.
 *
 * @param {Storage|null} [sessionStorage]
 * @return {boolean}
 */
export function shouldLandOnRefine(
	sessionStorage = typeof window !== 'undefined'
		? window.sessionStorage
		: null
) {
	return peekChartFlowSession(sessionStorage) === CHART_FLOW_CREATE;
}
