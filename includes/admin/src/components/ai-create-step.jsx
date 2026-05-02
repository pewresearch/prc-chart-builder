/**
 * AI Create Step component.
 *
 * Renders a multi-input panel that lets the user generate a chart
 * from a text description, an uploaded PNG, and/or pasted CSV data.
 * On success, a live BlockPreview of the generated markup is shown
 * with Accept and Regenerate actions.
 *
 * This component is only mounted when window.prcChartBuilderLibrary.aiEnabled
 * is true (set by Chart_AI_Experiment::localize_experiment_data()).
 *
 * @package
 */

/**
 * WordPress Dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import {
	Button,
	CheckboxControl,
	Flex,
	FlexItem,
	Icon,
	Notice,
	Spinner,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	check,
	chevronLeft,
	close,
	create as magicIcon,
	rotateRight,
	upload,
} from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import CsvDataInput from './csv-data-input';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read a File object as a base64 data-URL string.
 *
 * @param {File} file
 * @return {Promise<string>} base64 data-URL (e.g. "data:image/png;base64,...")
 */
function readFileAsBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Simple drag-and-drop + click PNG upload zone.
 * @param root0
 * @param root0.imageFile
 * @param root0.onImageChange
 */
function ImageDropZone({ imageFile, onImageChange }) {
	const inputRef = useRef(null);
	const [isDragOver, setIsDragOver] = useState(false);

	const handleDrop = useCallback(
		(e) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file && file.type.startsWith('image/')) {
				onImageChange(file);
			}
		},
		[onImageChange]
	);

	const handleFileInput = useCallback(
		(e) => {
			const file = e.target.files[0];
			if (file) {
				onImageChange(file);
			}
		},
		[onImageChange]
	);

	return (
		<div
			className={[
				'prc-ai-create__dropzone',
				isDragOver && 'prc-ai-create__dropzone--drag-over',
				imageFile && 'prc-ai-create__dropzone--has-file',
			]
				.filter(Boolean)
				.join(' ')}
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragOver(true);
			}}
			onDragLeave={() => setIsDragOver(false)}
			onDrop={handleDrop}
			onClick={() => inputRef.current?.click()}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					inputRef.current?.click();
				}
			}}
			aria-label={__('Upload chart image', 'prc-chart-builder')}
		>
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				style={{ display: 'none' }}
				onChange={handleFileInput}
			/>
			{imageFile ? (
				<Flex align="center" gap={2}>
					<Icon icon={check} size={16} />
					<span className="prc-ai-create__dropzone-filename">
						{imageFile.name}
					</span>
					<Button
						icon={close}
						isSmall
						label={__('Remove image', 'prc-chart-builder')}
						onClick={(e) => {
							e.stopPropagation();
							onImageChange(null);
						}}
					/>
				</Flex>
			) : (
				<Flex direction="column" align="center" gap={2}>
					<Icon icon={upload} size={24} />
					<span>
						{__(
							'Drop a PNG/JPG or click to browse',
							'prc-chart-builder'
						)}
					</span>
				</Flex>
			)}
		</div>
	);
}

/**
 * Preview pane shown after a successful AI generation.
 * @param root0
 * @param root0.content
 * @param root0.chartType
 * @param root0.onAccept
 * @param root0.onRegenerate
 * @param root0.isRegenerating
 */
