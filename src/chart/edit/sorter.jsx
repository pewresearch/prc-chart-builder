/**
 * Category / series reorder list with optional show/hide toggles.
 *
 * react-movable wiring matches the block inspector. Visibility is `isHidden`
 * (not `disabled`) because react-movable treats `disabled` as non-draggable.
 */
import { List, arrayMove } from 'react-movable';
import { Icon } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

import { useMovableDocumentBridge } from './use-movable-document-bridge';

/**
 * @param {Array<{ label: string, disabled?: boolean, isHidden?: boolean }>} options
 * @return {Array<{ label: string, isHidden: boolean }>} Options with visibility
 *                                                       normalized onto `isHidden`.
 */
function normalizeOptions(options = []) {
	return (options || []).map((option) => ({
		label: option.label,
		isHidden: Boolean(option.isHidden ?? option.disabled ?? false),
	}));
}

function Sorter({
	options,
	setAttributes,
	attribute,
	parentObject = null,
	parentObjectValue = null,
	allowDisabled = true,
}) {
	const movable = useMovableDocumentBridge();
	const [items, setItems] = useState(() => normalizeOptions(options));

	useEffect(() => {
		const next = normalizeOptions(options);
		setItems((currentItems) => {
			const currentLabels = new Set(currentItems.map((i) => i.label));
			const newLabels = new Set(next.map((o) => o.label));

			const labelsChanged =
				currentLabels.size !== newLabels.size ||
				[...currentLabels].some((label) => !newLabels.has(label)) ||
				[...newLabels].some((label) => !currentLabels.has(label));

			return labelsChanged ? next : currentItems;
		});
	}, [options]);

	const updateAttribute = (newItems) => {
		const filteredValues = newItems
			.filter((i) => !i.isHidden)
			.map((i) => i.label);

		if (parentObject && parentObjectValue) {
			setAttributes({
				[parentObject]: {
					...parentObjectValue,
					[attribute]: filteredValues,
				},
			});
		} else {
			setAttributes({
				[attribute]: filteredValues,
			});
		}
	};

	return (
		<div ref={movable.ref} className="prc-chart-sorter">
			<List
				values={items}
				container={movable.container}
				onChange={({ oldIndex, newIndex }) => {
					const newItems = arrayMove(items, oldIndex, newIndex);
					setItems(newItems);
					updateAttribute(newItems);
				}}
				renderList={({ children, props }) => (
					<ul {...props} className="prc-chart-sorter__list">
						{children}
					</ul>
				)}
				renderItem={({
					value,
					props,
					index,
					isDragged,
					isSelected,
				}) => (
					<li
						{...props}
						className={[
							'prc-chart-sorter__item',
							(isDragged || isSelected) &&
								'prc-chart-sorter__item--dragging',
							isSelected && 'prc-chart-sorter__item--selected',
							value.isHidden &&
								'prc-chart-sorter__item--disabled',
						]
							.filter(Boolean)
							.join(' ')}
						style={props.style}
					>
						<div className="prc-chart-sorter__row">
							{value.label}
							{allowDisabled && (
								<button
									type="button"
									className="prc-chart-sorter__toggle"
									onClick={() => {
										const newItems = items.map((item, i) =>
											i === index
												? {
														...item,
														isHidden:
															!item.isHidden,
													}
												: item
										);
										setItems(newItems);
										updateAttribute(newItems);
									}}
								>
									{!value.isHidden ? (
										<Icon icon="visibility" />
									) : (
										<Icon icon="hidden" />
									)}
								</button>
							)}
						</div>
					</li>
				)}
			/>
		</div>
	);
}

export default Sorter;
