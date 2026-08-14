import { createContext, useContext } from '@wordpress/element';

/**
 * Bridges chart block edit actions (e.g. add annotation) to wizard chrome
 * without storing callbacks in Redux.
 */
export const WizardChartActionsContext = createContext(null);

/**
 * @return {import('./wizard-chart-actions-context').WizardChartActions|null}
 */
export function useWizardChartActions() {
	return useContext(WizardChartActionsContext);
}

/**
 * @typedef {Object} WizardChartActions
 * @property {Function} registerAddAnnotation Register `(handler) => void`.
 * @property {Function} unregisterAddAnnotation Clear the registered handler.
 * @property {Function} invokeAddAnnotation    Call the registered handler.
 */
