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
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * WordPress dependencies
 */
import {
	__experimentalFontFamilyControl as FontFamilyControl,
	useSettings,
} from '@wordpress/block-editor';
import {
	Button,
	FlexBlock,
	FlexItem,
	FontSizePicker,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, copy, plus, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import {
	appendClonedAnnotation,
	getAnnotationDrawerTitle,
	getFocusAfterClone,
} from './annotation-clipboard';
import ChartPanelColorSettings from './chart-panel-color-settings';
import { StyledLabel } from './control-ui';
import {
	useFocusedPanel,
	useInspectorFocus,
} from './hooks/inspector-focus-context';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { RichTextField } from './popover/panels/RichTextField';
import { getSmallMultiplesPanelKeys } from './popover/utils';
import WizardControlTip from '../../shared/wizard-ui/wizard-control-tip';

function AnnotationDrawerItem({
	index,
	annotation,
	selectedAnnotationIndex,
	hasPanelKeys,
	panelKeys,
	fontFamilyOptions,
	updateAnnotation,
	deleteAnnotation,
	onDuplicate,
}) {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (selectedAnnotationIndex === index) {
			setIsOpen(true);
			return;
		}
		if (
			selectedAnnotationIndex !== null &&
			selectedAnnotationIndex !== undefined
		) {
			setIsOpen(false);
		}
	}, [selectedAnnotationIndex, index]);

	return (
		<>
			<HStack
				className="prc-chart-controls__annotation-drawer-header"
				alignment="center"
				style={{
					borderTop: '1px solid #e0e0e0',
				}}
			>
				<Button
					__next40pxDefaultSize
					className="components-button components-panel__body-toggle"
					aria-expanded={isOpen}
					onClick={() => setIsOpen((open) => !open)}
					style={{ flex: 1 }}
					icon={isOpen ? chevronUp : chevronDown}
				>
					<span>{getAnnotationDrawerTitle(annotation, index)}</span>
				</Button>
				<Button
					icon={copy}
					label={__('Duplicate annotation', 'prc-chart-builder')}
					size="small"
					__next40pxDefaultSize
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						onDuplicate(index);
					}}
				/>
				<Button
					icon={trash}
					label={__('Delete annotation', 'prc-chart-builder')}
					size="small"
					isDestructive
					__next40pxDefaultSize
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						deleteAnnotation(index);
					}}
				/>
			</HStack>
			{isOpen && (
				<div className="components-panel__body-content">
					<RichTextField
						label={__('Text', 'prc-chart-builder')}
						value={annotation.text}
						onChange={(value) => {
							updateAnnotation(index, 'text', value);
						}}
						placeholder={__(
							'Enter annotation text',
							'prc-chart-builder'
						)}
					/>
					<StyledLabel className="prc-chart-modal__control-label-with-tip">
						{__('Position', 'prc-chart-builder')}
						<WizardControlTip
							label={__(
								'Help: annotation position',
								'prc-chart-builder'
							)}
							text={
								hasPanelKeys
									? __(
											'Chart: full graphic. Inner: data area. Panel: full cell or plot area; travels with the cell on restack.',
											'prc-chart-builder'
										)
									: __(
											'Chart: positions relative to the entire chart including axes and padding (eg. use for titles, etc.). Data Area: positions relative to the chart data area (eg. use if annotating a specific data point).',
											'prc-chart-builder'
										)
							}
						/>
					</StyledLabel>
					<SelectControl
						__next40pxDefaultSize
						value={annotation.positioningContext || 'chart'}
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
											label: __('Panel (full cell)'),
											value: 'panel',
										},
										{
											label: __('Panel data area'),
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
					/>
					{(annotation.positioningContext === 'panel' ||
						annotation.positioningContext === 'panel-inner') &&
						hasPanelKeys && (
							<SelectControl
								__next40pxDefaultSize
								label={__('Panel')}
								value={
									annotation.panelKey || String(panelKeys[0])
								}
								options={panelKeys.map((key) => ({
									label: String(key),
									value: String(key),
								}))}
								onChange={(value) => {
									updateAnnotation(index, 'panelKey', value);
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
					<StyledLabel>
						{__('Text Properties', 'prc-chart-builder')}
					</StyledLabel>
					<FontSizePicker
						__next40pxDefaultSize
						value={annotation.fontSize}
						fontSizes={[
							{ name: __('10'), slug: 'xs', size: 10 },
							{ name: __('12'), slug: 'small', size: 12 },
							{ name: __('14'), slug: 'medium', size: 14 },
							{ name: __('16'), slug: 'large', size: 16 },
							{ name: __('18'), slug: 'xl', size: 18 },
							{ name: __('20'), slug: 'xxl', size: 20 },
						]}
						onChange={(newFontSize) => {
							updateAnnotation(index, 'fontSize', newFontSize);
						}}
					/>
					<FontFamilyControl
						label={__('Font Family')}
						value={annotation.fontFamily}
						fontFamilies={fontFamilyOptions}
						onChange={(value) => {
							updateAnnotation(index, 'fontFamily', value);
						}}
					/>
					<SelectControl
						__next40pxDefaultSize
						label={__('Font Weight')}
						value={annotation.fontWeight}
						options={[
							{ label: __('Normal'), value: 'normal' },
							{ label: __('Bold'), value: 'bold' },
							{ label: __('600'), value: '600' },
							{ label: __('700'), value: '700' },
						]}
						onChange={(value) => {
							updateAnnotation(index, 'fontWeight', value);
						}}
					/>
					<SelectControl
						__next40pxDefaultSize
						label={__('Font Style')}
						value={annotation.fontStyle}
						options={[
							{ label: __('Normal'), value: 'normal' },
							{ label: __('Italic'), value: 'italic' },
							{ label: __('Underline'), value: 'underline' },
							{
								label: __('Strikethrough'),
								value: 'strikethrough',
							},
						]}
						onChange={(value) => {
							updateAnnotation(index, 'fontStyle', value);
						}}
					/>
					<StyledLabel>
						{__('Alignment & Positioning', 'prc-chart-builder')}
					</StyledLabel>
					<SelectControl
						__next40pxDefaultSize
						label={__('Text Anchor')}
						value={annotation.textAnchor}
						options={[
							{ label: __('Start'), value: 'start' },
							{ label: __('Middle'), value: 'middle' },
							{ label: __('End'), value: 'end' },
						]}
						onChange={(value) => {
							updateAnnotation(index, 'textAnchor', value);
						}}
					/>
					<SelectControl
						__next40pxDefaultSize
						label={__('Vertical Anchor')}
						value={annotation.verticalAnchor}
						options={[
							{ label: __('Start'), value: 'start' },
							{ label: __('Middle'), value: 'middle' },
							{ label: __('End'), value: 'end' },
						]}
						onChange={(value) => {
							updateAnnotation(index, 'verticalAnchor', value);
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
					<StyledLabel>
						{__('Colors & Background', 'prc-chart-builder')}
					</StyledLabel>
					<ChartPanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Colors')}
						initialOpen
						colorSettings={[
							{
								value: annotation.fill,
								onChange: (val) => {
									updateAnnotation(index, 'fill', val ?? '');
								},
								label: __('Text Color'),
								contrast: 'text',
							},
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
					<VStack spacing={2}>
						<Button
							__next40pxDefaultSize
							isDestructive
							icon={trash}
							variant="secondary"
							onClick={() => {
								deleteAnnotation(index);
							}}
						>
							{__('Delete Annotation', 'prc-chart-builder')}
						</Button>
					</VStack>
				</div>
			)}
		</>
	);
}

function AnnotationControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { deviceType, getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(attributes, setAttributes);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('annotations');
	const { selectedAnnotationIndex, setSelectedAnnotationIndex } =
		useInspectorFocus() ?? {};

	const annotationsActive = Boolean(getCurrentValue('annotations', 'active'));
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

	// Stable per-row keys so local drawer open state follows the annotation,
	// not the list index, across insert/delete.
	const rowKeySeqRef = useRef(0);
	const rowKeysRef = useRef([]);
	const prevItemsRef = useRef(items);
	if (rowKeysRef.current.length < items.length) {
		const next = [...rowKeysRef.current];
		while (next.length < items.length) {
			next.push(`ann-${rowKeySeqRef.current++}`);
		}
		rowKeysRef.current = next;
	} else if (items.length < prevItemsRef.current.length) {
		const prevItems = prevItemsRef.current;
		const prevKeys = rowKeysRef.current;
		rowKeysRef.current = items.map((item) => {
			const prevIndex = prevItems.indexOf(item);
			if (prevIndex >= 0 && prevIndex < prevKeys.length) {
				return prevKeys[prevIndex];
			}
			return `ann-${rowKeySeqRef.current++}`;
		});
	}
	prevItemsRef.current = items;

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
		rowKeysRef.current = rowKeysRef.current.filter((_, i) => i !== index);
		if (
			selectedAnnotationIndex === null ||
			selectedAnnotationIndex === undefined
		) {
			return;
		}
		if (selectedAnnotationIndex === index) {
			setSelectedAnnotationIndex?.(null);
		} else if (selectedAnnotationIndex > index) {
			setSelectedAnnotationIndex?.(selectedAnnotationIndex - 1);
		}
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
		setSelectedAnnotationIndex?.(currentItems.length);
	};

	const duplicateAnnotation = (sourceIndex) => {
		const currentItems = getCurrentValue('annotations', 'items') || [];
		const { items: nextItems, newIndex } = appendClonedAnnotation(
			currentItems,
			sourceIndex
		);
		if (newIndex < 0) {
			return;
		}
		updateAttributeForDevice('annotations', { items: nextItems });
		const focus = getFocusAfterClone(newIndex);
		setSelectedAnnotationIndex?.(focus.expandedDrawerIndex);
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Text Annotations')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<VStack spacing={2}>
					<ToggleControl
						label={__('Annotations Active')}
						checked={annotationsActive}
						onChange={(newValue) =>
							updateAttributeForDevice('annotations', {
								active: newValue,
							})
						}
					/>
				</VStack>
				{annotationsActive && (
					<>
						{items.map((annotation, index) => (
							<AnnotationDrawerItem
								key={`${deviceType}-annotation-${rowKeysRef.current[index]}`}
								index={index}
								annotation={annotation}
								selectedAnnotationIndex={
									selectedAnnotationIndex
								}
								hasPanelKeys={hasPanelKeys}
								panelKeys={panelKeys}
								fontFamilyOptions={fontFamilyOptions}
								updateAnnotation={updateAnnotation}
								deleteAnnotation={deleteAnnotation}
								onDuplicate={duplicateAnnotation}
							/>
						))}

						<Button
							__next40pxDefaultSize
							icon={plus}
							variant="secondary"
							onClick={addAnnotation}
						>
							Add New Annotation
						</Button>
					</>
				)}
			</PanelBody>
		</div>
	);
}

export default AnnotationControls;
