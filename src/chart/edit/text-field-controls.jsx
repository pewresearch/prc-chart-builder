/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TextareaControl,
	TextControl,
	ToggleControl,
	PanelBody,
} from '@wordpress/components';

import { generateDefaultAltText } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

function TextFieldControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const metadata = getCurrentValue('metadata') || {};
	const io = attributes.io || {}; // io is not viewport-aware
	const layout = getCurrentValue('layout') || {};

	const { active, title, alt } = metadata;
	const {
		questionWording,
		questionWordingActive,
		isStaticChart,
		staticImageAltText,
	} = io;
	const { type: chartType, horizontalRules } = layout;
	return (
		<PanelBody title={__('Text Fields')} initialOpen={false}>
			<ToggleControl
				label={__('Text Fields Active')}
				help={__(
					'Enables title, subtitle, note, source, and tag fields for chart.'
				)}
				checked={active}
				onChange={(newValue) => {
					const currentMetadata = getCurrentValue('metadata') || {};
					updateAttributeForDevice('metadata', {
						...currentMetadata,
						active: newValue,
					});
				}}
			/>
			<ToggleControl
				label={__('Show horizontal rules')}
				help={__('Show horizontal rules above and below chart')}
				checked={horizontalRules}
				onChange={(newValue) => {
					const currentLayout = getCurrentValue('layout') || {};
					updateAttributeForDevice('layout', {
						...currentLayout,
						horizontalRules: newValue,
					});
				}}
			/>
			<TextControl
				label={__('Title')}
				value={getCurrentValue('metadata', 'title')}
				onChange={(val) =>
					updateAttributeForDevice('metadata', {
						title: val,
						alt:
							val.length > 0
								? val
								: generateDefaultAltText(chartType, val),
					})
				}
			/>
			<TextControl
				label={__('Subtitle')}
				value={getCurrentValue('metadata', 'subtitle')}
				onChange={(val) =>
					updateAttributeForDevice('metadata', {
						subtitle: val,
					})
				}
			/>
			{isStaticChart && (
				<TextareaControl
					label={__('Static Image Alt Text')}
					help="Enter the alt text for the static image"
					value={staticImageAltText}
					onChange={(val) =>
						setAttributes({
							io: {
								...io,
								staticImageAltText: val,
							},
						})
					}
				/>
			)}
			{!isStaticChart && (
				<TextareaControl
					label={__('Alt Text (Accessibility)')}
					help={
						alt
							? __('Custom alt text set')
							: `Default: ${generateDefaultAltText(chartType, title)}`
					}
					value={alt}
					placeholder={generateDefaultAltText(chartType, title)}
					onChange={(val) => {
						const currentMetadata =
							getCurrentValue('metadata') || {};
						updateAttributeForDevice('metadata', {
							...currentMetadata,
							alt: val,
						});
					}}
				/>
			)}
			<ToggleControl
				label={__('Question Wording Active')}
				help={__('If active, enables question wording field for chart')}
				checked={questionWordingActive}
				onChange={() =>
					setAttributes({
						io: {
							...io,
							questionWordingActive: !questionWordingActive,
						},
					})
				}
			/>
			<TextareaControl
				label={__('Question Wording')}
				help={__('Optional: Add the question wording for the chart')}
				value={questionWording}
				onChange={(val) =>
					setAttributes({
						io: {
							...io,
							questionWording: val,
						},
					})
				}
			/>
			<TextareaControl
				label={__('Note')}
				help="Enter the note for the chart"
				value={getCurrentValue('metadata', 'note')}
				onChange={(val) =>
					updateAttributeForDevice('metadata', {
						note: val,
					})
				}
			/>
			<TextareaControl
				label={__('Source')}
				help="Enter the source of the chart"
				value={getCurrentValue('metadata', 'source')}
				onChange={(val) =>
					updateAttributeForDevice('metadata', {
						source: val,
					})
				}
			/>
			<TextControl
				label={__('Tag')}
				value={getCurrentValue('metadata', 'tag')}
				onChange={(val) =>
					updateAttributeForDevice('metadata', {
						tag: val,
					})
				}
			/>
		</PanelBody>
	);
}

export default TextFieldControls;
