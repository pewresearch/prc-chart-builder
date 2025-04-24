/**
 * External Dependencies
 */
import { WPEntitySearch } from '@prc/components';

export default function ChartSearch({ clientId, attributes, setAttributes }) {
	return (
		<WPEntitySearch
			placeholder="Search for charts"
			entityType="postType"
			entitySubType="chart"
			entityStatus={['publish', 'draft']}
			onSelect={(item) => {
				setAttributes({
					ref: parseInt(item.entityId),
				});
			}}
			onKeyEnter={() => {
				console.log("Enter Key Pressed");
			}}
			onKeyESC={() => {
				console.log("ESC Key Pressed");
			}}
			perPage={10}
		/>
	);
}
