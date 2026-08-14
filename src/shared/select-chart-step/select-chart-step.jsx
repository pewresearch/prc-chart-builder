/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
/* eslint-disable import/no-extraneous-dependencies */
/**
 * Select Chart step UI — type picker + pattern grid (PRC-527).
 *
 * Shared by the admin ChartWizard and the chart CPT Controller shell.
 * Pattern previews need a BlockEditorProvider; wrap consumers with
 * WizardEditorShell (or supply one higher up).
 */
import { Icon as PRCIcon } from '@prc/icons';
import * as blockEditor from '@wordpress/block-editor';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	parse,
	serialize,
} from '@wordpress/blocks';
import { Button, Flex, FlexItem, Icon, Spinner } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	chartBar,
	chevronLeft,
	globe,
	image,
	layout,
	trendingUp,
} from '@wordpress/icons';

import { applyThemeToInnerBlocksTemplate } from '../../controller/variation-templates/helpers';
import * as variationTemplates from '../../controller/variation-templates/index';
import { getSelectChartPanel } from '../wizard-chrome';
import usePatternPreviewVisibility from './use-pattern-preview-visibility';
import useWizardPreviewSettings from './use-wizard-preview-settings';

// ── Icon map (fallback when no variation image exists) ──────────────────────────

const CHART_TYPE_ICON_MAP = {
	area: trendingUp,
	bar: chartBar,
	column: chartBar,
	'diverging-bar': chartBar,
	'dot-plot': trendingUp,
	'exploded-bar': chartBar,
	freeform: image,
	line: trendingUp,
	'map-usa': globe,
	'map-usa-block': globe,
	'map-usa-county': globe,
	'map-usa-counties': globe,
	'map-usa-hex': globe,
	'map-world': globe,
	'map-world-orthographic': globe,
	pie: chartBar,
	sankey: trendingUp,
	scatter: trendingUp,
	'stacked-area': trendingUp,
	'stacked-bar': chartBar,
	'stacked-column': chartBar,
	treemap: image,
	waffle: chartBar,
	'heat-map-table': chartBar,
};

const PREVIEW_VIEWPORT_WIDTH = 1200;
const EMPTY_BLOCKS = [];
const { BlockEditorProvider, BlockPreview } = blockEditor;

/**
 * Placeholder copy for when each chart type is a good fit.
 * Replace with final UX copy when ready.
 * @return {Object.<string, string>} Slug → description map.
 */
function getChartTypeDescriptionMap() {
	return {
		area: __(
			'Use an area chart to show how a total changes over time, with the filled region emphasizing magnitude.',
			'prc-chart-builder'
		),
		bar: __(
			'Use a bar chart to compare values across categories when labels are long or there are many categories.',
			'prc-chart-builder'
		),
		'bee-swarm': __(
			'Use a beeswarm to show the distribution of individual points along one axis without full overlap.',
			'prc-chart-builder'
		),
		column: __(
			'Use a column chart to compare values across a small set of categories or time periods.',
			'prc-chart-builder'
		),
		'diverging-bar': __(
			'Use a diverging bar chart to compare values that fall on either side of a midpoint (e.g. agree vs disagree).',
			'prc-chart-builder'
		),
		'dot-plot': __(
			'Use a dot plot to compare values across categories with less visual weight than bars.',
			'prc-chart-builder'
		),
		'exploded-bar': __(
			'Use an exploded bar when one category needs to be broken into parts while still relating to a whole.',
			'prc-chart-builder'
		),
		freeform: __(
			'Use freeform when you need a custom layout that combines multiple chart elements.',
			'prc-chart-builder'
		),
		'heat-map-table': __(
			'Use a heat map table to show values across a grid of categories with color encoding intensity.',
			'prc-chart-builder'
		),
		line: __(
			'Use a line chart to show trends or change over time for one or more series.',
			'prc-chart-builder'
		),
		'map-usa': __(
			'Use a USA map to show state-level geographic patterns.',
			'prc-chart-builder'
		),
		'map-usa-block': __(
			'Use a USA block map when equal-sized state tiles matter more than geographic accuracy.',
			'prc-chart-builder'
		),
		'map-usa-cbsa': __(
			'Use a USA CBSA map to show metro-area geographic patterns.',
			'prc-chart-builder'
		),
		'map-usa-counties': __(
			'Use a USA county map to show county-level geographic patterns.',
			'prc-chart-builder'
		),
		'map-usa-county': __(
			'Use a USA county map to show county-level geographic patterns.',
			'prc-chart-builder'
		),
		'map-usa-hex': __(
			'Use a USA hex map when equal-area state tiles help comparison across states.',
			'prc-chart-builder'
		),
		'map-world': __(
			'Use a world map to show country-level geographic patterns.',
			'prc-chart-builder'
		),
		'map-world-orthographic': __(
			'Use a world globe map for a spherical view of country-level patterns.',
			'prc-chart-builder'
		),
		pie: __(
			'Use a pie chart to show parts of a whole for a small number of categories.',
			'prc-chart-builder'
		),
		sankey: __(
			'Use a sankey to show flow or composition moving between stages or groups.',
			'prc-chart-builder'
		),
		scatter: __(
			'Use a scatter plot to show the relationship between two numeric variables.',
			'prc-chart-builder'
		),
		'small-multiples': __(
			'Use small multiples to repeat the same chart for each series or group with shared scales.',
			'prc-chart-builder'
		),
		'stacked-area': __(
			'Use a stacked area chart to show how parts of a total change over time.',
			'prc-chart-builder'
		),
		'stacked-bar': __(
			'Use a stacked bar to compare totals across categories while showing composition.',
			'prc-chart-builder'
		),
		'stacked-column': __(
			'Use a stacked column to compare totals across categories while showing composition.',
			'prc-chart-builder'
		),
		treemap: __(
			'Use a treemap to show hierarchical part-to-whole relationships by area.',
			'prc-chart-builder'
		),
		waffle: __(
			'Use a waffle chart to show parts of a whole on a fixed cell grid.',
			'prc-chart-builder'
		),
	};
}

