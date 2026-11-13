/**
 * Chart CPT wizard host — full 4-step shell inside Controller Edit.
 *
 * Configure (3) = curated controls + lean preview, with optional design mode
 * (full canvas + block inspector). Preview (4) = interactive canvas with
 * viewport / appearance preview chrome; inspector stays closed.
 */
import {
	ChartBuilderTextWrapper,
	ChartBuilderWrapper,
} from '@prc/charting-library';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	Notice,
	Spinner,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import { buildPreviewChartData } from '../chart/utils/build-preview-chart-data';
import getConfig from '../chart/utils/get-config';
import { prepareChartAttributesForPreview } from '../chart/utils/prepare-chart-attributes-for-preview';
import {
	clearChartFlowSession,
	consumeChartFlowCreate,
	shouldLandOnRefine,
} from '../shared/chart-flow-handoff';
import {
	FreeformPreviewUnavailable,
	isFreeformChartPreview,
} from '../shared/chart-preview';
import CuratedControls from '../shared/curated-controls';
import CsvDataInput from '../shared/data-step/csv-data-input';
import { SelectChartStep, useChartPatterns } from '../shared/select-chart-step';
import { applyUploadedBarChartHeight } from '../shared/utils/bar-chart-height';
import { bindBarChartHeightToCsvImport } from '../shared/utils/bind-bar-chart-height-to-csv-import';
import { csvToTableAttributes } from '../shared/utils/csv';
import {
	TemplateResetWarning,
	WIZARD_STEPS,
	WizardActionBar,
	WizardStepExplainer,
	WizardStepProgress,
	canReachCptWizardStep,
	getContinueToNextStepLabel,
	shouldConfirmTemplateReset,
	shouldShowBlockInspector,
} from '../shared/wizard-chrome';
import ChartViewLink from '../shared/wizard-chrome/chart-view-link';
import {
	DEFAULT_PREVIEW_APPEARANCE,
	previewPaneProps,
} from '../shared/wizard-chrome/preview-appearance';
import PreviewToolbar from '../shared/wizard-chrome/preview-toolbar';
import PreviewViewportToggle from '../shared/wizard-chrome/preview-viewport-toggle';
import { ZOOM_DEFAULT } from '../shared/wizard-chrome/preview-zoom';
import PreviewZoomControl from '../shared/wizard-chrome/preview-zoom-control';
import WizardControlTip from '../shared/wizard-ui/wizard-control-tip';
import {
	PREVIEW_CARD_PADDING,
	getEffectivePreviewViewport,
	getPreviewViewportForWidth,
	getPreviewViewportStyle,
	getPreviewWidthRange,
} from '../shared/wizard-chrome/preview-viewports';
import PreviewVisionFilters from '../shared/wizard-chrome/preview-vision-filters';
import { WorkflowStatusPaneSlot } from '../shared/wizard-chrome/workflow-status-pane-slot';
import useWizardSplit from '../shared/wizard-chrome/use-wizard-split';
import { WizardChartActionsContext } from '../shared/wizard-chrome/wizard-chart-actions-context';
import { getWizardScreens } from '../shared/wizard-screens';
import controllerStore from './store';
import useKeepCaretInsideBlock from './use-keep-caret-inside-block';
import { applyControllerTemplateContent } from './utils/apply-controller-template';
import { applyChartContent } from './utils/apply-chart-content';
import useHideBlockToolbar from './use-hide-block-toolbar';

/**
 * Resolve a chart type slug to a library term (`{ slug, label }`).
 *
 * @param {string|undefined} slug
 * @return {Object|null} Matching chart type term, or null without a slug.
 */
function termFromChartType(slug) {
	if (!slug) {
		return null;
	}
	const terms = window?.prcChartBuilderLibrary?.chartTypeTerms || [];
	return terms.find((t) => t.slug === slug) || { slug, label: slug };
}

/**
 * @param {number} step 1-based step number.
 * @return {'select'|'data'|'configure'|'preview'} Wizard step key.
 */
function stepKey(step) {
	switch (step) {
		case 1:
			return 'select';
		case 2:
			return 'data';
		case 3:
			return 'configure';
		case 4:
			return 'preview';
		default:
			return 'preview';
	}
}

