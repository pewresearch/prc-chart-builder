/* eslint-disable @wordpress/i18n-no-variables */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */

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
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	FontSizePicker,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';

function AnnotationControls({ attributes, setAttributes }) {
	const { annotationsActive, annotations, mobileBreakpoint } = attributes;

	const updateAnnotation = (index, key, value) => {
		setAttributes({
			annotations: annotations.map((annotation, i) =>
				i === index
					? {
							...annotation,
							[key]: value,
						}
					: annotation
			),
		});
	};

	const deleteAnnotation = (index) => {
		setAttributes({
			annotations: annotations.filter((annotation, i) => i !== index),
		});
	};

	const addAnnotation = () => {
		const newAnnotation = {
			x: 0,
			y: 0,
			text: 'New annotation',
			fontSize: 12,
			fontWeight: 'normal',
			fontStyle: 'normal',
			fill: '#000000',
			textAnchor: 'start',
			verticalAnchor: 'start',
			rotation: 0,
			link: '',
			backgroundColor: 'transparent',
			padding: 0,
			borderRadius: 0,
			opacity: 1,
			maxWidth: 200,
			activeOnMobile: true,
		};

		setAttributes({
			annotations: [...annotations, newAnnotation],
		});
	};

	return (
		<PanelBody title={__('Text Annotations')} initialOpen={false}>
			<ToggleControl
				label={__('Annotations Active')}
				checked={annotationsActive}
				onChange={() =>
					setAttributes({ annotationsActive: !annotationsActive })
				}
			/>

			<Spacer height={20} />

			{annotations.map((annotation, index) => (
				<div key={index}>
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
							<Heading level={2}>Position</Heading>
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
							<Heading level={2}>Text Properties</Heading>
							<ToggleControl
								label={__('Active on Mobile')}
								help={__(
									`If enabled, the annotation will be active on mobile devices that are smaller than the mobile breakpoint of ${mobileBreakpoint}px.`
								)}
								checked={annotation.activeOnMobile}
								onChange={() =>
									updateAnnotation(
										index,
										'activeOnMobile',
										!annotation.activeOnMobile
									)
								}
							/>
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
									updateAnnotation(index, 'fontStyle', value);
								}}
							/>
						</CardBody>
						<CardBody>
							<Heading level={2}>Alignment & Positioning</Heading>
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
							<Heading level={2}>Colors & Background</Heading>
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
												val
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
									// 			val
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
							<Heading level={2}>Link</Heading>
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
	);
}

export default AnnotationControls;
