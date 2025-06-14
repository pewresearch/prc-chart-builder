/**
 * WordPress Dependencies
 */
import { DropZone as WPDropZone } from '@wordpress/components';

/**
 * Internal Dependencies
 */

export default function DropZone() {
	return (
		<WPDropZone
			label="Drop a CSV data file here to get started on a new chart."
			onFilesDrop={(droppedFiles) =>
				console.log(
					'chart library drop csv to new cahrt...',
					droppedFiles
				)
			}
		/>
	);
}
