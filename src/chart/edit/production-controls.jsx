/**
 * WordPress Dependencies
 */
import { useState } from '@wordpress/element';
import {
	Button,
	ExternalLink,
	PanelBody,
	PanelRow,
	TextControl,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { brush, copy, download, undo, update } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal Dependencies
 */
import { createSVG } from '../utils/image-exports';
import useCopyPasteStyles from './hooks/use-copy-paste-styles';

const CHART_POST_TYPE = 'chart';

const descriptionStyle = {
	fontSize: '12px',
	// set the color to be ui text color
	color: 'var(--wp--preset--color--ui-text-color, #2a2a2a)',
	margin: '0 0 8px',
	lineHeight: '1.4',
};

const warningStyle = {
	...descriptionStyle,
	color: 'var(--wp--preset--color--alert-red, #cc1818)',
};

/**
 * Production-oriented inspector controls for the chart block.
 *
 * Consolidates image/data exports and editor utility buttons into a single
 * "Production Tools" panel, keeping all chart-production tasks in one place:
 *
 *  1. Reset Viewport Overrides  – destructively clears mobile/tablet overrides.
 *  2. Force Regenerate PNG      – re-schedules the server-side ScreenshotOne job.
 *  3. Copy Data & Config        – clipboard snapshot for developer diagnostics.
 *  4. Download SVG              – raw SVG of the chart element (no title/footer).
 *  5. PNG URL / preview         – link to the auto-generated static PNG.
 *  6. Allow data download       – toggle the public CSV download link.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Block setAttributes.
 * @param {string}   props.clientId      Block client ID.
 */
export default function ProductionControls({
	attributes,
	setAttributes,
	clientId,
}) {
	const [isCopied, setIsCopied] = useState(false);
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [regenMessage, setRegenMessage] = useState(null);
	const [svgLoading, setSvgLoading] = useState(false);
	const [stylesCopied, setStylesCopied] = useState(false);
	const { hasCopiedStyles, copyStyles, pasteStyles } = useCopyPasteStyles(
		attributes,
		setAttributes
	);

	const { postId, postType } = useSelect((select) => {
		const { getCurrentPostId, getCurrentPostType } = select(editorStore);
		return {
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
		};
	}, []);

	const isChartPost = postType === CHART_POST_TYPE;
	const io = attributes.io || {};
	const { pngUrl } = io;

	const mobileOverrideCount = Object.keys(attributes.mobile || {}).length;
	const tabletOverrideCount = Object.keys(attributes.tablet || {}).length;
	const hasViewportOverrides =
		mobileOverrideCount > 0 || tabletOverrideCount > 0;

	// -----------------------------------------------------------------------
	// Reset viewport-specific attribute overrides.
	// -----------------------------------------------------------------------
	const handleResetViewportAttributes = () => {
		setAttributes({ mobile: {}, tablet: {} });
	};

	// -----------------------------------------------------------------------
	// Force re-schedule the server-side ScreenshotOne PNG generation job.
	// -----------------------------------------------------------------------
	const handleForceRegeneratePng = async () => {
		if (!isChartPost || !postId) return;

		setIsRegenerating(true);
		setRegenMessage(null);

		try {
			await apiFetch({
				path: `/prc-chart-builder/v1/chart/${postId}/regenerate-png`,
				method: 'POST',
			});
			setRegenMessage(
				__('PNG regeneration scheduled.', 'prc-chart-builder')
			);
		} catch (err) {
			const msg =
				err?.message || __('Unknown error.', 'prc-chart-builder');
			setRegenMessage(
				// translators: %s is an error message.
				sprintf(__('Error: %s', 'prc-chart-builder'), msg)
			);
		} finally {
			setIsRegenerating(false);
			setTimeout(() => setRegenMessage(null), 5000);
		}
	};

	// -----------------------------------------------------------------------
	// Copy the chart's data and all config attributes to the clipboard.
	// -----------------------------------------------------------------------
	const handleCopyDataAndConfig = () => {
		const {
			io: ioAttrs,
			mobile: _m,
			tablet: _t,
			...configAttributes
		} = attributes;
		const payload = {
			chartId: attributes.id || clientId,
			data: ioAttrs?.chartData || [],
			config: configAttributes,
			viewportOverrides: {
				mobile: attributes.mobile || {},
				tablet: attributes.tablet || {},
			},
		};

		window.navigator.clipboard
			.writeText(JSON.stringify(payload, null, 2))
			.then(() => {
				setIsCopied(true);
				setTimeout(() => setIsCopied(false), 2500);
			})
			.catch(() => {
				// eslint-disable-next-line no-alert
				window.prompt(
					__(
						'Copy the chart data (Ctrl+C / ⌘+C):',
						'prc-chart-builder'
					),
					JSON.stringify(payload)
				);
			});
	};

	const handleCopyStyles = () => {
		copyStyles();
		setStylesCopied(true);
		setTimeout(() => setStylesCopied(false), 2500);
	};

	// -----------------------------------------------------------------------
	// Download the raw SVG of the chart element (no title/footer/legend).
	// -----------------------------------------------------------------------
	const handleDownloadSvg = () => {
		setSvgLoading(true);
		createSVG({
			clientId,
			upload: false,
			onComplete: () => setSvgLoading(false),
			onError: () => setSvgLoading(false),
		});
	};

	return (
		<InspectorControls>
			<PanelBody
				title={__('Production Tools', 'prc-chart-builder')}
				initialOpen={false}
			>
				{/* ── Viewport Overrides ─────────────────────────────── */}
				<PanelRow>
					<p style={warningStyle}>
						{__(
							'Viewport overrides let you customise how the chart appears on tablet and mobile independently of desktop. Resetting them is permanent — all mobile and tablet tweaks will be lost and both viewports will fall back to the desktop settings.',
							'prc-chart-builder'
						)}
					</p>
				</PanelRow>
				<PanelRow>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={undo}
						onClick={handleResetViewportAttributes}
						isDestructive
						disabled={!hasViewportOverrides}
					>
						{hasViewportOverrides
							? sprintf(
									// translators: %s is a summary like "2 mobile, 1 tablet".
									__(
										'Reset Viewport Overrides (%s)',
										'prc-chart-builder'
									),
									[
										mobileOverrideCount > 0 &&
											sprintf(
												// translators: %d is the number of mobile overrides.
												__(
													'%d mobile',
													'prc-chart-builder'
												),
												mobileOverrideCount
											),
										tabletOverrideCount > 0 &&
											sprintf(
												// translators: %d is the number of tablet overrides.
												__(
													'%d tablet',
													'prc-chart-builder'
												),
												tabletOverrideCount
											),
									]
										.filter(Boolean)
										.join(', ')
								)
							: __(
									'Reset Viewport Overrides',
									'prc-chart-builder'
								)}
					</Button>
				</PanelRow>

				{/* ── Force Regenerate PNG (chart CPT only) ──────────── */}
				{isChartPost && (
					<>
						<PanelRow>
							<p style={descriptionStyle}>
								{__(
									'The chart PNG is captured automatically when you publish or update. Use this if the initial capture looked wrong (e.g. the chart was still animating). The job runs asynchronously — check Action Scheduler for progress.',
									'prc-chart-builder'
								)}
							</p>
						</PanelRow>
						<PanelRow>
							<Button
								__next40pxDefaultSize
								variant="secondary"
								icon={update}
								onClick={handleForceRegeneratePng}
								isBusy={isRegenerating}
							>
								{__(
									'Force Regenerate PNG',
									'prc-chart-builder'
								)}
							</Button>
						</PanelRow>
						{regenMessage && (
							<PanelRow>
								<p
									style={{
										fontSize: '12px',
										margin: '0',
										color: regenMessage.startsWith('Error')
											? 'var(--wp--preset--color--alert-red)'
											: 'inherit',
									}}
								>
									{regenMessage}
								</p>
							</PanelRow>
						)}
					</>
				)}

				{/* ── Copy Data & Config ─────────────────────────────── */}
				<PanelRow>
					<p style={descriptionStyle}>
						{__(
							'Copies the chart data and all block config attributes as JSON to your clipboard. Share this with a developer to help diagnose rendering issues without needing editor access.',
							'prc-chart-builder'
						)}
					</p>
				</PanelRow>
				<PanelRow>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={copy}
						onClick={handleCopyDataAndConfig}
					>
						{isCopied
							? __('Copied!', 'prc-chart-builder')
							: __('Copy Data & Config', 'prc-chart-builder')}
					</Button>
				</PanelRow>

				{/* ── Copy / Paste Chart Styles ──────────────────────── */}
				<PanelRow>
					<p style={descriptionStyle}>
						{__(
							'Copies this chart’s visual styles (colors, axes, legend, labels, layout) so you can paste them onto another chart. Data is not copied. Copied styles are available in other editor tabs for 24 hours.',
							'prc-chart-builder'
						)}
					</p>
				</PanelRow>
				<PanelRow>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={copy}
						onClick={handleCopyStyles}
					>
						{stylesCopied
							? __('Styles Copied!', 'prc-chart-builder')
							: __('Copy Chart Styles', 'prc-chart-builder')}
					</Button>
				</PanelRow>
				<PanelRow>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={brush}
						onClick={pasteStyles}
						disabled={!hasCopiedStyles}
					>
						{__('Paste Chart Styles', 'prc-chart-builder')}
					</Button>
				</PanelRow>

				{/* ── SVG Download ───────────────────────────────────── */}
				<PanelRow>
					<p style={descriptionStyle}>
						{__(
							'Downloads the raw SVG of the chart element — no title, legend, or footer. Useful for continued design work in Illustrator or Figma.',
							'prc-chart-builder'
						)}
					</p>
				</PanelRow>
				<PanelRow>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={download}
						isBusy={svgLoading}
						onClick={handleDownloadSvg}
					>
						{__('Download SVG', 'prc-chart-builder')}
					</Button>
				</PanelRow>
				{svgLoading && (
					<PanelRow>
						<p style={{ fontSize: '12px', margin: '0' }}>
							{__('Preparing SVG…', 'prc-chart-builder')}
						</p>
					</PanelRow>
				)}

				{/* ── PNG URL / preview ──────────────────────────────── */}
				{pngUrl && pngUrl.length > 0 && (
					<>
						<PanelRow>
							<TextControl
								__next40pxDefaultSize
								label={__('PNG URL', 'prc-chart-builder')}
								value={pngUrl}
								onChange={() => {}}
							/>
						</PanelRow>
						<PanelRow>
							<ExternalLink href={pngUrl}>
								{__('Preview PNG', 'prc-chart-builder')}
							</ExternalLink>
						</PanelRow>
					</>
				)}
			</PanelBody>
		</InspectorControls>
	);
}
