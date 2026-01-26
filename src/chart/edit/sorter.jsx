/**
 * External Dependencies
 */
import { List, arrayMove } from 'react-movable';
/**
 * Wordpress Dependencies
 */
import { useState, useEffect } from 'react';
import { Icon } from '@wordpress/components';

function Sorter({
	options,
	setAttributes,
	attribute,
	parentObject = null,
	parentObjectValue = null,
	allowDisabled = true,
}) {
	const [items, setItems] = useState(options);

	// Update items when options prop changes, but only if the set of items changed
	useEffect(() => {
		setItems((currentItems) => {
			const currentLabels = new Set(currentItems.map((i) => i.label));
			const newLabels = new Set(options.map((o) => o.label));

			// Only update if items were added or removed, not if just order changed
			const labelsChanged =
				currentLabels.size !== newLabels.size ||
				[...currentLabels].some((label) => !newLabels.has(label)) ||
				[...newLabels].some((label) => !currentLabels.has(label));

			return labelsChanged ? options : currentItems;
		});
	}, [options]);

	// Helper function to update attributes (handles both flat and nested)
	const updateAttribute = (newItems) => {
		const filteredValues = newItems
			.filter((i) => !i.disabled)
			.map((i) => i.label);

		if (parentObject && parentObjectValue) {
			// Nested attribute update (e.g., divergingBar.positiveCategories)
			setAttributes({
				[parentObject]: {
					...parentObjectValue,
					[attribute]: filteredValues,
				},
			});
		} else {
			// Flat attribute update (e.g., categories)
			setAttributes({
				[attribute]: filteredValues,
			});
		}
	};

	return (
		<div style={{ width: '100%' }}>
			<List
				values={items}
				onChange={({ oldIndex, newIndex }) => {
					const newItems = arrayMove(items, oldIndex, newIndex);
					setItems(newItems);
					updateAttribute(newItems);
				}}
				renderList={({ children, props }) => (
					<ul {...props}>{children}</ul>
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
						style={{
							...props.style,
							listStyleType: 'none',
							cursor: isDragged ? 'grabbing' : 'grab',
							color: value.disabled ? '#888' : '#333',
							textDecoration: value.disabled
								? 'line-through'
								: 'none',
							backgroundColor:
								isDragged || isSelected ? '#EEE' : '#FFF',
							paddingTop: '5px',
							paddingBottom: '5px',
							borderBottom: '1px solid #CCC',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							{value.label}
							{allowDisabled && (
								<button
									type="button"
									onClick={() => {
										const newItems = items.map((item, i) =>
											i === index
												? {
														...item,
														disabled:
															!item.disabled,
													}
												: item
										);
										setItems(newItems);
										updateAttribute(newItems);
									}}
									style={{
										border: 'none',
										margin: 0,
										padding: 0,
										width: 'auto',
										overflow: 'visible',
										cursor: 'pointer',
										background: 'transparent',
									}}
								>
									{!value.disabled ? (
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
