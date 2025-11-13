/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	TextControl,
	PanelBody,
	PanelRow,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import store from '../controller/store';

const HIDE_TABLE_LABEL = __('Hide Table');
const SHOW_TABLE_LABEL = __('Show Table');

export default function Controls({ attributes, clientId, blocks }) {
	const { ref } = attributes;

	const [title, setTitle] = useEntityProp('postType', 'chart', 'title', ref);
	const [permalink] = useEntityProp('postType', 'chart', 'link', ref);
	const editLink = useMemo(() => {
		const url = new URL(window.location.href);
		url.searchParams.set('post', ref);
		return url.toString();
	}, [ref]);

	// Get the controller block's id attribute
	const controllerId = useMemo(() => {
		const controllerBlock = blocks?.find(
			(block) => block.name === 'prc-chart-builder/controller'
		);
		return controllerBlock?.attributes?.id;
	}, [blocks]);

	const { set } = useDispatch('core/preferences');

	const { userHidesThisTable } = useSelect(
		(select) => {
			const { get } = select('core/preferences');
			const persistentHiddenTables = get(
				'prc-chart-builder/controller',
				'persistentHiddenTables'
			);

			return {
				userHidesThisTable:
					persistentHiddenTables &&
					controllerId &&
					persistentHiddenTables.includes(controllerId),
			};
		},
		[controllerId]
	);

	const hideThisTablePersistently = () => {
		if (!controllerId) {
			return;
		}

		const { get } = wp.data.select('core/preferences');
		const persistentHiddenTables = get(
			'prc-chart-builder/controller',
			'persistentHiddenTables'
		);

		if (!persistentHiddenTables) {
			set('prc-chart-builder/controller', 'persistentHiddenTables', [
				controllerId,
			]);
			return;
		}

		const newHiddenTables = [...persistentHiddenTables, controllerId];
		set('prc-chart-builder/controller', 'persistentHiddenTables', [
			...newHiddenTables,
		]);
	};

	const showThisTablePersistently = () => {
		if (!controllerId) {
			return;
		}

		const { get } = wp.data.select('core/preferences');
		const persistentHiddenTables = get(
			'prc-chart-builder/controller',
			'persistentHiddenTables'
		);

		const newHiddenTables = persistentHiddenTables.filter(
			(tableId) => tableId !== controllerId
		);
		set('prc-chart-builder/controller', 'persistentHiddenTables', [
			...newHiddenTables,
		]);
	};

	const handlePersistentTableVisibility = () => {
		if (userHidesThisTable) {
			showThisTablePersistently();
		} else {
			hideThisTablePersistently();
		}
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						name="hide-table"
						title={
							userHidesThisTable
								? SHOW_TABLE_LABEL
								: HIDE_TABLE_LABEL
						}
						onClick={() => handlePersistentTableVisibility()}
					>
						{userHidesThisTable
							? SHOW_TABLE_LABEL
							: HIDE_TABLE_LABEL}
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody>
					<div>
						<TextControl
							__nextHasNoMarginBottom
							label={__('Chart Title')}
							value={title}
							onChange={setTitle}
						/>
						<PanelRow>
							<Button
								variant="secondary"
								onClick={() => {
									window.open(permalink, '_blank');
								}}
							>
								Preview chart in isolation
							</Button>
						</PanelRow>
						<PanelRow>
							<Button
								variant="secondary"
								onClick={() => {
									window.open(editLink, '_blank');
								}}
							>
								Edit chart in isolation
							</Button>
						</PanelRow>
					</div>
				</PanelBody>
				<PanelBody title={__('Table Visibility')}>
					<div>
						<p>
							<Button
								onClick={() =>
									handlePersistentTableVisibility()
								}
								variant="secondary"
							>
								{userHidesThisTable
									? SHOW_TABLE_LABEL
									: HIDE_TABLE_LABEL}
							</Button>
						</p>
						<p>
							<em>
								{__(
									'The data table is automatically hidden when this chart is not selected. Use this button to hide it even when the chart is selected.'
								)}
							</em>
						</p>
						<hr style={{ margin: '15px 0' }} />
						<p>
							<strong>{__('Keyboard shortcuts:')}</strong>
						</p>
						<p>
							<code>Option + Shift + H</code>
							{' — '}
							{__(
								'Hide/show this table persistently across sessions'
							)}
						</p>
						<p>
							<code>Option + H</code>
							{' — '}
							{__(
								'Hide/show ALL tables temporarily (resets on new sessions)'
							)}
						</p>
					</div>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
