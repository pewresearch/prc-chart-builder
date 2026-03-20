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
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { DataViews, CreateNewChartModal, DropZone } from './components';

export default function ChartLibrary() {
	const [isOpen, setIsOpen] = useState(false);
	const [initialCsvText, setInitialCsvText] = useState('');

	const handleFileDrop = useCallback((files) => {
		const csvFile = files.find(
			(f) => f.name.endsWith('.csv') || f.type === 'text/csv'
		);
		if (!csvFile) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			setInitialCsvText(e.target.result);
			setIsOpen(true);
		};
		reader.readAsText(csvFile);
	}, []);

	const handleOpen = useCallback(() => setIsOpen(true), []);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setInitialCsvText('');
	}, []);

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
						<CreateNewChartModal
							isOpen={isOpen}
							onOpen={handleOpen}
							onClose={handleClose}
							initialCsvText={initialCsvText}
						/>
					</FlexItem>
				</Flex>
			</CardHeader>
			<CardBody>
				<DataViews />
				<DropZone onFilesDrop={handleFileDrop} />
			</CardBody>
		</Card>
	);
}
