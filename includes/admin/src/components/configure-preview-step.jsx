/**
 * Configure + live preview wizard step (PRC-527).
 *
 * Slice 3: right-pane preview only. Curated controls land in slices 6–8.
 */
import { Button, Flex, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import ChartPreviewPane from './chart-preview-pane';
import CuratedControls from './curated-controls';

/**
 * @param {Object}        props
 * @param {Object}        props.chartAttributes
 * @param {Function}      props.onChartAttributesChange Replace the whole chart attributes object.
 * @param {Function}      props.onBack
 * @param {string|number} [props.previewKey]
 * @param {Function}      props.onCreate
 * @param {boolean}       [props.isCreating]
 * @param {string|null}   [props.createError]
 * @param {string}        [props.mode]
 * @param {string}        [props.layout]                'full' hides the inline footer (the wizard action bar owns it).
 */
export default function ConfigurePreviewStep({
	chartAttributes,
	onChartAttributesChange,
	onBack,
	previewKey,
	onCreate,
	isCreating = false,
	createError = null,
	mode = 'create-post',
	layout = 'compact',
}) {
	const isInlineMode = mode === 'inline';
	const showInlineFooter = layout !== 'full';

	let createLabel;
	if (isCreating) {
		createLabel = (
			<Flex gap={2}>
				<Spinner />
				{isInlineMode
					? __('Inserting…', 'prc-chart-builder')
					: __('Creating…', 'prc-chart-builder')}
			</Flex>
		);
	} else if (isInlineMode) {
		createLabel = __('Insert Chart', 'prc-chart-builder');
	} else {
		createLabel = __('Create Chart', 'prc-chart-builder');
	}

	return (
		<div className="prc-chart-modal__configure">
			<div className="prc-chart-modal__configure-controls">
				{layout !== 'full' && (
					<p className="prc-chart-modal__step-label">
						{__('Chart Settings', 'prc-chart-builder')}
					</p>
				)}
				<CuratedControls
					chartAttributes={chartAttributes}
					onChange={onChartAttributesChange}
				/>
			</div>
			<ChartPreviewPane
				chartAttributes={chartAttributes}
				previewKey={previewKey}
			/>
			{showInlineFooter && (
				<div className="prc-chart-modal__configure-footer">
					{createError && (
						<Notice status="error" isDismissible={false}>
							{createError}
						</Notice>
					)}
					<Flex justify="space-between" align="center">
						<Button
							variant="secondary"
							onClick={onBack}
							disabled={isCreating}
						>
							{__('Back', 'prc-chart-builder')}
						</Button>
						<Button
							variant="primary"
							onClick={onCreate}
							disabled={isCreating}
						>
							{createLabel}
						</Button>
					</Flex>
				</div>
			)}
		</div>
	);
}
