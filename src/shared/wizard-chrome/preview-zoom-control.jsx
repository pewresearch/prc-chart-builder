/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * Zoom buttons and a percent field for the chart preview. Zoom only changes
 * how the preview is shown; it is not saved with the chart.
 */
import {
	Button,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lineSolid, plus } from '@wordpress/icons';

import { ZOOM_MAX, ZOOM_MIN, parseZoomInput, stepZoom } from './preview-zoom';

/**
 * @param {Object}   props
 * @param {number}   props.zoom         Zoom in percent.
 * @param {Function} props.onZoomChange `(nextZoom) => void`.
 * @return {import('react').ReactNode} The zoom control.
 */
export default function PreviewZoomControl({ zoom, onZoomChange }) {
	// Typing applies on Enter or blur, so a partial number like the `1` in
	// `150` does not zoom the preview on the way. Arrow keys apply at once.
	const [draft, setDraft] = useState(String(zoom));

	useEffect(() => {
		setDraft(String(zoom));
	}, [zoom]);

	const commitDraft = () => {
		const next = parseZoomInput(draft);
		if (next === null) {
			setDraft(String(zoom));
			return;
		}
		setDraft(String(next));
		onZoomChange(next);
	};

	return (
		<div className="prc-chart-wizard__preview-zoom">
			<Button
				icon={lineSolid}
				iconSize={16}
				size="compact"
				label={__('Zoom out', 'prc-chart-builder')}
				disabled={zoom <= ZOOM_MIN}
				accessibleWhenDisabled
				onClick={() => onZoomChange(stepZoom(zoom, -1))}
			/>
			<NumberControl
				__next40pxDefaultSize
				size="compact"
				className="prc-chart-wizard__preview-zoom-field"
				label={__('Preview zoom', 'prc-chart-builder')}
				hideLabelFromVision
				min={ZOOM_MIN}
				max={ZOOM_MAX}
				spinControls="none"
				isDragEnabled={false}
				value={draft}
				suffix={
					<InputControlSuffixWrapper variant="control">
						%
					</InputControlSuffixWrapper>
				}
				onChange={(next, { event } = {}) => {
					setDraft(next ?? '');
					const spun = parseZoomInput(next ?? '');
					if (event?.type === 'keydown' && spun !== null) {
						onZoomChange(spun);
					}
				}}
				onBlur={commitDraft}
				onKeyDown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						commitDraft();
					} else if (event.key === 'Escape') {
						setDraft(String(zoom));
					}
				}}
			/>
			<Button
				icon={plus}
				iconSize={16}
				size="compact"
				label={__('Zoom in', 'prc-chart-builder')}
				disabled={zoom >= ZOOM_MAX}
				accessibleWhenDisabled
				onClick={() => onZoomChange(stepZoom(zoom, 1))}
			/>
		</div>
	);
}
