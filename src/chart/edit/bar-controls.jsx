// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { effectiveChartTypeForControls } from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { WidePanelItem } from './control-ui';

function BarControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('bar');

	const layout = getCurrentValue('layout') || {};
	const { type: chartType } = layout;
	const effectiveType = effectiveChartTypeForControls(attributes);

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Bar Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<ToolsPanel
					label={__('Attributes')}
					panelId={clientId}
					style={{
						paddingLeft: '0',
						paddingRight: '0',
					}}
				>
					{effectiveType === 'bar' && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Bar Group Padding')}
							isShownByDefault
							panelId={clientId}
						>
							<NumberControl
								label={__('Bar Group Padding')}
								withInputField
								min={0}
								max={10}
								step={0.05}
								value={parseFloat(
									getCurrentValue('bar', 'barGroupPadding') ||
										0,
									10
								)}
								onChange={(value) => {
									updateAttributeForDevice('bar', {
										barGroupPadding: formatNum(
											value,
											'float'
										),
									});
								}}
							/>
						</WidePanelItem>
					)}
					<WidePanelItem
						hasValue={() => true}
						label={__('Individual Bar Padding')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Individual Bar Padding')}
							withInputField
							min={0}
							max={10}
							step={0.05}
							value={parseFloat(
								getCurrentValue('bar', 'barPadding') || 0,
								10
							)}
							onChange={(value) => {
								updateAttributeForDevice('bar', {
									barPadding: formatNum(value, 'float'),
								});
							}}
						/>
					</WidePanelItem>
					{chartType === 'exploded-bar' && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Exploded Bar Column Gap')}
							isShownByDefault
							panelId={clientId}
						>
							<NumberControl
								label={__('Exploded Bar Column Gap')}
								withInputField
								step={1}
								value={parseInt(
									getCurrentValue(
										'explodedBar',
										'columnGap'
									) || 0,
									10
								)}
								onChange={(value) => {
									updateAttributeForDevice('explodedBar', {
										columnGap: formatNum(value, 'integer'),
									});
								}}
							/>
						</WidePanelItem>
					)}
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default BarControls;
