# PRC Chart Builder

A WordPress block for building charts using the PRC Charting Library.

## Configuration Reference

### General Layout Attributes

| Base Config Path        | Block Attribute  | Type                                                                                                                                                                                                                                | Default Value                                 | Description                  |
| ----------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| layout.width            | width            | number                                                                                                                                                                                                                              | 640                                           | Chart width in pixels        |
| layout.height           | height           | number                                                                                                                                                                                                                              | 400                                           | Chart height in pixels       |
| layout.type             | chartType        | 'bar'\|'diverging-bar'\|'line'\|'area'\|'scatter'\|'pie'\|'dot-plot'\|'stacked-bar'\|'single-stacked-bar'\|'grouped-bar'\|'exploded-bar'\|'stacked-area'\|'map-usa'\|'map-usa-counties'\|'map-usa-block'\|'map-world'\|'map-europe' | "bar"                                         | Type of chart to render      |
| layout.orientation      | chartOrientation | 'vertical'\|'horizontal'                                                                                                                                                                                                            | "vertical"                                    | Chart orientation            |
| layout.parentClass      | parentClass      | string                                                                                                                                                                                                                              | undefined                                     | Parent class for container   |
| layout.name             | --               | string                                                                                                                                                                                                                              | "wp-block-prc-block-chart-builder-controller" | Block name identifier        |
| layout.padding.top      | paddingTop       | number                                                                                                                                                                                                                              | 0                                             | Top padding of chart area    |
| layout.padding.right    | paddingRight     | number                                                                                                                                                                                                                              | 0                                             | Right padding of chart area  |
| layout.padding.bottom   | paddingBottom    | number                                                                                                                                                                                                                              | 0                                             | Bottom padding of chart area |
| layout.padding.left     | paddingLeft      | number                                                                                                                                                                                                                              | 0                                             | Left padding of chart area   |
| layout.overflowX        | overflowX        | 'scroll-fixed-y-axis'\|'responsive'\|'scroll'                                                                                                                                                                                       | "responsive"                                  | Horizontal overflow handling |
| layout.mobileBreakpoint | mobileBreakpoint | number                                                                                                                                                                                                                              | 480                                           | Mobile layout trigger width  |
| layout.horizontalRules  | horizontalRules  | boolean                                                                                                                                                                                                                             | true                                          | Show horizontal grid lines   |

### Metadata Attributes

| Base Config Path  | Block Attribute | Type    | Default Value         | Description                      |
| ----------------- | --------------- | ------- | --------------------- | -------------------------------- |
| metadata.active   | metaTextActive  | boolean | false                 | Enable/disable metadata display  |
| metadata.title    | metaTitle       | string  | ""                    | Chart title                      |
| metadata.subtitle | metaSubtitle    | string  | ""                    | Chart subtitle                   |
| metadata.note     | metaNote        | string  | ""                    | Additional notes about the chart |
| metadata.source   | metaSource      | string  | ""                    | Data source attribution          |
| metadata.tag      | metaTag         | string  | "PEW RESEARCH CENTER" | Tag label                        |

### Colors and Plot Bands

| Base Config Path      | Block Attribute | Type       | Default Value                                                      | Description                       |
| --------------------- | --------------- | ---------- | ------------------------------------------------------------------ | --------------------------------- |
| colors                | customColors    | string[]   | ["#436983", "#bf3927", "#756a7e", "#ea9e2c", "#bc7b2b", "#eeece4"] | Chart color palette               |
| plotBands.active      | plotBandsActive | boolean    | false                                                              | Enable/disable plot bands         |
| plotBands.allowDrag   | --              | boolean    | false                                                              | Allow dragging of plot bands      |
| plotBands.allowResize | --              | boolean    | false                                                              | Allow resizing of plot bands      |
| plotBands.dimension   | --              | string     | "x"                                                                | Dimension for plot bands          |
| plotBands.bands       | plotBands       | PlotBand[] | []                                                                 | Array of plot band configurations |

### Axis Configuration

