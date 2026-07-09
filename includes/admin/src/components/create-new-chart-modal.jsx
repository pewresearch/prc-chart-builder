/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
/* eslint-disable import/no-extraneous-dependencies */
/**
 * WordPress Dependencies
 */
import { Icon as PRCIcon } from '@prc/icons';
import apiFetch from '@wordpress/api-fetch';
import * as blockEditor from '@wordpress/block-editor';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	parse,
	serialize,
} from '@wordpress/blocks';
import {
	Button,
	Flex,
	FlexItem,
	Icon,
	Modal,
	Notice,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	chartBar,
	chevronLeft,
	globe,
	image,
	layout,
	plus,
	trendingUp,
} from '@wordpress/icons';
/**
 * Internal Dependencies
 */
import * as variationTemplates from '../../../../src/controller/variation-templates/index';
import { applyThemeToInnerBlocksTemplate } from '../../../../src/controller/variation-templates/helpers';
import { csvToTableAttributes, inferCategories, parseCsv } from '../utils/csv';
import AICreateStep from './ai-create-step';
import CsvDataInput from './csv-data-input';
import PchImportStep from './pch-import';

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
};

const PREVIEW_VIEWPORT_WIDTH = 1200;
const EMPTY_BLOCKS = [];
const { BlockEditorProvider, BlockPreview } = blockEditor;

function ModalPreviewShell({ children }) {
	if (!BlockEditorProvider) {
		return children;
	}

	return (
		<BlockEditorProvider value={EMPTY_BLOCKS} settings={{}}>
			{children}
		</BlockEditorProvider>
	);
}

// DataViews previewSize snaps to these discrete pixel widths (from preview-size-picker.tsx).
// We map each card width to a BlockPreview viewportWidth so the content scales
// proportionally: a wider card = less aggressive zoom-out = higher viewportWidth.
const DEFAULT_PREVIEW_SIZE = 290; // ~3 columns at modal width
const PREVIEW_SIZE_VIEWPORT_MAP = {
	120: 480,
	170: 680,
	230: 920,
	290: 1160,
	350: 1400,
	430: 1720,
};
function previewSizeToViewportWidth(previewSize = DEFAULT_PREVIEW_SIZE) {
	return PREVIEW_SIZE_VIEWPORT_MAP[previewSize] ?? PREVIEW_VIEWPORT_WIDTH;
}

/**
 * Convert a kebab-case chart type slug to the camelCase template export name.
 * e.g. 'map-usa-county' → 'mapUsaCountyTemplate'
 * @param {string} slug
 */
