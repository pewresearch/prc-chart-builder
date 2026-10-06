/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useCommand } from '@wordpress/commands';
import { copy, brush } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import useCopyPasteStyles from './hooks/use-copy-paste-styles';

const COPY_STYLES_LABEL = __('Copy Chart Styles', 'prc-chart-builder');
const PASTE_STYLES_LABEL = __('Paste Chart Styles', 'prc-chart-builder');
const COMMAND_KEYWORDS = ['chart', 'styles', 'format', 'copy', 'paste'];

/**
 * CopyPasteStylesHandler - Block toolbar buttons and command palette
 * commands for copying/pasting chart styles.
 *
 * Command names are shared by every chart block, so only the selected
 * chart may register them.
 *
 * @param {Object}   props               - Component props
 * @param {Object}   props.attributes    - The chart block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {boolean}  props.isSelected    - Whether this chart block is selected
 */
const CopyPasteStylesHandler = ({ attributes, setAttributes, isSelected }) => {
	const { hasCopiedStyles, copyStyles, pasteStyles } = useCopyPasteStyles(
		attributes,
		setAttributes
	);

	useCommand({
		name: 'prc-chart-builder/copy-chart-styles',
		label: COPY_STYLES_LABEL,
		icon: copy,
		category: 'action',
		keywords: COMMAND_KEYWORDS,
		disabled: !isSelected,
		callback: ({ close }) => {
			copyStyles();
			close();
		},
	});

	useCommand({
		name: 'prc-chart-builder/paste-chart-styles',
		label: PASTE_STYLES_LABEL,
		icon: brush,
		category: 'action',
		keywords: COMMAND_KEYWORDS,
		disabled: !isSelected || !hasCopiedStyles,
		callback: ({ close }) => {
			pasteStyles();
			close();
		},
	});

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					icon={copy}
					name="copy-styles"
					label={COPY_STYLES_LABEL}
					title={COPY_STYLES_LABEL}
					onClick={copyStyles}
				/>
				{hasCopiedStyles && (
					<ToolbarButton
						icon={brush}
						name="paste-styles"
						label={PASTE_STYLES_LABEL}
						title={PASTE_STYLES_LABEL}
						onClick={pasteStyles}
					/>
				)}
			</ToolbarGroup>
		</BlockControls>
	);
};

export default CopyPasteStylesHandler;
