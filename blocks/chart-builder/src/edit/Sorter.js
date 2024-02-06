/**
 * External Dependencies
 */
import { List, arrayMove } from 'react-movable';
/**
 * Wordpress Dependencies
 */
import { useState } from '@wordpress/element';
import { Icon } from '@wordpress/components';

function Sorter({ options, setAttributes, attribute, allowDisabled = true }) {
	const [items, setItems] = useState(options);
	return (
		<div style={{ width: '100%' }}>
			<List
				values={items}
				onChange={({ oldIndex, newIndex }) => {
					const newItems = arrayMove(items, oldIndex, newIndex);
					setItems(newItems);
					setAttributes({
						[attribute]: newItems
							.filter((i) => !i.disabled)
							.map((i) => i.label),
					});
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
									onClick={({ oldIndex, newIndex }) => {
										items[index].disabled =
											!items[index].disabled;
										const newItems = arrayMove(
											items,
											oldIndex,
											newIndex
										);
										setItems(newItems);
										setAttributes({
											[attribute]: newItems
												.filter((i) => !i.disabled)
												.map((i) => i.label),
										});
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