/**
 * @param {string} slug Chart type slug.
 * @return {string} Placeholder description for the selected type.
 */
export function getChartTypeDescription(slug) {
	const descriptions = getChartTypeDescriptionMap();
	return (
		descriptions[slug] ||
		__(
			'Select a template below to start with a pre-built layout, or choose Default for a default chart.',
			'prc-chart-builder'
		)
	);
}

/**
 * Provides the BlockEditorProvider the pattern-picker BlockPreview needs, in
 * both the modal and full-page hosts. (Formerly ModalPreviewShell.)
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children Wizard content.
 * @return {import('react').ReactNode} Provider-wrapped content.
 */
export function WizardEditorShell({ children }) {
	const settings = useWizardPreviewSettings();

	if (!BlockEditorProvider) {
		return children;
	}

	return (
		<BlockEditorProvider value={EMPTY_BLOCKS} settings={settings}>
			{children}
		</BlockEditorProvider>
	);
}

const DEFAULT_PREVIEW_SIZE = 290;

/**
 * Convert a kebab-case chart type slug to the camelCase template export name.
 * e.g. 'map-usa-county' → 'mapUsaCountyTemplate'
 * @param {string} slug
 */
export function slugToTemplateKey(slug) {
	return (
		slug
			.split('-')
			.map((part, i) =>
				i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
			)
			.join('') + 'Template'
	);
}

/**
 * Serialize a variation template into raw block markup.
 * Injects a chart title into serialized block content before POST.
 * @param {string} chartTypeSlug
 */
export function serializeVariationTemplate(chartTypeSlug) {
	const key = slugToTemplateKey(chartTypeSlug);
	const innerBlocks = applyThemeToInnerBlocksTemplate(
		variationTemplates[key] ?? null
	);
	if (!innerBlocks) {
		return null;
	}
	const innerBlockObjects = createBlocksFromInnerBlocksTemplate(innerBlocks);
	const controllerBlock = createBlock(
		'prc-chart-builder/controller',
		{
			chartType: chartTypeSlug,
			...(chartTypeSlug === 'freeform' ? { isFreeform: true } : {}),
		},
		innerBlockObjects
	);
	return serialize(controllerBlock);
}

// ── Pattern preview — mirrors edit-site/src/components/page-patterns/fields.js
//
// The edit-site patterns page uses ExperimentalBlockEditorProvider at the page
// level and BlockPreview per-pattern inside a DataViews `mediaField`. We
// replicate that here: one BlockEditorProvider wraps the wizard, and each
// pattern card gets a BlockPreview with parsed blocks.

function PatternPreviewPlaceholder() {
	return (
		<div
			className="prc-chart-modal__pattern-preview-field is-placeholder"
			aria-hidden="true"
		/>
	);
}

