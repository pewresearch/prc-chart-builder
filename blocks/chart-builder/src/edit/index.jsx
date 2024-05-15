/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
import { ResizableBox, Spinner } from '@wordpress/components';
import { Fragment, useEffect, useMemo, useState } from '@wordpress/element';
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

/**
 * Internal Dependencies
 */
import { formatLegacyAttrs, handleLegacyConversion } from '../utils/helpers';
import ChartControls from './ChartControls';
import getConfig from '../utils/getConfig';
import WaybackHelper from './WaybackHelper'; // This is temporary for the migration.
import CopyPasteStylesHandler from './CopyPasteStylesHandler';

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
	} = attrs;

	useEffect(() => {
		if (!id) {
			setAttributes({ id: clientId });
		}
	}, []);

	const { converted } = chartConverted || {};

	const [isConverting, toggleConversionState] = useState(false);

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
	// use a reducer to create an array of objects with the headers as keys
	// and the table data as values
	const formatCellContent = (content, key) => {
		const replaceNonNumeric = (str) => {
			// Replace all non-numeric, non-decimal characters, and negative sign
			str = str.replace(/[^0-9.-]/g, '');

			// if string has no numbers, return empty string
			if (!str.match(/[0-9]/g)) {
				return '';
			}
			// Replace all non-numeric, non-decimal characters, and negative sign
			str = str.replace(/[^0-9.-]/g, '');

			// if string has no numbers, return empty string
			if (!str.match(/[0-9]/g)) {
				return '';
			}

			// Ensure only the first decimal place is kept
			const decimalIndex = str.indexOf('.');
			if (decimalIndex !== -1) {
				str =
					str.slice(0, decimalIndex + 1) +
					str.slice(decimalIndex + 1).replace(/\./g, '');
			}

			// Likewise, ensure only the first negative sign is kept
			const negativeIndex = str.indexOf('-');
			if (negativeIndex !== -1) {
				str =
					str.slice(0, negativeIndex + 1) +
					str.slice(negativeIndex + 1).replace(/-/g, '');
			}

			return str;
		};

		if ('x' === key) {
			return content;
		}
		// TODO: temporary fix for less than signs in table cells.
		// If value is < something, return empty string
		if (content.includes('&lt;') || content.charAt(0) === '<') {
			return '';
		}
		return replaceNonNumeric(content);
	};

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
									<>
										<RichText
											className="cb__title"
											value={metaTitle}
											onChange={(content) =>
												setAttributes({
													metaTitle: content,
												})
											}
											placeholder={metaTitle}
										/>
										<RichText
											className="cb__subtitle"
											value={metaSubtitle}
											onChange={(content) =>
												setAttributes({
													metaSubtitle: content,
												})
											}
											placeholder={metaSubtitle}
										/>
									</>
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
											data={memoizedChartData}
										/>
									)}
								</ResizableBox>
								{metaTextActive && (
									<>
										<RichText
											className="cb__note"
											value={metaNote}
											onChange={(content) =>
												setAttributes({
													metaNote: content,
												})
											}
											placeholder={metaNote}
										/>
										<RichText
											className="cb__note"
											value={metaSource}
											onChange={(content) =>
												setAttributes({
													metaSource: content,
												})
											}
											placeholder={metaSource}
										/>
										<RichText
											className="cb__tag"
											value={metaTag}
											onChange={(content) =>
												setAttributes({
													metaTag: content,
												})
											}
											placeholder={metaTag}
										/>
									</>
								)}
							</ChartBuilderTextWrapper>
						</figure>
					)}
				</div>
			</CopyPasteStylesHandler>
		</Fragment>
	);
}