#### Independent Axis (X-Axis)

| Base Config Path                          | Block Attribute          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Default Value | Description                    |
| ----------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------ |
| independentAxis.active                    | xAxisActive              | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | true          | Enable/disable X-axis          |
| independentAxis.label                     | xLabel                   | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ""            | X-axis label                   |
| independentAxis.scale                     | xScale                   | 'linear'\|'time'\|'log'\|'sqrt'                                                                                                                                                                                                                                                                                                                                                                                                                                            | "linear"      | Scale type                     |
| independentAxis.dateFormat                | xDateFormat              | '%Y'\|'%y'\|'%-m/%Y'\|'%-m/%y'\|'%m/%Y'\|'%m/%y'\|'%B %Y'\|'%b %Y'\|'%B \'%y'\|'%b \'%y'\|'%-m/%-d/%Y'\|'%-d/%-m/%Y'\|'%-m/%-d/%y'\|'%-d/%-m/%y'\|'%-m/%-d'\|'%-d/%-m'\|'%m/%-d/%Y'\|'%-d/%m/%Y'\|'%m/%-d/%y'\|'%-d/%m/%y'\|'%m/%-d'\|'%-d/%m'\|'%B %-d, %Y'\|'%B %-d %Y'\|'%b %-d, %Y'\|'%b %-d %Y'\|'%-d %B, %Y'\|'%-d %B %Y'\|'%-d %b, %Y'\|'%-d %b %Y'\|'%B %-d \'%y'\|'%-d %B \'%y'\|'%b %-d \'%y'\|'%-d %b \'%y'\|'%B %-d'\|'%-d %B'\|'%b %-d'\|'%-d %b'\|'%B'\|'%b' | "%-m/%Y"      | Date format for time scale     |
| independentAxis.domain                    | xMinDomain, xMaxDomain   | [number,number]                                                                                                                                                                                                                                                                                                                                                                                                                                                            | [0, 100]      | Axis domain range              |
| independentAxis.domainPadding             | --                       | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 20            | Padding for domain             |
| independentAxis.showZero                  | showXMinDomainLabel      | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | false         | Show zero on axis              |
| independentAxis.padding                   | xLabelPadding            | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 60            | Axis padding                   |
| independentAxis.tickAngle                 | xTickLabelAngle          | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 0             | Angle of tick labels           |
| independentAxis.tickCount                 | xTickNum                 | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 5             | Number of ticks                |
| independentAxis.tickValues                | xTickExact               | number[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | undefined     | Exact tick values              |
| independentAxis.tickFormat                | --                       | Function                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | null          | Custom tick format function    |
| independentAxis.ticksToLocaleString       | xTicksToLocaleString     | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | false         | Use locale string for ticks    |
| independentAxis.abbreviateTicks           | xAbbreviateTicks         | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | false         | Abbreviate tick values         |
| independentAxis.abbreviateTicksDecimals   | xAbbreviateTicksDecimals | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 0             | Decimals for abbreviated ticks |
| independentAxis.tickUnit                  | xTickUnit                | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ""            | Unit for tick values           |
| independentAxis.tickUnitPosition          | xTickUnitPosition        | 'start'\|'end'                                                                                                                                                                                                                                                                                                                                                                                                                                                             | "end"         | Position of tick unit          |
| independentAxis.tickLabels.textAnchor     | --                       | 'start'\|'middle'\|'end'                                                                                                                                                                                                                                                                                                                                                                                                                                                   | "middle"      | Tick label text anchor         |
| independentAxis.tickLabels.verticalAnchor | --                       | 'start'\|'middle'\|'end'                                                                                                                                                                                                                                                                                                                                                                                                                                                   | "middle"      | Tick label vertical anchor     |
| independentAxis.axisLabel.textAnchor      | --                       | 'start'\|'middle'\|'end'                                                                                                                                                                                                                                                                                                                                                                                                                                                   | "middle"      | Axis label text anchor         |
| independentAxis.axisLabel.verticalAnchor  | --                       | 'start'\|'middle'\|'end'                                                                                                                                                                                                                                                                                                                                                                                                                                                   | "middle"      | Axis label vertical anchor     |

#### Dependent Axis (Y-Axis)

| Base Config Path                        | Block Attribute          | Type                            | Default Value | Description                    |
| --------------------------------------- | ------------------------ | ------------------------------- | ------------- | ------------------------------ |
| dependentAxis.active                    | yAxisActive              | boolean                         | false         | Enable/disable Y-axis          |
| dependentAxis.label                     | yLabel                   | string                          | ""            | Y-axis label                   |
| dependentAxis.scale                     | yScale                   | 'linear'\|'time'\|'log'\|'sqrt' | "linear"      | Scale type                     |
| dependentAxis.domain                    | yMinDomain, yMaxDomain   | [number,number]                 | [0, 200]      | Axis domain range              |
| dependentAxis.domainPadding             | --                       | number                          | 20            | Padding for domain             |
| dependentAxis.showZero                  | showYMinDomainLabel      | boolean                         | true          | Show zero on axis              |
| dependentAxis.padding                   | yLabelPadding            | number                          | 100           | Axis padding                   |
| dependentAxis.tickCount                 | yTickNum                 | number                          | 10            | Number of ticks                |
| dependentAxis.tickValues                | yTickExact               | number[]                        | undefined     | Exact tick values              |
| dependentAxis.tickFormat                | --                       | Function                        | null          | Custom tick format function    |
| dependentAxis.ticksToLocaleString       | yTicksToLocaleString     | boolean                         | false         | Use locale string for ticks    |
| dependentAxis.abbreviateTicks           | yAbbreviateTicks         | boolean                         | true          | Abbreviate tick values         |
| dependentAxis.abbreviateTicksDecimals   | yAbbreviateTicksDecimals | number                          | 0             | Decimals for abbreviated ticks |
| dependentAxis.tickUnit                  | yTickUnit                | string                          | ""            | Unit for tick values           |
| dependentAxis.tickUnitPosition          | yTickUnitPosition        | 'start'\|'end'                  | "end"         | Position of tick unit          |
| dependentAxis.tickLabels.textAnchor     | --                       | 'start'\|'middle'\|'end'        | "middle"      | Tick label text anchor         |
| dependentAxis.tickLabels.verticalAnchor | --                       | 'start'\|'middle'\|'end'        | "middle"      | Tick label vertical anchor     |
| dependentAxis.axisLabel.textAnchor      | --                       | 'start'\|'middle'\|'end'        | "middle"      | Tick label text anchor         |
| dependentAxis.axisLabel.verticalAnchor  | --                       | 'start'\|'middle'\|'end'        | "middle"      | Tick label vertical anchor     |

### Chart Type-Specific Configurations

#### Bar Charts

| Base Config Path                      | Block Attribute   | Type                                              | Default Value | Description                |
| ------------------------------------- | ----------------- | ------------------------------------------------- | ------------- | -------------------------- |
| bar.hasRectStroke                     | elementHasStroke  | boolean                                           | false         | Show bar borders           |
| bar.rectStrokeColor                   | --                | string                                            | "white"       | Color of bar borders       |
| bar.rectStrokeWidth                   | --                | number                                            | 1             | Width of bar borders       |
| bar.barPadding                        | barPadding        | number                                            | 0.2           | Padding between bars       |
| bar.barGroupPadding                   | barGroupPadding   | number                                            | 0.2           | Padding between bar groups |
| bar.groupBreaksActive                 | groupBreaksActive | boolean                                           | false         | Enable group breaks        |
| bar.groupBreaks                       | groupBreaks       | object                                            | {}            | Group break configurations |
| bar.groupBreaks.breakStyles.variation | --                | 'empty'\|'solid'\|'dotted'\|'dashed'\|'heartbeat' | "solid"       | Break style variation      |
| bar.groupBreaks.labelStyles.fontStyle | --                | 'normal'\|'italic'\|'bold'                        | "normal"      | Label font style           |

#### Line/Area Charts

| Base Config Path     | Block Attribute     | Type                                                                                                                                                                                                                                                                                                  | Default Value | Description             |
| -------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------- |
| line.interpolation   | lineInterpolation   | 'curveBasis'\|'curveBasisClosed'\|'curveBasisOpen'\|'curveStep'\|'curveStepAfter'\|'curveStepBefore'\|'curveLinear'\|'curveLinearClosed'\|'curveCardinal'\|'curveCardinalClosed'\|'curveCardinalOpen'\|'curveCatmullRom'\|'curveCatmullRomClosed'\|'curveMonotoneX'\|'curveMonotoneY'\|'curveNatural' | "curveLinear" | Line interpolation type |
| line.strokeDasharray | lineStrokeDashArray | string                                                                                                                                                                                                                                                                                                | "1"           | Line dash pattern       |
| line.strokeWidth     | lineStrokeWidth     | number                                                                                                                                                                                                                                                                                                | 3             | Line width              |
| line.showPoints      | lineNodes           | boolean                                                                                                                                                                                                                                                                                               | false         | Show data points        |
| line.showArea        | --                  | boolean                                                                                                                                                                                                                                                                                               | false         | Show area fill          |
| line.areaFillOpacity | areaFillOpacity     | number                                                                                                                                                                                                                                                                                                | 0.4           | Opacity of area fill    |

### Data Rendering Configuration

| Base Config Path              | Block Attribute     | Type                                                                                              | Default Value                                      | Description              |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------ |
| dataRender.x                  | independentVariable | string                                                                                            | "x"                                                | Independent variable key |
| dataRender.y                  | --                  | string                                                                                            | "y"                                                | Dependent variable key   |
| dataRender.x2                 | --                  | string                                                                                            | null                                               | Secondary X variable     |
| dataRender.y2                 | --                  | string                                                                                            | null                                               | Secondary Y variable     |
| dataRender.sortKey            | sortKey             | string                                                                                            | "y"                                                | Key to sort data by      |
| dataRender.sortOrder          | sortOrder           | 'ascending'\|'descending'\|'reverse'\|'none'                                                      | "ascending"                                        | Sort direction           |
| dataRender.categories         | categories          | string[]                                                                                          | ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] | Data categories          |
| dataRender.xScale             | xScale              | 'linear'\|'time'\|'log'\|'sqrt'                                                                   | "linear"                                           | X-axis scale type        |
| dataRender.yScale             | yScale              | 'linear'\|'time'\|'log'\|'sqrt'                                                                   | "linear"                                           | Y-axis scale type        |
| dataRender.xFormat            | --                  | Function                                                                                          | null                                               | X value format           |
| dataRender.yFormat            | --                  | Function                                                                                          | null                                               | Y value format           |
| dataRender.numberFormat       | --                  | 'en-US'\|'en-GB'\|'de-DE'\|'fr-FR'\|'es-ES'\|'it-IT'\|'ja-JP'\|'ko-KR'\|'pt-BR'\|'zh-CN'\|'zh-TW' | "en-US"                                            | Number formatting locale |
| dataRender.isHighlightedColor | --                  | string                                                                                            | "#ECDBAC"                                          | Highlight color          |
| dataRender.mapScale           | mapScale            | 'ordinal'\|'threshold'\|'quantile'\|'quantize'\|'linear'                                          | "threshold"                                        | Map scale type           |
| dataRender.mapScaleDomain     | mapScaleDomain      | number[]                                                                                          | [10, 20, 30, 40, 50]                               | Map scale domain         |