export function PreviewField({ item, chartTypeSlug = '' }) {
	const [visibilityRef, isVisible] = usePatternPreviewVisibility();
	const isBlank = item.name === '__blank__';

	const blocks = useMemo(() => {
		if (isBlank) {
			return null;
		}
		return (
			item.blocks ??
			parse(item.content, {
				__unstableSkipMigrationLogs: true,
			})
		);
	}, [isBlank, item.content, item.blocks]);

	const fallbackIcon = CHART_TYPE_ICON_MAP[chartTypeSlug] || chartBar;

	if (isBlank) {
		return (
			<div
				ref={visibilityRef}
				className="prc-chart-modal__pattern-preview-blank"
			>
				<Icon icon={layout} size={48} />
				<span>{__('Default', 'prc-chart-builder')}</span>
			</div>
		);
	}

	const isEmpty = !blocks?.length;

	if (isEmpty) {
		return (
			<div
				ref={visibilityRef}
				className="prc-chart-modal__pattern-preview-fallback"
			>
				<Icon icon={fallbackIcon} size={48} />
			</div>
		);
	}

	if (!BlockPreview) {
		return (
			<div
				ref={visibilityRef}
				className="prc-chart-modal__pattern-preview-fallback"
			>
				<Icon icon={layout} size={48} />
			</div>
		);
	}

	return (
		<div
			ref={visibilityRef}
			className="prc-chart-modal__pattern-preview-field"
		>
			{isVisible ? (
				<BlockPreview.Async placeholder={<PatternPreviewPlaceholder />}>
					<BlockPreview
						blocks={blocks}
						viewportWidth={
							item.viewportWidth ?? PREVIEW_VIEWPORT_WIDTH
						}
					/>
				</BlockPreview.Async>
			) : (
				<PatternPreviewPlaceholder />
			)}
		</div>
	);
}

// ── Step 1: Chart Type Picker ─────────────────────────────────────────────────

function getVariationImageUrl(slug) {
	const baseUrl = window?.prcChartBuilderLibrary?.variationImagesUrl || '';
	if (!baseUrl || !slug) return null;
	return `${baseUrl.replace(/\/$/, '')}/${slug}.png`;
}

export function ChartTypeCard({ term, onSelect, isActive = false }) {
	const [imageError, setImageError] = useState(false);
	const imageUrl = getVariationImageUrl(term.slug);
	const icon = CHART_TYPE_ICON_MAP[term.slug] || chartBar;
	const showImage = imageUrl && !imageError;

	return (
		<button
			className={['prc-chart-modal__type-card', isActive && 'is-active']
				.filter(Boolean)
				.join(' ')}
			aria-pressed={isActive}
			onClick={() => onSelect(term)}
		>
			{showImage ? (
				<img
					src={imageUrl}
					alt=""
					loading="lazy"
					decoding="async"
					className="prc-chart-modal__type-image"
					onError={() => setImageError(true)}
				/>
			) : (
				<Icon
					icon={icon}
					size={28}
					className="prc-chart-modal__type-icon"
				/>
			)}
			<span className="prc-chart-modal__type-label">{term.label}</span>
		</button>
	);
}

export function ChartTypePicker({
	onSelect,
	onImportPch,
	activeSlug = null,
	showIntro = true,
}) {
	const terms = window?.prcChartBuilderLibrary?.chartTypeTerms || [];
	const showPch = typeof onImportPch === 'function';

	return (
		<div className="prc-chart-modal__type-picker">
			{showIntro && (
				<p className="prc-chart-modal__step-label">
					{showPch
						? __(
								'Choose a chart type to get started. Importing from pewplots?',
								'prc-chart-builder'
							)
						: __(
								'Choose a chart type to get started.',
								'prc-chart-builder'
							)}{' '}
					{showPch && (
						<>
							<Button variant="link" onClick={onImportPch}>
								{__('Upload', 'prc-chart-builder')}
							</Button>{' '}
							{__('your .pch.json file.', 'prc-chart-builder')}
						</>
					)}
				</p>
			)}
			<div className="prc-chart-modal__type-grid">
				{terms.map((term) => (
					<ChartTypeCard
						key={term.slug}
						term={term}
						onSelect={onSelect}
						isActive={activeSlug === term.slug}
					/>
				))}
			</div>
			{!showIntro && showPch && (
				<Button
					variant="link"
					onClick={onImportPch}
					className="prc-chart-wizard__pch-link"
				>
					{__('Import from pewplots…', 'prc-chart-builder')}
				</Button>
			)}
		</div>
	);
}

const PATTERN_VIEW = {
	type: 'grid',
	page: 1,
	perPage: 20,
	search: '',
	filters: [],
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
	layout: {
		mediaField: 'preview',
		primaryField: 'title',
		previewSize: DEFAULT_PREVIEW_SIZE,
	},
};

// ── Step 2: Pattern Picker ────────────────────────────────────────────────────

