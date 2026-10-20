/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import getSmallMultiplesPanels from '../utils/get-small-multiples-panels';
import { getSeriesColorSlotKeys } from '../utils/get-series-color-keys';
import SeriesStyleList from './series-style-list';

/**
 * One color section per small-multiples panel, written to
 * `smallMultiples.panelStyles`. Unset rows show the shared color they inherit.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes       Chart block attributes.
 * @param {string[]} props.palette          Active palette colors.
 * @param {string[]} [props.paletteSources] Selected palette slugs; when set,
 *                                          row pickers offer only these.
 * @param {string}   [props.chartType]      Effective chart type for field gating.
 * @param {Function} props.onChange         Receives the next `panelStyles`.
 */
export default function SmallMultiplesPanelColors({
	attributes,
	palette = [],
	paletteSources,
	chartType,
	onChange,
}) {
	const seriesStyles = attributes.seriesStyles ?? {};
	const panelStyles = attributes.smallMultiples?.panelStyles ?? {};
	const slotKeys = getSeriesColorSlotKeys(attributes);
	const sharedColor = (sharedKey) =>
		seriesStyles[sharedKey]?.fill ??
		palette[Math.max(0, slotKeys.indexOf(sharedKey)) % palette.length];

	return getSmallMultiplesPanels(attributes).map((panel) => (
		<div key={panel.key} data-panel-key={panel.key}>
			<h3 className="prc-chart-controls__label">
				{
					/* translators: %s: panel name. */
					sprintf(__('Panel: %s', 'prc-chart-builder'), panel.key)
				}
			</h3>
			<SeriesStyleList
				categories={panel.seriesKeys}
				seriesStyles={panelStyles[panel.key] ?? {}}
				palette={palette}
				paletteSources={paletteSources}
				fallbackColors={panel.sharedKeys.map(sharedColor)}
				chartType={chartType}
				onChange={(next) =>
					onChange({ ...panelStyles, [panel.key]: next })
				}
			/>
		</div>
	));
}
