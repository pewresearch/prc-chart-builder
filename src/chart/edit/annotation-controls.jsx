// V2
/* eslint-disable @wordpress/i18n-no-flanking-whitespace */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @wordpress/i18n-no-variables */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */

/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	Button,
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	TextControl,
	__experimentalNumberControl as NumberControl,
	__experimentalSpacer as Spacer,
	FontSizePicker,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import {
	PanelColorSettings,
	useSettings,
	__experimentalFontFamilyControl as FontFamilyControl,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { StyledLabel } from './control-ui';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { getSmallMultiplesPanelKeys } from './popover/utils';

function AnnotationControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { deviceType, getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(attributes, setAttributes);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('annotations');

	const annotationsActive = getCurrentValue('annotations', 'active');
	const items = getCurrentValue('annotations', 'items') || [];
	const layoutType = getCurrentValue('layout', 'type');
	const panelKeys =
		layoutType === 'small-multiples'
			? getSmallMultiplesPanelKeys({
					dataRender: getCurrentValue('dataRender'),
					io: getCurrentValue('io'),
				})
			: [];
	const hasPanelKeys = panelKeys.length > 0;

	const [blockLevelFontFamilies] = useSettings('typography.fontFamilies');

	const fontFamilyOptions = useMemo(() => {
		return blockLevelFontFamilies.theme.map(({ fontFamily, name }) => ({
			fontFamily,
			name,
		}));
	}, [blockLevelFontFamilies]);
	const updateAnnotation = (index, key, value) => {
		const currentItems = getCurrentValue('annotations', 'items') || [];
		const isPanelContext = (ctx) =>
			ctx === 'panel' || ctx === 'panel-inner';
		updateAttributeForDevice('annotations', {
			items: currentItems.map((annotation, i) => {
				if (i !== index) return annotation;
				if (key === 'positioningContext' && !isPanelContext(value)) {
					return {
						...annotation,
						positioningContext: value,
						panelKey: '',
					};
				}
				if (key === 'positioningContext' && isPanelContext(value)) {
					return {
						...annotation,
						positioningContext: value,
						panelKey:
							annotation.panelKey || String(panelKeys[0] || ''),
						x: 8,
						y: 8,
					};
				}
				return { ...annotation, [key]: value };
			}),
		});
	};

	const deleteAnnotation = (index) => {
		const currentItems = getCurrentValue('annotations', 'items') || [];
		updateAttributeForDevice('annotations', {
			items: currentItems.filter((annotation, i) => i !== index),
		});
	};

	const addAnnotation = () => {
		const newAnnotation = {
			x: 0,
			y: 10,
			text: 'New annotation',
			fontSize: 12,
			fontWeight: 'normal',
			fontStyle: 'normal',
			fontFamily: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			fill: 'light-dark(#000000, #f0f0f0)',
			textAnchor: 'start',
			verticalAnchor: 'start',
			rotation: 0,
			link: '',
			backgroundColor: 'transparent',
			padding: 0,
			borderRadius: 0,
			opacity: 1,
			maxWidth: 200,
			positioningContext: 'chart',
		};

		const currentItems = getCurrentValue('annotations', 'items') || [];
		updateAttributeForDevice('annotations', {
			items: [...currentItems, newAnnotation],
		});
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Text Annotations')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<ToggleControl
					label={__('Annotations Active')}
					checked={annotationsActive || false}
					onChange={(newValue) =>
						updateAttributeForDevice('annotations', {
							active: newValue,
						})
					}
				/>

				<Spacer height={20} />

				{items.map((annotation, index) => (
					<div key={`${deviceType}-annotation-${index}`}>
						<Card>
							<CardHeader>
								<TextControl
									placeholder={__(`Annotation ${index + 1}`)}
									value={annotation.text}
									onChange={(value) => {
										updateAnnotation(index, 'text', value);
									}}
								/>
							</CardHeader>
							<CardBody>
								<StyledLabel>
									{__('Position', 'prc-chart-builder')}
								</StyledLabel>
								<SelectControl
									label={__('Positioning Context')}
									value={
										annotation.positioningContext || 'chart'
									}
									options={[
										{
											label: __('Full Chart Area'),
											value: 'chart',
										},
										{
											label: __('Data Area (Inner)'),
											value: 'inner',
										},
										...(hasPanelKeys
											? [
													{
														label: __(
															'Panel (full cell)'
														),
														value: 'panel',
													},
													{
														label: __(
															'Panel data area'
														),
														value: 'panel-inner',
													},
												]
											: []),
									]}
									onChange={(value) => {
										updateAnnotation(
											index,
											'positioningContext',
											value
										);
									}}
									help={
										hasPanelKeys
											? __(
													'Chart: full graphic. Inner: data area. Panel: full cell or plot area; travels with the cell on restack.'
												)
											: __(
													'Chart: positions relative to the entire chart including axes and padding (eg. use for titles, etc.). Data Area: positions relative to the chart data area (eg. use if annotating a specific data point).'
												)
									}
								/>
								{(annotation.positioningContext === 'panel' ||
									annotation.positioningContext ===
										'panel-inner') &&
									hasPanelKeys && (
										<SelectControl
											label={__('Panel')}
											value={
												annotation.panelKey ||
												String(panelKeys[0])
											}
											options={panelKeys.map((key) => ({
												label: String(key),
												value: String(key),
											}))}
											onChange={(value) => {
												updateAnnotation(
													index,
													'panelKey',
													value
												);
											}}
										/>
									)}
								<FlexBlock>
									<FlexItem>
										<NumberControl
											label={__('X Position')}
											value={annotation.x}
											onChange={(value) => {
												updateAnnotation(
													index,
													'x',
													formatNum(value, 'float')
												);
											}}
										/>
									</FlexItem>
									<FlexItem>
										<NumberControl
											label={__('Y Position')}
											value={annotation.y}
											onChange={(value) => {
												updateAnnotation(
													index,
													'y',
													formatNum(value, 'float')
												);
											}}
										/>
									</FlexItem>
								</FlexBlock>
							</CardBody>
							<CardBody>
								<StyledLabel>
									{__('Text Properties', 'prc-chart-builder')}
								</StyledLabel>
								{/* TODO: potentially irrelevant now that we have viewport-aware attributes */}
								{/* <ToggleControl
								label={__('Active on Mobile')}
								help={__(
									`If enabled, the annotation will be active on mobile devices that are smaller than the mobile breakpoint of ${mobileBreakpoint}px.`
								)}
								checked={annotation?.activeOnMobile || false}
								onChange={() =>
									updateAnnotation(
										index,
										'activeOnMobile',
										!annotation.activeOnMobile
									)
								}
							/> */}
								<FontSizePicker
									value={annotation.fontSize}
									fontSizes={[
										{
											name: __('10'),
											slug: 'xs',
											size: 10,
										},
										{
											name: __('12'),
											slug: 'small',
											size: 12,
										},
										{
											name: __('14'),
											slug: 'medium',
											size: 14,
										},
										{
											name: __('16'),
											slug: 'large',
											size: 16,
										},
										{
											name: __('18'),
											slug: 'xl',
											size: 18,
										},
										{
											name: __('20'),
											slug: 'xxl',
											size: 20,
										},
									]}
									onChange={(newFontSize) => {
										updateAnnotation(
											index,
											'fontSize',
											newFontSize
										);
									}}
								/>
								<FontFamilyControl
									label={__('Font Family')}
									value={annotation.fontFamily}
									fontFamilies={fontFamilyOptions}
									onChange={(value) => {
										updateAnnotation(
											index,
											'fontFamily',
											value
										);
									}}
								/>
								<SelectControl
									label={__('Font Weight')}
									value={annotation.fontWeight}
									options={[
										{
											label: __('Normal'),
											value: 'normal',
										},
										{
											label: __('Bold'),
											value: 'bold',
										},
										{
											label: __('600'),
											value: '600',
										},
										{
											label: __('700'),
											value: '700',
										},
									]}
									onChange={(value) => {
										updateAnnotation(
											index,
											'fontWeight',
											value
										);
									}}
								/>
								<SelectControl
									label={__('Font Style')}
									value={annotation.fontStyle}
									options={[
										{
											label: __('Normal'),
											value: 'normal',
										},
										{
											label: __('Italic'),
											value: 'italic',
										},
										{
											label: __('Underline'),
											value: 'underline',
										},
										{
											label: __('Strikethrough'),
											value: 'strikethrough',
										},
									]}
									onChange={(value) => {
										updateAnnotation(
											index,
											'fontStyle',
											value
										);
									}}
								/>
							</CardBody>
							<CardBody>
								<StyledLabel>
									{__(
										'Alignment & Positioning',
										'prc-chart-builder'
									)}
								</StyledLabel>
								<SelectControl
									label={__('Text Anchor')}
									value={annotation.textAnchor}
									options={[
										{
											label: __('Start'),
											value: 'start',
										},
										{
											label: __('Middle'),
											value: 'middle',
										},
										{
											label: __('End'),
											value: 'end',
										},
									]}
									onChange={(value) => {
										updateAnnotation(
											index,
											'textAnchor',
											value
										);
									}}
								/>
								<SelectControl
									label={__('Vertical Anchor')}
									value={annotation.verticalAnchor}
									options={[
										{
											label: __('Start'),
											value: 'start',
										},
										{
											label: __('Middle'),
											value: 'middle',
										},
										{
											label: __('End'),
											value: 'end',
										},
									]}
									onChange={(value) => {
										updateAnnotation(
											index,
											'verticalAnchor',
											value
										);
									}}
								/>
								<NumberControl
									label={__('Rotation (degrees)')}
									value={annotation.rotation}
									onChange={(value) => {
										updateAnnotation(
											index,
											'rotation',
											formatNum(value, 'integer')
										);
									}}
									min={-360}
									max={360}
								/>
								<NumberControl
									label={__('Max Width')}
									value={annotation.maxWidth}
									onChange={(value) => {
										updateAnnotation(
											index,
											'maxWidth',
											formatNum(value, 'integer')
										);
									}}
									min={0}
									help={__('Maximum width for text wrapping')}
								/>
							</CardBody>
							<CardBody>
								<StyledLabel>
									{__(
										'Colors & Background',
										'prc-chart-builder'
									)}
								</StyledLabel>
								<PanelColorSettings
									__experimentalHasMultipleOrigins
									__experimentalIsRenderedInSidebar
									title={__('Colors')}
									initialOpen
									colorSettings={[
										{
											value: annotation.fill,
											onChange: (val) => {
												updateAnnotation(
													index,
													'fill',
													val ?? ''
												);
											},
											label: __('Text Color'),
										},
										// {
										// 	value: annotation.backgroundColor,
										// 	onChange: (val) => {
										// 		updateAnnotation(
										// 			index,
										// 			'backgroundColor',
										// 			val ?? ''
										// 		);
										// 	},
										// 	label: __('Background Color'),
										// },
									]}
								/>
								<NumberControl
									label={__('Opacity')}
									value={annotation.opacity}
									onChange={(val) => {
										updateAnnotation(index, 'opacity', val);
									}}
									min={0}
									max={1}
									step={0.1}
								/>
								{/* <NumberControl
								label={__('Padding')}
								value={annotation.padding}
								onChange={(val) => {
									updateAnnotation(
										index,
										'padding',
										formatNum(val, 'integer')
									);
								}}
								min={0}
								help={__(
									'Padding around text when background is set'
								)}
							/>
							<NumberControl
								label={__('Border Radius')}
								value={annotation.borderRadius}
								onChange={(val) => {
									updateAnnotation(
										index,
										'borderRadius',
										formatNum(val, 'integer')
									);
								}}
								min={0}
								help={__('Border radius for background')}
							/> */}
							</CardBody>
							{/* TODO: Add link control */}
							{/* <CardBody>
							<StyledLabel>
								{__('Link', 'prc-chart-builder')}
							</StyledLabel>
							<TextControl
								label={__('Link URL')}
								value={annotation.link}
								onChange={(value) => {
									updateAnnotation(index, 'link', value);
								}}
								help={__(
									'Optional URL to make this annotation clickable'
								)}
								type="url"
							/>
						</CardBody> */}
							<CardFooter>
								<Button
									isDestructive
									onClick={() => {
										deleteAnnotation(index);
									}}
								>
									Delete Annotation
								</Button>
							</CardFooter>
						</Card>
						<Spacer height={10} />
					</div>
				))}

				<Button onClick={addAnnotation}>Add Annotation</Button>
			</PanelBody>
		</div>
	);
}

export default AnnotationControls;