export function PatternPicker({
	chartType,
	patterns,
	isLoading,
	onBack,
	onSelect,
	selectedItemId = null,
	layout: layoutMode = 'compact',
	primaryAction = null,
}) {
	const [view, setView] = useState(PATTERN_VIEW);

	// Fields are defined inside the component so chartType can be closed over.
	const fields = useMemo(
		() => [
			{
				id: 'preview',
				label: __('Preview', 'prc-chart-builder'),
				render: ({ item }) => (
					<PreviewField
						item={item}
						chartTypeSlug={chartType?.slug || ''}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'title',
				type: 'text',
				label: __('Title', 'prc-chart-builder'),
				getValue: ({ item }) => item.title,
				enableSorting: false,
				enableHiding: false,
				enableGlobalSearch: true,
			},
		],
		[chartType?.slug]
	);

	// A synthetic "blank" item that represents starting from the default
	// variation template rather than a saved pattern.
	const blankItem = useMemo(
		() => ({
			name: '__blank__',
			title: __('Default', 'prc-chart-builder'),
			content: serializeVariationTemplate(chartType?.slug) ?? '',
			blocks: null,
		}),
		[chartType]
	);

	const allItems = useMemo(
		() => [...patterns, blankItem],
		[blankItem, patterns]
	);

	const selection = useMemo(
		() => (selectedItemId ? [selectedItemId] : []),
		[selectedItemId]
	);

	const handleSelectionChange = useCallback(
		(nextSelection) => {
			const nextId = Array.isArray(nextSelection)
				? nextSelection[0]
				: null;
			if (!nextId) {
				return;
			}
			const item = allItems.find((entry) => entry.name === nextId);
			if (item) {
				onSelect(item);
			}
		},
		[allItems, onSelect]
	);

	if (isLoading) {
		return (
			<div className="prc-chart-modal__pattern-picker">
				<Flex justify="center" style={{ padding: '32px' }}>
					<Spinner />
				</Flex>
			</div>
		);
	}

	return (
		<div className="prc-chart-modal__pattern-picker">
			{/*
			 * Free composition (Gutenberg DataViews README): pass children to
			 * skip DefaultUI. Requires @wordpress/dataviews with Layout
			 * subcomponent; chart-builder pins ^17.2.0.
			 */}
			<DataViews
				data={allItems}
				fields={fields}
				view={view}
				onChangeView={setView}
				defaultLayouts={{
					grid: {
						layout: {
							mediaField: 'preview',
							primaryField: 'title',
							previewSize: DEFAULT_PREVIEW_SIZE,
						},
					},
				}}
				paginationInfo={{
					totalItems: allItems.length,
					totalPages: 1,
				}}
				getItemId={(item) => item.name}
				selection={selection}
				onChangeSelection={handleSelectionChange}
				isItemClickable={() => true}
				onClickItem={(item) => onSelect(item)}
				search={false}
			>
				<DataViews.Layout />
			</DataViews>
			{layoutMode !== 'full' && (
				<Flex
					justify="flex-start"
					gap={3}
					style={{ marginTop: '12px' }}
				>
					{primaryAction && (
						<FlexItem>
							<Button
								variant="primary"
								onClick={primaryAction.onClick}
								disabled={primaryAction.disabled}
							>
								{primaryAction.label}
							</Button>
						</FlexItem>
					)}
					<FlexItem>
						<Button
							variant="secondary"
							onClick={onBack}
							icon={chevronLeft}
						>
							{__('Back', 'prc-chart-builder')}
						</Button>
					</FlexItem>
				</Flex>
			)}
		</div>
	);
}

// ── Step 2: Tab bar (Pattern vs AI) ──────────────────────────────────────────

/**
 * Thin tab bar rendered above the pattern picker / AI step.
 * Only shown when the AI experiment is enabled.
 * @param {Object}   root0
 * @param {string}   root0.activeTab
 * @param {Function} root0.onChangeTab
 */
export function Step2TabBar({ activeTab, onChangeTab }) {
	return (
		<div className="prc-chart-modal__tab-bar" role="tablist">
			<button
				role="tab"
				aria-selected={activeTab === 'pattern'}
				className={[
					'prc-chart-modal__tab',
					activeTab === 'pattern' && 'prc-chart-modal__tab--active',
				]
					.filter(Boolean)
					.join(' ')}
				onClick={() => onChangeTab('pattern')}
			>
				<Icon icon={layout} size={16} />
				{__('From Pattern', 'prc-chart-builder')}
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'ai'}
				className={[
					'prc-chart-modal__tab',
					activeTab === 'ai' && 'prc-chart-modal__tab--active',
				]
					.filter(Boolean)
					.join(' ')}
				onClick={() => onChangeTab('ai')}
			>
				<PRCIcon icon="hat-wizard" />
				{__('Chart Wizard (Experimental)', 'prc-chart-builder')}
			</button>
		</div>
	);
}

