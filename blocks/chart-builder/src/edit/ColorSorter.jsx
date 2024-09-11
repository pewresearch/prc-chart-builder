/**
 * External Dependencies
 */
import { List, arrayMove } from 'react-movable';
/**
 * Wordpress Dependencies
 */
import { useState, useEffect } from 'react';

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
	// set determine color contrast per W3 guidelines: https://www.w3.org/TR/AERT/#color-contrast
	// Color brightness = ((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000
	// The range for color brightness difference is 125.
	const brightness = Math.round(
		(rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
	);
	const fill = 125 < brightness ? 'black' : 'white';
	return fill;
}

const ColorSorter = function ({ colors, setAttributes }) {
	const [items, setItems] = useState(colors);
	useEffect(() => {
		setItems(colors);
	}, [colors]);
	return (
		<div className="components-base-control">
			<div
				style={{
					fontSize: '11px',
					fontWeight: '500',
					lineHeight: '1.4',
					textTransform: 'uppercase',
					display: 'inline-block',
					marginBottom: 'calc(8px)',
					padding: '0px',
				}}
			>
				Arrange Active Colors
			</div>
			<List
				values={items}
				onChange={({ oldIndex, newIndex }) => {
					const newItems = arrayMove(items, oldIndex, newIndex);
					setItems(newItems);
					setAttributes({
						customColors: newItems,
					});
				}}
				renderList={({ children, props }) => (
					<ul {...props}>{children}</ul>
				)}
				renderItem={({ value, props, isDragged }) => (
					<li
						{...props}
						style={{
							...props.style,
							listStyleType: 'none',
							cursor: isDragged ? 'grabbing' : 'grab',
							backgroundColor: value,
							borderRadius: '5px',
							padding: '5px',
							borderBottom: '1px solid #CCC',
							color: labelFill(value),
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							{value}
						</div>
					</li>
				)}
			/>
		</div>
	);
};

export default ColorSorter;