### Animation Configuration

| Base Config Path           | Block Attribute | Type     | Default Value | Description             |
| -------------------------- | --------------- | -------- | ------------- | ----------------------- |
| animate.active             | --              | boolean  | false         | Enable animations       |
| animate.animationWhitelist | --              | string[] | []            | Whitelisted animations  |
| animate.duration           | --              | number   | 2000          | Animation duration (ms) |

### Tooltip Configuration

| Base Config Path            | Block Attribute       | Type     | Default Value        | Description                   |
| --------------------------- | --------------------- | -------- | -------------------- | ----------------------------- |
| tooltip.active              | tooltipActive         | boolean  | true                 | Enable tooltips               |
| tooltip.activeOnMobile      | tooltipActiveOnMobile | boolean  | true                 | Enable mobile tooltips        |
| tooltip.headerActive        | tooltipHeaderActive   | boolean  | true                 | Show tooltip header           |
| tooltip.headerValue         | tooltipHeaderValue    | string   | "independentValue"   | Header value source           |
| tooltip.format              | tooltipFormat         | string   | "{{row}}: {{value}}" | Tooltip format string         |
| tooltip.offsetX             | tooltipOffsetX        | number   | 10                   | Horizontal offset             |
| tooltip.offsetY             | tooltipOffsetY        | number   | 10                   | Vertical offset               |
| tooltip.abbreviateValue     | --                    | boolean  | false                | Abbreviate values             |
| tooltip.absoluteValue       | --                    | boolean  | false                | Show absolute values          |
| tooltip.toFixedDecimal      | --                    | number   | 0                    | Decimal places                |
| tooltip.toLocaleString      | --                    | boolean  | true                 | Use locale formatting         |
| tooltip.customFormat        | --                    | Function | null                 | Custom format function        |
| tooltip.rlsFormat           | --                    | boolean  | false                | Use RLS formatting            |
| tooltip.dateFormat          | tooltipDateFormat     | string   | "%-m/%Y"             | Date format                   |
| tooltip.caretPosition       | --                    | string   | "bottom"             | Tooltip caret position        |
| tooltip.deemphasizeSiblings | deemphasizeSiblings   | boolean  | false                | Fade non-highlighted elements |
| tooltip.deemphasizeOpacity  | deemphasizeOpacity    | number   | 0.5                  | Fade opacity                  |

