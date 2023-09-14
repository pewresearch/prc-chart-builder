/**
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { PluginBlockSettingsMenuItem } from '@wordpress/edit-post';
import { useSelect, useDispatch } from '@wordpress/data';
import { symbol as icon } from '@wordpress/icons';
import { createBlock, serialize } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticeStore } from '@wordpress/notices';

/**
 * Internal Dependencies
 */

const allowedBlocks = ['prc-block/chart-builder-controller'];

export default function ConvertToSyncedChartBlockSettingMenuItem() {
	const [processing, setProcessing] = useState(false);

	const { replaceBlock } = useDispatch(blockEditorStore);
	const { createSuccessNotice, createErrorNotice } = useDispatch(noticeStore);

	const { selectedBlock, allow = false } = useSelect((select) => {
		const { getSelectedBlock, getBlockRootClientId, getBlockName } =
			select('core/block-editor');
		const selectedRootClientId = getBlockRootClientId(
			getSelectedBlock()?.clientId
		);
		const rootBlockName = getBlockName(selectedRootClientId);
		return {
			selectedBlock: getSelectedBlock(),
			allow: rootBlockName !== 'prc-block/chart',
		};
	}, []);

	const convertToSyncedChart = () => {
		if (processing) {
			return;
		}
		const clientId = selectedBlock?.clientId;
		const attributes = selectedBlock?.attributes;
		const innerBlocks = selectedBlock?.innerBlocks;
		if (clientId && attributes) {
			const newChartControllerBlock = createBlock(
				'prc-block/chart-builder-controller',
				attributes,
				innerBlocks
			);
			const newTitle = newChartControllerBlock.innerBlocks.find(
				(block) => block.name === 'prc-block/chart-builder'
			)?.attributes?.metaTitle;
			const newChartContent = serialize(newChartControllerBlock);

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
						const chartId = parseInt(chart.id);
						const newChartBlock = createBlock(
							'prc-block/chart',
							{
								ref: chartId,
							},
							[]
						);
						replaceBlock(clientId, newChartBlock);
						createSuccessNotice(
							__(
								'Chart created successfully!',
								'prc-chart-builder'
							),
							{
								type: 'default',
							}
						);
					}
				})
				.catch((error) => {
					if (error) {
						createErrorNotice(
							__(
								'Chart could not be created, please try again.',
								'prc-chart-builder'
							),
							{
								type: 'default',
							}
						);
					}
				})
				.finally(() => {
					setProcessing(false);
				});
		}
	};

	if (!allow) {
		return null;
	}

	return (
		<PluginBlockSettingsMenuItem
			allowedBlocks={allowedBlocks}
			icon={icon}
			label={__('Convert to synced chart', 'prc-chart-builder')}
			onClick={() => {
				convertToSyncedChart();
			}}
		/>
	);
}
