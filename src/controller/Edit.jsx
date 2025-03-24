/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
/* eslint-disable max-lines-per-function */
import { Fragment, useEffect } from 'react';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
	BlockControls,
	BlockAlignmentControl,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import store from './store';
import HideTableHandler from './HideTableHandler';
import Placeholder from './placeholder';

const TABLE = [
	'flexible-table-block/table',
	{
		className: 'chart-builder-data-table',
		attributes: {
			fontSize: 'small',
			fontFamily: 'sans-serif',
		},
		head: [
			{
				cells: [
					{ content: 'x', tag: 'th' },
					{ content: 'y', tag: 'th' },
				],
			},
		],
		body: [
			{
				cells: [
					{ content: '', tag: 'td' },
					{ content: '', tag: 'td' },
				],
			},
			{
				cells: [
					{ content: '', tag: 'td' },
					{ content: '', tag: 'td' },
				],
			},
		],
	},
];
console.log(TABLE);
export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		id,
		isConvertedChart,
		tabsActive,
		align,
		isStatic,
		isTable,
		chartType,
	} = attributes;

	// useSelect to check for other chart builders, filter out the current one
	// get all chart controllers, check to see if any have the same id
	// if so, set the id to a new id
	const otherChartControllers = useSelect(
		(select) =>
			select('core/block-editor')
				.getBlocks()
				.filter(
					(block) =>
						'prc-block/chart-builder-controller' === block.name
				)
				.filter((block) => block.clientId !== clientId),
		[]
	);

	useEffect(() => {
		if (!id) {
			setAttributes({ id: clientId });
		} else if (
			// check if other controllers exist, and if the id is already taken
			otherChartControllers.length > 0 &&
			otherChartControllers.some(
				(controller) => controller.attributes.id === id
			)
		) {
			{
				console.log(
					`id ${id} already exists. creating new one: ${clientId}`
				);
				setAttributes({ id: clientId });
			}
		}
	}, []);

	const { hideThisTable } = useSelect(
		(select) => {
			const { get } = select('core/preferences');
			const { getAllTableVisibility } = select(store);

			const persistentHiddenTables = get(
				'prc-block/chart-builder-controller',
				'persistentHiddenTables'
			);

			const tempHideAllTables = getAllTableVisibility();

			return {
				hideThisTable:
					persistentHiddenTables?.includes(id) || tempHideAllTables,
			};
		},
		[id]
	);

	const TEMPLATE = [
		TABLE,
		[
			'prc-block/chart-builder',
			{
				isConvertedChart,
			},
		],
	];

	const dummyCSVS = [
		{
			name: 'US State Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/usa-state.csv',
		},
		{
			name: 'US County Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/usa-county.csv',
		},
		{
			name: 'US Block Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/usa-block-map.csv',
		},
		{
			name: 'World Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/world.csv',
		},
	];

	const STATIC_TEMPLATE = [TABLE, ['core/image', {}]];

	const TABLE_TEMPLATE = [TABLE];

	const blockElmProps = {};
	if (hideThisTable) {
		blockElmProps['data-hide-table'] = true;
	}

	const blockProps = useBlockProps({
		...blockElmProps,
		className: align ? `align${align}` : 'alignnone',
	});
	const hasInnerBlocks = useSelect(
		(select) => select(blockEditorStore).getBlocks(clientId).length > 0,
		[clientId]
	);

	if (!hasInnerBlocks) {
		return <Placeholder {...{ attributes, setAttributes, clientId }} />;
	}

	let RENDERED_TEMPLATE;
	if (isStatic) {
		RENDERED_TEMPLATE = STATIC_TEMPLATE;
	} else if (isTable) {
		RENDERED_TEMPLATE = TABLE_TEMPLATE;
	} else {
		RENDERED_TEMPLATE = TEMPLATE;
	}
	return (
		<Fragment>
			<InspectorControls>
				{/* check if chartType has substring of 'map' */}
				{undefined !== chartType && chartType.includes('map') && (
					<PanelBody>
						<p>
							<strong>
								Your table must include{' '}
								<a href="https://transition.fcc.gov/oet/info/maps/census/fips/fips.txt">
									county or state FIPS codes
								</a>{' '}
								to match the data for a US Map, or{' '}
								<a href="https://www.iban.com/country-codes">
									3-digit ISO codes
								</a>{' '}
								for world maps.
							</strong>{' '}
						</p>
						<p>Dummy data for maps can be found here:</p>
						<ul>
							{dummyCSVS.map((csv) => (
								<li key={csv.name}>
									<a href={csv.url} download>
										{csv.name}
									</a>
								</li>
							))}
						</ul>
					</PanelBody>
				)}
				<PanelBody>
					<ToggleControl
						label={__('Show data and share tabs')}
						checked={tabsActive}
						help={__(
							'If unchecked, only the chart will be shown. Disable this for small multiples and charts where you do not want to show underlying data.'
						)}
						onChange={() =>
							setAttributes({ tabsActive: !tabsActive })
						}
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockAlignmentControl
					value={align}
					onChange={(nextAlign) => {
						// const extraUpdatedAttributes = [
						// 	'wide',
						// 	'full',
						// ].includes(nextAlign)
						// 	? { width: undefined, height: undefined }
						// 	: {};
						setAttributes({
							// ...extraUpdatedAttributes,
							align: nextAlign,
						});
					}}
				/>
			</BlockControls>
			<HideTableHandler id={id}>
				{/* for some reason there is an extra div being rendered here, which makes the editor alignment a little screwy. need to figure out */}
				<figure {...blockProps}>
					<InnerBlocks template={RENDERED_TEMPLATE} />
				</figure>
			</HideTableHandler>
		</Fragment>
	);
}
