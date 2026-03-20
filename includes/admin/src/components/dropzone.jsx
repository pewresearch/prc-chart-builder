/**
 * WordPress Dependencies
 */
import { DropZone as WPDropZone } from '@wordpress/components';

/**
 * Internal Dependencies
 */

export default function DropZone({ onFilesDrop }) {
	return (
		<WPDropZone
			label="Drop a CSV to create a new chart"
			onFilesDrop={onFilesDrop}
		/>
	);
}
