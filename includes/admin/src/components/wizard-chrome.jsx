/**
 * Re-export shared wizard chrome for admin SPA import stability.
 *
 * Canonical source: `src/shared/wizard-chrome`.
 */
export {
	CREATE_WIZARD_STEPS,
	WIZARD_STEPS,
	getActiveWizardStep,
	canReachCreateWizardStep,
	canReachCptWizardStep,
	getContinueToNextStepLabel,
	getSelectChartPanel,
	getWizardStepExplainer,
	CHART_STYLE_GUIDE_URL,
	TemplateResetWarning,
	WizardStepProgress,
	WizardStepExplainer,
	WizardActionBar,
} from '../../../../src/shared/wizard-chrome';
