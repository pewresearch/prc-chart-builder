/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Flex,
	FlexBlock,
	FlexItem,
	Card,
	CardHeader,
	CardBody,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { DataViews, CreateNewChartModal, DropZone } from './components';

export default function ChartLibrary() {
	return (
		<Card>
			<CardHeader>
				<Flex align="center">
					<FlexBlock>
						<h1 style={{ margin: 0 }}>
							{__('Chart Library', 'prc-chart-builder')}
						</h1>
						<p style={{ margin: '4px 0 0', color: '#757575' }}>
							{__(
								'Add and manage charts used across the site.',
								'prc-chart-builder'
							)}
						</p>
					</FlexBlock>
					<FlexItem>
						<CreateNewChartModal />
					</FlexItem>
				</Flex>
			</CardHeader>
			<CardBody>
				<DataViews />
				<DropZone />
			</CardBody>
		</Card>
	);
}
