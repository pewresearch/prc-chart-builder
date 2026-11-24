/**
 * Image annotation controls shared by the canvas popover and the inspector
 * drawer. Field order follows text annotations: alt text, position, then size.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	AnglePickerControl,
	Button,
	FlexBlock,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import WizardControlTip from '../../../../shared/wizard-ui/wizard-control-tip';
import { formatNum } from '../../../utils/helpers';
import { StyledLabel } from '../../control-ui';
import {
	getImageAnnotationFromMedia,
	IMAGE_ANNOTATION_ALLOWED_TYPES,
	resizeImageAnnotation,
} from '../../image-annotation';

const toNumber = (value, fallback) => {
	const n = Number(value);
	return value === '' || !Number.isFinite(n) ? fallback : n;
};

// AnglePickerControl is 0–360. Negative degrees are the same turn.
const normalizeAngle = (value) => {
	const rounded = Math.round(toNumber(value, 0));
	return ((rounded % 360) + 360) % 360;
};

const HORIZONTAL_ANCHOR_OPTIONS = [
	{ label: __('Left', 'prc-chart-builder'), value: 'start' },
	{ label: __('Center', 'prc-chart-builder'), value: 'middle' },
	{ label: __('Right', 'prc-chart-builder'), value: 'end' },
];

const VERTICAL_ANCHOR_OPTIONS = [
	{ label: __('Top', 'prc-chart-builder'), value: 'start' },
	{ label: __('Middle', 'prc-chart-builder'), value: 'middle' },
	{ label: __('Bottom', 'prc-chart-builder'), value: 'end' },
];

const isPanelContext = (value) => value === 'panel' || value === 'panel-inner';

/**
 * Positioning context, panel, and x/y. Popover labels match text annotations
 * in the popover. Drawer labels match text annotations in the inspector.
 *
 * @param {Object}   props
 * @param {Object}   props.annotation
 * @param {Function} props.onUpdate
 * @param {string[]} props.panelKeys
 * @param {string}   props.surface    'popover' or 'drawer'
 */
function ImagePositionControls({ annotation, onUpdate, panelKeys, surface }) {
	const hasPanelKeys = panelKeys.length > 0;
	const positioningContext = annotation?.positioningContext || 'chart';
	const isPanel =
		positioningContext === 'panel' || positioningContext === 'panel-inner';
	const options = [
		{
			label: __('Full Chart Area', 'prc-chart-builder'),
			value: 'chart',
		},
		{
			label: __('Data Area (Inner)', 'prc-chart-builder'),
			value: 'inner',
		},
		...(hasPanelKeys
			? [
					{
						label: __('Panel (full cell)', 'prc-chart-builder'),
						value: 'panel',
					},
					{
						label: __('Panel data area', 'prc-chart-builder'),
						value: 'panel-inner',
					},
				]
			: []),
	];
	const positionHelp = hasPanelKeys
		? __(
				'Chart: full graphic. Inner: data area. Panel: full cell or plot area; travels with the cell on restack.',
				'prc-chart-builder'
			)
		: __(
				'Chart: positions relative to the entire chart including axes and padding (eg. use for titles, etc.). Data Area: positions relative to the chart data area (eg. use if annotating a specific data point).',
				'prc-chart-builder'
			);

	const handleContext = (value) => {
		if (isPanelContext(value)) {
			onUpdate({
				positioningContext: value,
				panelKey: annotation?.panelKey || String(panelKeys[0] || ''),
				x: 8,
				y: 8,
			});
			return;
		}
		onUpdate({ positioningContext: value, panelKey: '' });
	};

	return [
		surface === 'drawer' ? (
			<StyledLabel
				key="position-label"
				className="prc-chart-modal__control-label-with-tip"
			>
				{__('Position', 'prc-chart-builder')}
				<WizardControlTip
					label={__('Help: annotation position', 'prc-chart-builder')}
					text={positionHelp}
				/>
			</StyledLabel>
		) : null,
		<SelectControl
			key="position"
			value={positioningContext}
			options={options}
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			onChange={handleContext}
			{...(surface === 'popover'
				? {
						label: __('Positioning Context', 'prc-chart-builder'),
						help: hasPanelKeys ? positionHelp : undefined,
					}
				: {})}
		/>,
		isPanel && hasPanelKeys ? (
			<SelectControl
				key="panel"
				label={__('Panel', 'prc-chart-builder')}
				value={annotation?.panelKey || String(panelKeys[0])}
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				options={panelKeys.map((key) => ({
					label: String(key),
					value: String(key),
				}))}
				onChange={(value) => onUpdate({ panelKey: value })}
			/>
		) : null,
		<HStack key="coordinates" spacing={2} alignment="stretch">
			<FlexBlock>
				<NumberControl
					label={__('X Position', 'prc-chart-builder')}
					value={annotation?.x}
					onChange={(value) =>
						onUpdate({ x: formatNum(value, 'float') })
					}
				/>
			</FlexBlock>
			<FlexBlock>
				<NumberControl
					label={__('Y Position', 'prc-chart-builder')}
					value={annotation?.y}
					onChange={(value) =>
						onUpdate({ y: formatNum(value, 'float') })
					}
				/>
			</FlexBlock>
		</HStack>,
	];
}

