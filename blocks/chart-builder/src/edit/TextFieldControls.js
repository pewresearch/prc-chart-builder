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

function TextFieldControls({ attributes, setAttributes }) {
	const {
		metaTextActive,
		metaTitle,
		metaSubtitle,
		metaNote,
		metaSource,
		metaTag,
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
				onChange={(val) => setAttributes({ metaTitle: val })}
			/>
			<TextControl
				label={__('Subtitle')}
				value={metaSubtitle}
				onChange={(val) => setAttributes({ metaSubtitle: val })}
			/>
			{isStaticChart && (
				<TextareaControl
					label={__('Static Image Alt Text')}
					help="Enter some text"
					value={staticImageAltText}
					onChange={(val) =>
						setAttributes({ staticImageAltText: val })
					}
				/>
			)}
			<TextareaControl
				label={__('Note')}
				help="Enter some text"
				value={metaNote}
				onChange={(val) => setAttributes({ metaNote: val })}
			/>
			<TextareaControl
				label={__('Source')}
				help="Enter some text"
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
