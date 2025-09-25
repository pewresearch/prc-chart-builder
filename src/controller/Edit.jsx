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
	useInnerBlocksProps,
	useBlockProps,
	store as blockEditorStore,
	BlockControls,
	BlockAlignmentControl,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	PanelBody,
	CheckboxControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import store from './store';
import HideTableHandler from './hide-table-handler';
import Placeholder from './placeholder';

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		id,
		isConvertedChart,
		tabsActive,
		shareActive,
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
					(block) => 'prc-chart-builder/controller' === block.name
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
				'prc-chart-builder/controller',
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

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		orientation: 'horizontal',
		renderAppender: false,
		templateLock: false,
	});

	if (!hasInnerBlocks) {
		return <Placeholder {...{ attributes, setAttributes, clientId }} />;
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
						label={__('Show tabs')}
						checked={tabsActive}
						help={__(
							'If unchecked, only the chart will be shown. Disable this for small multiples and charts where you do not want to show underlying data.'
						)}
						onChange={() =>
							setAttributes({ tabsActive: !tabsActive })
						}
					/>
					<ToggleControl
						label={__('Show share tab')}
						help={__(
							'If unchecked, only chart and data tabs will be shown.'
						)}
						checked={shareActive}
						onChange={() =>
							setAttributes({
								shareActive: !shareActive,
							})
						}
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockAlignmentControl
					value={align}
					onChange={(nextAlign) => {
						setAttributes({
							align: nextAlign,
						});
					}}
				/>
			</BlockControls>
			<HideTableHandler id={id}>
				<figure {...blockProps}>
					<div {...innerBlocksProps} />
				</figure>
			</HideTableHandler>
		</Fragment>
	);
}
