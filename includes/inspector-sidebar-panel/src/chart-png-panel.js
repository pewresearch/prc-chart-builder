/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Notice, ExternalLink, Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	createPNG,
	createPNGsForMultipleCharts,
	createAttributesHash,
} from '../../../src/chart/utils/image-exports';

/**
 * Helper function to recursively find all chart blocks
 *
 * @param {Array} blocks Array of blocks to search
 * @return {Array} Array of chart blocks found
 */
function findChartBlocks(blocks) {
	const chartBlocks = [];

	for (const block of blocks) {
		if (block.name === 'prc-chart-builder/chart') {
			chartBlocks.push(block);
		}
		// Also check inner blocks recursively
		if (block.innerBlocks && block.innerBlocks.length > 0) {
			chartBlocks.push(...findChartBlocks(block.innerBlocks));
		}
	}

	return chartBlocks;
}

/**
 * WeakMap cache for storing change detection results per block
 * Automatically garbage collected when blocks are removed from editor
 * Stores both the result and the attributes hash to detect stale cache
 */
const hasChartAttributesChangedCache = new WeakMap();

/**
 * Helper function to check if chart attributes have changed since PNG generation
 * Uses WeakMap caching to avoid expensive recalculations on every render
 *
 * @param {Object} block Block object with attributes
 * @return {boolean} True if attributes have changed
 */
function hasChartAttributesChanged(block) {
	const storedHash = block.attributes?.io?.pngAttributesHash;

	// Early return if no stored hash - nothing to compare
	if (!storedHash) {
		return false;
	}

	// Check cache and validate it's still current
	const cached = hasChartAttributesChangedCache.get(block);
	if (cached) {
		// Only use cache if the stored PNG hash hasn't changed
		// (meaning we're looking at the same PNG generation)
		if (cached.pngHash === storedHash) {
			return cached.hasChanged;
		}
	}

	// Use shared hash function to ensure consistency with PNG generation
	const currentHash = createAttributesHash(block.attributes);
	const hasChanged = currentHash !== storedHash;

	// Cache the result along with the PNG hash for validation
	hasChartAttributesChangedCache.set(block, {
		hasChanged,
		pngHash: storedHash,
	});

	return hasChanged;
}

/**
 * Format timestamp for display
 *
 * @param {string} isoString ISO date string
 * @return {string} Formatted date string
 */
function formatTimestamp(isoString) {
	if (!isoString) return '';

	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return __('Just now', 'prc-chart-builder');
	if (diffMins < 60)
		return `${diffMins} ${__('minutes ago', 'prc-chart-builder')}`;

	const diffHours = Math.floor(diffMs / 3600000);
	if (diffHours < 24)
		return `${diffHours} ${__('hours ago', 'prc-chart-builder')}`;

	const diffDays = Math.floor(diffMs / 86400000);
	if (diffDays < 7)
		return `${diffDays} ${__('days ago', 'prc-chart-builder')}`;

	return date.toLocaleDateString();
}

/**
 * Pre-Publish Panel for Chart PNG Generation Reminder
 */
