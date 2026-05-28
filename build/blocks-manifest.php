<?php
// This file is generated. Do not modify it manually.
return array(
	'chart' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-chart-builder/chart',
		'title' => 'Chart Builder Chart',
		'description' => 'Chart element for the Chart Builder Controller block.',
		'category' => 'media',
		'icon' => 'chart-line',
		'parent' => array(
			'prc-chart-builder/controller'
		),
		'attributes' => array(
			'_version' => array(
				'type' => 'string',
				'enum' => array(
					'v1',
					'v2'
				)
			),
			'id' => array(
				'type' => 'string'
			),
			'mobile' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'tablet' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'layout' => array(
				'type' => 'object',
				'default' => array(
					'name' => 'wp-block-prc-block-chart-builder-controller',
					'type' => 'bar',
					'orientation' => 'horizontal',
					'width' => 640,
					'height' => 400,
					'padding' => array(
						'top' => 20,
						'bottom' => 25,
						'left' => 60,
						'right' => 0
					),
					'overflowX' => 'responsive',
					'horizontalRules' => true,
					'mobileBreakpoint' => 480,
					'parentClass' => 'wp-chart-builder-wrapper'
				)
			),
			'metadata' => array(
				'type' => 'object',
				'default' => array(
					'active' => true,
					'title' => 'Title',
					'subtitle' => 'Subtitle',
					'note' => 'Note: This is a note.',
					'source' => 'Source: This is your source.',
					'tag' => 'PEW RESEARCH CENTER',
					'alt' => ''
				)
			),
			'colors' => array(
				'type' => 'array',
				'default' => array(
					'#456A83',
					'#BF3B27',
					'#756a7e',
					'#ea9e2c',
					'#BB792A',
					'#eeece4'
				)
			),
			'plotBands' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'allowDrag' => false,
					'allowResize' => false,
					'dimension' => 'x',
					'bands' => array(
						
					)
				)
			),
			'independentAxis' => array(
				'type' => 'object',
				'default' => array(
					'active' => true,
					'label' => '',
					'scale' => 'linear',
					'dateFormat' => '%Y',
					'domain' => array(
						0,
						100
					),
					'domainPadding' => 20,
					'showZero' => true,
					'padding' => 30,
					'tickMarksActive' => false,
					'tickCount' => 5,
					'tickValues' => null,
					'tickFormat' => null,
					'ticksToLocaleString' => false,
					'abbreviateTicks' => false,
					'abbreviateTicksDecimals' => 0,
					'tickUnit' => '',
					'tickUnitPosition' => 'end',
					'tickLabels' => array(
						'fontSize' => 12,
						'padding' => 0,
						'angle' => 0,
						'dx' => 0,
						'dy' => 0,
						'textAnchor' => 'middle',
						'verticalAnchor' => 'end',
						'fill' => '#2a2a2a',
						'fontFamily' => '\'franklin-gothic-urw\', Verdana, Geneva, sans-serif',
						'maxWidth' => 50
					),
					'axisLabel' => array(
						'fontSize' => 12,
						'fill' => '#2a2a2a',
						'padding' => 15,
						'angle' => 0,
						'dx' => 0,
						'dy' => 0,
						'textAnchor' => 'end',
						'verticalAnchor' => 'middle',
						'fontFamily' => '\'franklin-gothic-urw\', Verdana, Geneva, sans-serif',
						'maxWidth' => 100
					),
					'axis' => array(
						'stroke' => '#818181',
						'strokeWidth' => 1
					),
					'ticks' => array(
						'stroke' => '#818181',
						'size' => 5,
						'strokeWidth' => 0
					),
					'grid' => array(
						'stroke' => '',
						'strokeOpacity' => 0.2,
						'strokeWidth' => 2,
						'strokeDasharray' => ''
					)
				)
			),
			'dependentAxis' => array(
				'type' => 'object',
				'default' => array(
					'active' => true,
					'label' => '',
					'scale' => 'linear',
					'domain' => array(
						0,
						100
					),
					'showZero' => false,
					'tickMarksActive' => true,
					'tickCount' => 5,
					'tickValues' => null,
					'tickFormat' => null,
					'tickAngle' => 0,
					'ticksToLocaleString' => false,
					'abbreviateTicks' => true,
					'abbreviateTicksDecimals' => 0,
					'tickUnit' => '',
					'tickUnitPosition' => 'end',
					'tickLabels' => array(
						'fontSize' => 12,
						'padding' => 15,
						'angle' => 0,
						'dx' => 0,
						'dy' => 0,
						'textAnchor' => 'end',
						'verticalAnchor' => 'middle',
						'fill' => '#565656',
						'fontFamily' => '\'franklin-gothic-urw\', Verdana, Geneva, sans-serif',
						'maxWidth' => 50
					),
					'axisLabel' => array(
						'fontSize' => 12,
						'fill' => '#565656',
						'padding' => 30,
						'angle' => 270,
						'dx' => 0,
						'dy' => 0,
						'textAnchor' => 'middle',
						'verticalAnchor' => 'middle',
						'fontFamily' => '\'franklin-gothic-urw\', Verdana, Geneva, sans-serif',
						'maxWidth' => 200
					),
					'axis' => array(
						'stroke' => '#818181',
						'strokeWidth' => 1
					),
					'ticks' => array(
						'stroke' => '#818181',
						'size' => 5,
						'strokeWidth' => 0
					),
					'grid' => array(
						'stroke' => '',
						'strokeOpacity' => 0.2,
						'strokeWidth' => 1,
						'strokeDasharray' => ''
					)
				)
			),
			'tooltip' => array(
				'type' => 'object',
				'default' => array(
					'active' => true,
					'activeOnMobile' => true,
					'headerActive' => true,
					'headerValue' => 'categoryValue',
					'format' => '{{row}}: {{value}}',
					'offsetX' => 10,
					'offsetY' => 10,
					'abbreviateValue' => false,
					'absoluteValue' => false,
					'toFixedDecimal' => 0,
					'toLocaleString' => true,
					'customFormat' => null,
					'rlsFormat' => false,
					'dateFormat' => '%-m/%Y',
					'caretPosition' => 'bottom',
					'deemphasizeSiblings' => false,
					'deemphasizeOpacity' => 0.5,
					'emphasizeStrokeActive' => false,
					'emphasizeStrokeColor' => 'black',
					'emphasizeStrokeWidth' => 1,
					'style' => array(
						'minWidth' => 50,
						'maxWidth' => 200,
						'maxHeight' => 100,
						'minHeight' => 20,
						'width' => 'auto',
						'height' => 'auto',
						'fontSize' => 13,
						'fontFamily' => '\'franklin-gothic-urw\', Verdana, Geneva, sans-serif',
						'background' => 'white',
						'border' => '1px solid #CBCBCB',
						'padding' => '10px',
						'borderRadius' => '0px',
						'color' => 'black'
					)
				)
			),
			'legend' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'variation' => 'grouped',
					'orientation' => 'row',
					'title' => '',
					'alignment' => 'center',
					'offsetX' => 0,
					'offsetY' => 0,
					'markerStyle' => 'rect',
					'markerFill' => 'solid',
					'borderStroke' => '',
					'fill' => '',
					'categories' => array(
						
					),
					'labelDelimiter' => 'to',
					'labelLower' => 'Less than ',
					'labelUpper' => 'More than ',
					'fontSize' => 12,
					'fontWeight' => 'normal',
					'margin' => array(
						'top' => 0,
						'right' => 5,
						'bottom' => 0,
						'left' => 0
					)
				)
			),
			'labels' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'showFirstLastPointsOnly' => false,
					'color' => 'inherit',
					'fontWeight' => 200,
					'fontSize' => 10,
					'fontFamily' => '\'franklin-gothic-urw\', Verdana, Geneva, sans-serif',
					'labelPositionBar' => 'inside',
					'labelCutoff' => 10,
					'labelCutoffMobile' => 5,
					'labelPositionDX' => 0,
					'labelPositionDY' => 0,
					'pieLabelRadius' => 60,
					'abbreviateValue' => false,
					'absoluteValue' => false,
					'toLocaleString' => true,
					'truncateDecimal' => true,
					'toFixedDecimal' => 3,
					'labelUnit' => '',
					'labelUnitPosition' => 'end',
					'textAnchor' => 'middle',
					'customLabelFormat' => null,
					'customPositions' => array(
						
					),
					'customLabels' => array(
						
					),
					'customVisibility' => array(
						
					),
					'customStyles' => array(
						
					)
				)
			),
			'shapes' => array(
				'type' => 'object',
				'default' => array(
					'customStyles' => array(
						
					),
					'segmentStyles' => array(
						
					),
					'segmentsActive' => false
				)
			),
			'bar' => array(
				'type' => 'object',
				'default' => array(
					'barPadding' => 0.2,
					'barGroupPadding' => 0.2,
					'hasRectStroke' => false,
					'stackOffset' => 'none'
				)
			),
			'line' => array(
				'type' => 'object',
				'default' => array(
					'interpolation' => 'curveLinear',
					'strokeDasharray' => '',
					'strokeWidth' => 3,
					'showPoints' => true,
					'showArea' => false,
					'areaFillOpacity' => 0.4
				)
			),
			'dotPlot' => array(
				'type' => 'object',
				'default' => array(
					'connectPoints' => true,
					'connectingLine' => array(
						'stroke' => '#E6E7E8',
						'strokeWidth' => 6,
						'strokeDasharray' => '',
						'strokeOpacity' => 1
					)
				)
			),
			'errorBars' => array(
				'type' => 'object',
				'default' => array(
					'enabled' => false,
					'defaultStyles' => array(
						'stroke' => '#E6E7E8',
						'strokeWidth' => 6,
						'strokeDasharray' => '',
						'strokeOpacity' => 1
					),
					'categories' => array(
						
					),
					'customStyles' => array(
						
					)
				)
			),
			'explodedBar' => array(
				'type' => 'object',
				'default' => array(
					'columnGap' => 16
				)
			),
			'pie' => array(
				'type' => 'object',
				'default' => array(
					'hasPathStroke' => false,
					'pathStrokeColor' => 'white',
					'pathStrokeWidth' => 1,
					'showCategoryLabels' => true,
					'innerRadius' => 0,
					'padAngle' => 0,
					'cornerRadius' => 0,
					'sortByValue' => false,
					'groupGapAngle' => 10,
					'showGroupArcs' => false,
					'groupArcStyle' => array(
						'stroke' => '#666666',
						'strokeWidth' => 1,
						'strokeDasharray' => '4,4'
					)
				)
			),
			'nodes' => array(
				'type' => 'object',
				'default' => array(
					'pointSize' => 3,
					'pointFill' => 'inherit',
					'pointStrokeWidth' => 1,
					'pointStroke' => 'inherit'
				)
			),
			'regression' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'type' => 'linear',
					'stroke' => '#2a2a2a',
					'strokeWidth' => 2,
					'strokeDasharray' => '',
					'perGroupBreak' => false,
					'groupBreakStyles' => array(
						
					)
				)
			),
			'map' => array(
				'type' => 'object',
				'default' => array(
					'ignoreSmallStateLabels' => false,
					'ignoredLabels' => array(
						
					),
					'abbreviateLabels' => true,
					'blockRectSize' => 44,
					'pathBackgroundFill' => '#f7f7f7',
					'pathStroke' => '#d3d3d3',
					'pathStrokeWidth' => 0.5,
					'showCountyBoundaries' => true,
					'showStateBoundaries' => true,
					'zoomActive' => false,
					'projectionPreset' => 'default',
					'topologyRegion' => 'default',
					'centerLongitude' => 0,
					'centerLatitude' => 0,
					'rotateLambda' => 0,
					'rotatePhi' => 0,
					'rotateGamma' => 0,
					'customScale' => 1
				)
			),
			'divergingBar' => array(
				'type' => 'object',
				'default' => array(
					'positiveCategories' => array(
						
					),
					'negativeCategories' => array(
						
					),
					'netPositiveCategory' => '',
					'netNegativeCategory' => '',
					'percentOfInnerWidth' => 0.7,
					'neutralBar' => array(
						'active' => true,
						'category' => '',
						'offsetX' => 0,
						'separator' => true,
						'separatorOffsetX' => -1
					),
					'secondary' => array(
						'active' => false,
						'positiveCategories' => array(
							
						),
						'negativeCategories' => array(
							
						),
						'fill' => '#D9D9D9',
						'stroke' => '#000000',
						'strokeWidth' => 0.5,
						'opacity' => 0.4,
						'categoryStyles' => array(
							
						),
						'showInLegend' => false
					)
				)
			),
			'diffColumn' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'category' => '',
					'columnHeader' => 'Diff',
					'customLabels' => array(
						
					),
					'dx' => 0,
					'dy' => 0,
					'style' => array(
						'rectStrokeWidth' => 0,
						'rectStrokeColor' => 'white',
						'rectFill' => 'none',
						'fill' => '#2a2a2a',
						'headerFill' => '#2a2a2a',
						'textOutline' => false,
						'headerTextOutline' => false,
						'fontWeight' => 'normal',
						'fontStyle' => 'normal',
						'headerFontWeight' => 'normal',
						'headerFontStyle' => 'normal',
						'headerFontFamily' => '',
						'fontAppearance' => 'default',
						'fontSize' => '10px',
						'headerFontSize' => '12px',
						'marginLeft' => 10,
						'width' => 30,
						'heightOffset' => 0
					)
				)
			),
			'netValues' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'positive' => array(
						'active' => true,
						'category' => '',
						'color' => 'black',
						'fontWeight' => 700,
						'fontSize' => 10,
						'fontFamily' => '',
						'textAnchor' => 'middle',
						'labelPositionDX' => 0,
						'labelPositionDY' => 0,
						'abbreviateValue' => false,
						'absoluteValue' => false,
						'truncateDecimal' => false,
						'toFixedDecimal' => 0,
						'toLocaleString' => false,
						'labelUnit' => '',
						'labelUnitPosition' => 'end',
						'margin' => 5
					),
					'negative' => array(
						'active' => false,
						'category' => '',
						'color' => 'black',
						'fontWeight' => 700,
						'fontSize' => 10,
						'fontFamily' => '',
						'textAnchor' => 'middle',
						'labelPositionDX' => 0,
						'labelPositionDY' => 0,
						'abbreviateValue' => false,
						'absoluteValue' => false,
						'truncateDecimal' => false,
						'toFixedDecimal' => 0,
						'toLocaleString' => false,
						'labelUnit' => '',
						'labelUnitPosition' => 'end',
						'margin' => 5
					)
				)
			),
			'treemap' => array(
				'type' => 'object',
				'default' => array(
					'tile' => 'squarify',
					'rectStroke' => '#ffffff',
					'rectStrokeWidth' => 2,
					'labelMinArea' => 1600,
					'paddingInner' => 2,
					'paddingOuter' => 4,
					'scaleOpacity' => false,
					'opacityRange' => array(
						0.4,
						1
					),
					'borderRadius' => 0,
					'showValues' => false
				)
			),
			'sankey' => array(
				'type' => 'object',
				'default' => array(
					'nodeAlign' => 'justify',
					'nodeWidth' => 12,
					'nodePadding' => 10,
					'linkOpacity' => 0.5,
					'nodeRadius' => 0,
					'sourceKey' => 'x',
					'targetKey' => 'target',
					'valueKey' => 'value'
				)
			),
			'annotations' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'activeOnMobile' => false,
					'items' => array(
						
					)
				)
			),
			'drawings' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'customTickLabels' => array(
				'type' => 'object',
				'default' => array(
					'independent' => array(
						
					),
					'dependent' => array(
						
					)
				)
			),
			'customLegendLabels' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'customTooltips' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'dataRender' => array(
				'type' => 'object',
				'default' => array(
					'x' => 'x',
					'y' => 'y',
					'sortKey' => 'x',
					'sortOrder' => 'none',
					'categories' => array(
						
					),
					'xScale' => 'linear',
					'yScale' => 'linear',
					'xFormat' => null,
					'yFormat' => null,
					'numberFormat' => 'en-US',
					'isHighlightedColor' => '#ECDBAC',
					'highlightColor' => '#ECDBAC',
					'deselectedColor' => '#EEECE4',
					'deselectedOpacity' => 1,
					'highlightedCategories' => array(
						
					),
					'mapScale' => 'threshold',
					'mapScaleDomain' => array(
						10,
						20,
						30,
						40,
						50
					),
					'groupBreaksActive' => false,
					'groupBreaksCategory' => 'Continent',
					'groupBreaksCategoryValues' => array(
						
					),
					'groupBreaks' => array(
						'breakStyles' => array(
							'variation' => 'empty',
							'stroke' => '#A4A4A4',
							'strokeWidth' => 1.4,
							'height' => 30,
							'strokeDasharray' => 'none'
						),
						'labelStyles' => array(
							'fill' => 'black',
							'fontStyle' => 'normal'
						)
					)
				)
			),
			'animate' => array(
				'type' => 'object',
				'default' => array(
					'active' => false,
					'animationWhitelist' => array(
						
					),
					'duration' => 2000
				)
			),
			'io' => array(
				'type' => 'object',
				'default' => array(
					'isConvertedChart' => false,
					'isStaticChart' => false,
					'isFreeformChart' => false,
					'staticImageId' => '',
					'staticImageUrl' => '',
					'staticImageInnerHTML' => '',
					'staticImageAltText' => '',
					'chartConverted' => array(
						'converted' => false,
						'requester' => '',
						'timestamp' => ''
					),
					'defaultShouldRender' => true,
					'pngUrl' => '',
					'pngId' => '',
					'colorValue' => 'general',
					'customColors' => array(
						
					),
					'chartFamily' => 'chart',
					'chartData' => array(
						
					),
					'tableData' => '',
					'availableCategories' => array(
						
					),
					'independentVariable' => '',
					'hasPreformattedData' => false,
					'preformattedData' => array(
						
					),
					'questionWordingActive' => false,
					'questionWording' => '',
					'tabsActive' => false,
					'allowDataDownload' => true,
					'elementHasStroke' => false,
					'isCustomChart' => false,
					'customAttributes' => array(
						
					),
					'preserveStringKeys' => array(
						
					)
				)
			),
			'_legacy' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'_v1Original' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'_migrationMeta' => array(
				'type' => 'object',
				'default' => array(
					'migratedAt' => '',
					'migrationVersion' => '1.0.0',
					'forceRemigrate' => false
				)
			)
		),
		'example' => array(
			'attributes' => array(
				'_version' => 'v2',
				'layout' => array(
					'type' => 'bar'
				),
				'metadata' => array(
					'title' => 'Chart Title',
					'subtitle' => 'Chart Subtitle',
					'note' => 'Chart Note',
					'source' => 'Chart Source'
				),
				'io' => array(
					'chartData' => array(
						array(
							'x' => 'Category 1',
							'y' => 100
						),
						array(
							'x' => 'Category 2',
							'y' => 200
						)
					)
				)
			)
		),
		'usesContext' => array(
			'refId',
			'prc-chart-builder/id'
		),
		'supports' => array(
			'html' => false,
			'inserter' => false,
			'interactivity' => true,
			'lock' => false
		),
		'editorScript' => 'file:./index.js',
		'viewScriptModule' => 'file:./view.js'
	),
	'controller' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'textdomain' => 'chart-builder-controller',
		'name' => 'prc-chart-builder/controller',
		'category' => 'media',
		'title' => 'Chart Builder Controller',
		'description' => 'Create a custom data-driven chart using blocks.',
		'icon' => 'chart-area',
		'keywords' => array(
			'chart'
		),
		'attributes' => array(
			'id' => array(
				'type' => 'string'
			),
			'isStatic' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isFreeform' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isTable' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isInteractive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'chartType' => array(
				'type' => 'string'
			),
			'transformed' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isConvertedChart' => array(
				'type' => 'boolean',
				'default' => false
			),
			'tabsActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'shareActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'enableSchemaOutput' => array(
				'type' => 'boolean',
				'default' => true
			),
			'chartPreformattedData' => array(
				'type' => 'array'
			),
			'align' => array(
				'type' => 'string',
				'default' => 'none'
			)
		),
		'example' => array(
			'attributes' => array(
				'className' => 'is-style-bar is-example'
			)
		),
		'providesContext' => array(
			'prc-chart-builder/id' => 'id',
			'prc-chart-builder/align' => 'align'
		),
		'usesContext' => array(
			'refId'
		),
		'supports' => array(
			'html' => false,
			'interactivity' => true,
			'align' => true
		),
		'viewScriptModule' => 'file:./view.js',
		'editorScript' => 'file:./index.js',
		'style' => 'file:./style-index.css'
	),
	'synced-chart' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-chart-builder/synced-chart',
		'title' => 'Synced Chart',
		'category' => 'media',
		'description' => 'Create, save, and sync charts to reuse across the site. Update the chart, and the changes apply everywhere it\'s used.',
		'textdomain' => 'default',
		'attributes' => array(
			'ref' => array(
				'type' => 'number'
			)
		),
		'supports' => array(
			'customClassName' => false,
			'html' => false,
			'align' => true,
			'interactivity' => true
		),
		'providesContext' => array(
			'refId' => 'ref'
		),
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css'
	)
);
