/* eslint-disable max-lines-per-function */
/**
 * External Dependencies
 */
import { useState, useEffect } from 'react';
/**
 * WordPress Dependencies
 */
import {
	BaseControl,
	Button,
	TextControl,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticeStore } from '@wordpress/notices';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	serialize,
	store as blocksStore,
} from '@wordpress/blocks';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal Dependencies
 */

const BLOCK_TO_CREATE = 'prc-block/chart-builder-controller';

export default function ChartCreate({ setAttributes }) {
	const { createSuccessNotice, createErrorNotice } = useDispatch(noticeStore);
	const [processing, setProcessing] = useState(false);
	const [chartOptions, setChartOptions] = useState([]);
	const [title, setTitle] = useState('');
	const [type, setType] = useState(null);
	const [chartId, setChartId] = useState(null);
	const [chartContent, setChartContent] = useState(null);
	// title, set title, go create a new chart post type with the title, return the id and drop.

	const { variations } = useSelect((select) => {
		const { getBlockVariations } = select(blocksStore);
		return {
			variations: getBlockVariations(BLOCK_TO_CREATE),
		};
	});

	const processNewChartContent = (newType) => {
		const matchedVariation = variations.find(
			(variation) => variation.name === newType
		);
		const { attributes, innerBlocks } = matchedVariation;
		const newChartControllerBlock = createBlock(
			BLOCK_TO_CREATE,
			attributes,
			createBlocksFromInnerBlocksTemplate(innerBlocks)
		);
		const newChartContent = serialize(newChartControllerBlock);
		setChartContent(newChartContent);
	};

	const createChart = async () => {
		setProcessing(true);
		const newTitle = title || 'Untitled Chart';
		apiFetch({
			path: '/wp/v2/chart',
			method: 'POST',
			data: {
				title: newTitle,
				status: 'publish',
			},
		})
			.then((chart) => {
				if (chart.id) {
					setChartId(parseInt(chart.id));
				}
			})
			.catch((error) => {
				if (error) {
					createErrorNotice(`Chart ${title} could not be created!`, {
						type: 'snackbar',
					});
				}
			})
			.finally(() => {
				setProcessing(false);
			});
	};

	useEffect(() => {
		const newChartOptions = variations.map((variation) => {
			return {
				label: variation.title,
				value: variation.name,
			};
		});
		// Add a blank option to the top of the list.
		newChartOptions.unshift({
			label: 'Select a chart type',
			value: null,
		});
		setChartOptions(newChartOptions);
	}, [variations]);

	useEffect(() => {
		if (!processing && null !== chartId && null !== type) {
			processNewChartContent(type);
		}
	}, [processing, chartId, type]);

	useEffect(() => {
		if (!processing && null !== chartId && null !== chartContent) {
			setProcessing(true);
			apiFetch({
				path: `/wp/v2/chart/${chartId}`,
				method: 'POST',
				data: {
					content: chartContent,
				},
			})
				.then((chart) => {
					if (chart.id) {
						setAttributes({
							ref: chartId,
						});
						createSuccessNotice(
							`Chart ${chart.title.rendered} created successfully!`,
							{
								type: 'snackbar',
							}
						);
					}
				})
				.finally(() => {
					setProcessing(false);
				});
		}
	}, [processing, chartId, chartContent]);

	const textControlDisabled = processing;
	const selectControlDisabled =
		processing || null === chartOptions || title.length < 3;
	const buttonDisabled = processing || selectControlDisabled || type === null;

	return (
		<BaseControl id="create-chart" label="Create a new chart">
			<TextControl
				label="Chart Title"
				value={title}
				onChange={(newTitle) => setTitle(newTitle)}
				disabled={textControlDisabled}
			/>
			<SelectControl
				label="Chart Type"
				value={type}
				options={chartOptions}
				onChange={(newType) => setType(newType)}
				disabled={selectControlDisabled}
			/>
			<Button
				variant="primary"
				onClick={() => {
					createChart();
				}}
				disabled={buttonDisabled}
			>
				{processing ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Spinner /> Creating Chart...
					</div>
				) : (
					'Create Chart'
				)}
			</Button>
		</BaseControl>
	);
}
