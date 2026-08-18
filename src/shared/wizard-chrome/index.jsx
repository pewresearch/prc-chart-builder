/**
 * Shared full-layout chrome for the chart wizard (PRC-527).
 *
 * Used by the admin Chart Library SPA and (Phase 2+) the chart CPT Controller
 * Edit host. A top step-progress indicator and a bottom action bar own
 * navigation when the wizard runs at `layout="full"`. In `compact` (modal)
 * mode the steps keep their own inline buttons and this chrome is not rendered.
 */
import { Button, ExternalLink, Flex, Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft } from '@wordpress/icons';

export { shouldConfirmTemplateReset } from './template-reset-navigation';

/** Three-step create flow (admin Chart Library SPA). */
export const CREATE_WIZARD_STEPS = [
	'Select Template',
	'Add Data',
	'Style Chart',
];

/** Four-step flow including Preview Chart (chart CPT Controller host). */
export const WIZARD_STEPS = [...CREATE_WIZARD_STEPS, 'Preview Chart'];

/**
 * Style-guide URL for visualization selection help (Select Template step).
 */
export const CHART_STYLE_GUIDE_URL =
	'https://pew.sharepoint.com/sites/NET_PRC_Research/Shared%20Documents/Design_Style_Book_2025.pdf#page=34';

/**
 * Explainer copy for each wizard step (1-based).
 *
 * @param {number} activeStep Active wizard step number.
 * @return {{ text: string, linkUrl?: string, linkLabel?: string }|null} Copy for the step, or null.
 */
export function getWizardStepExplainer(activeStep) {
	switch (activeStep) {
		case 1:
			return {
				text: __(
					'Pick a chart type, then choose a blank canvas or a saved template to start from. Templates carry starter data and common settings so you can move faster.',
					'prc-chart-builder'
				),
				linkUrl: CHART_STYLE_GUIDE_URL,
				linkLabel: __(
					'Need help choosing a visualization? Reference the style guide.',
					'prc-chart-builder'
				),
			};
		case 2:
			return {
				text: __(
					'Add or edit your data in the table — drag and drop a spreadsheet, paste values, or type directly. The chart preview updates as you go.',
					'prc-chart-builder'
				),
			};
		case 3:
			return {
				text: __(
					'Style the chart across Appearance, Data, Text, and chart-type tabs. Drag labels and annotations on the live preview, or enter design mode for the full inspector.',
					'prc-chart-builder'
				),
			};
		case 4:
			return {
				text: __(
					'Preview how the chart reads at different screen sizes, in light or dark mode, and with color vision simulation. Viewport, color mode, and color vision only affect the preview panel.',
					'prc-chart-builder'
				),
			};
		default:
			return null;
	}
}
/**
 * Derive the active 1-based top-level step from wizard state.
 *
 * @param {Object}      state
 * @param {Object|null} state.selectedPattern The chosen pattern, if any.
 * @param {string}      [state.wizardStep]    'select' | 'data' | 'configure' | 'refine'.
 * @return {number} 1–4 for Select Template / Add Data / Style Chart / Preview Chart.
 */
export function getActiveWizardStep({ selectedPattern, wizardStep }) {
	if (selectedPattern && wizardStep === 'refine') {
		return 4;
	}
	if (selectedPattern && wizardStep === 'configure') {
		return 3;
	}
	if (selectedPattern && wizardStep === 'data') {
		return 2;
	}
	// 'select' (or unset): stay on step 1 even when a template is highlighted.
	return 1;
}

/**
 * Whether the admin create flow may advance to `targetStep` (1-based).
 *
 * @param {number}      targetStep
 * @param {Object|null} selectedPattern
 * @return {boolean} Whether navigation to the step is allowed.
 */
export function canReachCreateWizardStep(targetStep, selectedPattern) {
	if (targetStep <= 1) {
		return true;
	}
	return Boolean(selectedPattern);
}

/**
 * Whether the chart CPT wizard may navigate to `targetStep` (1-based).
 *
 * @param {number}      targetStep
 * @param {Object}      state
 * @param {boolean}     state.hasTemplate     A pattern/template was applied.
 * @param {Object|null} state.chartAttributes Live chart block attributes.
 * @return {boolean} Whether navigation to the step is allowed.
 */
export function canReachCptWizardStep(
	targetStep,
	{ hasTemplate, chartAttributes }
) {
	if (targetStep <= 1) {
		return true;
	}
	if (!hasTemplate) {
		return false;
	}
	if (targetStep === 2) {
		return true;
	}
	return Boolean(chartAttributes);
}

/**
 * Primary action label pointing at the next wizard step.
 *
 * @param {number}   activeStep Active 1-based step.
 * @param {string[]} [steps]    Step labels (defaults to {@link WIZARD_STEPS}).
 * @return {string|null} Localized "Continue to {Next Step}" label, or null when
 *   there is no next step.
 */
export function getContinueToNextStepLabel(activeStep, steps = WIZARD_STEPS) {
	const nextLabel = steps[activeStep];
	if (!nextLabel) {
		return null;
	}
	return sprintf(
		/* translators: %s: next wizard step label (e.g. "Add Data"). */
		__('Continue to %s', 'prc-chart-builder'),
		nextLabel
	);
}

/**
 * Whether the block inspector should be visible for a wizard step.
 *
 * @param {number}  activeStep   Active 1-based step.
 * @param {boolean} isDesignMode Style Chart design mode (step 3 only).
 * @return {boolean} True only when design mode is active on Style Chart.
 */
export function shouldShowBlockInspector(activeStep, isDesignMode = false) {
	return activeStep === 3 && isDesignMode;
}

