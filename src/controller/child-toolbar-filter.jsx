/**
 * Injects the shared ViewModeControls into the chart block and the
 * data table block when they are children of a
 * `prc-chart-builder/controller`. Keeps the "switch to data / switch
 * to chart" toggle reachable from whichever inner block the user is
 * actively editing.
 *
 * Implemented as a `editor.BlockEdit` filter so `prc-block/table` -- a
 * generic block used throughout the site -- does not need to know
 * anything about chart-builder.
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

import ViewModeControls from './view-mode-controls';
import controllerStore from './store';

const TARGET_BLOCKS = ['prc-chart-builder/chart', 'prc-block/table'];
const CONTROLLER_NAME = 'prc-chart-builder/controller';

function ChildViewControlsWrapper({ BlockEdit, blockProps }) {
	const { clientId, name } = blockProps;

	const { controllerId, chartClientId, tableClientId, view, showBoth } =
		useSelect(
			(select) => {
				const { getBlockParentsByBlockName, getBlock } =
					select(blockEditorStore);
				const parents = getBlockParentsByBlockName(
					clientId,
					CONTROLLER_NAME,
					true
				);
				if (!parents?.length) {
					return {
						controllerId: null,
						chartClientId: null,
						tableClientId: null,
						view: 'chart',
						showBoth: false,
					};
				}
				const controllerClientId = parents[0];
				const controllerBlock = getBlock(controllerClientId);
				const ctrlId = controllerBlock?.attributes?.id || null;
				const chartBlock = controllerBlock?.innerBlocks?.find(
					(inner) => inner.name === 'prc-chart-builder/chart'
				);
				const tableBlock = controllerBlock?.innerBlocks?.find(
					(inner) => inner.name === 'prc-block/table'
				);
				const { getControllerView, getControllerShowBoth } =
					select(controllerStore);
				return {
					controllerId: ctrlId,
					chartClientId: chartBlock?.clientId || null,
					tableClientId: tableBlock?.clientId || null,
					view: getControllerView(ctrlId),
					showBoth: getControllerShowBoth(ctrlId),
				};
			},
			[clientId]
		);

	const { setControllerView, setControllerShowBoth } =
		useDispatch(controllerStore);
	const { selectBlock } = useDispatch(blockEditorStore);

	if (!controllerId) {
		return <BlockEdit {...blockProps} />;
	}

	const handleChangeView = (nextView) => {
		setControllerView(controllerId, nextView);
		// Follow the selection to the newly-visible pane so the
		// controller's auto-switch effect agrees with this action
		// instead of fighting it, and the user's caret lands in a
		// block they can actually see.
		if (
			nextView === 'chart' &&
			chartClientId &&
			name !== 'prc-chart-builder/chart'
		) {
			selectBlock(chartClientId);
		} else if (
			nextView === 'data' &&
			tableClientId &&
			name !== 'prc-block/table'
		) {
			selectBlock(tableClientId);
		}
	};

	const handleChangeShowBoth = (next) => {
		setControllerShowBoth(controllerId, next);
	};

	return (
		<>
			<ViewModeControls
				view={view}
				showBoth={showBoth}
				onChangeView={handleChangeView}
				onChangeShowBoth={handleChangeShowBoth}
			/>
			<BlockEdit {...blockProps} />
		</>
	);
}

const withChartBuilderViewControls = createHigherOrderComponent(
	(BlockEdit) => (props) => {
		if (!TARGET_BLOCKS.includes(props.name)) {
			return <BlockEdit {...props} />;
		}
		return (
			<ChildViewControlsWrapper
				BlockEdit={BlockEdit}
				blockProps={props}
			/>
		);
	},
	'withChartBuilderViewControls'
);

export function registerChildToolbarFilter() {
	addFilter(
		'editor.BlockEdit',
		'prc-chart-builder/child-view-controls',
		withChartBuilderViewControls
	);
}

export default registerChildToolbarFilter;
