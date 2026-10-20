/**
 * Single-line rich text input for chart label text (labels, ticks, legend,
 * annotations, panel and axis titles). Saves RichText HTML; the charting
 * library turns it into styled SVG runs with parseRichText.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { RichText } from '@wordpress/block-editor';
import { BaseControl, __experimentalText as Text } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

export const LABEL_RICH_TEXT_FORMATS = [
	'core/bold',
	'core/italic',
	'core/underline',
	'core/strikethrough',
	'core/text-color',
	'core/link',
];

/**
 * @param {Object}   props
 * @param {string}   props.label
 * @param {string}   props.value
 * @param {Function} props.onChange      - (html) => void
 * @param {string}   [props.placeholder]
 * @param {string}   [props.help]
 */
export function RichTextField({ label, value, onChange, placeholder, help }) {
	const id = useInstanceId(RichTextField, 'cb-rich-text-field');

	return (
		<BaseControl id={id} label={label} __nextHasNoMarginBottom>
			<div
				className="cb__rich-text-field"
				style={{
					padding: '8px 12px',
					minHeight: '40px',
					border: '1px solid #949494',
					borderRadius: '2px',
					background: '#fff',
				}}
			>
				<RichText
					identifier={id}
					tagName="div"
					aria-label={label}
					value={value ?? ''}
					onChange={onChange}
					placeholder={placeholder}
					allowedFormats={LABEL_RICH_TEXT_FORMATS}
					disableLineBreaks
					inlineToolbar
				/>
			</div>
			{help && (
				<Text
					size="12px"
					color="#757575"
					style={{ display: 'block', marginTop: '8px' }}
				>
					{help}
				</Text>
			)}
		</BaseControl>
	);
}

export default RichTextField;
