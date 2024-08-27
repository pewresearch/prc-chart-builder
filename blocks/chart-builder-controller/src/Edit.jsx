/* eslint-disable max-lines-per-function */
import classnames from 'classnames';
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
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import store from './store';
import HideTableHandler from './HideTableHandler';
import Placeholder from './Placeholder';

export default function Edit(props) {
	const { attributes, setAttributes, clientId } = props;
	const { id, isConvertedChart, tabsActive, align, isStatic, isTable } =
		attributes;

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

	const TEMPLATE = [
		TABLE,
		[
			'prc-block/chart-builder',
			{
				isConvertedChart,
			},
		],
	];

	const STATIC_TEMPLATE = [TABLE, ['core/image', {}]];

	const TABLE_TEMPLATE = [TABLE];

	const blockElmProps = {};
	if (hideThisTable) {
		blockElmProps['data-hide-table'] = true;
	}

	const blockProps = useBlockProps({
		...blockElmProps,
		className: classnames({
			[`align${align}`]: align,
			'hello-world': 'hello-world',
		}),
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
