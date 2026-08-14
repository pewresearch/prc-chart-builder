/**
 * Whether navigation should require confirmation because a new template can
 * replace data and chart settings created in later steps.
 *
 * @param {number} currentStep Active 1-based step.
 * @param {number} targetStep  Requested 1-based step.
 * @return {boolean} Whether to show the template reset warning.
 */
export function shouldConfirmTemplateReset(currentStep, targetStep) {
	return currentStep > 1 && targetStep === 1;
}
