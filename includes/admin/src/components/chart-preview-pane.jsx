/**
 * Live chart preview for the configure step (PRC-527).
 *
 * Renders ChartBuilderWrapper with getConfig('modal-preview') — no block mount,
 * no wpEditorFunctions (non-interactive preview). Freeform charts show an
 * unavailable message instead of a broken SVG preview.
 */
import {
	ChartBuilderTextWrapper,
	ChartBuilderWrapper,
} from '@prc/charting-library';
import { Spinner } from '@wordpress/components';
import { Suspense, useMemo } from '@wordpress/element';

import getConfig from '../../../../src/chart/utils/get-config';
import { buildPreviewChartData } from '../../../../src/chart/utils/build-preview-chart-data';
import {
	FreeformPreviewUnavailable,
	isFreeformChartPreview,
} from '../../../../src/shared/chart-preview';
import { prepareChartAttributesForPreview } from '../utils/configure-preview/chart-attributes';

/**
 * @param {Object}        props
 * @param {Object}        props.chartAttributes Seeded/edited chart block attributes.
 * @param {string|number} [props.previewKey]    Remount key when the configure step opens.
 */
export default function ChartPreviewPane({ chartAttributes, previewKey }) {
	const isFreeform = isFreeformChartPreview(chartAttributes);
	const previewAttributes = useMemo(
		() => prepareChartAttributesForPreview(chartAttributes),
		[chartAttributes]
	);
	const config = useMemo(
		() =>
			isFreeform ? null : getConfig(previewAttributes, 'modal-preview'),
		[isFreeform, previewAttributes]
	);
	const data = useMemo(
		() => (isFreeform ? [] : buildPreviewChartData(previewAttributes)),
		[isFreeform, previewAttributes]
	);

	if (isFreeform) {
		return (
			<div
				className="prc-chart-modal__preview-pane"
				data-preview-key={previewKey}
			>
				<FreeformPreviewUnavailable />
			</div>
		);
	}

	const { metadata = {}, layout = {} } = config;

	return (
		<div
			className="prc-chart-modal__preview-pane"
			data-preview-key={previewKey}
		>
			{/*
			 * `wp-block-prc-chart-builder-controller` is required: the
			 * title/subtitle/footer (`cb__*`) styles are scoped under the
			 * controller class in the controller block's stylesheet. This
			 * mirrors the real render tree so those styles apply in the preview.
			 */}
			<div className="wp-block-prc-chart-builder-controller">
				<figure
					className="prc-chart-modal__preview-figure"
					style={{
						width: `${layout.width}px`,
						maxWidth: `${layout.width}px`,
					}}
				>
					<ChartBuilderTextWrapper
						active={metadata.active}
						width={layout.width}
						horizontalRules={layout.horizontalRules}
						title={metadata.title}
						subtitle={metadata.subtitle}
						note={metadata.note}
						source={metadata.source}
						tag={metadata.tag}
					>
						<Suspense fallback={<Spinner />}>
							<ChartBuilderWrapper
								key={previewKey}
								config={config}
								data={data}
							/>
						</Suspense>
					</ChartBuilderTextWrapper>
				</figure>
			</div>
		</div>
	);
}
