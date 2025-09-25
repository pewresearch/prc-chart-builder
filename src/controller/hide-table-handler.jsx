/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	KeyboardShortcuts,
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
} from '@wordpress/components';
import { useCommand } from '@wordpress/commands';
import { table } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import store from './store';

const HIDE_TABLE_LABEL = __('Hide THIS Table');
const SHOW_TABLE_LABEL = __('Show THIS Table');

const HIDE_ALL_TABLE_LABEL = __('Hide ALL Tables (Temporary)');
const SHOW_ALL_TABLE_LABEL = __('Show ALL Tables (Temporary)');

export default function HideTableHandler({ children, id }) {
	const { set } = useDispatch('core/preferences');
	const { toggleAllTableVisibility } = useDispatch(store);

	const { persistentHiddenTables, tempHideAllTables } = useSelect(
		(select) => {
			const { get } = select('core/preferences');
			const { getAllTableVisibility } = select(store);
			return {
				persistentHiddenTables: get(
					'prc-chart-builder/controller',
					'persistentHiddenTables'
				),
				tempHideAllTables: getAllTableVisibility(),
			};
		},
		[]
	);

	// Register the command for hiding/showing all tables
	useCommand({
		name: 'prc-chart-builder/toggle-all-tables',
		label: tempHideAllTables ? SHOW_ALL_TABLE_LABEL : HIDE_ALL_TABLE_LABEL,
		icon: table,
		callback: ({ close }) => {
			toggleAllTableVisibility();
			close();
		},
	});

	const userHidesThisTable = useMemo(
		() => persistentHiddenTables && persistentHiddenTables.includes(id),
		[persistentHiddenTables, id]
	);

	const hideThisTablePersistently = () => {
		// check if persistentHiddenTables exists, if not, create it
		if (!persistentHiddenTables) {
			set('prc-chart-builder/controller', 'persistentHiddenTables', [id]);
			return;
		}

		const newHiddenTables = [...persistentHiddenTables, id];
		set('prc-chart-builder/controller', 'persistentHiddenTables', [
			...newHiddenTables,
		]);
	};

	const showThisTablePersistently = () => {
		const newHiddenTables = persistentHiddenTables.filter(
			(tableId) => tableId !== id
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

	const handleTemporaryTableVisibility = (e) => {
		toggleAllTableVisibility();
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
							<Button
								onClick={() => handleTemporaryTableVisibility()}
								variant="secondary"
							>
								{tempHideAllTables
									? SHOW_ALL_TABLE_LABEL
									: HIDE_ALL_TABLE_LABEL}
							</Button>
						</p>
						<p>
							<strong>Keyboard shortcuts available:</strong>
						</p>
						<p>
							<code>Option + Shift + H</code> to hide/show this
							table in editor view, persistently, across your
							sessions.
						</p>
						<p>
							<code>Option + H</code> to hide/show ALL tables in
							editor view. This is temporary and will reset on new
							sessions.
						</p>
					</div>
				</PanelBody>
			</InspectorControls>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={{
					'option+shift+h': () => handlePersistentTableVisibility(),
					'option+h': () => handleTemporaryTableVisibility(),
				}}
			>
				{children}
			</KeyboardShortcuts>
		</>
	);
}
