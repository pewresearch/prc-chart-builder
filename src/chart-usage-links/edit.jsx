import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit() {
	return (
		<div {...useBlockProps()}>
			<ul className="chart-usage-links__list">
				<li className="chart-usage-links__item chart-usage-links__item--canonical">
					<a href="#chart-usage-links">
						{__('Canonical article', 'prc-chart-builder')}
					</a>
				</li>
				<li className="chart-usage-links__item">
					<a href="#chart-usage-links">
						{__(
							'Another article using this chart',
							'prc-chart-builder'
						)}
					</a>
				</li>
			</ul>
		</div>
	);
}
