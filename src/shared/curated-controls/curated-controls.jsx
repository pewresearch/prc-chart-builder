/**
 * Curated chart controls for the Configure / Style Chart step (PRC-527).
 *
 * Tabbed sections: Appearance, Data, Text, and an optional chart-type tab.
 * Shared by the admin Chart Library wizard and the chart CPT Controller host.
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { InspectorFocusProvider } from '../../chart/edit/hooks/inspector-focus-context';
import AppearanceTab from './appearance-tab';
import ChartTypeTab from './chart-type-tab';
import { getChartTypeTabMeta } from './chart-type-tab-meta';
import DataTab from './data-tab';
import TextTab from './text-tab';

/**
 * @param {Object}   props
 * @param {string}   props.id
 * @param {string}   props.label
 * @param {boolean}  props.isActive
 * @param {Function} props.onSelect
 */
function ConfigureTab({ id, label, isActive, onSelect }) {
	return (
		<button
			type="button"
			role="tab"
			id={`prc-chart-configure-tab-${id}`}
			aria-selected={isActive}
			aria-controls={`prc-chart-configure-panel-${id}`}
			tabIndex={isActive ? 0 : -1}
			className={[
				'prc-chart-modal__tab',
				'prc-chart-modal__configure-tab',
				isActive && 'prc-chart-modal__tab--active',
			]
				.filter(Boolean)
				.join(' ')}
			onClick={() => onSelect(id)}
		>
			{label}
		</button>
	);
}

/**
 * @param {Object}   props
 * @param {Object}   props.chartAttributes Current chart attributes.
 * @param {Function} props.onChange        `(nextChartAttributes) => void`.
 */
export default function CuratedControls({ chartAttributes, onChange }) {
	const chartTypeTab = useMemo(
		() => getChartTypeTabMeta(chartAttributes),
		[chartAttributes]
	);

	const tabs = useMemo(() => {
		const base = [
			{
				id: 'appearance',
				label: __('Appearance', 'prc-chart-builder'),
			},
			{ id: 'data', label: __('Data', 'prc-chart-builder') },
			{ id: 'text', label: __('Text', 'prc-chart-builder') },
		];
		if (chartTypeTab) {
			base.push({
				id: 'chart-type',
				label: chartTypeTab.label,
			});
		}
		return base;
	}, [chartTypeTab]);

	const [activeTab, setActiveTab] = useState('appearance');

	useEffect(() => {
		if (!tabs.some((tab) => tab.id === activeTab)) {
			setActiveTab('appearance');
		}
	}, [tabs, activeTab]);

	const setAttributes = (updates) =>
		onChange({ ...chartAttributes, ...updates });

	return (
		<div className="prc-chart-modal__configure-tabs">
			<div
				className="prc-chart-modal__tab-bar prc-chart-modal__configure-tab-bar"
				role="tablist"
				aria-label={__('Chart style sections', 'prc-chart-builder')}
			>
				{tabs.map((tab) => (
					<ConfigureTab
						key={tab.id}
						id={tab.id}
						label={tab.label}
						isActive={activeTab === tab.id}
						onSelect={setActiveTab}
					/>
				))}
			</div>

			<div
				id={`prc-chart-configure-panel-${activeTab}`}
				role="tabpanel"
				aria-labelledby={`prc-chart-configure-tab-${activeTab}`}
				className="prc-chart-modal__configure-tab-content"
			>
				{activeTab === 'appearance' && (
					<AppearanceTab
						chartAttributes={chartAttributes}
						onChange={onChange}
						setAttributes={setAttributes}
					/>
				)}
				{activeTab === 'data' && (
					<DataTab
						chartAttributes={chartAttributes}
						onChange={onChange}
						setAttributes={setAttributes}
					/>
				)}
				{activeTab === 'text' && (
					<InspectorFocusProvider>
						<TextTab
							chartAttributes={chartAttributes}
							setAttributes={setAttributes}
						/>
					</InspectorFocusProvider>
				)}
				{activeTab === 'chart-type' && chartTypeTab && (
					<InspectorFocusProvider>
						<ChartTypeTab
							chartAttributes={chartAttributes}
							setAttributes={setAttributes}
						/>
					</InspectorFocusProvider>
				)}
			</div>
		</div>
	);
}