/**
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.refineContent           Existing controller
 *                                                                  canvas (inners + view-mode) shown on Data / design mode / Preview.
 * @param {Object|null}               props.chartAttributes         Child chart block attributes.
 * @param {string|null}               props.chartClientId           Child chart block clientId.
 * @param {Function}                  props.onChartAttributesChange `(nextAttrs) => void`.
 * @param {string}                    [props.chartType]             Controller chartType for Select step.
 * @param {string}                    props.clientId                Controller block clientId.
 * @param {string}                    [props.controllerId]          Controller attribute id.
 * @param {Function}                  props.setAttributes           Controller setAttributes().
 * @param {Function}                  props.replaceInnerBlocks      block editor replaceInnerBlocks().
 * @param {string|null}               [props.tableClientId]         prc-block/table clientId for CSV upload.
 * @param {Function}                  [props.onEnterDataStep]       Called when navigating to Set Data.
 * @param {Function}                  [props.onEnterDesignMode]     Called when entering design mode.
 * @param {Function}                  [props.onEnterPreviewStep]    Called when navigating to Preview.
 */
export default function ChartCptWizardShell({
	refineContent,
	chartAttributes,
	chartClientId,
	onChartAttributesChange,
	chartType,
	clientId,
	controllerId = '',
	setAttributes,
	replaceInnerBlocks,
	tableClientId = null,
	onEnterDataStep,
	onEnterDesignMode,
	onEnterPreviewStep,
}) {
	const [activeStep, setActiveStep] = useState(() => {
		consumeChartFlowCreate();
		if (shouldLandOnRefine()) {
			return 3;
		}
		return chartType ? 4 : 1;
	});
	const [isDesignMode, setIsDesignMode] = useState(() =>
		shouldLandOnRefine()
	);

	// Advanced Settings (design mode on Style Chart) restores block toolbars
	// so copy/paste styles, chart/data switch, and core block controls work.
	const exposeBlockToolbar = activeStep === 3 && isDesignMode;
	useHideBlockToolbar(clientId, exposeBlockToolbar);

	const [appearance, setAppearance] = useState(DEFAULT_PREVIEW_APPEARANCE);
	const [previewViewport, setPreviewViewport] = useState('desktop');
	/** Hand-picked canvas width; `null` follows the selected viewport. */
	const [previewWidth, setPreviewWidth] = useState(null);
	const [previewZoom, setPreviewZoom] = useState(ZOOM_DEFAULT);
	const handleViewportChange = useCallback((next) => {
		setPreviewViewport(next);
		setPreviewWidth(null);
	}, []);

	const handleCustomWidthChange = useCallback((next) => {
		setPreviewWidth(next);
		if (next) {
			setPreviewViewport(getPreviewViewportForWidth(next));
		}
	}, []);

	const [selectedType, setSelectedType] = useState(() =>
		termFromChartType(chartType)
	);
	const [selectedPattern, setSelectedPattern] = useState(null);
	const [activeTab, setActiveTab] = useState('pattern');
	const wizardScreens = useMemo(() => getWizardScreens(), []);
	const [activeScreenSlug, setActiveScreenSlug] = useState(null);
	const ActiveScreen = wizardScreens.find(
		(screen) => screen.slug === activeScreenSlug
	)?.component;
	const [showTemplateResetWarning, setShowTemplateResetWarning] =
		useState(false);
	const { selectBlock, updateBlockAttributes } =
		useDispatch(blockEditorStore);
	const { openGeneralSidebar, closeGeneralSidebar } =
		useDispatch(editPostStore);
	const { editPost } = useDispatch(editorStore);
	const { createInfoNotice } = useDispatch(noticesStore);
	const { postId, currentTitle } = useSelect(
		(select) => ({
			postId: select(editorStore).getCurrentPostId(),
			currentTitle: select(editorStore).getEditedPostAttribute('title'),
		}),
		[]
	);

	const addAnnotationHandlerRef = useRef(null);
	const curatedControlsRef = useKeepCaretInsideBlock();

	const wizardChartActions = useMemo(
		() => ({
			registerAddAnnotation(handler) {
				addAnnotationHandlerRef.current = handler;
			},
			unregisterAddAnnotation() {
				addAnnotationHandlerRef.current = null;
			},
			invokeAddAnnotation() {
				addAnnotationHandlerRef.current?.();
			},
		}),
		[]
	);

	const { patterns, patternsLoading, patternsError } =
		useChartPatterns(selectedType);

	useEffect(() => {
		if (shouldLandOnRefine()) {
			clearChartFlowSession();
		}
	}, []);

	useEffect(() => {
		if (activeStep === 2) {
			onEnterDataStep?.();
		} else if (activeStep === 3) {
			// Style Chart (curated or design mode) mounts the live chart canvas.
			onEnterDesignMode?.();
		} else if (activeStep === 4) {
			onEnterPreviewStep?.();
		}
	}, [activeStep, onEnterDataStep, onEnterDesignMode, onEnterPreviewStep]);

	useEffect(() => {
		if (shouldShowBlockInspector(activeStep, isDesignMode)) {
			selectBlock(chartClientId || clientId);
			openGeneralSidebar('edit-post/block');
			return;
		}

		// Keep the chart selected so drag/drop labels & annotations work on
		// Style Chart (curated) and Preview without opening the inspector.
		if (activeStep === 3 || activeStep === 4) {
			selectBlock(chartClientId || clientId);
		} else if (activeStep === 2) {
			// A selected chart block switches the controller back to the chart
			// view, which hides the table. A step change without a canvas click
			// (keyboard, guided tour) keeps the chart selected.
			selectBlock(clientId);
		}

		closeGeneralSidebar();
	}, [
		activeStep,
		isDesignMode,
		chartClientId,
		clientId,
		closeGeneralSidebar,
		openGeneralSidebar,
		selectBlock,
	]);

	const goTo = useCallback(
		(step) => {
			const next = Math.min(Math.max(step, 1), WIZARD_STEPS.length);
			if (
				!canReachCptWizardStep(next, {
					hasTemplate: Boolean(chartType),
					chartAttributes,
				})
			) {
				return;
			}
			if (shouldConfirmTemplateReset(activeStep, next)) {
				setShowTemplateResetWarning(true);
				return;
			}
			if (next !== 3) {
				setIsDesignMode(false);
			}
			setActiveStep(next);
		},
		[activeStep, chartAttributes, chartType]
	);

	const confirmTemplateReset = useCallback(() => {
		setShowTemplateResetWarning(false);
		setIsDesignMode(false);
		setActiveStep(1);
	}, []);

	const enterDesignMode = useCallback(() => {
		setIsDesignMode(true);
		onEnterDesignMode?.();
	}, [onEnterDesignMode]);

	const exitDesignMode = useCallback(() => {
		setIsDesignMode(false);
	}, []);

	const handleSelectType = useCallback((term) => {
		setSelectedType(term);
		setSelectedPattern(null);
		setActiveTab('pattern');
	}, []);

	const handleSelectPattern = useCallback(
		(pattern) => {
			if (!pattern?.content) {
				return;
			}
			const applied = applyControllerTemplateContent({
				content: pattern.content,
				clientId,
				controllerId,
				setAttributes,
				replaceInnerBlocks,
				preserveAttributes: ['id', 'lock'],
			});
			if (applied) {
				setSelectedPattern(pattern);
				setIsDesignMode(false);
			}
		},
		[clientId, controllerId, replaceInnerBlocks, setAttributes]
	);

	// Land where the Add New Chart import lands: Style Chart, design mode.
	const handleApplyScreenChart = useCallback(
		(chart) => {
			const applied = applyChartContent(chart, {
				clientId,
				controllerId,
				setAttributes,
				replaceInnerBlocks,
				createInfoNotice,
				editPost,
				currentTitle,
			});
			if (applied) {
				setActiveScreenSlug(null);
				setSelectedPattern(null);
				setIsDesignMode(true);
				setActiveStep(3);
			}
		},
		[
			clientId,
			controllerId,
			createInfoNotice,
			currentTitle,
			editPost,
			replaceInnerBlocks,
			setAttributes,
		]
	);

	const handleBackToTypes = useCallback(() => {
		setSelectedType(null);
		setSelectedPattern(null);
		setActiveTab('pattern');
	}, []);

	const chartAttributesRef = useRef(chartAttributes);
	const onChartAttributesChangeRef = useRef(onChartAttributesChange);
	chartAttributesRef.current = chartAttributes;
	onChartAttributesChangeRef.current = onChartAttributesChange;

	useEffect(() => {
		if (!tableClientId) {
			return undefined;
		}
		return bindBarChartHeightToCsvImport({
			namespace: `prc-chart-builder/cpt-wizard/${tableClientId}`,
			getChartAttributes: () => chartAttributesRef.current,
			getTableClientId: () => tableClientId,
			onChartAttributesChange: (next) => {
				onChartAttributesChangeRef.current?.({
					layout: next.layout,
				});
			},
		});
	}, [tableClientId]);

	const handleCsvUpload = useCallback(
		(csvText) => {
			if (!tableClientId) {
				return;
			}
			const { head, body } = csvToTableAttributes(csvText);
			updateBlockAttributes(tableClientId, { head, body });
			if (!chartAttributes) {
				return;
			}
			const nextChart = applyUploadedBarChartHeight(chartAttributes, {
				head,
				body,
			});
			if (nextChart !== chartAttributes) {
				onChartAttributesChange({ layout: nextChart.layout });
			}
		},
		[
			chartAttributes,
			onChartAttributesChange,
			tableClientId,
			updateBlockAttributes,
		]
	);

	const key = stepKey(activeStep);
	const {
		containerProps: splitProps,
		handleProps: splitHandleProps,
		view: splitView,
		setView: setSplitView,
	} = useWizardSplit(key);
	const splitHandle = (
		<div className="prc-chart-wizard__split-handle" {...splitHandleProps} />
	);
	const chartPreviewLabel = __('Chart preview', 'prc-chart-builder');
	const splitStartLabel = {
		data: __('Data table', 'prc-chart-builder'),
		configure: __('Style controls', 'prc-chart-builder'),
		preview: __('Preview settings', 'prc-chart-builder'),
	}[key];
	const hasSplitPanels =
		key === 'data' ||
		key === 'preview' ||
		(key === 'configure' && chartAttributes && !isDesignMode);

	// Style Chart and Preview edit and render the chart at the preview
	// viewport. Advanced Settings keeps the editor's own device type.
	const previewStepViewport =
		key === 'preview' && !previewWidth
			? getEffectivePreviewViewport(
					previewViewport,
					chartAttributes?.layout?.width
				)
			: previewViewport;
	const previewDeviceType =
		key === 'preview' || (key === 'configure' && !isDesignMode)
			? previewStepViewport
			: null;
	const { setPreviewDeviceType } = useDispatch(controllerStore);
	useEffect(() => {
		setPreviewDeviceType(previewDeviceType);
		return () => setPreviewDeviceType(null);
	}, [previewDeviceType, setPreviewDeviceType]);

	const previewConfig = useMemo(() => {
		if (!chartAttributes) {
			return null;
		}
		const previewAttributes =
			prepareChartAttributesForPreview(chartAttributes);
		return getConfig(previewAttributes, 'cpt-configure-preview');
	}, [chartAttributes]);

	const previewWidthRange = useMemo(() => {
		const chartWidth = chartAttributes?.layout?.width;
		return typeof chartWidth === 'number'
			? getPreviewWidthRange(chartWidth)
			: null;
	}, [chartAttributes]);
	// Canvas width that shows the chart at the previewed viewport's own
	// layout.width; no preview card is wider than this.
	const viewportChartWidth =
		chartAttributes?.[previewStepViewport]?.layout?.width ??
		chartAttributes?.layout?.width;
	const previewFullWidth =
		typeof viewportChartWidth === 'number'
			? viewportChartWidth + PREVIEW_CARD_PADDING
			: null;

	const paneAppearance = previewPaneProps(appearance);

	const previewData = useMemo(() => {
		if (!chartAttributes) {
			return [];
		}
		return buildPreviewChartData(
			prepareChartAttributesForPreview(chartAttributes)
		);
	}, [chartAttributes]);

	const reachState = useMemo(
		() => ({
			hasTemplate: Boolean(chartType),
			chartAttributes,
		}),
		[chartAttributes, chartType]
	);

	let primary = null;
	if (
		activeStep < WIZARD_STEPS.length &&
		canReachCptWizardStep(activeStep + 1, reachState)
	) {
		primary = {
			label: getContinueToNextStepLabel(activeStep, WIZARD_STEPS),
			onClick: () => goTo(activeStep + 1),
		};
	}

	const handleBack = useCallback(() => {
		if (activeStep === 3 && isDesignMode) {
			exitDesignMode();
			return;
		}
		goTo(activeStep - 1);
	}, [activeStep, exitDesignMode, goTo, isDesignMode]);

	const leanPreviewPane = (
		<div
			className="prc-chart-modal__preview-pane"
			data-collapsed-label={chartPreviewLabel}
		>
			{isFreeformChartPreview(chartAttributes) ? (
				<FreeformPreviewUnavailable />
			) : (
				previewConfig && (
					<div className="wp-block-prc-chart-builder-controller">
						<figure
							className="prc-chart-modal__preview-figure"
							style={{
								width: `${previewConfig.layout?.width}px`,
								maxWidth: `${previewConfig.layout?.width}px`,
							}}
						>
							<ChartBuilderTextWrapper
								active={previewConfig.metadata?.active}
								width={previewConfig.layout?.width}
								horizontalRules={
									previewConfig.layout?.horizontalRules
								}
								title={previewConfig.metadata?.title}
								subtitle={previewConfig.metadata?.subtitle}
								note={previewConfig.metadata?.note}
								source={previewConfig.metadata?.source}
								tag={previewConfig.metadata?.tag}
							>
								<Suspense fallback={<Spinner />}>
									<ChartBuilderWrapper
										config={previewConfig}
										data={previewData}
									/>
								</Suspense>
							</ChartBuilderTextWrapper>
						</figure>
					</div>
				)
			)}
		</div>
	);

	return (
		<WizardChartActionsContext.Provider value={wizardChartActions}>
			<div
				className="prc-chart-cpt-wizard prc-chart-wizard"
				data-layout="full"
				data-wizard-step={key}
				data-design-mode={isDesignMode ? 'true' : 'false'}
			>
				{showTemplateResetWarning && (
					<TemplateResetWarning
						onCancel={() => setShowTemplateResetWarning(false)}
						onConfirm={confirmTemplateReset}
					/>
				)}
				<WizardStepProgress
					activeStep={activeStep}
					onStepSelect={goTo}
					canSelectStep={(step) =>
						canReachCptWizardStep(step, reachState)
					}
				/>
				<WizardStepExplainer activeStep={activeStep} />

				{activeStep === 2 && (
					<CsvDataInput
						variant="upload-button"
						csvText=""
						onCsvChange={handleCsvUpload}
						disabled={!tableClientId}
					/>
				)}

				{hasSplitPanels && (
					<div className="prc-chart-wizard__panel-switch">
						<ToggleGroupControl
							label={__('Show panel', 'prc-chart-builder')}
							hideLabelFromVision
							value={splitView}
							isBlock
							onChange={setSplitView}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						>
							<ToggleGroupControlOption
								label={splitStartLabel}
								value="start"
							/>
							<ToggleGroupControlOption
								label={chartPreviewLabel}
								value="end"
							/>
						</ToggleGroupControl>
					</div>
				)}

				<div className="prc-chart-cpt-wizard__body">
					{key === 'select' && (
						<div className="prc-chart-cpt-wizard__select">
							{patternsError && (
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
							{ActiveScreen ? (
								<ActiveScreen
									onBack={() => setActiveScreenSlug(null)}
									postId={postId}
									onApplyChart={handleApplyScreenChart}
								/>
							) : (
								<SelectChartStep
									layout="full"
									selectedType={selectedType}
									onSelectType={handleSelectType}
									screens={wizardScreens}
									onOpenScreen={setActiveScreenSlug}
									patterns={patterns}
									patternsLoading={patternsLoading}
									onSelectPattern={handleSelectPattern}
									selectedPattern={selectedPattern}
									onBackToTypes={handleBackToTypes}
									aiEnabled={false}
									activeTab={activeTab}
									onChangeTab={setActiveTab}
								/>
							)}
						</div>
					)}

					{key === 'data' && (
						<div
							className="prc-chart-modal__configure"
							{...splitProps}
						>
							<div
								className="prc-chart-modal__configure-controls"
								data-collapsed-label={splitStartLabel}
							>
								<div className="prc-chart-modal__data-table editor-styles-wrapper">
									{refineContent}
								</div>
							</div>
							{splitHandle}
							{leanPreviewPane}
						</div>
					)}

					{key === 'configure' &&
						chartAttributes &&
						!isDesignMode && (
							<div
								className="prc-chart-modal__configure"
								{...splitProps}
							>
								<div
									ref={curatedControlsRef}
									className="prc-chart-modal__configure-controls"
									data-collapsed-label={splitStartLabel}
								>
									<CuratedControls
										chartAttributes={chartAttributes}
										onChange={onChartAttributesChange}
									/>
									<div className="prc-chart-wizard__design-mode-entry">
										<Button
											__next40pxDefaultSize
											variant="secondary"
											onClick={enterDesignMode}
										>
											{__(
												'Advanced Settings',
												'prc-chart-builder'
											)}
										</Button>
									</div>
								</div>
								{splitHandle}
								<div
									className="prc-chart-wizard__preview-stack"
									data-collapsed-label={chartPreviewLabel}
								>
									<div
										className="prc-chart-modal__preview-pane editor-styles-wrapper"
										data-preview-viewport={previewViewport}
										style={{
											...getPreviewViewportStyle(
												previewViewport,
												null,
												previewFullWidth
											),
											'--prc-chart-preview-zoom':
												previewZoom / 100,
										}}
									>
										{refineContent}
									</div>
									<div className="prc-chart-wizard__preview-footer">
										<div className="prc-chart-wizard__preview-footer-group">
											<PreviewViewportToggle
												viewport={previewViewport}
												onViewportChange={
													handleViewportChange
												}
											/>
											<WizardControlTip
												label={__(
													'Help: preview size',
													'prc-chart-builder'
												)}
												text={__(
													'Shows the chart at desktop, tablet, or mobile width. Changes you make with Tablet or Mobile selected apply only to that size. Changes made on Desktop apply to every size that has no setting of its own.',
													'prc-chart-builder'
												)}
											/>
										</div>
										<PreviewZoomControl
											zoom={previewZoom}
											onZoomChange={setPreviewZoom}
										/>
									</div>
								</div>
							</div>
						)}

					{key === 'configure' && isDesignMode && (
						<div className="prc-chart-cpt-wizard__design-mode">
							<div className="prc-chart-wizard__design-mode-header">
								<Button
									__next40pxDefaultSize
									variant="secondary"
									onClick={exitDesignMode}
								>
									{__(
										'Exit Advanced Settings',
										'prc-chart-builder'
									)}
								</Button>
							</div>
							{refineContent}
						</div>
					)}

					{key === 'preview' && (
						<div
							className="prc-chart-modal__configure prc-chart-wizard__preview"
							{...splitProps}
						>
							<PreviewVisionFilters />
							<div
								className="prc-chart-modal__configure-controls"
								data-collapsed-label={splitStartLabel}
							>
								<PreviewToolbar
									viewport={previewStepViewport}
									onViewportChange={handleViewportChange}
									customWidth={previewWidth}
									onCustomWidthChange={
										handleCustomWidthChange
									}
									widthRange={previewWidthRange}
									appearance={appearance}
									onAppearanceChange={setAppearance}
								/>
								<WorkflowStatusPaneSlot />
								<ChartViewLink />
							</div>
							{splitHandle}
							<div
								className={`prc-chart-modal__preview-pane editor-styles-wrapper${paneAppearance.className}`}
								data-preview-viewport={previewStepViewport}
								data-collapsed-label={chartPreviewLabel}
								// Sizes the chart card inside the pane, not the
								// pane itself — see controller/style.scss.
								style={{
									...getPreviewViewportStyle(
										previewStepViewport,
										previewWidth,
										previewFullWidth
									),
									...paneAppearance.style,
								}}
							>
								{refineContent}
							</div>
						</div>
					)}

					{key === 'configure' && !chartAttributes && (
						<Notice status="warning" isDismissible={false}>
							{__(
								'No chart block found to configure.',
								'prc-chart-builder'
							)}
						</Notice>
					)}
				</div>

				<WizardActionBar
					activeStep={activeStep}
					onBack={activeStep > 1 ? handleBack : undefined}
					primary={primary}
				/>
			</div>
		</WizardChartActionsContext.Provider>
	);
}