export function ChartPngPrePublishPanel() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState({ completed: 0, total: 0 });
	const [generationResults, setGenerationResults] = useState(null);

	const { chartBlocks } = useSelect((select) => {
		const blocks = select(blockEditorStore).getBlocks();
		return {
			chartBlocks: findChartBlocks(blocks),
		};
	}, []);

	// Check which charts are missing PNG URLs and are not static/freeform charts
	const chartsMissingPng = useMemo(() => {
		return chartBlocks.filter((block) => {
			const pngUrl = block.attributes?.io?.pngUrl;
			const isStaticChart = block.attributes?.io?.isStaticChart;
			const isFreeformChart = block.attributes?.io?.isFreeformChart;

			// Skip static/freeform charts - they may have different structure
			if (isStaticChart || isFreeformChart) {
				return false;
			}

			return !pngUrl || pngUrl.length === 0;
		});
	}, [chartBlocks]);

	// Check for any charts with outdated PNGs
	// Memoize to avoid recalculating on every render
	const chartsWithOutdatedPngs = useMemo(() => {
		return chartBlocks.filter((block) => {
			return hasChartAttributesChanged(block);
		});
	}, [chartBlocks]);

	// Clear generation results if any charts have been modified
	// This ensures we don't show stale success messages
	useEffect(() => {
		if (generationResults && chartsWithOutdatedPngs.length > 0) {
			// Check if any of the generated charts are now outdated
			const hasOutdatedGeneration = generationResults.some((result) => {
				return chartsWithOutdatedPngs.some(
					(block) => block.clientId === result.clientId
				);
			});

			if (hasOutdatedGeneration) {
				setGenerationResults(null);
			}
		}
	}, [chartsWithOutdatedPngs, generationResults]);

	// Don't show the panel if there are no chart blocks
	if (chartBlocks.length === 0) {
		return null;
	}

	const handleGenerateAll = () => {
		const clientIds = chartsMissingPng.map((block) => block.clientId);
		setIsGenerating(true);
		setGenerationResults(null);
		setProgress({ completed: 0, total: clientIds.length });

		createPNGsForMultipleCharts({
			clientIds,
			onProgress: ({ completed, total }) => {
				setProgress({ completed, total });
			},
			onComplete: (results) => {
				setIsGenerating(false);
				setGenerationResults(results);
			},
			onError: (error) => {
				// eslint-disable-next-line no-console
				console.error('Error generating PNG:', error);
			},
		});
	};

	// Show results after generation
	if (generationResults) {
		const successCount = generationResults.filter((r) => r.success).length;
		const failedCount = generationResults.filter((r) => !r.success).length;

		return (
			<PluginPrePublishPanel
				title={__('Chart Images', 'prc-chart-builder')}
				icon="chart-line"
				initialOpen={true}
			>
				<Notice status="success" isDismissible={false}>
					<p>
						{successCount === 1
							? __(
									'1 chart image generated!',
									'prc-chart-builder'
								)
							: `${successCount} ${__('chart images generated!', 'prc-chart-builder')}`}
					</p>
					{failedCount > 0 && (
						<p style={{ marginTop: '8px', color: '#cc1818' }}>
							{failedCount === 1
								? __(
										'1 chart failed to generate.',
										'prc-chart-builder'
									)
								: `${failedCount} ${__('charts failed to generate.', 'prc-chart-builder')}`}
						</p>
					)}
				</Notice>
				<div style={{ marginTop: '12px' }}>
					{generationResults
						.filter((r) => r.success && r.fileObj)
						.map((result, index) => (
							<div
								key={result.clientId}
								style={{
									marginBottom: '12px',
									padding: '8px',
									border: '1px solid #ddd',
									borderRadius: '4px',
								}}
							>
								<div
									style={{
										display: 'flex',
										gap: '8px',
										alignItems: 'flex-start',
									}}
								>
									<img
										src={result.fileObj.url}
										alt={`Chart ${index + 1}`}
										style={{
											width: '60px',
											height: '60px',
											objectFit: 'cover',
											borderRadius: '2px',
											flexShrink: 0,
										}}
									/>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												fontSize: '12px',
												fontWeight: 500,
												marginBottom: '4px',
											}}
										>
											{__('Chart', 'prc-chart-builder')}{' '}
											{index + 1}
										</div>
										<ExternalLink
											href={`${window.prcPlatform.siteUrl}/wp-admin/upload.php?item=${result.fileObj.id}`}
											style={{ fontSize: '11px' }}
										>
											{__(
												'View Image',
												'prc-chart-builder'
											)}
										</ExternalLink>
									</div>
								</div>
							</div>
						))}
				</div>
				<Button
					variant="tertiary"
					onClick={() => setGenerationResults(null)}
					style={{ marginTop: '8px' }}
				>
					{__('Done', 'prc-chart-builder')}
				</Button>
			</PluginPrePublishPanel>
		);
	}

	// All charts have PNGs - show success message with details
	if (chartsMissingPng.length === 0) {
		return (
			<PluginPrePublishPanel
				title={__('Chart Images', 'prc-chart-builder')}
				icon="chart-line"
				initialOpen={true}
			>
				{chartsWithOutdatedPngs.length > 0 && (
					<Notice status="warning" isDismissible={false}>
						<p>
							{chartsWithOutdatedPngs.length === 1
								? __(
										'1 chart has been modified since its PNG was generated.',
										'prc-chart-builder'
									)
								: `${chartsWithOutdatedPngs.length} ${__('charts have been modified since their PNGs were generated.', 'prc-chart-builder')}`}
						</p>
						<p style={{ marginTop: '8px', fontSize: '12px' }}>
							{__(
								'Consider regenerating to ensure the images match the current charts.',
								'prc-chart-builder'
							)}
						</p>
					</Notice>
				)}
				{chartsWithOutdatedPngs.length === 0 && (
					<p style={{ color: 'var(--wp-components-color-accent)' }}>
						{__(
							'All charts have static PNG images generated.',
							'prc-chart-builder'
						)}
					</p>
				)}
				<div style={{ marginTop: '12px' }}>
					{chartBlocks
						.filter(
							(block) =>
								!block.attributes?.io?.isStaticChart &&
								!block.attributes?.io?.isFreeformChart
						)
						.map((block, index) => {
							const pngGeneratedAt =
								block.attributes?.io?.pngGeneratedAt;
							const hasChanged = hasChartAttributesChanged(block);

							return (
								<div
									key={block.clientId}
									style={{
										marginBottom: '8px',
										padding: '8px',
										border: '1px solid #ddd',
										borderRadius: '4px',
										backgroundColor: hasChanged
											? '#fff8e5'
											: 'transparent',
									}}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											fontSize: '12px',
										}}
									>
										<div>
											<strong>
												{__(
													'Chart',
													'prc-chart-builder'
												)}{' '}
												{index + 1}
											</strong>
											{pngGeneratedAt && (
												<div
													style={{
														color: '#757575',
														marginTop: '4px',
													}}
												>
													{__(
														'Generated',
														'prc-chart-builder'
													)}{' '}
													{formatTimestamp(
														pngGeneratedAt
													)}
													{hasChanged && (
														<span
															style={{
																color: '#cc7a00',
																marginLeft:
																	'8px',
															}}
														>
															•{' '}
															{__(
																'Modified',
																'prc-chart-builder'
															)}
														</span>
													)}
												</div>
											)}
										</div>
										<Button
											variant="tertiary"
											size="small"
											onClick={() => {
												setIsGenerating(true);
												setGenerationResults(null);
												setProgress({
													completed: 0,
													total: 1,
												});

												createPNG({
													clientId: block.clientId,
													onComplete: (fileObj) => {
														setIsGenerating(false);
														setGenerationResults([
															{
																clientId:
																	block.clientId,
																success: true,
																fileObj,
															},
														]);
													},
													onError: (error) => {
														setIsGenerating(false);
														setGenerationResults([
															{
																clientId:
																	block.clientId,
																success: false,
																error,
															},
														]);
													},
												});
											}}
											disabled={isGenerating}
										>
											{__(
												'Regenerate',
												'prc-chart-builder'
											)}
										</Button>
									</div>
								</div>
							);
						})}
				</div>
			</PluginPrePublishPanel>
		);
	}

	// Some charts are missing PNGs - show recommendation and generate button
	return (
		<PluginPrePublishPanel
			title={__('Chart Images', 'prc-chart-builder')}
			icon="chart-line"
			initialOpen={true}
		>
			<Notice status="warning" isDismissible={false}>
				<p>
					{chartsMissingPng.length === 1
						? __(
								'1 chart is missing a static PNG image.',
								'prc-chart-builder'
							)
						: `${chartsMissingPng.length} ${__('charts are missing static PNG images.', 'prc-chart-builder')}`}
				</p>
				<p style={{ marginTop: '8px' }}>
					{__(
						'For better social sharing and fallback display, we recommend generating PNG images for all charts.',
						'prc-chart-builder'
					)}
				</p>
			</Notice>
			<div style={{ marginTop: '12px' }}>
				<Button
					variant="secondary"
					isBusy={isGenerating}
					disabled={isGenerating}
					onClick={handleGenerateAll}
				>
					{/* eslint-disable-next-line no-nested-ternary */}
					{isGenerating
						? `${__('Generating', 'prc-chart-builder')} (${progress.completed}/${progress.total})…`
						: chartsMissingPng.length === 1
							? __('Generate PNG Image', 'prc-chart-builder')
							: `${__('Generate All', 'prc-chart-builder')} (${chartsMissingPng.length}) ${__('PNG Images', 'prc-chart-builder')}`}
				</Button>
				{isGenerating && (
					<p
						style={{
							marginTop: '8px',
							fontSize: '12px',
							color: 'var(--wp-components-color-gray-600)',
						}}
					>
						{__(
							'This may take a moment. Please wait…',
							'prc-chart-builder'
						)}
					</p>
				)}
			</div>
		</PluginPrePublishPanel>
	);
}
