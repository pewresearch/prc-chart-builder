/**
 * Plot band label panel.
 *
 * Shown when an author clicks a plot band label. Text, type, and position
 * controls match the annotation popover. Range and band fill stay in the
 * plot bands sidebar.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { readPlotBandLabelRotation } from '@prc/charting-library';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { formatNum } from '../../../utils/helpers';
import { RichTextField } from './RichTextField';
import { TextAnnotationLayoutControls } from './TextAnnotationLayoutControls';
import { TextStyleControls } from './TextStyleControls';

/**
 * @param {Object}   props
 * @param {string}   props.plotBandIndex Band index as a string.
 * @param {Object}   props.plotBand      Plot band object.
 * @param {Function} props.onUpdate      Receives a partial band update.
 * @param {Function} props.onDelete      Deletes this plot band.
 */
export function PlotBandLabelPanel({
	plotBandIndex,
	plotBand,
	onUpdate,
	onDelete,
}) {
	const labelStyle = plotBand?.style?.label ?? {};
	const index = parseInt(plotBandIndex, 10);

	const updateLabel = (updates) => {
		onUpdate({
			style: {
				label: updates,
			},
		});
	};

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{__('Plot band', 'prc-chart-builder')} #{index + 1}
			</Text>

			<RichTextField
				label={__('Text', 'prc-chart-builder')}
				value={plotBand?.label ?? ''}
				onChange={(value) => onUpdate({ label: value })}
				placeholder={__('Enter label text', 'prc-chart-builder')}
			/>

			<SelectControl
				label={__('Alignment', 'prc-chart-builder')}
				value={labelStyle.align ?? 'top'}
				__next40pxDefaultSize
				options={[
					{ label: __('Top', 'prc-chart-builder'), value: 'top' },
					{
						label: __('Bottom', 'prc-chart-builder'),
						value: 'bottom',
					},
				]}
				onChange={(value) => updateLabel({ align: value })}
			/>

			<HStack spacing={2}>
				<NumberControl
					label={__('X Offset', 'prc-chart-builder')}
					value={labelStyle.dx ?? 0}
					onChange={(value) =>
						updateLabel({ dx: formatNum(value, 'integer') })
					}
				/>
				<NumberControl
					label={__('Y Offset', 'prc-chart-builder')}
					value={labelStyle.dy ?? 0}
					onChange={(value) =>
						updateLabel({ dy: formatNum(value, 'integer') })
					}
				/>
			</HStack>

			<TextStyleControls
				showText={false}
				values={{
					fontWeight: labelStyle.fontWeight ?? 'normal',
					fontStyle: labelStyle.fontStyle ?? 'normal',
					fontFamily: labelStyle.fontFamily,
					fontSize: labelStyle.fontSize,
					fill: labelStyle.fill,
					textOutline: labelStyle.textOutline,
				}}
				onChange={(field, value) => {
					if (field === 'fontSize') {
						updateLabel({ fontSize: value || 10 });
						return;
					}
					updateLabel({ [field]: value });
				}}
				showTextOutline
				colorLabel={__('Label text color', 'prc-chart-builder')}
				colorPanelTitle={__('Label Color', 'prc-chart-builder')}
			/>

			<TextAnnotationLayoutControls
				textAnchor={labelStyle.textAnchor ?? 'start'}
				verticalAnchor={labelStyle.verticalAnchor ?? 'start'}
				rotation={readPlotBandLabelRotation(labelStyle)}
				maxWidth={labelStyle.maxWidth ?? 0}
				opacity={labelStyle.opacity ?? 1}
				maxWidthHelp={__(
					'Maximum width for text wrapping. 0 keeps the label on one line.',
					'prc-chart-builder'
				)}
				onChange={(field, value) => {
					if (field === 'rotation') {
						updateLabel({
							rotation: formatNum(value, 'integer') ?? 0,
							orientation: undefined,
						});
						return;
					}
					if (field === 'maxWidth') {
						updateLabel({
							maxWidth: formatNum(value, 'integer') ?? 0,
						});
						return;
					}
					updateLabel({ [field]: value });
				}}
			/>

			{onDelete && (
				<Button
					variant="secondary"
					isDestructive
					onClick={onDelete}
					style={{ marginTop: '8px' }}
					__next40pxDefaultSize
				>
					{__('Delete plot band', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default PlotBandLabelPanel;
