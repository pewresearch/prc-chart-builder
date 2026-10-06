/**
 * Shared editor-view controls for the chart-builder controller and its
 * two inner blocks (the chart and the data table). Renders a toolbar
 * "switch view" button plus an inspector panel "Show both" toggle.
 *
 * View state is stored in the `prc-chart-builder/controller` Redux
 * store, keyed by controller id, so all three consumers stay in sync
 * without any block attributes or prop drilling.
 */
import { Fragment } from 'react';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useCommand } from '@wordpress/commands';
import { table, chartBar } from '@wordpress/icons';

const SWITCH_TO_DATA_LABEL = __('Switch to data', 'prc-chart-builder');
const SWITCH_TO_CHART_LABEL = __('Switch to chart', 'prc-chart-builder');
const VIEW_COMMAND_KEYWORDS = ['chart', 'data', 'table', 'view', 'switch'];

/**
 * @param {Object}         props
 * @param {'chart'|'data'} props.view              Current single-pane view when `showBoth` is false.
 * @param {boolean}        props.showBoth          Whether both panes are visible.
 * @param {Function}       props.onChangeView      Called with the next single-pane view value.
 * @param {Function}       props.onChangeShowBoth  Called with the next boolean.
 * @param {boolean}        [props.initialOpen]     Inspector panel default open state (defaults to true).
 * @param {boolean}        [props.isBlockSelected] When true, registers command palette toggle (defaults to false).
 */
export default function ViewModeControls({
	view,
	showBoth,
	onChangeView,
	onChangeShowBoth,
	initialOpen = true,
	isBlockSelected = false,
}) {
	const toolbarLabel =
		view === 'chart' ? SWITCH_TO_DATA_LABEL : SWITCH_TO_CHART_LABEL;
	const toolbarIcon = view === 'chart' ? table : chartBar;
	const toggleView = () => onChangeView(view === 'chart' ? 'data' : 'chart');

	useCommand({
		name: 'prc-chart-builder/toggle-chart-data-view',
		label: toolbarLabel,
		icon: toolbarIcon,
		category: 'action',
		keywords: VIEW_COMMAND_KEYWORDS,
		disabled: !isBlockSelected || showBoth,
		callback: ({ close }) => {
			toggleView();
			close();
		},
	});

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={__('Editor view')} initialOpen={initialOpen}>
					<ToggleControl
						label={__('Show both data and chart')}
						help={__(
							'Display the data table and chart side-by-side in the editor. This is a per-user editor preference and does not affect the published view.'
						)}
						checked={showBoth}
						onChange={(next) => onChangeShowBoth(next)}
					/>
				</PanelBody>
			</InspectorControls>
			{!showBoth && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							icon={toolbarIcon}
							label={toolbarLabel}
							onClick={toggleView}
						>
							{toolbarLabel}
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			)}
		</Fragment>
	);
}
