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
				const ref = parseInt(item?.entityId, 10);
				if (!Number.isFinite(ref) || ref <= 0) {
					return;
				}
				setAttributes({ ref });
			}}
			perPage={10}
			showType={false}
			showFeaturedImage={true}
		/>
	);
}
