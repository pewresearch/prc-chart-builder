/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginPostStatusInfo, store as editorStore } from '@wordpress/editor';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import {
	TextControl,
	Button,
	Dropdown,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Design Slug Component (in Post Status Info section)
 */
export function DesignSlugStatusInfo() {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [popoverAnchor, setPopoverAnchor] = useState(null);
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ({
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'left-start',
			offset: 36,
			shift: true,
		}),
		[popoverAnchor]
	);

	const { postType, designSlug } = useSelect(
		(select) => ({
			postType: select(editorStore).getCurrentPostType(),
			designSlug:
				select(editorStore).getEditedPostAttribute('meta')
					?.design_slug || '',
		}),
		[]
	);

	const { editPost } = useDispatch(editorStore);

	// Only show for chart post type
	if (postType !== 'chart') {
		return null;
	}

	const handleDesignSlugChange = (value) => {
		editPost({ meta: { design_slug: value } });
	};

	return (
		<PluginPostStatusInfo>
			<HStack className={'editor-post-panel__row'} ref={setPopoverAnchor}>
				<div className="editor-post-panel__row-label">
					{__('Design Slug', 'prc-chart-builder')}
				</div>
				<div className="editor-post-panel__row-control">
					<Dropdown
						popoverProps={popoverProps}
						contentClassName="editor-post-design-slug__panel-dialog"
						focusOnMount
						renderToggle={({ isOpen, onToggle }) => (
							<Button
								size="compact"
								className="editor-post-design-slug__panel-toggle"
								variant="tertiary"
								aria-expanded={isOpen}
								aria-label={
									__(
										'Change design slug:',
										'prc-chart-builder'
									) +
									' ' +
									(designSlug ||
										__('Not set', 'prc-chart-builder'))
								}
								onClick={onToggle}
							>
								{designSlug ||
									__('Not set', 'prc-chart-builder')}
							</Button>
						)}
						renderContent={({ onClose }) => (
							<div className="editor-post-design-slug">
								<InspectorPopoverHeader
									title={__(
										'Design Slug',
										'prc-chart-builder'
									)}
									onClose={onClose}
								/>
								<div style={{ padding: '16px' }}>
									<TextControl
										value={designSlug}
										onChange={handleDesignSlugChange}
										placeholder={__(
											'Team-Name_Date_Topic',
											'prc-chart-builder'
										)}
										help={__(
											'Enter a unique identifier for this chart design. This is used to identify the chart in the design team. Typically follows a format like "SR_2025.12.10_HealthCare_topic".',
											'prc-chart-builder'
										)}
									/>
								</div>
							</div>
						)}
					/>
				</div>
			</HStack>
		</PluginPostStatusInfo>
	);
}
