/**
 * External Dependencies
 */
import { WPEntitySearch } from '@prc/components';

export default function ChartSearch({ setAttributes, entityId, onSelect }) {
	return (
		<WPEntitySearch
			placeholder="Search for charts"
			entityId={entityId}
			entityType="postType"
			entitySubType="chart"
			entityStatus={['publish', 'draft', 'future']}
			onSelect={(item) => {
				const ref = parseInt(item?.entityId, 10);
				if (!Number.isFinite(ref) || ref <= 0) {
					return;
				}
				setAttributes({ ref });
				onSelect?.(ref);
			}}
			perPage={10}
			showType={false}
			showFeaturedImage={true}
		/>
	);
}