// ── Step 1: Select Chart (type + template) ─────────────────────────────────────

// Step 1. At `full` it's a master-detail screen — type rail (left) + template
// grid (right, filtered by the selected type). At `compact` it's the sequential
// type-picker → pattern-picker flow.
/**
 * @param {Object}      props
 * @param {string}      props.layout
 * @param {Object|null} props.selectedType
 * @param {Function}    props.onSelectType
 * @param {Function}    [props.onImportPch]     When omitted, pewplots import UI is hidden.
 * @param {Object[]}    props.patterns
 * @param {boolean}     props.patternsLoading
 * @param {Function}    props.onSelectPattern
 * @param {Object|null} [props.selectedPattern] Currently selected template (highlight only).
 * @param {Function}    props.onBackToTypes
 * @param {boolean}     [props.aiEnabled]
 * @param {string}      [props.activeTab]
 * @param {Function}    [props.onChangeTab]
 * @param {Function}    [props.onAIAccept]
 * @param {Function}    [props.renderAI]        `( { chartType, onBack, onAccept } ) => node`
 *                                              Injected AI panel (admin-only); omit for CPT shell v1.
 * @param {Object|null} [props.primaryAction]   `{ label, onClick, disabled }` advance button. Only
 *                                              rendered at `compact`, where there is no action bar.
 */
export default function SelectChartStep({
	layout: layoutMode,
	selectedType,
	onSelectType,
	onImportPch,
	patterns,
	patternsLoading,
	onSelectPattern,
	selectedPattern = null,
	onBackToTypes,
	aiEnabled,
	activeTab,
	onChangeTab,
	onAIAccept,
	renderAI,
	primaryAction = null,
}) {
	const isFull = layoutMode === 'full';
	const panel = getSelectChartPanel({ selectedType, activeTab });

	const tabs =
		aiEnabled && selectedType ? (
			<Step2TabBar activeTab={activeTab} onChangeTab={onChangeTab} />
		) : null;

	const typeDescription = selectedType ? (
		<p className="prc-chart-modal__type-description">
			{getChartTypeDescription(selectedType.slug)}
		</p>
	) : null;

	const renderTemplates = () => {
		if (panel === 'ai') {
			return (
				renderAI?.({
					chartType: selectedType,
					onBack: onBackToTypes,
					onAccept: onAIAccept,
				}) ?? null
			);
		}
		if (panel === 'patterns') {
			return (
				<PatternPicker
					chartType={selectedType}
					patterns={patterns}
					isLoading={patternsLoading}
					onBack={onBackToTypes}
					onSelect={onSelectPattern}
					selectedItemId={selectedPattern?.name ?? null}
					layout={layoutMode}
					primaryAction={primaryAction}
				/>
			);
		}
		// 'prompt' — only rendered full-page (compact shows the type picker).
		return (
			<div className="prc-chart-wizard__choose-empty">
				<p>
					{__(
						'Select a chart type to see its templates.',
						'prc-chart-builder'
					)}
				</p>
			</div>
		);
	};

	// Compact (modal): sequential — type grid until a type is picked, then the
	// tabs + template content.
	if (!isFull) {
		if (panel === 'prompt') {
			return (
				<ChartTypePicker
					onSelect={onSelectType}
					onImportPch={onImportPch}
				/>
			);
		}
		return (
			<>
				{typeDescription}
				{tabs}
				{renderTemplates()}
			</>
		);
	}

	// Full: master-detail.
	return (
		<div className="prc-chart-wizard__choose">
			<div className="prc-chart-wizard__choose-types">
				<p className="prc-chart-modal__step-label">
					{__('Chart Type', 'prc-chart-builder')}
				</p>
				<ChartTypePicker
					onSelect={onSelectType}
					onImportPch={onImportPch}
					activeSlug={selectedType?.slug}
					showIntro={false}
				/>
			</div>
			<div className="prc-chart-wizard__choose-templates">
				{selectedType && (
					<p className="prc-chart-modal__step-label">
						{sprintf(
							/* translators: %s: chart type label. */
							__('Template — %s', 'prc-chart-builder'),
							selectedType.label
						)}
					</p>
				)}
				{typeDescription}
				{tabs}
				{renderTemplates()}
			</div>
		</div>
	);
}
