/**
 * External Dependencies
 */

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
import { DataViews, CreateNewChartDropdown, DropZone } from './components';

export default function ChartLibrary() {
	return (
		<Card>
			<CardHeader>
				<Flex>
					<FlexBlock>
						<h1>
							{__('Chart Builder Library', 'prc-chart-builder')}
						</h1>
						<p>
							{__('Add and manage charts used across the site.')}
						</p>
					</FlexBlock>
					<FlexItem>
						<CreateNewChartDropdown />
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