/**
 * Decide what the "Select Chart" step's template area should show.
 *
 * @param {Object}      state
 * @param {Object|null} state.selectedType The chosen chart type, if any.
 * @param {string}      [state.activeTab]  'pattern' | 'ai'.
 * @return {'prompt'|'ai'|'patterns'} 'prompt' until a type is picked, then the
 *   active tab's content ('ai' or the pattern grid).
 */
export function getSelectChartPanel({ selectedType, activeTab }) {
	if (!selectedType) {
		return 'prompt';
	}
	return activeTab === 'ai' ? 'ai' : 'patterns';
}

/**
 * Top step-progress indicator.
 *
 * @param {Object}        props
 * @param {number}        props.activeStep      Active 1-based step.
 * @param {Function|null} [props.onStepSelect]  Optional step click handler.
 * @param {string[]}      [props.steps]         Step labels.
 * @param {Function|null} [props.canSelectStep] Gate for step clicks.
 * @return {import('react').ReactNode} The indicator.
 */
export function WizardStepProgress({
	activeStep,
	onStepSelect = null,
	steps = WIZARD_STEPS,
	canSelectStep = null,
}) {
	return (
		<ol className="prc-chart-wizard__steps">
			{steps.map((label, index) => {
				const step = index + 1;
				let state = 'upcoming';
				if (step < activeStep) {
					state = 'complete';
				} else if (step === activeStep) {
					state = 'active';
				}
				const isSelectable =
					typeof onStepSelect === 'function' &&
					step !== activeStep &&
					(typeof canSelectStep !== 'function' ||
						canSelectStep(step));

				return (
					<li
						key={label}
						className={`prc-chart-wizard__step is-${state}${
							isSelectable ? ' is-selectable' : ''
						}`}
						aria-current={step === activeStep ? 'step' : undefined}
					>
						{isSelectable ? (
							<button
								type="button"
								className="prc-chart-wizard__step-button"
								onClick={() => onStepSelect(step)}
							>
								<span className="prc-chart-wizard__step-num">
									{step}
								</span>
								<span className="prc-chart-wizard__step-label">
									{label}
								</span>
							</button>
						) : (
							<>
								<span className="prc-chart-wizard__step-num">
									{step}
								</span>
								<span className="prc-chart-wizard__step-label">
									{label}
								</span>
							</>
						)}
					</li>
				);
			})}
		</ol>
	);
}

/**
 * Inline confirmation shown before returning to template selection.
 *
 * @param {Object}   props
 * @param {Function} props.onCancel  Keep the current chart and dismiss.
 * @param {Function} props.onConfirm Return to template selection.
 * @return {import('react').ReactNode} Warning banner.
 */
export function TemplateResetWarning({ onCancel, onConfirm }) {
	return (
		<div className="prc-chart-wizard__template-reset-warning" role="alert">
			<p>
				{__(
					'Changing the chart template will replace your current data and chart settings.',
					'prc-chart-builder'
				)}
			</p>
			<Flex gap={2}>
				<Button variant="secondary" onClick={onCancel}>
					{__('Keep current chart', 'prc-chart-builder')}
				</Button>
				<Button variant="primary" onClick={onConfirm}>
					{__('Change template', 'prc-chart-builder')}
				</Button>
			</Flex>
		</div>
	);
}

/**
 * Short instructional copy under the step progress indicator.
 *
 * @param {Object} props
 * @param {number} props.activeStep Active 1-based step.
 * @return {import('react').ReactNode} Explainer, or null when unknown.
 */
export function WizardStepExplainer({ activeStep }) {
	const explainer = getWizardStepExplainer(activeStep);
	if (!explainer) {
		return null;
	}

	return (
		<div className="prc-chart-wizard__explainer">
			<p className="prc-chart-wizard__explainer-text">{explainer.text}</p>
			{explainer.linkUrl && explainer.linkLabel ? (
				<p className="prc-chart-wizard__explainer-link">
					<ExternalLink href={explainer.linkUrl}>
						{explainer.linkLabel}
					</ExternalLink>
				</p>
			) : null}
		</div>
	);
}

/**
 * Bottom action bar: Back (left), "Step N of M" (center), primary (right).
 *
 * @param {Object}      props
 * @param {number}      props.activeStep  1-based active step.
 * @param {Function}    [props.onBack]    Back handler (omit to hide).
 * @param {string}      [props.backLabel] Back button label.
 * @param {Object|null} [props.primary]   `{ label, onClick, busy, busyLabel, disabled }`.
 * @param {string[]}    [props.steps]     Step labels (defaults to {@link WIZARD_STEPS}).
 * @return {import('react').ReactNode} The action bar.
 */
export function WizardActionBar({
	activeStep,
	onBack,
	backLabel,
	primary = null,
	steps = WIZARD_STEPS,
}) {
	return (
		<div className="prc-chart-wizard__action-bar">
			<div className="prc-chart-wizard__action-bar-side">
				{onBack && (
					<Button
						variant="secondary"
						onClick={onBack}
						icon={chevronLeft}
					>
						{backLabel || __('Back', 'prc-chart-builder')}
					</Button>
				)}
			</div>
			<div className="prc-chart-wizard__action-bar-center">
				{sprintf(
					/* translators: 1: current step number, 2: total steps. */
					__('Step %1$d of %2$d', 'prc-chart-builder'),
					activeStep,
					steps.length
				)}
			</div>
			<div className="prc-chart-wizard__action-bar-side prc-chart-wizard__action-bar-side--end">
				{primary && (
					<Button
						variant="primary"
						onClick={primary.onClick}
						disabled={primary.disabled || primary.busy}
					>
						{primary.busy ? (
							<Flex gap={2} justify="center">
								<Spinner />
								{primary.busyLabel}
							</Flex>
						) : (
							primary.label
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
