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
import { store as coreStore } from '@wordpress/core-data';

/**
 * External Dependencies
 */
import {
	ChartBuilderWrapper,
	ChartBuilderTextWrapper,
} from '@prc/chart-builder';
// eslint-disable-next-line
import { Fragment, useEffect, useMemo, useState } from 'react';

/**
 * Internal Dependencies
 */
import { formatCellContent } from '../utils/helpers';
import ChartControls from './chart-controls';
// import AnnotationControls, { editorClickEvent } from './annotation-controls';
import getConfig from '../utils/get-config';
import CopyPasteStylesHandler from './copy-paste-styles-handler';
import { TitleSubtitle, Footer } from './meta-text-fields';

const getCellContent = (cell) => {
	return (
		cell.content?.originalContent ||
		cell.content?.originalHTML ||
		cell.content?.text ||
		cell.content
	);
};

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
		metaNote,
		metaSource,
		metaTag,
		chartData,
		mapScale,
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
				'prc-block/chart-builder-controller'
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
	const config = useMemo(
		() => getConfig(attrs, clientId, editorClickEvent),
		[attrs]
	);

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
							mapScale
						),
					};
				}, {})
			),
		[body, headers, mapScale]
	);

	useEffect(() => {
		const [, ...rest] = headers;
		setAttributes({
			availableCategories: rest,
			independentVariable: headers[0],
		});
	}, [headers, setAttributes]);

	useEffect(() => {
		setAttributes({
			chartData: memoizedChartData,
		});
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
			{/* <AnnotationControls
				attributes={attrs}
				setAttributes={setAttributes}
			/> */}
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
							<ResizableBox
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
							>
								{(isStaticChart || isFreeformChart) && (
									<div
										className="cb__chart"
										{...innerBlocksProps}
									/>
								)}
								{!isStaticChart &&
									!isFreeformChart &&
									memoizedChartData && (
										<ChartBuilderWrapper
											className="cb__chart"
											config={config}
											data={
												chartData || memoizedChartData
											}
										/>
									)}
							</ResizableBox>
							{metaTextActive && (
								<Footer
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
