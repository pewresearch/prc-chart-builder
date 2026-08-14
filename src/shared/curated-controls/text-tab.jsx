/**
 * Text tab — header/footer meta, labels, annotations, legend.
 */
import { __experimentalVStack as VStack } from '@wordpress/components';

import AnnotationControls from '../../chart/edit/annotation-controls';
import LabelControls from '../../chart/edit/label-controls';
import LegendControls from '../../chart/edit/legend-controls';
import TextFieldControls from '../../chart/edit/text-field-controls';

const CLIENT_ID = 'prc-chart-modal-configure-text';

/**
 * @param {Object}   props
 * @param {Object}   props.chartAttributes
 * @param {Function} props.setAttributes
 */
export default function TextTab({ chartAttributes, setAttributes }) {
	const controlProps = {
		attributes: chartAttributes,
		setAttributes,
		clientId: CLIENT_ID,
		curated: true,
	};

	return (
		<VStack spacing={2} className="prc-chart-modal__configure-tab-panel">
			<TextFieldControls {...controlProps} />
			<LabelControls {...controlProps} />
			<AnnotationControls {...controlProps} />
			<LegendControls {...controlProps} />
		</VStack>
	);
}
