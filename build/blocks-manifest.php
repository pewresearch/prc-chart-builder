<?php
// This file is generated. Do not modify it manually.
return array(
	'chart' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-block/chart-builder',
		'title' => 'Chart Builder',
		'description' => 'Chart element for the Chart Builder Controller block.',
		'category' => 'media',
		'icon' => 'chart-line',
		'parent' => array(
			'prc-block/chart-builder-controller'
		),
		'attributes' => array(
			'test' => array(
				'type' => 'string',
				'default' => 'test'
			),
			'id' => array(
				'type' => 'string'
			),
			'parentClass' => array(
				'type' => 'string',
				'default' => 'wp-chart-builder-wrapper'
			),
			'isConvertedChart' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isStaticChart' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isFreeformChart' => array(
				'type' => 'boolean',
				'default' => false
			),
			'staticImageId' => array(
				'type' => 'string'
			),
			'staticImageUrl' => array(
				'type' => 'string'
			),
			'staticImageInnerHTML' => array(
				'type' => 'string'
			),
			'chartConverted' => array(
				'type' => 'object',
				'default' => array(
					'converted' => false,
					'requester' => '',
					'timestamp' => ''
				)
			),
			'chartData' => array(
				'type' => 'array'
			),
			'tableData' => array(
				'type' => 'string'
			),
			'hasPreformattedData' => array(
				'type' => 'boolean',
				'default' => false
			),
			'preformattedData' => array(
				'type' => 'array'
			),
			'chartType' => array(
				'type' => 'string',
				'enum' => array(
					'bar',
					'diverging-bar',
					'line',
					'area',
					'stacked-area',
					'scatter',
					'pie',
					'dot-plot',
					'stacked-bar',
					'grouped-bar',
					'exploded-bar',
					'static',
					'map-usa',
					'map-usa-counties',
					'map-usa-block',
					'map-world',
					'freeform'
				),
				'default' => 'bar'
			),
			'chartFamily' => array(
				'type' => 'string',
				'enum' => array(
					'chart',
					'map'
				),
				'default' => 'chart'
			),
			'chartOrientation' => array(
				'type' => 'string',
				'enum' => array(
					'vertical',
					'horizontal'
				),
				'default' => 'horizontal'
			),
			'width' => array(
				'type' => 'integer',
				'default' => 640
			),
			'height' => array(
				'type' => 'integer',
				'default' => 400
			),
			'overflowX' => array(
				'type' => 'string',
				'enum' => array(
					'scroll',
					'responsive',
					'scroll-fixed-y-axis',
					'preserve-aspect-ratio'
				),
				'default' => 'responsive'
			),
			'mobileBreakpoint' => array(
				'type' => 'integer',
				'default' => 480
			),
			'horizontalRules' => array(
				'type' => 'boolean',
				'default' => true
			),
			'paddingTop' => array(
				'type' => 'integer',
				'default' => 20
			),
			'paddingLeft' => array(
				'type' => 'integer',
				'default' => 60
			),
			'paddingBottom' => array(
				'type' => 'integer',
				'default' => 25
			),
			'paddingRight' => array(
				'type' => 'integer',
				'default' => 0
			),
			'pieCategoryLabelsActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'dataRenderX' => array(
				'type' => 'string',
				'default' => 'x'
			),
			'dataRenderY' => array(
				'type' => 'string',
				'default' => 'y'
			),
			'dateInputFormat' => array(
				'type' => 'string',
				'enum' => array(
					'YYYY',
					'YYYY-MM',
					'YYYY-MM-DD',
					'MM-YYYY',
					'MM-DD-YYYY',
					'DD-MM-YYYY',
					'MM/DD/YYYY',
					'MM/YYYY',
					'DD/MM/YYYY',
					'MM/DD',
					'DD/MM',
					'MM'
				),
				'default' => 'YYYY'
			),
			'sortOrder' => array(
				'type' => 'string',
				'enum' => array(
					'ascending',
					'descending',
					'none',
					'reverse'
				),
				'default' => 'none'
			),
			'sortKey' => array(
				'type' => 'string',
				'default' => 'x'
			),
			'colorValue' => array(
				'type' => 'string',
				'default' => 'general'
			),
			'customColors' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'elementHasStroke' => array(
				'type' => 'boolean',
				'default' => false
			),
			'tabsActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'xAxisActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'xLabel' => array(
				'type' => 'string',
				'default' => null
			),
			'xLabelMaxWidth' => array(
				'type' => 'number',
				'default' => 100
			),
			'xLabelFontSize' => array(
				'type' => 'number',
				'default' => 12
			),
			'xLabelPadding' => array(
				'type' => 'number',
				'default' => 30
			),
			'xLabelTextFill' => array(
				'type' => 'string',
				'default' => '#231F20'
			),
			'xMinDomain' => array(
				'type' => 'number',
				'default' => 0
			),
			'xMaxDomain' => array(
				'type' => 'number',
				'default' => 100
			),
			'showXMinDomainLabel' => array(
				'type' => 'boolean',
				'default' => true
			),
			'xTickMarksActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'xTickNum' => array(
				'type' => 'integer',
				'default' => 5
			),
			'xTickExact' => array(
				'type' => 'string',
				'default' => ''
			),
			'xTickUnit' => array(
				'type' => 'string',
				'default' => ''
			),
			'xTickUnitPosition' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'end'
				),
				'default' => 'end'
			),
			'xTickLabelAngle' => array(
				'type' => 'integer',
				'default' => 0
			),
			'xTickLabelMaxWidth' => array(
				'type' => 'integer',
				'default' => 50
			),
			'xTickLabelTextAnchor' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'middle',
					'end'
				),
				'default' => 'middle'
			),
			'xTickLabelVerticalAnchor' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'middle',
					'end'
				),
				'default' => 'start'
			),
			'xTickLabelDY' => array(
				'type' => 'integer',
				'default' => 0
			),
			'xTickLabelDX' => array(
				'type' => 'integer',
				'default' => 0
			),
			'xAbbreviateTicks' => array(
				'type' => 'boolean',
				'default' => false
			),
			'xAbbreviateTicksDecimals' => array(
				'type' => 'integer',
				'default' => 0
			),
			'xTicksToLocaleString' => array(
				'type' => 'boolean',
				'default' => false
			),
			'xMultiLineTickLabels' => array(
				'type' => 'boolean',
				'default' => false
			),
			'xMultiLineTickLabelsBreak' => array(
				'type' => 'integer',
				'default' => 1
			),
			'xScale' => array(
				'type' => 'string',
				'enum' => array(
					'linear',
					'time',
					'log',
					'sqrt'
				),
				'default' => 'linear'
			),
			'xDateFormat' => array(
				'type' => 'string',
				'enum' => array(
					'%Y',
					'%B/%Y',
					'%b/%Y',
					'%-m/%Y',
					'%-m/%y',
					'%-m/%-d/%Y',
					'%-d/%-m/%y',
					'%B %d, %Y',
					'%B %Y',
					'%b %Y',
					'%b %d, %Y',
					'%d %b %Y',
					'%d %b %y',
					'%d %b',
					'%d %B %Y',
					'%d %B \'%y',
					'%d %b \'%y',
					'%b \'%y',
					'\'%y',
					'%d %B',
					'%d %b, %Y'
				),
				'default' => '%Y'
			),
			'xAxisStroke' => array(
				'type' => 'string',
				'default' => '#756f6a'
			),
			'xGridStroke' => array(
				'type' => 'string',
				'default' => ''
			),
			'xGridStrokeDasharray' => array(
				'type' => 'string',
				'default' => ''
			),
			'xGridOpacity' => array(
				'type' => 'number',
				'default' => 0.2
			),
			'yAxisStroke' => array(
				'type' => 'string',
				'default' => '#756f6a'
			),
			'yGridStroke' => array(
				'type' => 'string',
				'default' => ''
			),
			'yGridStrokeDasharray' => array(
				'type' => 'string',
				'default' => ''
			),
			'yGridOpacity' => array(
				'type' => 'number',
				'default' => 0.2
			),
			'yAxisActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'yLabel' => array(
				'type' => 'string',
				'default' => null
			),
			'yLabelFontSize' => array(
				'type' => 'number',
				'default' => 12
			),
			'yLabelTextFill' => array(
				'type' => 'string',
				'default' => '#231F20'
			),
			'yLabelPadding' => array(
				'type' => 'number',
				'default' => 30
			),
			'yLabelMaxWidth' => array(
				'type' => 'number',
				'default' => 100
			),
			'yScale' => array(
				'type' => 'string',
				'enum' => array(
					'linear',
					'time',
					'log',
					'sqrt'
				),
				'default' => 'linear'
			),
			'yScaleFormat' => array(
				'type' => 'string',
				'default' => ''
			),
			'yMinDomain' => array(
				'type' => 'number',
				'default' => 0
			),
			'yMaxDomain' => array(
				'type' => 'number',
				'default' => 100
			),
			'showYMinDomainLabel' => array(
				'type' => 'boolean',
				'default' => false
			),
			'yTickMarksActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'yTickNum' => array(
				'type' => 'integer',
				'default' => 5
			),
			'yTickExact' => array(
				'type' => 'string',
				'default' => ''
			),
			'yTickUnit' => array(
				'type' => 'string',
				'default' => ''
			),
			'yTickUnitPosition' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'end'
				),
				'default' => 'end'
			),
			'yTickLabelAngle' => array(
				'type' => 'integer',
				'default' => 0
			),
			'yTickLabelMaxWidth' => array(
				'type' => 'integer',
				'default' => 50
			),
			'yTickLabelTextAnchor' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'middle',
					'end'
				),
				'default' => 'middle'
			),
			'yTickLabelVerticalAnchor' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'middle',
					'end'
				),
				'default' => 'start'
			),
			'yTickLabelDY' => array(
				'type' => 'integer',
				'default' => 0
			),
			'yTickLabelDX' => array(
				'type' => 'integer',
				'default' => 0
			),
			'yAbbreviateTicks' => array(
				'type' => 'boolean',
				'default' => true
			),
			'yAbbreviateTicksDecimals' => array(
				'type' => 'integer',
				'default' => 0
			),
			'yTicksToLocaleString' => array(
				'type' => 'boolean',
				'default' => false
			),
			'yMultiLineTickLabels' => array(
				'type' => 'boolean',
				'default' => false
			),
			'yMultiLineTickLabelsBreak' => array(
				'type' => 'integer',
				'default' => 1
			),
			'plotBandsActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'plotBands' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'annotationsActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'annotations' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'barLabelPosition' => array(
				'type' => 'string',
				'enum' => array(
					'inside',
					'outside',
					'center'
				),
				'default' => 'inside'
			),
			'barLabelCutoff' => array(
				'type' => 'number',
				'default' => 10
			),
			'barLabelCutoffMobile' => array(
				'type' => 'number',
				'default' => 5
			),
			'barPadding' => array(
				'type' => 'number',
				'default' => 0.2
			),
			'barGroupPadding' => array(
				'type' => 'number',
				'default' => 0.2
			),
			'groupBreaksActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'groupBreaks' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'lineInterpolation' => array(
				'type' => 'string',
				'enum' => array(
					'curveBasis',
					'curveBasisClosed',
					'curveBasisOpen',
					'curveStep',
					'curveStepAfter',
					'curveStepBefore',
					'curveBundle',
					'curveLinear',
					'curveLinearClosed',
					'curveCardinal',
					'curveCardinalClosed',
					'curveCardinalOpen',
					'curveCatmullRom',
					'curveCatmullRomClosed',
					'curveCatmullRomOpen',
					'curveMonotoneX',
					'curveMonotoneY',
					'curveNatural'
				),
				'default' => 'curveLinear'
			),
			'lineStrokeWidth' => array(
				'type' => 'integer',
				'default' => 3
			),
			'lineStrokeDashArray' => array(
				'type' => 'string',
				'default' => ''
			),
			'lineNodes' => array(
				'type' => 'boolean',
				'default' => true
			),
			'nodeSize' => array(
				'type' => 'integer',
				'default' => 3
			),
			'nodeFill' => array(
				'type' => 'string',
				'default' => 'inherit'
			),
			'nodeStrokeWidth' => array(
				'type' => 'integer',
				'default' => 3
			),
			'areaFillOpacity' => array(
				'type' => 'number',
				'default' => 0.4
			),
			'tooltipActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'tooltipActiveOnMobile' => array(
				'type' => 'boolean',
				'default' => true
			),
			'deemphasizeSiblings' => array(
				'type' => 'boolean',
				'default' => false
			),
			'deemphasizeOpacity' => array(
				'type' => 'number',
				'default' => 0.5
			),
			'tooltipMaxHeight' => array(
				'type' => 'integer',
				'default' => 100
			),
			'tooltipMaxWidth' => array(
				'type' => 'integer',
				'default' => 200
			),
			'tooltipMinHeight' => array(
				'type' => 'integer',
				'default' => 20
			),
			'tooltipMinWidth' => array(
				'type' => 'integer',
				'default' => 50
			),
			'tooltipHeaderActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'tooltipHeaderValue' => array(
				'type' => 'string',
				'enum' => array(
					'independentValue',
					'categoryValue'
				),
				'default' => 'categoryValue'
			),
			'tooltipOffsetX' => array(
				'type' => 'integer',
				'default' => 10
			),
			'tooltipOffsetY' => array(
				'type' => 'integer',
				'default' => 10
			),
			'tooltipCaretPosition' => array(
				'type' => 'string',
				'enum' => array(
					'top',
					'bottom',
					'left',
					'right'
				)
			),
			'tooltipFormat' => array(
				'type' => 'string',
				'default' => '{{row}}: {{value}}'
			),
			'tooltipFormatValue' => array(
				'type' => 'boolean',
				'default' => true
			),
			'tooltipAbsoluteValue' => array(
				'type' => 'boolean',
				'default' => false
			),
			'tooltipDateFormat' => array(
				'type' => 'string',
				'enum' => array(
					'%Y',
					'%B/%Y',
					'%b/%Y',
					'%-m/%Y',
					'%-m/%y',
					'%-m/%-d/%Y',
					'%-d/%-m/%y',
					'%B %d, %Y',
					'%B %Y',
					'%b %Y',
					'%b %d, %Y',
					'%d %b %Y',
					'%d %b %y',
					'%d %b',
					'%d %B %Y',
					'%d %B \'%y',
					'%d %b \'%y',
					'%b \'%y',
					'\'%y',
					'%d %B',
					'%d %b, %Y'
				),
				'default' => '%Y'
			),
			'labelsActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'showFirstLastPointsOnly' => array(
				'type' => 'boolean',
				'default' => false
			),
			'labelPositionDX' => array(
				'type' => 'integer',
				'default' => 0
			),
			'labelPositionDY' => array(
				'type' => 'integer',
				'default' => 0
			),
			'labelCutoff' => array(
				'type' => 'number',
				'default' => 10
			),
			'labelAbsoluteValue' => array(
				'type' => 'boolean',
				'default' => false
			),
			'labelFormatValue' => array(
				'type' => 'boolean',
				'default' => true
			),
			'labelTruncateDecimal' => array(
				'type' => 'boolean',
				'default' => true
			),
			'labelToFixedDecimal' => array(
				'type' => 'integer',
				'default' => 3
			),
			'labelUnit' => array(
				'type' => 'string',
				'default' => ''
			),
			'labelUnitPosition' => array(
				'type' => 'string',
				'enum' => array(
					'start',
					'end'
				),
				'default' => 'end'
			),
			'labelColor' => array(
				'type' => 'string',
				'enum' => array(
					'inherit',
					'black',
					'white',
					'contrast'
				),
				'default' => 'inherit'
			),
			'labelFontSize' => array(
				'type' => 'integer',
				'default' => 10
			),
			'labelFontWeight' => array(
				'type' => 'integer',
				'default' => 200
			),
			'legendActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'legendCategories' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'legendOrientation' => array(
				'type' => 'string',
				'enum' => array(
					'row',
					'column',
					'row-reverse',
					'column-reverse'
				),
				'default' => 'row'
			),
			'legendTitle' => array(
				'type' => 'string',
				'default' => ''
			),
			'legendAlignment' => array(
				'type' => 'string',
				'enum' => array(
					'flex-start',
					'center',
					'flex-end',
					'none'
				),
				'default' => 'center'
			),
			'legendOffsetX' => array(
				'type' => 'integer',
				'default' => 0
			),
			'legendOffsetY' => array(
				'type' => 'integer',
				'default' => 0
			),
			'legendMarkerStyle' => array(
				'type' => 'string',
				'enum' => array(
					'circle',
					'rect',
					'line'
				),
				'default' => 'rect'
			),
			'legendBorderStroke' => array(
				'type' => 'string',
				'default' => '#231F20'
			),
			'legendFill' => array(
				'type' => 'string',
				'default' => 'white'
			),
			'legendLabelDelimiter' => array(
				'type' => 'string',
				'default' => ' - '
			),
			'legendLabelLower' => array(
				'type' => 'string',
				'default' => 'Less than '
			),
			'legendLabelUpper' => array(
				'type' => 'string',
				'default' => 'More than '
			),
			'metaTextActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'metaTitle' => array(
				'type' => 'string',
				'default' => 'Title'
			),
			'metaSubtitle' => array(
				'type' => 'string',
				'default' => 'Subtitle'
			),
			'metaNote' => array(
				'type' => 'string',
				'default' => 'Note: This is a note.'
			),
			'metaSource' => array(
				'type' => 'string',
				'default' => 'Source: This is your source.'
			),
			'metaTag' => array(
				'type' => 'string',
				'default' => 'PEW RESEARCH CENTER'
			),
			'svgUrl' => array(
				'type' => 'string',
				'default' => ''
			),
			'svgId' => array(
				'type' => 'integer'
			),
			'pngUrl' => array(
				'type' => 'string',
				'default' => ''
			),
			'pngId' => array(
				'type' => 'integer'
			),
			'independentVariable' => array(
				'type' => 'string',
				'default' => 'x'
			),
			'categories' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'positiveCategories' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'negativeCategories' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'neutralCategory' => array(
				'type' => 'string',
				'default' => ''
			),
			'neutralBarActive' => array(
				'type' => 'boolean',
				'default' => true
			),
			'neutralBarOffsetX' => array(
				'type' => 'integer',
				'default' => 0
			),
			'neutralBarSeparator' => array(
				'type' => 'boolean',
				'default' => true
			),
			'neutralBarSeparatorOffsetX' => array(
				'type' => 'integer',
				'default' => -1
			),
			'divergingBarPercentOfInnerWidth' => array(
				'type' => 'number',
				'default' => 70
			),
			'dotPlotConnectPoints' => array(
				'type' => 'boolean',
				'default' => true
			),
			'dotPlotConnectPointsStroke' => array(
				'type' => 'string',
				'default' => '#E6E7E8'
			),
			'dotPlotConnectPointsStrokeWidth' => array(
				'type' => 'integer',
				'default' => 6
			),
			'dotPlotConnectPointsStrokeDasharray' => array(
				'type' => 'string',
				'default' => ''
			),
			'explodedBarColumnGap' => array(
				'type' => 'number',
				'default' => 16
			),
			'availableCategories' => array(
				'type' => 'array',
				'default' => array(
					'y'
				)
			),
			'diffColumnActive' => array(
				'type' => 'boolean',
				'default' => false
			),
			'diffColumnCategory' => array(
				'type' => 'string',
				'default' => ''
			),
			'diffColumnHeader' => array(
				'type' => 'string',
				'default' => ''
			),
			'diffColumnWidth' => array(
				'type' => 'integer',
				'default' => 30
			),
			'diffColumnBackgroundColor' => array(
				'type' => 'string',
				'default' => ''
			),
			'diffColumnMarginLeft' => array(
				'type' => 'integer',
				'default' => 10
			),
			'diffColumnHeightOffset' => array(
				'type' => 'integer',
				'default' => 0
			),
			'diffColumnAppearance' => array(
				'type' => 'string',
				'default' => 'default'
			),
			'mapScale' => array(
				'type' => 'string',
				'enum' => array(
					'threshold',
					'ordinal',
					'linear'
				),
				'default' => 'threshold'
			),
			'mapScaleDomain' => array(
				'type' => 'array',
				'default' => array(
					10,
					20,
					30,
					40,
					50
				)
			),
			'mapAbbreviateLabels' => array(
				'type' => 'boolean',
				'default' => true
			),
			'mapIgnoreSmallStateLabels' => array(
				'type' => 'boolean',
				'default' => true
			),
			'mapIgnoredLabels' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'showCountyBoundaries' => array(
				'type' => 'boolean',
				'default' => true
			),
			'mapShowStateBoundaries' => array(
				'type' => 'boolean',
				'default' => true
			),
			'mapPathBackgroundFill' => array(
				'type' => 'string',
				'default' => '#f7f7f7'
			),
			'mapPathStroke' => array(
				'type' => 'string',
				'default' => '#d3d3d3'
			),
			'mapBlockRectSize' => array(
				'type' => 'integer',
				'default' => 44
			),
			'allowDataDownload' => array(
				'type' => 'boolean',
				'default' => true
			),
			'isCustomChart' => array(
				'type' => 'boolean',
				'default' => false
			),
			'customAttributes' => array(
				'type' => 'object',
				'default' => array(
					
				)
			),
			'defaultShouldRender' => array(
				'type' => 'boolean',
				'default' => true
			)
		),
		'example' => array(
			'attributes' => array(
				'chartType' => 'bar',
				'className' => 'is-style-bar'
			)
		),
		'usesContext' => array(
			'refId',
			'prc-chart-builder/id'
		),
		'supports' => array(
			'html' => false,
			'inserter' => false,
			'interactivity' => true
		),
		'editorScript' => 'file:./index.js',
		'viewScriptModule' => 'file:./view.js',
		'render' => 'file:./render.php'
	),
	'controller' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'textdomain' => 'chart-builder-controller',
		'name' => 'prc-block/chart-builder-controller',
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
				'chartType' => 'bar',
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
			'inserter' => false
		),
		'viewScriptModule' => 'file:./view.js',
		'editorScript' => 'file:./index.js',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'synced-chart' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-block/chart',
		'title' => 'Chart',
		'category' => 'media',
		'description' => 'Create, save, and sync charts to reuse across the site. Update the chart, and the changes apply everywhere it’s used.',
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
