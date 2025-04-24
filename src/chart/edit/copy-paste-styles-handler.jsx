/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, select } from '@wordpress/data';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
/**
 * Internal Dependencies
 */
import store from './store';
import getLayoutAttributes from '../utils/get-layout-attributes';

const COPY_STYLES_LABEL = __('Copy Layout Styles');
const PASTE_STYLES_LABEL = __('Paste Layout Styles');

const CopyPasteStylesHandler = ({
	children,
	id,
	attributes,
	setAttributes,
}) => {
	const layoutAttributes = getLayoutAttributes(attributes);
	const { copyLayoutStyles } = useDispatch(store);

	const hasCopiedLayoutStyles = select(store).getCopiedStylesStatus();
	const copyStyles = () => {
		copyLayoutStyles(layoutAttributes);
	};
	const pasteStyles = () => {
		const { getCopiedStyles } = select(store);
		const styles = getCopiedStyles();
		setAttributes({
			...attributes,
			...styles,
		});
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						name="copy-styles"
						label={COPY_STYLES_LABEL}
						title={COPY_STYLES_LABEL}
						onClick={() => copyStyles()}
					>
						{COPY_STYLES_LABEL}
					</ToolbarButton>
				</ToolbarGroup>
				{hasCopiedLayoutStyles && (
					<ToolbarGroup>
						<ToolbarButton
							name="paste-styles"
							label={PASTE_STYLES_LABEL}
							title={PASTE_STYLES_LABEL}
							onClick={() => pasteStyles()}
						>
							{PASTE_STYLES_LABEL}
						</ToolbarButton>
					</ToolbarGroup>
				)}
			</BlockControls>
			{children}
		</>
	);
};

export default CopyPasteStylesHandler;
