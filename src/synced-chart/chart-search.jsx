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
			perPage={10}
		/>
	);
}
