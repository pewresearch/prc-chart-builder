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
import { Fragment, useEffect, useMemo, useState } from 'react';

/**
 * Internal Dependencies
 */
import {
	formatLegacyAttrs,
	handleLegacyConversion,
	formatCellContent,
} from '../utils/helpers';
import ChartControls from './ChartControls';
import getConfig from '../utils/getConfig';
import WaybackHelper from './WaybackHelper'; // This is temporary for the migration.
import CopyPasteStylesHandler from './CopyPasteStylesHandler';
import { TitleSubtitle, Footer } from './metaTextFields';

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
		isConvertedChart,
		isStaticChart,
		chartConverted,
		height,
		width,
		metaTextActive,
		metaTitle,
		metaSubtitle,
		metaNote,
		metaSource,
		metaTag,
		chartData,
	} = attrs;
	const { converted } = chartConverted || {};

	const [isConverting, toggleConversionState] = useState(false);

	// use the controller id to create a unique id for the chart
	const controllerId = context['prc-chart-builder/id'];
	useEffect(() => {
		if (controllerId) {
			setAttributes({ id: `${controllerId}-chart` });
		}
	}, [controllerId]);

	const { tableData, parentBlockId, refId, siteId, currentUserName } =
		useSelect(
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
						'flexible-table-block/table' === block.name ||
						'core/table' === block.name
				);
				const { attributes } = tableBlock;
				const editorContextPostType = getCurrentPostType();

				let postId = null;
				if (context && context.refId) {
					postId = context.refId;
				} else if ('chart' === editorContextPostType) {
					postId = getCurrentPostId();
				}

				return {
					tableData: attributes,
					parentBlockId: rootBlockId,
					refId: postId,
					editorPostType: editorContextPostType,
					siteId: select(coreStore).getSite()?.siteId,
					currentUserName: select(coreStore).getCurrentUser()?.slug,
				};
			},
			[context]
		);

	// Convert legacy charts:
	useEffect(() => {
		if (converted) {
			return;
		}
		if (isConvertedChart && null !== refId) {
			toggleConversionState(true);
			handleLegacyConversion(refId)
				.then((data) => {
					const { chartTitle, chartMeta } = data;
					const legacyMeta = { title: chartTitle, ...chartMeta };
					if (legacyMeta.cb_type) {
						const legacyAttrs = formatLegacyAttrs(
							legacyMeta,
							attrs,
							attrs,
							siteId
						);
						const timestamp = new Date().getTime();
						legacyAttrs.chartConverted = {
							converted: true,
							requester: currentUserName,
							timestamp,
						};
						setAttributes(legacyAttrs);
					} else {
						// Fail if we dont have a cb_type
						toggleConversionState(false);
						// set conversion to fail in the attribute so it doesnt keep running.
					}
				})
				.finally(() => {
					toggleConversionState(false);
				});
		}
	}, [isConvertedChart, refId, siteId, attrs, converted]);

	const config = useMemo(
		() => getConfig(attrs, clientId, 'wp-block-prc-block-chart-builder'),
		[attrs]
	);

	const headers = useMemo(
		() => (tableData ? tableData.head[0].cells.map((c) => c.content) : []),
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
						[key]: formatCellContent(cell.content, key),
					};
				}, {})
			),
		[tableData, body, headers]
	);
	useEffect(() => {
		const [, ...rest] = headers;
		setAttributes({
			availableCategories: rest,
			independentVariable: headers[0],
		});
	}, [headers]);

	useEffect(() => {
		setAttributes({
			chartData: memoizedChartData,
		});
	}, [memoizedChartData]);

	const blockProps = useBlockProps({
		className: 'active',
	});

	const innerBlocksProps = useInnerBlocksProps();

	return (
		<Fragment>
			<WaybackHelper postId={refId} />
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
					{isConverting && (
						<Warning>
							<span>Converting legacy chart, please wait...</span>
							<Spinner />
						</Warning>
					)}
					{!isConverting && (
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
									{isStaticChart && (
										<div
											className="cb__chart"
											{...innerBlocksProps}
										/>
									)}
									{!isStaticChart && memoizedChartData && (
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
					)}
				</div>
			</CopyPasteStylesHandler>
		</Fragment>
	);
}
