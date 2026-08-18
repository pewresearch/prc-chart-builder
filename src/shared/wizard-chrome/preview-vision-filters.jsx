/**
 * Hidden SVG color-vision filters for the chart preview pane.
 */
import { visionFilterDefs } from './preview-appearance';

/**
 * @return {import('react').ReactNode} Zero-size SVG with the three CVD filters.
 */
export default function PreviewVisionFilters() {
	return (
		<svg
			aria-hidden="true"
			width="0"
			height="0"
			style={{ overflow: 'hidden', position: 'absolute' }}
		>
			<defs>
				{visionFilterDefs().map(({ id, values }) => (
					<filter
						key={id}
						id={id}
						colorInterpolationFilters="linearRGB"
					>
						<feColorMatrix type="matrix" values={values} />
					</filter>
				))}
			</defs>
		</svg>
	);
}
