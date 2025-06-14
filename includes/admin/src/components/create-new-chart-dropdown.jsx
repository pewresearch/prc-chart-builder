/**
 * External Dependencies
 */
import { addCard } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

export default function CreateNewChartDropdown() {
	return (
		<DropdownMenu
			icon={null}
			label={'Create New Chart'}
			popoverProps={{
				offset: 8,
			}}
			text={'Create New Chart'}
			toggleProps={{
				className: 'create-new-chart-dropdown',
				variant: 'primary',
				showTooltip: false,
				__next40pxDefaultSize: true,
			}}
			children={({ onClose }) => (
				<MenuGroup>
					{[
						{
							icon: addCard,
							label: 'Add Chart Type A',
							value: 'add-chart-type-a',
						},
						{
							icon: addCard,
							label: 'Add Chart Type B',
							value: 'add-chart-type-b',
						},
						{
							icon: addCard,
							label: 'Add Chart Type C',
							value: 'add-chart-type-c',
						},
						{
							icon: addCard,
							label: 'Add Chart Type D',
							value: 'add-chart-type-d',
						},
					].map(({ icon, label, value }) => (
						<div
							key={value}
							className="create-new-chart-dropdown-btn-wrapper"
						>
							<MenuItem
								className={`create-new-chart-dropdown-btn-${value}`}
								icon={icon}
								iconPosition="left"
								onClick={() => {
									onClose();
								}}
							>
								{label}
							</MenuItem>
						</div>
					))}
				</MenuGroup>
			)}
		/>
	);
}
