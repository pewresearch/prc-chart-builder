/**
 * External Dependencies
 */
import { WPEntitySearch } from '@prc/components';

export default function ChartSearch({ setAttributes }) {
	return (
		<WPEntitySearch
			placeholder="Search for charts"
			entityType="postType"
			entitySubType="chart"
			entityStatus={['publish', 'draft', 'future']}
			onSelect={(item) => {
				setAttributes({
					ref: parseInt(item.entityId),
				});
			}}
			perPage={10}
			showFeaturedImage={true}
		/>
	);
}
