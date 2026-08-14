/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
/* eslint-disable import/no-extraneous-dependencies */
/**
 * ChartWizard — the container-agnostic Add-New-Chart flow (PRC-527).
 *
 * Holds all wizard state + step routing. Full flow: Type → Pattern → Data →
 * Configure → Create. Inline mode (classic controller placeholder) stops after
 * template selection and inserts the pattern content immediately.
 * It renders no shell of its own — CreateNewChartModal hosts it at
 * `layout="compact"` for synced-chart insert and the classic controller
 * placeholder. Chart CPT creation uses ChartCptWizardShell instead.
 *
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { parse, serialize } from '@wordpress/blocks';
import { Notice, Flex, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal Dependencies
 */
import {
	SelectChartStep,
	WizardEditorShell,
	useChartPatterns,
} from '../../../../src/shared/select-chart-step';
import {
	buildChartEditUrl,
	CHART_FLOW_CREATE,
} from '../../../../src/shared/chart-flow-handoff';
import AICreateStep from './ai-create-step';
import ConfigurePreviewStep from './configure-preview-step';
import DataStep from './data-step';
import PchImportStep from './pch-import';
import {
	WizardActionBar,
	TemplateResetWarning,
	WizardStepProgress,
	WizardStepExplainer,
	CREATE_WIZARD_STEPS,
	canReachCreateWizardStep,
	getActiveWizardStep,
	getContinueToNextStepLabel,
} from './wizard-chrome';
import {
	deriveChartAttributesOnNext,
	getChartPostTitle,
} from '../utils/configure-preview/chart-attributes';
import {
	assembleChartBlocks,
	extractChartAttributes,
	extractTableBlock,
} from '../utils/configure-preview/chart-blocks';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEditUrl(postId) {
	return buildChartEditUrl(postId, { chartFlow: CHART_FLOW_CREATE });
}

async function createChartPost(title, content) {
	return apiFetch({
		path: '/wp/v2/chart',
		method: 'POST',
		data: {
			title: title || __('Untitled Chart', 'prc-chart-builder'),
			content,
			status: 'draft',
		},
	});
}

// ── Wizard ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {string}   [props.mode]          'create-post' (admin) or 'inline' (block editor).
 * @param {string}   [props.layout]        'full' or 'compact' spatial treatment.
 * @param {Function} [props.afterCreate]   `(postId, chart) => Promise<void>` for inline insert.
 * @param {Function} [props.onExit]        Called after an inline create to dismiss the host.
 * @param {Function} [props.onTitleChange] Receives the contextual step title (for the modal header).
 */
