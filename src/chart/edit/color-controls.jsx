// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ExternalLink } from '@wordpress/components';
/**
 * Internal dependencies
 */
import CuratedColorControls from '../../shared/curated-controls/curated-color-controls';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { PanelDescription } from './control-ui';

function ColorControls({ attributes, setAttributes }) {
	const { isOpen, panelRef, onToggle } = useFocusedPanel('colors');

	return (
		<div ref={panelRef}>
			<PanelBody title={__('Colors')} opened={isOpen} onToggle={onToggle}>
				<CuratedColorControls
					attributes={attributes}
					setAttributes={setAttributes}
				/>
				<PanelDescription>
					<ExternalLink href="https://codepen.io/benjiwo/pen/GdBNPP">
						Pew Research Color Guide
					</ExternalLink>
				</PanelDescription>
			</PanelBody>
		</div>
	);
}

export default ColorControls;
