/* eslint-disable max-lines */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
import { ResizableBox, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * External Dependencies
 */
import {
	ChartBuilderWrapper,
	ChartBuilderTextWrapper,
} from '@prc/charting-library';
// eslint-disable-next-line
import { Fragment, memo, useEffect, useMemo, useState } from 'react';

/**
 * Internal Dependencies
 */
import { formatCellContent } from '../utils/helpers';
import ChartControls from './chart-controls';
import getConfig from '../utils/get-config';
import CopyPasteStylesHandler from './copy-paste-styles-handler';
import { TitleSubtitle, Footer } from './meta-text-fields';
import { createWpEditorFunctions } from './wp-editor-functions';
import { AlignmentOverlay } from './alignment-overlay';

const getCellContent = (cell) => {
	return (
		cell.content?.originalContent ||
		cell.content?.originalHTML ||
		cell.content?.text ||
		cell.content
	);
};

/**
 * Memoized wrapper for ChartBuilderWrapper to prevent re-renders during drag.
 * This ensures that alignment state updates don't break drag interactions.
 */
const MemoizedChartBuilder = memo(
	({ className, config, data, wpEditorFunctions }) => (
		<ChartBuilderWrapper
			className={className}
			config={config}
			data={data}
			wpEditorFunctions={wpEditorFunctions}
		/>
	)
);

export default function Edit({
	attributes: attrs,
	setAttributes,
	toggleSelection,
	clientId,
	isSelected,
	context,
}) {
	const {
		id,
		isStaticChart,
		isFreeformChart,
		height,
		width,
		metaTextActive,
		metaTitle,
		metaSubtitle,
		metaQuestionWordingActive,
		metaQuestionWording,
		metaNote,
		metaSource,
		metaTag,
		chartData,
		mapScale,
		groupBreaksCategory,
	} = attrs;

	// Use the controller id to create a unique id for the chart.
	const controllerId = context['prc-chart-builder/id'];
	useEffect(() => {
		if (controllerId) {
			setAttributes({ id: `${controllerId}-chart` });
		}
	}, [controllerId]);

	const { tableData, parentBlockId, refId } = useSelect(
		(select) => {
			const { getBlockParentsByBlockName, getBlocks } =
				select(blockEditorStore);
			const { getCurrentPostId, getCurrentPostType } =
				select(editorStore);

			const rootBlockId = getBlockParentsByBlockName(
				clientId,
				'prc-chart-builder/controller'
			)?.[0];
			const tableBlock = getBlocks(rootBlockId).find(
				(block) =>
					'core/table' === block.name ||
					'prc-block/table' === block.name
			);
			const { attributes: tableAttributes } = tableBlock;
			// Debug table data:
			const editorContextPostType = getCurrentPostType();

			let postId = null;
			if (context && context.refId) {
				postId = context.refId;
			} else if ('chart' === editorContextPostType) {
				postId = getCurrentPostId();
			}

			return {
				tableData: tableAttributes,
				parentBlockId: rootBlockId,
				refId: postId,
				editorPostType: editorContextPostType,
			};
		},
		[context]
	);
	const editorClickEvent = () => {
		console.log('editorClickEvent...');
	};

	// Alignment state for visual guides during drag
	const [alignments, setAlignments] = useState({
		vertical: [],
		horizontal: [],
	});

	// Editor functions for chart interactions
	// IMPORTANT: setAlignments is NOT in dependencies to avoid recreating on every alignment change
	const wpEditorFunctions = useMemo(
		() =>
			createWpEditorFunctions({
				attrs,
				chartData,
				setAttributes,
				toggleSelection,
				setAlignments, // Pass alignment setter (stable reference)
			}),
		[attrs, chartData, setAttributes, toggleSelection] // setAlignments intentionally excluded
	);

	const config = useMemo(() => {
		const baseConfig = getConfig(attrs, clientId, editorClickEvent);

		// Add IDs to annotations
		if (baseConfig.annotations?.items) {
			baseConfig.annotations.items = baseConfig.annotations.items.map(
				(annotation, index) => ({
					...annotation,
					id: String(index),
				})
			);
		}

		return baseConfig;
	}, [attrs, clientId]);

	const headers = useMemo(
		() =>
			tableData
				? tableData.head[0].cells.map((c) => getCellContent(c))
				: [],
		[tableData]
	);

	const body = useMemo(() => (tableData ? tableData.body : []), [tableData]);

	const memoizedChartData = useMemo(
		() =>
			body.map((row) =>
				row.cells.reduce((acc, cell, index) => {
					const key = 0 === index ? 'x' : headers[index];
					return {
						...acc,
						[key]: formatCellContent(
							getCellContent(cell),
							key,
							mapScale,
							groupBreaksCategory
						),
					};
				}, {})
			),
		[body, headers, mapScale, groupBreaksCategory]
	);

	useEffect(() => {
		const [, ...rest] = headers;
		setAttributes({
			availableCategories: rest,
			independentVariable: headers[0],
		});
	}, [headers, setAttributes]);

	useEffect(() => {
		if (!memoizedChartData || memoizedChartData.length === 0) {
			return;
		}

		// Check if we have custom positions to preserve in the current chartData
		// Note: We read from chartData but don't include it in dependencies to avoid infinite loop
		const hasCustomPositions = chartData?.some(
			(d) =>
				d.__labelPositions && Object.keys(d.__labelPositions).length > 0
		);

		if (hasCustomPositions) {
			// Create lookup map of old positions by x-value
			const positionsMap = new Map();
			chartData.forEach((d) => {
				if (d.__labelPositions) {
					positionsMap.set(d.x, d.__labelPositions);
				}
			});

			// Merge positions into new data where x-values match
			const mergedData = memoizedChartData.map((d) => {
				const existingPositions = positionsMap.get(d.x);
				if (existingPositions) {
					return { ...d, __labelPositions: existingPositions };
				}
				return d;
			});

			setAttributes({ chartData: mergedData });
		} else {
			// No custom positions to preserve, use new data directly
			setAttributes({ chartData: memoizedChartData });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [memoizedChartData, setAttributes]);

	const blockProps = useBlockProps({
		className: 'active',
	});

	const innerBlocksProps = useInnerBlocksProps();

	return (
		<>
			<ChartControls
				attributes={attrs}
				setAttributes={setAttributes}
				parentBlock={parentBlockId}
				clientId={clientId}
			/>
			<CopyPasteStylesHandler
				id={id}
				attributes={attrs}
				setAttributes={setAttributes}
			>
				<div {...blockProps}>
					<figure>
						<ChartBuilderTextWrapper
							active={config.metadata.active}
							width={width}
							horizontalRules={config.layout.horizontalRules}
						>
							{metaTextActive && (
								<TitleSubtitle
									metaTitle={metaTitle}
									metaSubtitle={metaSubtitle}
									setAttributes={setAttributes}
								/>
							)}
							{/* <ResizableBox
								size={{
									height,
									width,
								}}
								minHeight="50"
								minWidth="50"
								enable={{
									top: false,
									right: false,
									bottom: false,
									left: false,
									topRight: false,
									bottomRight: !!isSelected,
									bottomLeft: false,
									topLeft: false,
								}}
								onResizeStop={(
									event,
									direction,
									elt,
									delta
								) => {
									setAttributes({
										height: parseInt(
											parseInt(height, 10) +
												parseInt(delta.height, 10),
											10
										),
										width: parseInt(
											parseInt(width, 10) +
												parseInt(delta.width, 10),
											10
										),
									});
									toggleSelection(true);
								}}
								onResizeStart={() => {
									toggleSelection(false);
								}}
							> */}
							{(isStaticChart || isFreeformChart) && (
								<div
									className="cb__chart"
									{...innerBlocksProps}
								/>
							)}
							{!isStaticChart &&
								!isFreeformChart &&
								memoizedChartData && (
									<div style={{ position: 'relative' }}>
										<MemoizedChartBuilder
											className="cb__chart"
											config={config}
											data={
												chartData || memoizedChartData
											}
											wpEditorFunctions={
												wpEditorFunctions
											}
										/>
										<AlignmentOverlay
											alignments={alignments}
											chartDimensions={{
												width,
												height,
												padding: config.layout.padding,
											}}
										/>
									</div>
								)}
							{/* </ResizableBox> */}
							{metaTextActive && (
								<Footer
									metaQuestionWordingActive={
										metaQuestionWordingActive
									}
									metaQuestionWording={metaQuestionWording}
									metaNote={metaNote}
									metaSource={metaSource}
									metaTag={metaTag}
									setAttributes={setAttributes}
								/>
							)}
						</ChartBuilderTextWrapper>
					</figure>
				</div>
			</CopyPasteStylesHandler>
		</>
	);
}