### Legend Configuration

| Base Config Path      | Block Attribute      | Type                                             | Default Value | Description             |
| --------------------- | -------------------- | ------------------------------------------------ | ------------- | ----------------------- |
| legend.active         | legendActive         | boolean                                          | false         | Enable legend           |
| legend.orientation    | legendOrientation    | 'row'\|'column'\|'row-reverse'\|'column-reverse' | "row"         | Legend layout direction |
| legend.title          | legendTitle          | string                                           | ""            | Legend title            |
| legend.alignment      | legendAlignment      | 'flex-start'\|'flex-end'\|'center'\|'none'       | "center"      | Legend alignment        |
| legend.offsetX        | legendOffsetX        | number                                           | 0             | Horizontal offset       |
| legend.offsetY        | legendOffsetY        | number                                           | 0             | Vertical offset         |
| legend.markerStyle    | legendMarkerStyle    | 'rect'\|'circle'\|'line'                         | "rect"        | Legend marker style     |
| legend.borderStroke   | legendBorderStroke   | string                                           | "black"       | Border color            |
| legend.fill           | legendFill           | string                                           | "white"       | Background color        |
| legend.categories     | legendCategories     | string[]                                         | []            | Legend categories       |
| legend.labelDelimiter | legendLabelDelimiter | string                                           | "to"          | Label delimiter         |
| legend.labelLower     | legendLabelLower     | string                                           | "Less than "  | Lower bound label       |
| legend.labelUpper     | legendLabelUpper     | string                                           | "More than "  | Upper bound label       |