function AIPreview({
	content,
	chartType,
	onAccept,
	onRegenerate,
	isRegenerating,
}) {
	const blocks = useMemo(() => {
		if (!content) {
			return [];
		}
		const parsed = parse(content, { __unstableSkipMigrationLogs: true });
		return parsed;
	}, [content]);

	return (
		<div className="prc-ai-create__preview">
			<p className="prc-ai-create__preview-label">
				{__(
					'AI-generated preview — review before creating:',
					'prc-chart-builder'
				)}
			</p>

			<div className="prc-ai-create__preview-frame">
				{blocks.length > 0 ? (
					<BlockPreview blocks={blocks} viewportWidth={1200} />
				) : (
					<Flex justify="center" style={{ padding: '32px' }}>
						<Spinner />
					</Flex>
				)}
			</div>

			<Flex gap={3} style={{ marginTop: '16px' }}>
				<FlexItem>
					<Button variant="primary" icon={check} onClick={onAccept}>
						{__('Accept & Continue', 'prc-chart-builder')}
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						variant="secondary"
						icon={isRegenerating ? null : rotateRight}
						onClick={onRegenerate}
						disabled={isRegenerating}
					>
						{isRegenerating ? (
							<Flex gap={2}>
								<Spinner />
								{__('Regenerating…', 'prc-chart-builder')}
							</Flex>
						) : (
							__('Regenerate', 'prc-chart-builder')
						)}
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * AICreateStep — Step 2b of the "Add New Chart" modal.
 *
 * @param {Object}   props
 * @param {Object}   props.chartType The selected chart type term { slug, label }.
 * @param {Function} props.onBack    Navigate back to the tab bar.
 * @param {Function} props.onAccept  Called with { content } when the user accepts the preview.
 */
export default function AICreateStep({ chartType, onBack, onAccept }) {
	const [description, setDescription] = useState('');
	const [imageFile, setImageFile] = useState(null);
	const [csvText, setCsvText] = useState('');
	const [model, setModel] = useState('claude-sonnet-4-6');
	const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);

	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [generatedContent, setGeneratedContent] = useState(null);

	// ── Generate ───────────────────────────────────────────────────────────

	const generate = useCallback(async () => {
		setIsGenerating(true);
		setError(null);
		setGeneratedContent(null);

		try {
			const restUrl = (
				window?.prcChartBuilderLibrary?.restUrl || ''
			).replace(/\/$/, '');
			const nonce = window?.prcChartBuilderLibrary?.nonce || '';

			const body = {
				chartType: chartType.slug,
				description,
				csvData: csvText,
				model,
				image: '',
			};

			if (imageFile) {
				body.image = await readFileAsBase64(imageFile);
			}

			const response = await fetch(
				`${restUrl}/prc-chart-builder/v1/ai/generate`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': nonce,
					},
					body: JSON.stringify(body),
				}
			);

			const data = await response.json();

			if (!response.ok || data.error) {
				throw new Error(
					data?.message ||
						data?.error ||
						__('Generation failed.', 'prc-chart-builder')
				);
			}

			if (!data.content) {
				throw new Error(
					__('No chart content was returned.', 'prc-chart-builder')
				);
			}

			setGeneratedContent({ content: data.content, csvText });
		} catch (err) {
			setError(
				err?.message ||
					__('An unexpected error occurred.', 'prc-chart-builder')
			);
		} finally {
			setIsGenerating(false);
		}
	}, [chartType, description, csvText, imageFile, model]);

	const handleRegenerate = useCallback(() => {
		generate();
	}, [generate]);

	const handleAccept = useCallback(() => {
		if (generatedContent) {
			onAccept({
				content: generatedContent.content,
				csvText: generatedContent.csvText,
			});
		}
	}, [generatedContent, onAccept]);

	// ── Render ─────────────────────────────────────────────────────────────

	// After a successful generation, switch to the preview state.
	if (generatedContent) {
		return (
			<div className="prc-ai-create prc-ai-create--preview-state">
				<AIPreview
					content={generatedContent.content}
					chartType={chartType}
					onAccept={handleAccept}
					onRegenerate={handleRegenerate}
					isRegenerating={isGenerating}
				/>
				{error && (
					<Notice
						status="error"
						isDismissible={false}
						style={{ marginTop: '12px' }}
					>
						{error}
					</Notice>
				)}
				<Button
					variant="tertiary"
					onClick={() => setGeneratedContent(null)}
					icon={chevronLeft}
					style={{ marginTop: '8px' }}
				>
					{__('Edit inputs', 'prc-chart-builder')}
				</Button>
			</div>
		);
	}

	const canGenerate =
		(description.trim() || imageFile || csvText.trim()) &&
		acknowledgedRisks;

	return (
		<div className="prc-ai-create">
			{/* temporary warning label  */}
			<Notice
				status="warning"
				isDismissible={false}
				style={{ marginBottom: '12px' }}
			>
				{__(
					'This feature is very experimental and may not produce expected results. Please use with caution.',
					'prc-chart-builder'
				)}
			</Notice>

			<p className="prc-ai-create__intro">
				{sprintf(
					/* translators: %s: chart type label (e.g. "Bar") */
					__(
						'Describe the %s chart you want to create. Optionally upload a reference image and/or paste CSV data.',
						'prc-chart-builder'
					),
					chartType.label
				)}
			</p>

			{error && (
				<Notice
					status="error"
					isDismissible
					onRemove={() => setError(null)}
					style={{ marginBottom: '12px' }}
				>
					{error}
				</Notice>
			)}

			{/* Image upload */}
			<div className="prc-ai-create__section">
				<label
					className="prc-ai-create__section-label"
					htmlFor="image-upload"
				>
					{__('Reference image (optional)', 'prc-chart-builder')}
				</label>
				<ImageDropZone
					id="image-upload"
					imageFile={imageFile}
					onImageChange={setImageFile}
				/>
			</div>

			{/* CSV data */}
			<div className="prc-ai-create__section">
				<CsvDataInput
					csvText={csvText}
					onCsvChange={setCsvText}
					disabled={isGenerating}
					label={__('CSV data (optional)', 'prc-chart-builder')}
					placeholder={__(
						'Paste CSV here, or drop/upload a .csv file…',
						'prc-chart-builder'
					)}
					rows={5}
				/>
			</div>

			{/* Text description */}
			<div className="prc-ai-create__section">
				<TextControl
					label={__('Description', 'prc-chart-builder')}
					value={description}
					onChange={setDescription}
					placeholder={__(
						'e.g. a line chart with a green color scheme showing monthly trends',
						'prc-chart-builder'
					)}
					disabled={isGenerating}
					__nextHasNoMarginBottom
				/>
			</div>

			{/* Model selection */}
			<div className="prc-ai-create__section">
				<ToggleGroupControl
					label={__('Model', 'prc-chart-builder')}
					value={model}
					onChange={setModel}
					isBlock
					disabled={isGenerating}
					__nextHasNoMarginBottom
				>
					<ToggleGroupControlOption
						value="claude-haiku-4-5"
						label={__('Haiku (fastest)', 'prc-chart-builder')}
						showTooltip
						aria-label={__(
							'Claude Haiku — fastest',
							'prc-chart-builder'
						)}
					/>
					<ToggleGroupControlOption
						value="claude-sonnet-4-6"
						label={__('Sonnet (default)', 'prc-chart-builder')}
						showTooltip
						aria-label={__(
							'Claude Sonnet — balanced (default)',
							'prc-chart-builder'
						)}
					/>
					<ToggleGroupControlOption
						value="claude-opus-4-7"
						label={__('Opus (most capable)', 'prc-chart-builder')}
						showTooltip
						aria-label={__(
							'Claude Opus — most capable',
							'prc-chart-builder'
						)}
					/>
				</ToggleGroupControl>
			</div>

			{/* Risk acknowledgment gate */}
			<div
				className="prc-ai-create__section"
				style={{ marginTop: '16px' }}
			>
				<CheckboxControl
					label={__(
						'I understand the risks of using the Chart Wizard and will carefully review output before publication.',
						'prc-chart-builder'
					)}
					checked={acknowledgedRisks}
					onChange={setAcknowledgedRisks}
					disabled={isGenerating}
				/>
			</div>

			{/* Actions */}
			<Flex gap={3} style={{ marginTop: '16px' }}>
				<FlexItem>
					<Button
						variant="primary"
						icon={isGenerating ? null : magicIcon}
						onClick={generate}
						disabled={isGenerating || !canGenerate}
					>
						{isGenerating ? (
							<Flex gap={2}>
								<Spinner />
								{__('Generating chart…', 'prc-chart-builder')}
							</Flex>
						) : (
							__('Generate Chart', 'prc-chart-builder')
						)}
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						variant="secondary"
						onClick={onBack}
						disabled={isGenerating}
						icon={chevronLeft}
					>
						{__('Back', 'prc-chart-builder')}
					</Button>
				</FlexItem>
			</Flex>

			{isGenerating && (
				<Notice
					status="info"
					isDismissible={false}
					style={{ marginTop: '12px' }}
				>
					{__(
						'Generating with Chart Wizard. This can take a few moments.',
						'prc-chart-builder'
					)}
				</Notice>
			)}
		</div>
	);
}
