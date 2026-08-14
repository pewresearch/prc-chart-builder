// V2
/**
 * External Dependencies
 */
import { List, arrayMove } from 'react-movable';
/**
 * WordPress Dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { useMovableDocumentBridge } from './use-movable-document-bridge';

function labelFill(hex = '#000000') {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	// eslint-disable-next-line no-param-reassign
	hex = hex
		.toString()
		.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		return 'black';
	}

	const rgb = [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16),
	];
	const brightness = Math.round(
		(rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
	);
	return 125 < brightness ? 'black' : 'white';
}

/**
 * Drag-reorder the active series color scale into `io.customColors`.
 *
 * Legend category labels stay in the order owned by legend controls.
 * Only the color chips move.
 *
 * react-movable wiring matches the block inspector — `{...props}` on list/items.
 *
 * @param {Object}   props
 * @param {string[]} props.colors        Active palette colors (hex or tokens).
 * @param {string[]} [props.categories]  Legend labels in legend order.
 * @param {Function} props.setAttributes Chart `setAttributes` shim.
 * @param {Object}   props.io            Current `io` attribute group.
 */
const ColorSorter = function ({
	colors = [],
	categories = [],
	setAttributes,
	io,
}) {
	const movable = useMovableDocumentBridge();
	const [items, setItems] = useState(() =>
		Array.isArray(colors) ? colors : []
	);
	const legendLabels = Array.isArray(categories) ? categories : [];

	useEffect(() => {
		setItems(Array.isArray(colors) ? colors : []);
	}, [colors]);

	if (!items.length) {
		return (
			<div className="prc-chart-color-sorter">
				<p className="prc-chart-color-sorter__empty">
					{__(
						'No colors in the active palette to rearrange.',
						'prc-chart-builder'
					)}
				</p>
			</div>
		);
	}

	const labelCount = Math.max(legendLabels.length, items.length);
	const showCategories = legendLabels.length > 0;

	return (
		<div
			ref={movable.ref}
			className="prc-chart-color-sorter components-base-control"
		>
			<div className="prc-chart-color-sorter__label">
				{__('Arrange active colors', 'prc-chart-builder')}
			</div>
			<div
				className={[
					'prc-chart-color-sorter__grid',
					showCategories && 'prc-chart-color-sorter__grid--labeled',
				]
					.filter(Boolean)
					.join(' ')}
			>
				{showCategories && (
					<div className="prc-chart-color-sorter__categories">
						{Array.from({ length: labelCount }, (_, index) => (
							<div
								key={`category-${index}`}
								className="prc-chart-color-sorter__category"
							>
								{legendLabels[index] ?? ''}
							</div>
						))}
					</div>
				)}
				<List
					values={items}
					container={movable.container}
					onChange={({ oldIndex, newIndex }) => {
						const newItems = arrayMove(items, oldIndex, newIndex);
						setItems(newItems);
						setAttributes({
							io: { ...io, customColors: newItems },
						});
					}}
					renderList={({ children, props }) => (
						<div {...props} className="prc-chart-color-sorter__list">
							{children}
						</div>
					)}
					renderItem={({ value, props, isDragged }) => (
						<div
							{...props}
							className={[
								'prc-chart-color-sorter__item',
								isDragged &&
									'prc-chart-color-sorter__item--dragging',
							]
								.filter(Boolean)
								.join(' ')}
							style={{
								...props.style,
								backgroundColor: value,
								color: labelFill(value),
							}}
						>
							{value}
						</div>
					)}
				/>
			</div>
		</div>
	);
};

export default ColorSorter;
