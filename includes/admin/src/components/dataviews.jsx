/**
 * External Dependencies
 */
import {
	DataViews as DataViewsComponent,
	filterSortAndPaginate,
} from '@wordpress/dataviews';

/**
 * WordPress Dependencies
 */
import { useEffect, useState, useMemo } from '@wordpress/element';
import { Spinner, Flex, FlexBlock, FlexItem } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import actions from '../actions';
import fields from '../fields';
import useCharts from '../hooks/use-charts';

export default function DataViews({}) {
	const [view, setView] = useState({
		type: 'table',
		fields: ['date'],
		titleField: 'title',
		descriptionField: 'description',
	});

	const { charts, isLoading } = useCharts();

	const { data: shownData, paginationInfo } = useMemo(() => {
		const result = filterSortAndPaginate(charts, view, fields);
		console.log('filterSortAndPaginate:', result);
		return result;
	}, [view, charts]);

	if (isLoading) {
		return (
			<Flex>
				<FlexItem>
					<Spinner />
				</FlexItem>
				<FlexBlock>
					<p>Loading Chart Builder Library...</p>
				</FlexBlock>
			</Flex>
		);
	}

	return (
		<DataViewsComponent
			fields={fields}
			data={shownData}
			view={view}
			search={true}
			paginationInfo={paginationInfo}
			getItemId={(item) => item.id.toString()}
			onChangeView={setView}
			actions={actions}
			onClickItem={(item) => {
				// eslint-disable-next-line no-alert
				alert(`Clicked: ${item.title}`);
			}}
			isItemClickable={() => true}
		/>
	);
}
