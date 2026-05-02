/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import {
	BaseControl,
	Button,
	TextControl,
	SelectControl,
	Spinner,
	__experimentalVStack as VStack,
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

const BLOCK_TO_CREATE = 'prc-chart-builder/controller';

export default function ChartCreate({ setAttributes }) {
	const { createSuccessNotice, createErrorNotice } = useDispatch(noticeStore);
	const [processing, setProcessing] = useState(false);
	const [chartOptions, setChartOptions] = useState([]);
	const [title, setTitle] = useState('');
	const [type, setType] = useState(null);

	const { variations } = useSelect((select) => {
		const { getBlockVariations } = select(blocksStore);
		return {
			variations: getBlockVariations(BLOCK_TO_CREATE),
		};
	});

	const createChart = async () => {
		setProcessing(true);
		const newTitle = title || 'Untitled Chart';

		// Get the matched variation for the selected chart type
		const matchedVariation = variations.find(
			(variation) => variation.name === type
		);
		const { attributes, innerBlocks } = matchedVariation;

		// Create the controller block with inner blocks
		const innerBlocksFromTemplate =
			createBlocksFromInnerBlocksTemplate(innerBlocks);

		// Find the chart block and update its metadata.title with the user's custom title
		const chartBlockIndex = innerBlocksFromTemplate.findIndex(
			(block) => block.name === 'prc-chart-builder/chart'
		);

		if (
			chartBlockIndex !== -1 &&
			innerBlocksFromTemplate[chartBlockIndex].attributes
		) {
			// Create a new chart block with updated metadata to avoid mutation
			const chartBlock = innerBlocksFromTemplate[chartBlockIndex];

			// Ensure we have the full nested structure from the variation template
			const updatedAttributes = {
				...chartBlock.attributes,
				_version: 'v2', // Explicitly set v2
				metadata: {
					...(chartBlock.attributes.metadata || {}),
					title: newTitle,
				},
			};

			const updatedChartBlock = createBlock(
				chartBlock.name,
				updatedAttributes,
				chartBlock.innerBlocks
			);

			// Replace the chart block with the updated one
			innerBlocksFromTemplate[chartBlockIndex] = updatedChartBlock;
		}

		const newChartControllerBlock = createBlock(
			BLOCK_TO_CREATE,
			attributes,
			innerBlocksFromTemplate
		);
		const newChartContent = serialize(newChartControllerBlock);

		// Create the chart with both title and content in a single API call
		apiFetch({
			path: '/wp/v2/chart',
			method: 'POST',
			data: {
				title: newTitle,
				content: newChartContent,
				status: 'publish',
			},
		})
			.then((chart) => {
				if (chart.id) {
					setAttributes({
						ref: parseInt(chart.id),
					});
					createSuccessNotice(
						`Chart ${chart.title.rendered} created successfully!`,
						{
							type: 'snackbar',
						}
					);
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

	const textControlDisabled = processing;
	const selectControlDisabled =
		processing || null === chartOptions || title.length < 3;
	const buttonDisabled = processing || selectControlDisabled || type === null;

	return (
		<BaseControl id="create-chart" label="Create a new chart">
			<VStack spacing="3">
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
				<div style={{ marginBottom: '1.5em' }}>
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
				</div>
			</VStack>
		</BaseControl>
	);
}
