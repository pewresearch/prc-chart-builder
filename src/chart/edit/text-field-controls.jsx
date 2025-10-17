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

function TextFieldControls({ attributes, setAttributes }) {
	const {
		metaTextActive,
		metaTitle,
		metaSubtitle,
		metaQuestionWordingActive,
		metaQuestionWording,
		metaNote,
		metaSource,
		metaTag,
		metaAlt,
		chartType,
		horizontalRules,
		isStaticChart,
		staticImageAltText,
	} = attributes;
	return (
		<PanelBody title={__('Text Fields')} initialOpen={false}>
			<ToggleControl
				label={__('Text Fields Active')}
				help={__(
					'Enables title, subtitle, note, source, and tag fields for chart.'
				)}
				checked={metaTextActive}
				onChange={() =>
					setAttributes({ metaTextActive: !metaTextActive })
				}
			/>
			<ToggleControl
				label={__('Show horizontal rules')}
				help={__('Show horizontal rules above and below chart')}
				checked={horizontalRules}
				onChange={() =>
					setAttributes({ horizontalRules: !horizontalRules })
				}
			/>
			<TextControl
				label={__('Title')}
				value={metaTitle}
				onChange={(val) =>
					setAttributes({
						metaTitle: val,
						metaAlt:
							metaAlt.length > 0
								? metaAlt
								: generateDefaultAltText(chartType, val),
					})
				}
			/>
			<TextControl
				label={__('Subtitle')}
				value={metaSubtitle}
				onChange={(val) => setAttributes({ metaSubtitle: val })}
			/>
			{isStaticChart && (
				<TextareaControl
					label={__('Static Image Alt Text')}
					help="Enter the alt text for the static image"
					value={staticImageAltText}
					onChange={(val) =>
						setAttributes({ staticImageAltText: val })
					}
				/>
			)}
			{!isStaticChart && (
				<TextareaControl
					label={__('Alt Text (Accessibility)')}
					help={
						metaAlt
							? __('Custom alt text set')
							: __(
									`Default: ${generateDefaultAltText(chartType, metaTitle)}`
								)
					}
					value={metaAlt}
					placeholder={generateDefaultAltText(chartType, metaTitle)}
					onChange={(val) => setAttributes({ metaAlt: val })}
				/>
			)}
			<ToggleControl
				label={__('Question Wording Active')}
				help={__('If active, enables question wording field for chart')}
				checked={metaQuestionWordingActive}
				onChange={() =>
					setAttributes({
						metaQuestionWordingActive: !metaQuestionWordingActive,
					})
				}
			/>
			<TextareaControl
				label={__('Question Wording')}
				help={__('Optional: Add the question wording for the chart')}
				value={metaQuestionWording}
				onChange={(val) => setAttributes({ metaQuestionWording: val })}
			/>
			<TextareaControl
				label={__('Note')}
				help="Enter the note for the chart"
				value={metaNote}
				onChange={(val) => setAttributes({ metaNote: val })}
			/>
			<TextareaControl
				label={__('Source')}
				help="Enter the source of the chart"
				value={metaSource}
				onChange={(val) => setAttributes({ metaSource: val })}
			/>
			<TextControl
				label={__('Tag')}
				value={metaTag}
				onChange={(val) => setAttributes({ metaTag: val })}
			/>
		</PanelBody>
	);
}

export default TextFieldControls;