export default function ChartWizard({
	mode = 'create-post',
	layout: wizardLayout = mode === 'inline' ? 'compact' : 'full',
	afterCreate,
	onExit,
	onTitleChange,
}) {
	const [selectedType, setSelectedType] = useState(null);
	const [selectedPattern, setSelectedPattern] = useState(null);
	const [isPchImport, setIsPchImport] = useState(false);
	const [wizardStep, setWizardStep] = useState('select');
	const [tableBlocks, setTableBlocks] = useState([]);
	const [chartAttributes, setChartAttributes] = useState(null);
	const [previewKey, setPreviewKey] = useState(0);
	const [isCreating, setIsCreating] = useState(false);
	const [createError, setCreateError] = useState(null);
	const [showTemplateResetWarning, setShowTemplateResetWarning] =
		useState(false);

	// Tab state for Step 2 — 'pattern' or 'ai'. Only shown when aiEnabled.
	const aiEnabled = !!window?.prcChartBuilderLibrary?.aiEnabled;
	const [activeTab, setActiveTab] = useState('pattern');
	const isInlineMode = mode === 'inline';

	const { patterns, patternsLoading, patternsError } =
		useChartPatterns(selectedType);

	const commitSelectedPattern = useCallback((pattern) => {
		if (!pattern) {
			return;
		}
		const patternBlocks = parse(pattern.content, {
			__unstableSkipMigrationLogs: true,
		});
		const tableBlock = extractTableBlock(patternBlocks);
		const baseAttributes = extractChartAttributes(patternBlocks);
		setTableBlocks(tableBlock ? [tableBlock] : []);
		// Seed the live preview immediately on entering the Data step (rather
		// than deferring to "Next") so the chart shows alongside the table.
		setChartAttributes(
			deriveChartAttributesOnNext({
				tableAttributes: tableBlock?.attributes ?? {},
				currentChartAttributes: null,
				baseAttributes,
			})
		);
		setCreateError(null);
		setIsCreating(false);
		setWizardStep('data');
	}, []);

	// Keep the Data-step preview in sync with table edits: debounce-refresh the
	// chart attributes from the current table (preserving any curated edits).
	useEffect(() => {
		if (wizardStep !== 'data') {
			return undefined;
		}
		const tableAttributes = tableBlocks[0]?.attributes ?? {};
		const handle = setTimeout(() => {
			setChartAttributes((prev) =>
				prev
					? deriveChartAttributesOnNext({
							tableAttributes,
							currentChartAttributes: prev,
							baseAttributes: prev,
						})
					: prev
			);
		}, 250);
		return () => clearTimeout(handle);
	}, [tableBlocks, wizardStep]);

	const handleChartCreated = useCallback(
		async (postId, chart) => {
			if (afterCreate) {
				await afterCreate(postId, chart);
				onExit?.();
			} else {
				window.location.href = getEditUrl(postId);
			}
		},
		[afterCreate, onExit]
	);

	const handleSelectType = useCallback((term) => {
		setSelectedType(term);
		setSelectedPattern(null);
		setActiveTab('pattern');
	}, []);

	const handleSelectPattern = useCallback(
		async (pattern) => {
			if (!isInlineMode) {
				setSelectedPattern(pattern);
				return;
			}

			setIsCreating(true);
			setCreateError(null);

			try {
				const patternBlocks = parse(pattern.content, {
					__unstableSkipMigrationLogs: true,
				});
				const baseAttributes = extractChartAttributes(patternBlocks);
				const postTitle = getChartPostTitle(baseAttributes);

				await handleChartCreated(null, {
					content: pattern.content,
					title: postTitle,
				});
			} catch (err) {
				setCreateError(
					err?.message ||
						__('Failed to insert chart.', 'prc-chart-builder')
				);
				setIsCreating(false);
			}
		},
		[isInlineMode, handleChartCreated]
	);

	const handleBackToTypes = useCallback(() => {
		setSelectedType(null);
		setSelectedPattern(null);
		setActiveTab('pattern');
		setIsPchImport(false);
	}, []);

	const resetToPatterns = useCallback(() => {
		setSelectedPattern(null);
		setWizardStep('select');
		setChartAttributes(null);
		setCreateError(null);
	}, []);

	const handleBackToPatterns = useCallback(() => {
		setShowTemplateResetWarning(true);
	}, []);

	const confirmTemplateReset = useCallback(() => {
		setShowTemplateResetWarning(false);
		resetToPatterns();
	}, [resetToPatterns]);

	const handleDataNext = useCallback(() => {
		// Flush the latest table edits into the preview attributes in case a
		// debounced refresh is still pending, then advance.
		const tableAttributes = tableBlocks[0]?.attributes ?? {};
		setChartAttributes((previous) =>
			previous
				? deriveChartAttributesOnNext({
						tableAttributes,
						currentChartAttributes: previous,
						baseAttributes: previous,
					})
				: previous
		);
		setPreviewKey(Date.now());
		setWizardStep('configure');
	}, [tableBlocks]);

	const handleConfigureBack = useCallback(() => {
		setWizardStep('data');
		setCreateError(null);
	}, []);

	const handleConfigureCreate = useCallback(async () => {
		if (!selectedPattern || !chartAttributes) {
			return;
		}

		setIsCreating(true);
		setCreateError(null);

		try {
			const patternBlocks = parse(selectedPattern.content, {
				__unstableSkipMigrationLogs: true,
			});
			const assembled = assembleChartBlocks(patternBlocks, {
				tableBlock: tableBlocks[0],
				chartAttributes,
			});
			const content = serialize(assembled);
			// The post title is drawn from the chart's own metadata title —
			// there is no separate title field.
			const postTitle = getChartPostTitle(chartAttributes);

			if (mode === 'inline') {
				await handleChartCreated(null, {
					content,
					title: postTitle,
				});
			} else {
				const chart = await createChartPost(postTitle, content);
				await handleChartCreated(chart.id, chart);
			}
		} catch (err) {
			setCreateError(
				err?.message ||
					(mode === 'inline'
						? __('Failed to insert chart.', 'prc-chart-builder')
						: __('Failed to create chart.', 'prc-chart-builder'))
			);
			setIsCreating(false);
		}
	}, [
		selectedPattern,
		chartAttributes,
		tableBlocks,
		mode,
		handleChartCreated,
	]);

	/**
	 * Called by AICreateStep when the user accepts the generated content.
	 * Synthesize a pattern-like object and advance to the Data step.
	 */
	const handleAIAccept = useCallback(
		({ content, csvText }) => {
			const pattern = {
				name: '__ai_generated__',
				title: __('AI Generated', 'prc-chart-builder'),
				content,
				csvText: csvText || '',
			};
			setSelectedPattern(pattern);
			commitSelectedPattern(pattern);
		},
		[commitSelectedPattern]
	);

	const renderAI = useCallback(
		({ chartType, onBack, onAccept }) => (
			<AICreateStep
				chartType={chartType}
				onBack={onBack}
				onAccept={onAccept}
			/>
		),
		[]
	);

	// Classic controller inline flow: type + template only (no data/configure).
	const showTemplateOnlyPicker = isInlineMode && !isPchImport;

	// Full-layout chrome: top step progress + bottom action bar own navigation
	// (steps suppress their inline buttons at `full`).
	const isFull = wizardLayout === 'full';
	const activeStep = getActiveWizardStep({ selectedPattern, wizardStep });

	// Contextual title for the host header (e.g. the Modal title bar).
	const wizardTitle = useMemo(() => {
		if (isPchImport) {
			return __('Import from pewplots', 'prc-chart-builder');
		}
		if (activeStep === 1 && selectedType) {
			return activeTab === 'ai'
				? `${selectedType.label} — ${__('Chart Wizard (Experimental)', 'prc-chart-builder')}`
				: `${selectedType.label} — ${__('Choose a Pattern', 'prc-chart-builder')}`;
		}
		if (selectedPattern && wizardStep === 'configure') {
			return __('Configure & Preview', 'prc-chart-builder');
		}
		if (selectedPattern && wizardStep === 'data') {
			return __('Add Chart Data', 'prc-chart-builder');
		}
		return isInlineMode
			? __('Add Chart', 'prc-chart-builder')
			: __('Add New Chart', 'prc-chart-builder');
	}, [
		isPchImport,
		selectedType,
		selectedPattern,
		activeTab,
		wizardStep,
		isInlineMode,
		activeStep,
	]);

	useEffect(() => {
		onTitleChange?.(wizardTitle);
	}, [wizardTitle, onTitleChange]);

	let actionBack = null;
	let actionBackLabel;
	let actionPrimary = null;
	if (activeStep === 1) {
		if (selectedType || isPchImport) {
			actionBack = handleBackToTypes;
			actionBackLabel = __('Chart types', 'prc-chart-builder');
		}
		if (selectedPattern && !isInlineMode) {
			actionPrimary = {
				label: getContinueToNextStepLabel(
					activeStep,
					CREATE_WIZARD_STEPS
				),
				onClick: () => commitSelectedPattern(selectedPattern),
			};
		}
		// On the type grid the host header provides the "Back to Library" exit.
	} else if (activeStep === 2) {
		actionBack = handleBackToPatterns;
		actionPrimary = {
			label: getContinueToNextStepLabel(activeStep, CREATE_WIZARD_STEPS),
			onClick: handleDataNext,
			disabled: !canReachCreateWizardStep(2, selectedPattern),
		};
	} else if (activeStep === 3) {
		actionBack = handleConfigureBack;
		actionPrimary = {
			label: isInlineMode
				? __('Insert Chart', 'prc-chart-builder')
				: __('Create Chart', 'prc-chart-builder'),
			onClick: handleConfigureCreate,
			busy: isCreating,
			busyLabel: isInlineMode
				? __('Inserting…', 'prc-chart-builder')
				: __('Creating…', 'prc-chart-builder'),
			disabled: !chartAttributes,
		};
	}

	return (
		<WizardEditorShell>
			<div className="prc-chart-wizard" data-layout={wizardLayout}>
				{showTemplateResetWarning && (
					<TemplateResetWarning
						onCancel={() => setShowTemplateResetWarning(false)}
						onConfirm={confirmTemplateReset}
					/>
				)}
				{isFull && (
					<>
						<WizardStepProgress
							activeStep={activeStep}
							steps={CREATE_WIZARD_STEPS}
						/>
						<WizardStepExplainer
							activeStep={activeStep}
							steps={CREATE_WIZARD_STEPS}
						/>
					</>
				)}

				{patternsError &&
					showTemplateOnlyPicker &&
					!selectedPattern && (
						<Notice
							status="error"
							isDismissible={false}
							className="prc-chart-modal__pattern-error"
						>
							{__(
								"Couldn't load the pattern library. Saved patterns won't appear until this is resolved — see the browser console for the underlying error.",
								'prc-chart-builder'
							)}
						</Notice>
					)}

				{createError && showTemplateOnlyPicker && (
					<Notice status="error" isDismissible={false}>
						{createError}
					</Notice>
				)}

				{isPchImport && <PchImportStep onBack={handleBackToTypes} />}

				{showTemplateOnlyPicker && isCreating && (
					<Flex justify="center" style={{ padding: '32px' }}>
						<Spinner />
					</Flex>
				)}

				{showTemplateOnlyPicker && !isCreating && !selectedPattern && (
					<SelectChartStep
						layout={wizardLayout}
						selectedType={selectedType}
						onSelectType={handleSelectType}
						patterns={patterns}
						patternsLoading={patternsLoading}
						onSelectPattern={handleSelectPattern}
						selectedPattern={selectedPattern}
						onBackToTypes={handleBackToTypes}
					/>
				)}

				{!isInlineMode && activeStep === 1 && !isPchImport && (
					<SelectChartStep
						layout={wizardLayout}
						selectedType={selectedType}
						onSelectType={handleSelectType}
						onImportPch={() => setIsPchImport(true)}
						patterns={patterns}
						patternsLoading={patternsLoading}
						onSelectPattern={handleSelectPattern}
						selectedPattern={selectedPattern}
						onBackToTypes={handleBackToTypes}
						aiEnabled={aiEnabled}
						activeTab={activeTab}
						onChangeTab={setActiveTab}
						onAIAccept={handleAIAccept}
						renderAI={renderAI}
						primaryAction={actionPrimary}
					/>
				)}

				{selectedType && selectedPattern && wizardStep === 'data' && (
					<DataStep
						tableBlocks={tableBlocks}
						onTableChange={setTableBlocks}
						onBack={handleBackToPatterns}
						onNext={handleDataNext}
						layout={wizardLayout}
						chartAttributes={chartAttributes}
						previewKey={previewKey}
					/>
				)}

				{selectedType &&
					selectedPattern &&
					wizardStep === 'configure' &&
					chartAttributes && (
						<ConfigurePreviewStep
							chartAttributes={chartAttributes}
							onChartAttributesChange={setChartAttributes}
							previewKey={previewKey}
							onBack={handleConfigureBack}
							onCreate={handleConfigureCreate}
							isCreating={isCreating}
							createError={createError}
							mode={mode}
							layout={wizardLayout}
						/>
					)}

				{isFull && (
					<>
						{createError && activeStep === 3 && (
							<Notice status="error" isDismissible={false}>
								{createError}
							</Notice>
						)}
						<WizardActionBar
							activeStep={activeStep}
							steps={CREATE_WIZARD_STEPS}
							onBack={actionBack}
							backLabel={actionBackLabel}
							primary={actionPrimary}
						/>
					</>
				)}
			</div>
		</WizardEditorShell>
	);
}