### Label Configuration

| Base Config Path               | Block Attribute         | Type                                    | Default Value                                        | Description                 |
| ------------------------------ | ----------------------- | --------------------------------------- | ---------------------------------------------------- | --------------------------- |
| labels.active                  | labelsActive            | boolean                                 | false                                                | Enable data labels          |
| labels.showFirstLastPointsOnly | showFirstLastPointsOnly | boolean                                 | false                                                | Show only first/last labels |
| labels.color                   | labelColor              | 'inherit'\|'contrast'\|'black'\|'white' | "inherit"                                            | Label color                 |
| labels.fontWeight              | labelFontWeight         | number                                  | 200                                                  | Font weight                 |
| labels.fontSize                | labelFontSize           | number                                  | 12                                                   | Font size                   |
| labels.fontFamily              | --                      | string                                  | "'franklin-gothic-urw', Verdana, Geneva, sans-serif" | Font family                 |
| labels.labelPositionBar        | barLabelPosition        | 'inside'\|'outside'\|'center'           | "inside"                                             | Label position for bars     |
| labels.labelCutoff             | labelCutoff             | number                                  | 5                                                    | Value cutoff for labels     |
| labels.labelCutoffMobile       | labelCutoffMobile       | number                                  | 10                                                   | Mobile cutoff value         |
| labels.labelPositionDX         | labelPositionDX         | number                                  | -25                                                  | Horizontal label offset     |
| labels.labelPositionDY         | labelPositionDY         | number                                  | 0                                                    | Vertical label offset       |
| labels.pieLabelRadius          | --                      | number                                  | 60                                                   | Pie chart label radius      |
| labels.abbreviateValue         | --                      | boolean                                 | false                                                | Abbreviate values           |
| labels.absoluteValue           | labelAbsoluteValue      | boolean                                 | false                                                | Show absolute values        |
| labels.toLocaleString          | labelFormatValue        | boolean                                 | true                                                 | Use locale formatting       |
| labels.truncateDecimal         | labelTruncateDecimal    | boolean                                 | true                                                 | Truncate decimals           |
| labels.toFixedDecimal          | labelToFixedDecimal     | number                                  | 0                                                    | Decimal places              |
| labels.labelUnit               | labelUnit               | string                                  | ""                                                   | Value unit                  |
| labels.labelUnitPosition       | labelUnitPosition       | 'start'\|'end'                          | "end"                                                | Unit position               |
| labels.textAnchor              | --                      | 'start'\|'middle'\|'end'                | "middle"                                             | Text anchor position        |
| labels.customLabelFormat       | --                      | Function                                | null                                                 | Custom format function      |

