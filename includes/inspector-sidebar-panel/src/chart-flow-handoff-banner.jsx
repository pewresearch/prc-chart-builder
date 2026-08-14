/**
 * Bootstrap create → chart CPT handoff: consume `?chart_flow=create` once.
 *
 * Continuity chrome lives on the Controller wizard shell; this only strips the
 * query flag and seeds sessionStorage for Refine landing.
 */
import { useEffect } from '@wordpress/element';

import { consumeChartFlowCreate } from '../../../src/shared/chart-flow-handoff';

/**
 * @return {null}
 */
export function ChartFlowHandoffBanner() {
	useEffect(() => {
		consumeChartFlowCreate();
	}, []);

	return null;
}