function slugToTemplateKey(slug) {
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
function serializeVariationTemplate(chartTypeSlug) {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEditUrl(postId) {
	const url = new URL(window.location.href);
	url.pathname = url.pathname.replace(/\/wp-admin\/.*/, '/wp-admin/post.php');
	url.search = '';
	url.searchParams.set('post', postId);
	url.searchParams.set('action', 'edit');
	return url.toString();
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

// ── Pattern preview — mirrors edit-site/src/components/page-patterns/fields.js
//
// The edit-site patterns page uses ExperimentalBlockEditorProvider at the page
// level and BlockPreview per-pattern inside a DataViews `mediaField`. We
// replicate that here: one BlockEditorProvider wraps the modal, and each
// pattern card gets a BlockPreview with parsed blocks.

function PreviewField({ item, viewportWidth = PREVIEW_VIEWPORT_WIDTH }) {
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

	// The synthetic blank item gets a dedicated visual placeholder.
	if (isBlank) {
		return (
			<div className="prc-chart-modal__pattern-preview-blank">
				<Icon icon={layout} size={48} />
				<span>{__('Blank', 'prc-chart-builder')}</span>
			</div>
		);
	}

	const isEmpty = !blocks?.length;

	if (isEmpty) {
		return (
			<div className="prc-chart-modal__pattern-preview-fallback">
				<Icon icon={chartBar} size={48} />
			</div>
		);
	}

	if (!BlockPreview) {
		return (
			<div className="prc-chart-modal__pattern-preview-fallback">
				<Icon icon={layout} size={48} />
			</div>
		);
	}

	return <BlockPreview blocks={blocks} viewportWidth={viewportWidth} />;
}

// ── Step 1: Chart Type Picker ─────────────────────────────────────────────────

function getVariationImageUrl(slug) {
	const baseUrl = window?.prcChartBuilderLibrary?.variationImagesUrl || '';
	if (!baseUrl || !slug) return null;
	return `${baseUrl.replace(/\/$/, '')}/${slug}.png`;
}

function ChartTypeCard({ term, patternCount, onSelect }) {
	const [imageError, setImageError] = useState(false);
	const imageUrl = getVariationImageUrl(term.slug);
	const icon = CHART_TYPE_ICON_MAP[term.slug] || chartBar;
	const showImage = imageUrl && !imageError;

	return (
		<button
			className="prc-chart-modal__type-card"
			onClick={() => onSelect(term)}
		>
			{showImage ? (
				<img
					src={imageUrl}
					alt=""
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
			{patternCount > 0 && (
				<span
					className="prc-chart-modal__type-count"
					aria-label={`${patternCount} patterns`}
				>
					{patternCount}
				</span>
			)}
		</button>
	);
}

function ChartTypePicker({ onSelect, patternCounts, onImportPch }) {
	const terms = window?.prcChartBuilderLibrary?.chartTypeTerms || [];

	return (
		<div className="prc-chart-modal__type-picker">
			<p className="prc-chart-modal__step-label">
				{__(
					'Choose a chart type to get started. Importing from pewplots? ',
					'prc-chart-builder'
				)}
				<Button variant="link" onClick={onImportPch}>
					{__('Upload', 'prc-chart-builder')}{' '}
				</Button>
				{__(' your .pch.json file.', 'prc-chart-builder')}
			</p>
			<div className="prc-chart-modal__type-grid">
				{terms.map((term) => (
					<ChartTypeCard
						key={term.slug}
						term={term}
						patternCount={patternCounts[term.slug] || 0}
						onSelect={onSelect}
					/>
				))}
			</div>
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

function PatternPicker({ chartType, patterns, isLoading, onBack, onSelect }) {
	const [view, setView] = useState(PATTERN_VIEW);

	// Derive viewportWidth from the DataViews previewSize so the Appearance
	// slider actually scales the BlockPreview content.
	const viewportWidth = previewSizeToViewportWidth(
		view.layout?.previewSize ?? DEFAULT_PREVIEW_SIZE
	);

	// Fields are defined inside the component so `viewportWidth` can be closed
	// over and passed to PreviewField. DataViews' render prop receives { item }
	// so we wrap PreviewField to inject the current viewportWidth.
	const fields = useMemo(
		() => [
			{
				id: 'preview',
				label: __('Preview', 'prc-chart-builder'),
				render: ({ item }) => (
					<PreviewField item={item} viewportWidth={viewportWidth} />
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
		[viewportWidth]
	);

	// A synthetic "blank" item that represents starting from the default
	// variation template rather than a saved pattern.
	const blankItem = useMemo(
		() => ({
			name: '__blank__',
			title: __('Blank', 'prc-chart-builder'),
			content: serializeVariationTemplate(chartType?.slug) ?? '',
			blocks: null,
		}),
		[chartType]
	);

	const allItems = useMemo(
		() => [blankItem, ...patterns],
		[blankItem, patterns]
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
				isItemClickable={() => true}
				onClickItem={(item) => onSelect(item)}
				search={false}
			/>
			<Button
				variant="secondary"
				onClick={onBack}
				icon={chevronLeft}
				style={{ marginTop: '12px' }}
			>
				{__('Back', 'prc-chart-builder')}
			</Button>
		</div>
	);
}

// ── Step 2: Tab bar (Pattern vs AI) ──────────────────────────────────────────

/**
 * Thin tab bar rendered above the pattern picker / AI step.
 * Only shown when the AI experiment is enabled (window.prcChartBuilderLibrary.aiEnabled).
 * @param {Object}   root0
 * @param {string}   root0.activeTab
 * @param {Function} root0.onChangeTab
 */
function Step2TabBar({ activeTab, onChangeTab }) {
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

// ── Step 3: Name + Create ─────────────────────────────────────────────────────

/**
 * Inject CSV data into serialized chart block content.
 * Replaces the prc-block/table inner block's head/body and updates
 * dataRender.categories on the chart block to match CSV column headers.
 *
 * @param {string} content Serialized block markup.
 * @param {string} csvText Raw CSV string.
 * @return {string} Updated serialized block markup.
 */
function injectCsvIntoContent(content, csvText) {
	if (!csvText.trim()) {
		return content;
	}
	const blocks = parse(content, { __unstableSkipMigrationLogs: true });
	const controller = blocks[0];
	if (!controller) {
		return content;
	}

	const tableBlock = controller.innerBlocks.find(
		(b) => b.name === 'prc-block/table'
	);
	const chartBlock = controller.innerBlocks.find(
		(b) => b.name === 'prc-chart-builder/chart'
	);

	if (tableBlock) {
		const tableAttrs = csvToTableAttributes(csvText);
		tableBlock.attributes = { ...tableBlock.attributes, ...tableAttrs };
	}

	if (chartBlock) {
		const { headers, rows } = parseCsv(csvText);
		const categories = inferCategories(headers, rows);
		if (categories.length) {
			chartBlock.attributes = {
				...chartBlock.attributes,
				dataRender: {
					...chartBlock.attributes.dataRender,
					categories,
				},
			};
		}
	}

	return serialize(blocks);
}

/**
 * Inject a title string into the chart block's metadata.title attribute.
 *
 * @param {string} content Serialized block markup.
 * @param {string} title   The chart title to apply.
 * @return {string} Updated serialized block markup.
 */
function injectTitleIntoContent(content, title) {
	if (!title.trim()) {
		return content;
	}
	const blocks = parse(content, { __unstableSkipMigrationLogs: true });
	const controller = blocks[0];
	if (!controller) {
		return content;
	}
	const chartBlock = controller.innerBlocks.find(
		(b) => b.name === 'prc-chart-builder/chart'
	);
	if (chartBlock) {
		chartBlock.attributes = {
			...chartBlock.attributes,
			metadata: {
				...chartBlock.attributes.metadata,
				title,
			},
		};
	}
	return serialize(blocks);
}

function CreateStep({
	chartType,
	pattern,
	initialCsvText = '',
	onBack,
	onChartCreated,
	mode = 'create-post',
}) {
	const [title, setTitle] = useState('');
	const [csvText, setCsvText] = useState(initialCsvText);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState(null);

	const isAiGenerated = pattern.name === '__ai_generated__';

	const handleCreate = useCallback(async () => {
		setIsCreating(true);
		setError(null);
		try {
			let content = pattern.content;
			if (csvText.trim()) {
				content = injectCsvIntoContent(content, csvText);
			}
			if (title.trim()) {
				content = injectTitleIntoContent(content, title);
			}
			if (mode === 'inline') {
				await onChartCreated(null, { content, title });
			} else {
				const chart = await createChartPost(title, content);
				await onChartCreated(chart.id, chart);
			}
		} catch (err) {
			setError(
				err?.message ||
					(mode === 'inline'
						? __('Failed to insert chart.', 'prc-chart-builder')
						: __('Failed to create chart.', 'prc-chart-builder'))
			);
			setIsCreating(false);
		}
	}, [title, csvText, pattern, onChartCreated, mode]);

	return (
		<div className="prc-chart-modal__create-step">
			<p className="prc-chart-modal__step-label">
				{__(
					'Give your chart a title to get started.',
					'prc-chart-builder'
				)}
			</p>
			<p className="prc-chart-modal__create-meta">
				<strong>{__('Type:', 'prc-chart-builder')}</strong>{' '}
				{chartType.label} &nbsp;·&nbsp;
				<strong>{__('Pattern:', 'prc-chart-builder')}</strong>{' '}
				{pattern.title}
			</p>

			{error && (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			)}

			<TextControl
				label={__('Chart Title', 'prc-chart-builder')}
				value={title}
				onChange={setTitle}
				placeholder={__(
					'e.g. US Broadband Adoption 2024',
					'prc-chart-builder'
				)}
				disabled={isCreating}
				__nextHasNoMarginBottom
			/>

			{!isAiGenerated && (
				<div style={{ marginTop: '16px' }}>
					<CsvDataInput
						csvText={csvText}
						onCsvChange={setCsvText}
						disabled={isCreating}
						label={__(
							'Your data (optional — replaces sample data)',
							'prc-chart-builder'
						)}
					/>
				</div>
			)}

			<Flex justify="flex-start" gap={3} style={{ marginTop: '16px' }}>
				<FlexItem>
					<Button
						variant="primary"
						onClick={handleCreate}
						disabled={isCreating}
						icon={isCreating ? null : plus}
					>
						{isCreating ? (
							<Flex gap={2}>
								<Spinner />
								{mode === 'inline'
									? __('Inserting…', 'prc-chart-builder')
									: __('Creating…', 'prc-chart-builder')}
							</Flex>
						) : mode === 'inline' ? (
							__('Insert Chart', 'prc-chart-builder')
						) : (
							__('Create Chart', 'prc-chart-builder')
						)}
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						variant="secondary"
						onClick={onBack}
						disabled={isCreating}
						icon={chevronLeft}
					>
						{__('Back', 'prc-chart-builder')}
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}

// ── Root Modal Component ──────────────────────────────────────────────────────

export default function CreateNewChartModal({
	isOpen,
	onOpen,
	onClose,
	initialCsvText = '',
	afterCreate,
	hideTrigger = false,
	mode = 'create-post',
}) {
	const [selectedType, setSelectedType] = useState(null);
	const [selectedPattern, setSelectedPattern] = useState(null);
	const [patterns, setPatterns] = useState([]);
	const [patternsLoading, setPatternsLoading] = useState(false);
	const [patternCounts, setPatternCounts] = useState({});
	const [allPatterns, setAllPatterns] = useState([]);
	const [termIdToSlug, setTermIdToSlug] = useState({});
	const [patternsError, setPatternsError] = useState(null);
	const [isPchImport, setIsPchImport] = useState(false);

	// Tab state for Step 2 — 'pattern' or 'ai'. Only shown when aiEnabled.
	const aiEnabled = !!window?.prcChartBuilderLibrary?.aiEnabled;
	const [activeTab, setActiveTab] = useState('pattern');

	useEffect(() => {
		const restUrl = (window?.prcChartBuilderLibrary?.restUrl || '').replace(
			/\/$/,
			''
		);
		const nonce = window?.prcChartBuilderLibrary?.nonce || '';
		const headers = { 'X-WP-Nonce': nonce };

		// Throws on non-2xx so Promise.all rejects and the UI can surface a
		// meaningful error. Returns both the parsed body and the raw response
		// so callers can read pagination headers.
		async function fetchJson(url) {
			const response = await fetch(url, { headers });
			if (!response.ok) {
				let message = `${response.status} ${response.statusText}`;
				try {
					const body = await response.json();
					if (body?.message) {
						message = `${message} — ${body.message}`;
					}
				} catch (_) {
					// Non-JSON error body; ignore.
				}
				const err = new Error(`${message} (${url})`);
				err.status = response.status;
				throw err;
			}
			return { data: await response.json(), response };
		}

		// Paginate /wp/v2/blocks so we don't silently drop patterns once the
		// total exceeds per_page. The safety cap prevents a runaway loop if
		// something goes sideways with the Totals headers.
		async function fetchAllBlocks() {
			const perPage = 100;
			const maxPages = 20;
			const { data: firstPage, response: firstResponse } =
				await fetchJson(
					`${restUrl}/wp/v2/blocks?per_page=${perPage}&context=edit&page=1`
				);
			const totalPages = Math.min(
				parseInt(
					firstResponse.headers.get('X-WP-TotalPages') || '1',
					10
				) || 1,
				maxPages
			);
			const first = Array.isArray(firstPage) ? firstPage : [];
			if (totalPages <= 1) {
				return first;
			}
			const rest = await Promise.all(
				Array.from({ length: totalPages - 1 }, (_, i) =>
					fetchJson(
						`${restUrl}/wp/v2/blocks?per_page=${perPage}&context=edit&page=${i + 2}`
					).then((r) => (Array.isArray(r.data) ? r.data : []))
				)
			);
			return [...first, ...rest.flat()];
		}

		Promise.all([
			fetchAllBlocks(),
			fetchJson(`${restUrl}/wp/v2/wp_pattern_category?per_page=100`).then(
				(r) => (Array.isArray(r.data) ? r.data : [])
			),
		])
			.then(([blocks, terms]) => {
				const idToSlug = {};
				terms.forEach((t) => {
					idToSlug[t.id] = t.slug;
				});

				setTermIdToSlug(idToSlug);
				setAllPatterns(blocks);
				setPatternsError(null);

				const counts = {};
				blocks.forEach((p) => {
					(p.wp_pattern_category || []).forEach((termId) => {
						const slug = idToSlug[termId];
						if (slug && slug.startsWith('prc-chart-builder-')) {
							const typeSlug = slug.replace(
								'prc-chart-builder-',
								''
							);
							counts[typeSlug] = (counts[typeSlug] || 0) + 1;
						}
					});
				});
				setPatternCounts(counts);
			})
			.catch((err) => {
				// eslint-disable-next-line no-console
				console.error(
					'[prc-chart-builder] Failed to load pattern library:',
					err
				);
				setPatternsError(
					err?.message ||
						__(
							'Failed to load the pattern library.',
							'prc-chart-builder'
						)
				);
			});
	}, []);

	useEffect(() => {
		if (!selectedType) {
			setPatterns([]);
			return;
		}
		setPatternsLoading(true);
		const targetSlug = `prc-chart-builder-${selectedType.slug}`;

		const filtered = allPatterns
			.filter((p) =>
				(p.wp_pattern_category || []).some(
					(termId) => termIdToSlug[termId] === targetSlug
				)
			)
			.map((p) => ({
				name: `wp-block-${p.id}`,
				title:
					p.title?.raw ||
					(typeof p.title === 'string' ? p.title : ''),
				description: p.excerpt?.raw || '',
				content:
					p.content?.raw ||
					(typeof p.content === 'string' ? p.content : ''),
			}));

		setPatterns(filtered);
		setPatternsLoading(false);
	}, [selectedType, allPatterns, termIdToSlug]);

	const handleClose = useCallback(() => {
		setSelectedType(null);
		setSelectedPattern(null);
		setPatterns([]);
		setActiveTab('pattern');
		setIsPchImport(false);
		onClose();
	}, [onClose]);

	const handleChartCreated = useCallback(
		async (postId, chart) => {
			if (afterCreate) {
				await afterCreate(postId, chart);
				handleClose();
			} else {
				window.location.href = getEditUrl(postId);
			}
		},
		[afterCreate, handleClose]
	);

	const handleSelectType = useCallback((term) => {
		setSelectedType(term);
		setSelectedPattern(null);
		setPatterns([]);
		setActiveTab('pattern');
	}, []);

	const handleSelectPattern = useCallback((pattern) => {
		setSelectedPattern(pattern);
	}, []);

	const handleBackToTypes = useCallback(() => {
		setSelectedType(null);
		setSelectedPattern(null);
		setPatterns([]);
		setActiveTab('pattern');
		setIsPchImport(false);
	}, []);

	const handleBackToPatterns = useCallback(() => {
		setSelectedPattern(null);
	}, []);

	/**
	 * Called by AICreateStep when the user accepts the generated content.
	 * We synthesize a pattern-like object and jump straight to Step 3 (Create).
	 */
	const handleAIAccept = useCallback(({ content, csvText }) => {
		setSelectedPattern({
			name: '__ai_generated__',
			title: __('AI Generated', 'prc-chart-builder'),
			content,
			csvText: csvText || '',
		});
	}, []);

	const isInlineMode = mode === 'inline';
	let modalTitle = isInlineMode
		? __('Add Chart', 'prc-chart-builder')
		: __('Add New Chart', 'prc-chart-builder');
	if (isPchImport) {
		modalTitle = __('Import from pewplots', 'prc-chart-builder');
	} else if (selectedType && !selectedPattern) {
		if (activeTab === 'ai') {
			modalTitle = `${selectedType.label} — ${__(
				'Chart Wizard (Experimental)',
				'prc-chart-builder'
			)}`;
		} else {
			modalTitle = `${selectedType.label} — ${__(
				'Choose a Pattern',
				'prc-chart-builder'
			)}`;
		}
	} else if (selectedPattern) {
		modalTitle = isInlineMode
			? __('Configure Chart', 'prc-chart-builder')
			: __('Name Your Chart', 'prc-chart-builder');
	}

	return (
		<>
			{!hideTrigger && (
				<Button
					variant="primary"
					onClick={onOpen}
					icon={plus}
					__next40pxDefaultSize
				>
					{__('Add New Chart', 'prc-chart-builder')}
				</Button>
			)}

			{isOpen && (
				<ModalPreviewShell>
					<Modal
						title={modalTitle}
						onRequestClose={handleClose}
						className="prc-chart-modal"
						size="large"
					>
						{patternsError && !isPchImport && !selectedPattern && (
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

						{!selectedType && !isPchImport && (
							<ChartTypePicker
								onSelect={handleSelectType}
								patternCounts={patternCounts}
								onImportPch={() => setIsPchImport(true)}
							/>
						)}

						{isPchImport && (
							<PchImportStep onBack={handleBackToTypes} />
						)}

						{selectedType && !selectedPattern && (
							<>
								{aiEnabled && (
									<Step2TabBar
										activeTab={activeTab}
										onChangeTab={setActiveTab}
									/>
								)}

								{activeTab === 'pattern' && (
									<PatternPicker
										chartType={selectedType}
										patterns={patterns}
										isLoading={patternsLoading}
										onBack={handleBackToTypes}
										onSelect={handleSelectPattern}
									/>
								)}

								{activeTab === 'ai' && (
									<AICreateStep
										chartType={selectedType}
										onBack={handleBackToTypes}
										onAccept={handleAIAccept}
									/>
								)}
							</>
						)}

						{selectedType && selectedPattern && (
							<CreateStep
								chartType={selectedType}
								pattern={selectedPattern}
								initialCsvText={
									selectedPattern.csvText ||
									initialCsvText ||
									''
								}
								onBack={handleBackToPatterns}
								onChartCreated={handleChartCreated}
								mode={mode}
							/>
						)}
					</Modal>
				</ModalPreviewShell>
			)}
		</>
	);
}