### Map Configuration

| Base Config Path           | Block Attribute           | Type     | Default Value | Description               |
| -------------------------- | ------------------------- | -------- | ------------- | ------------------------- |
| map.ignoreSmallStateLabels | mapIgnoreSmallStateLabels | boolean  | false         | Hide small state labels   |
| map.ignoredLabels          | --                        | string[] | []            | Labels to ignore          |
| map.abbreviateLabels       | mapAbbreviateLabels       | boolean  | true          | Use abbreviated labels    |
| map.blockRectSize          | mapBlockRectSize          | number   | 44            | Block size for block maps |
| map.pathBackgroundFill     | mapPathBackgroundFill     | string   | "#f7f7f7"     | Background fill color     |
| map.pathStroke             | mapPathStroke             | string   | "#d3d3d3"     | Border color              |
| map.showCountyBoundaries   | showCountyBoundaries      | boolean  | false         | Show county borders       |
| map.showStateBoundaries    | mapShowStateBoundaries    | boolean  | true          | Show state borders        |
| map.zoomActive             | --                        | boolean  | false         | Enable map zooming        |

### Custom Chart Configuration

| Base Config Path            | Block Attribute  | Type    | Default Value | Description              |
| --------------------------- | ---------------- | ------- | ------------- | ------------------------ |
| custom.isCustomChart        | isCustomChart    | boolean | false         | Enable custom chart type |
| custom.attributes.chartType | customAttributes | object  | null          | Custom chart attributes  |

## Usage

[Add usage instructions here]

## Development

[Add development setup instructions here]

## License

[Add license information here]

# Changelog

## [3.1.0] - 2024-06-07

### Added
- Admin page for Charts using WordPress DataViews, accessible under the Charts menu as "DataViews". This page provides a searchable, filterable table of all Chart posts with quick links to view and edit.