/**
 * @param {Object}   props
 * @param {Object}   props.annotation  Image annotation item.
 * @param {Function} props.onUpdate    (partial) => void
 * @param {string[]} [props.panelKeys]
 * @param {string}   [props.surface]   'popover' (default) or 'drawer'
 */
export function ImageAnnotationFields({
	annotation,
	onUpdate,
	panelKeys = [],
	surface = 'popover',
}) {
	const {
		mediaId,
		src,
		width,
		height,
		keepAspectRatio = true,
		alt = '',
		textAnchor = 'middle',
		verticalAnchor = 'middle',
		rotation = 0,
		opacity = 1,
	} = annotation || {};

	return (
		<VStack
			spacing={4}
			className="prc-chart-builder__image-annotation-fields"
		>
			<MediaUploadCheck>
				<MediaUpload
					onSelect={(media) =>
						onUpdate(getImageAnnotationFromMedia(media, annotation))
					}
					allowedTypes={IMAGE_ANNOTATION_ALLOWED_TYPES}
					value={mediaId || undefined}
					render={({ open }) => (
						<VStack spacing={2}>
							{src && (
								<img
									src={src}
									alt=""
									style={{
										maxWidth: '100%',
										maxHeight: 120,
										objectFit: 'contain',
										alignSelf: 'flex-start',
										background: '#f0f0f0',
									}}
								/>
							)}
							<Button
								variant="secondary"
								onClick={open}
								__next40pxDefaultSize
							>
								{src
									? __('Replace image', 'prc-chart-builder')
									: __('Choose image', 'prc-chart-builder')}
							</Button>
						</VStack>
					)}
				/>
			</MediaUploadCheck>

			<TextControl
				label={__('Alt text', 'prc-chart-builder')}
				value={alt}
				onChange={(value) => onUpdate({ alt: value })}
				help={__(
					'Leave empty when the image is decorative. Screen readers skip it.',
					'prc-chart-builder'
				)}
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<ImagePositionControls
				annotation={annotation}
				onUpdate={onUpdate}
				panelKeys={panelKeys}
				surface={surface}
			/>

			<HStack spacing={2} alignment="stretch">
				<FlexBlock>
					<NumberControl
						label={__('Width', 'prc-chart-builder')}
						value={width}
						min={1}
						onChange={(value) =>
							onUpdate(
								resizeImageAnnotation(
									annotation,
									'width',
									value
								)
							)
						}
					/>
				</FlexBlock>
				<FlexBlock>
					<NumberControl
						label={__('Height', 'prc-chart-builder')}
						value={height}
						min={1}
						onChange={(value) =>
							onUpdate(
								resizeImageAnnotation(
									annotation,
									'height',
									value
								)
							)
						}
					/>
				</FlexBlock>
			</HStack>
			<ToggleControl
				label={__('Keep aspect ratio', 'prc-chart-builder')}
				checked={keepAspectRatio !== false}
				onChange={(value) => onUpdate({ keepAspectRatio: value })}
				__nextHasNoMarginBottom
			/>

			<SelectControl
				label={__('Horizontal anchor', 'prc-chart-builder')}
				value={textAnchor}
				options={HORIZONTAL_ANCHOR_OPTIONS}
				onChange={(value) => onUpdate({ textAnchor: value })}
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
			<SelectControl
				label={__('Vertical anchor', 'prc-chart-builder')}
				value={verticalAnchor}
				options={VERTICAL_ANCHOR_OPTIONS}
				onChange={(value) => onUpdate({ verticalAnchor: value })}
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<AnglePickerControl
				label={__('Rotation', 'prc-chart-builder')}
				__nextHasNoMarginBottom
				value={normalizeAngle(rotation)}
				onChange={(value) =>
					onUpdate({ rotation: normalizeAngle(value) })
				}
			/>
			<NumberControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacity}
				min={0}
				max={1}
				step={0.1}
				onChange={(value) => onUpdate({ opacity: toNumber(value, 1) })}
			/>
		</VStack>
	);
}

export default ImageAnnotationFields;
