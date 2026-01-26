# Flat Keys Analysis - block.json

## Summary

This analysis identifies flat keys in `block.json` that were remapped to nested objects but were left behind as top-level attributes.

## Keys That Should Be Removed (Mapped to Nested Objects)

### Layout Object (lines 15-32)

These should be removed - they're in `layout` object:

- `width` (line 572) → `layout.width`
- `height` (line 576) → `layout.height`
- `paddingTop` (line 598) → `layout.padding.top`
- `paddingLeft` (line 602) → `layout.padding.left`
- `paddingBottom` (line 606) → `layout.padding.bottom`
- `paddingRight` (line 610) → `layout.padding.right`
- `overflowX` (line 580) → `layout.overflowX`
- `horizontalRules` (line 594) → `layout.horizontalRules`
- `mobileBreakpoint` (line 590) → `layout.mobileBreakpoint`
- `parentClass` (line 493) → `io.parentClass` (also in io object)

### Metadata Object (lines 34-44)

These should be removed - they're in `metadata` object:

- `metaTextActive` (line 1281) → `metadata.active`
- `metaTitle` (line 1285) → `metadata.title`
- `metaSubtitle` (line 1289) → `metadata.subtitle`
- `metaNote` (line 1300) → `metadata.note`
- `metaSource` (line 1304) → `metadata.source`
- `metaTag` (line 1308) → `metadata.tag`
- `metaAlt` (line 1312) → `metadata.alt`

### Independent Axis (X-axis) Object (lines 67-126)

These should be removed - they're in `independentAxis` object:

- `xAxisActive` (line 665) → `independentAxis.active`
- `xLabel` (line 669) → `independentAxis.label`
- `xScale` (line 768) → `independentAxis.scale`
- `xDateFormat` (line 773) → `independentAxis.dateFormat`
- `xMinDomain` (line 689) → `independentAxis.domain[0]`
- `xMaxDomain` (line 693) → `independentAxis.domain[1]`
- `showXMinDomainLabel` (line 697) → `independentAxis.showZero`
- `xLabelPadding` (line 681) → `independentAxis.padding`
- `xTickLabelAngle` (line 722) → `independentAxis.tickLabels.angle`
- `xTickNum` (line 705) → `independentAxis.tickCount`
- `xTickExact` (line 709) → `independentAxis.tickValues`
- `xTicksToLocaleString` (line 756) → `independentAxis.ticksToLocaleString`
- `xAbbreviateTicks` (line 748) → `independentAxis.abbreviateTicks`
- `xAbbreviateTicksDecimals` (line 752) → `independentAxis.abbreviateTicksDecimals`
- `xTickUnit` (line 713) → `independentAxis.tickUnit`
- `xTickUnitPosition` (line 717) → `independentAxis.tickUnitPosition`
- `xLabelFontSize` (line 677) → `independentAxis.tickLabels.fontSize` and `independentAxis.axisLabel.fontSize`
- `xLabelTextFill` (line 685) → `independentAxis.tickLabels.fill` and `independentAxis.axisLabel.fill`
- `xTickLabelMaxWidth` (line 726) → `independentAxis.tickLabels.maxWidth`
- `xTickLabelDX` (line 744) → `independentAxis.tickLabels.dx`
- `xTickLabelDY` (line 740) → `independentAxis.tickLabels.dy`
- `xTickLabelTextAnchor` (line 730) → `independentAxis.tickLabels.textAnchor`
- `xTickLabelVerticalAnchor` (line 735) → `independentAxis.tickLabels.verticalAnchor`
- `xTickMarksActive` (line 701) → `independentAxis.tickMarksActive`
- `xAxisStroke` (line 800) → `independentAxis.axis.stroke` and `independentAxis.ticks.stroke`
- `xGridStroke` (line 804) → `independentAxis.grid.stroke`
- `xGridStrokeDasharray` (line 808) → `independentAxis.grid.strokeDasharray`
- `xGridOpacity` (line 812) → `independentAxis.grid.strokeOpacity`
- `xLabelMaxWidth` (line 673) → `independentAxis.axisLabel.maxWidth`
- `xMultiLineTickLabels` (line 760) → (not in nested object, may be new feature)
- `xMultiLineTickLabelsBreak` (line 764) → (not in nested object, may be new feature)

### Dependent Axis (Y-axis) Object (lines 128-185)

These should be removed - they're in `dependentAxis` object:

- `yAxisActive` (line 832) → `dependentAxis.active`
- `yLabel` (line 836) → `dependentAxis.label`
- `yScale` (line 856) → `dependentAxis.scale`
- `yMinDomain` (line 865) → `dependentAxis.domain[0]`
- `yMaxDomain` (line 869) → `dependentAxis.domain[1]`
- `showYMinDomainLabel` (line 873) → `dependentAxis.showZero`
- `yTickNum` (line 881) → `dependentAxis.tickCount`
- `yTickExact` (line 885) → `dependentAxis.tickValues`
- `yTicksToLocaleString` (line 932) → `dependentAxis.ticksToLocaleString`
- `yAbbreviateTicks` (line 924) → `dependentAxis.abbreviateTicks`
- `yAbbreviateTicksDecimals` (line 928) → `dependentAxis.abbreviateTicksDecimals`
- `yTickUnit` (line 889) → `dependentAxis.tickUnit`
- `yTickUnitPosition` (line 893) → `dependentAxis.tickUnitPosition`
- `yLabelFontSize` (line 840) → `dependentAxis.tickLabels.fontSize` and `dependentAxis.axisLabel.fontSize`
- `yLabelTextFill` (line 844) → `dependentAxis.tickLabels.fill` and `dependentAxis.axisLabel.fill`
- `yTickLabelMaxWidth` (line 902) → `dependentAxis.tickLabels.maxWidth`
- `yTickLabelDX` (line 920) → `dependentAxis.tickLabels.dx`
- `yTickLabelDY` (line 916) → `dependentAxis.tickLabels.dy`
- `yTickLabelTextAnchor` (line 906) → `dependentAxis.tickLabels.textAnchor`
- `yTickLabelVerticalAnchor` (line 911) → `dependentAxis.tickLabels.verticalAnchor`
- `yTickMarksActive` (line 877) → `dependentAxis.tickMarksActive`
- `yAxisStroke` (line 816) → `dependentAxis.axis.stroke` and `dependentAxis.ticks.stroke`
- `yGridStroke` (line 820) → `dependentAxis.grid.stroke`
- `yGridStrokeDasharray` (line 824) → `dependentAxis.grid.strokeDasharray`
- `yGridOpacity` (line 828) → `dependentAxis.grid.strokeOpacity`
- `yLabelPadding` (line 848) → `dependentAxis.axisLabel.padding`
- `yLabelMaxWidth` (line 852) → `dependentAxis.axisLabel.maxWidth`
- `yTickLabelAngle` (line 898) → `dependentAxis.tickLabels.angle`
- `yScaleFormat` (line 861) → (not in nested object, may be deprecated or new)
- `yMultiLineTickLabels` (line 936) → (not in nested object, may be new feature)
- `yMultiLineTickLabelsBreak` (line 940) → (not in nested object, may be new feature)

### Tooltip Object (lines 187-225)

These should be removed - they're in `tooltip` object:

- `tooltipActive` (line 1050) → `tooltip.active`
- `tooltipActiveOnMobile` (line 1054) → `tooltip.activeOnMobile`
- `tooltipHeaderActive` (line 1098) → `tooltip.headerActive`
- `tooltipHeaderValue` (line 1102) → `tooltip.headerValue`
- `tooltipFormat` (line 1119) → `tooltip.format`
- `tooltipOffsetX` (line 1107) → `tooltip.offsetX`
- `tooltipOffsetY` (line 1111) → `tooltip.offsetY`
- `tooltipFormatValue` (line 1123) → `tooltip.toLocaleString`
- `tooltipAbsoluteValue` (line 1127) → `tooltip.absoluteValue`
- `tooltipDateFormat` (line 1131) → `tooltip.dateFormat`
- `tooltipCaretPosition` (line 1115) → `tooltip.caretPosition`
- `deemphasizeSiblings` (line 1058) → `tooltip.deemphasizeSiblings`
- `deemphasizeOpacity` (line 1062) → `tooltip.deemphasizeOpacity`
- `emphasizeStrokeActive` (line 1066) → `tooltip.emphasizeStrokeActive`
- `emphasizeStrokeColor` (line 1070) → `tooltip.emphasizeStrokeColor`
- `emphasizeStrokeWidth` (line 1074) → `tooltip.emphasizeStrokeWidth`
- `tooltipMinWidth` (line 1090) → `tooltip.style.minWidth`
- `tooltipMaxWidth` (line 1082) → `tooltip.style.maxWidth`
- `tooltipMaxHeight` (line 1078) → `tooltip.style.maxHeight`
- `tooltipMinHeight` (line 1086) → `tooltip.style.minHeight`
- `tooltipFontSize` (line 1094) → `tooltip.style.fontSize`

### Legend Object (lines 227-250)

These should be removed - they're in `legend` object:

- `legendActive` (line 1215) → `legend.active`
- `legendOrientation` (line 1223) → `legend.orientation`
- `legendTitle` (line 1228) → `legend.title`
- `legendAlignment` (line 1232) → `legend.alignment`
- `legendOffsetX` (line 1237) → `legend.offsetX`
- `legendOffsetY` (line 1241) → `legend.offsetY`
- `legendMarkerStyle` (line 1245) → `legend.markerStyle`
- `legendBorderStroke` (line 1250) → `legend.borderStroke`
- `legendFill` (line 1253) → `legend.fill`
- `legendCategories` (line 1219) → `legend.categories`
- `legendLabelDelimiter` (line 1269) → `legend.labelDelimiter`
- `legendLabelLower` (line 1273) → `legend.labelLower`
- `legendLabelUpper` (line 1277) → `legend.labelUpper`
- `legendFontSize` (line 1256) → `legend.fontSize`
- `legendMargin` (line 1260) → `legend.margin`

### Labels Object (lines 252-276)

These should be removed - they're in `labels` object:

- `labelsActive` (line 1158) → `labels.active`
- `showFirstLastPointsOnly` (line 1162) → `labels.showFirstLastPointsOnly`
- `labelColor` (line 1203) → `labels.color`
- `labelFontWeight` (line 1211) → `labels.fontWeight`
- `labelFontSize` (line 1207) → `labels.fontSize`
- `barLabelPosition` (line 952) → `labels.labelPositionBar`
- `barLabelCutoff` (line 957) → `labels.labelCutoff`
- `barLabelCutoffMobile` (line 961) → `labels.labelCutoffMobile`
- `labelPositionDX` (line 1166) → `labels.labelPositionDX`
- `labelPositionDY` (line 1170) → `labels.labelPositionDY`
- `labelAbsoluteValue` (line 1178) → `labels.absoluteValue`
- `labelFormatValue` (line 1182) → `labels.toLocaleString`
- `labelTruncateDecimal` (line 1186) → `labels.truncateDecimal`
- `labelToFixedDecimal` (line 1190) → `labels.toFixedDecimal`
- `labelUnit` (line 1194) → `labels.labelUnit`
- `labelUnitPosition` (line 1198) → `labels.labelUnitPosition`
- `labelCutoff` (line 1174) → (duplicate of barLabelCutoff, may be legacy)

### Bar Object (lines 278-285)

These should be removed - they're in `bar` object:

- `barPadding` (line 965) → `bar.barPadding`
- `barGroupPadding` (line 969) → `bar.barGroupPadding`
- `elementHasStroke` (line 657) → `bar.hasRectStroke` (also used in pie)

### Line Object (lines 287-298)

These should be removed - they're in `line` object:

- `lineInterpolation` (line 998) → `line.interpolation`
- `lineStrokeWidth` (line 1022) → `line.strokeWidth`
- `lineStrokeDashArray` (line 1026) → `line.strokeDasharray`
- `lineNodes` (line 1030) → `line.showPoints`
- `nodeSize` (line 1034) → `line.pointSize` (also in nodes object)
- `areaFillOpacity` (line 1046) → `line.areaFillOpacity`

### Dot Plot Object (lines 300-310)

These should be removed - they're in `dotPlot` object:

- `dotPlotConnectPoints` (line 1370) → `dotPlot.connectPoints`
- `dotPlotConnectPointsStroke` (line 1374) → `dotPlot.connectingLine.stroke`
- `dotPlotConnectPointsStrokeWidth` (line 1378) → `dotPlot.connectingLine.strokeWidth`
- `dotPlotConnectPointsStrokeDasharray` (line 1382) → `dotPlot.connectingLine.strokeDasharray`

### Exploded Bar Object (lines 312-316)

These should be removed - they're in `explodedBar` object:

- `explodedBarColumnGap` (line 1386) → `explodedBar.columnGap`

### Pie Object (lines 318-329)

These should be removed - they're in `pie` object:

- `pieCategoryLabelsActive` (line 614) → `pie.showCategoryLabels`

### Nodes Object (lines 331-338)

These should be removed - they're in `nodes` object:

- `nodeSize` (line 1034) → `nodes.pointSize` (also in line object)
- `nodeFill` (line 1038) → `nodes.pointFill`
- `nodeStrokeWidth` (line 1042) → `nodes.pointStrokeWidth`

### Map Object (lines 340-360)

These should be removed - they're in `map` object:

- `mapScale` (line 1426) → `map.scale`
- `mapScaleDomain` (line 1431) → `map.scaleDomain`
- `mapIgnoreSmallStateLabels` (line 1439) → `map.ignoreSmallStateLabels`
- `mapPathBackgroundFill` (line 1455) → `map.pathBackgroundFill`
- `mapPathStroke` (line 1459) → `map.pathStroke`
- `mapBlockRectSize` (line 1463) → `map.blockRectSize`
- `showCountyBoundaries` (line 1447) → `map.showCountyBoundaries`
- `mapShowStateBoundaries` (line 1451) → `map.showStateBoundaries`
- `mapProjectionPreset` (line 1467) → `map.projectionPreset`
- `mapTopologyRegion` (line 1488) → `map.topologyRegion`
- `mapCenterLongitude` (line 1509) → `map.centerLongitude`
- `mapCenterLatitude` (line 1513) → `map.centerLatitude`
- `mapRotateLambda` (line 1517) → `map.rotateLambda`
- `mapRotatePhi` (line 1521) → `map.rotatePhi`
- `mapRotateGamma` (line 1525) → `map.rotateGamma`
- `mapCustomScale` (line 1529) → `map.customScale`
- `mapZoomActive` (line 1533) → `map.zoomActive`
- `mapAbbreviateLabels` (line 1435) → (not in nested object, may be new feature)
- `mapIgnoredLabels` (line 1443) → (not in nested object, may be new feature)

### Diverging Bar Object (lines 362-377)

These should be removed - they're in `divergingBar` object:

- `positiveCategories` (line 1338) → `divergingBar.positiveCategories`
- `negativeCategories` (line 1342) → `divergingBar.negativeCategories`
- `neutralCategory` (line 1346) → `divergingBar.neutralBar.category`
- `neutralBarActive` (line 1350) → `divergingBar.neutralBar.active`
- `neutralBarOffsetX` (line 1354) → `divergingBar.neutralBar.offsetX`
- `neutralBarSeparator` (line 1358) → `divergingBar.neutralBar.separator`
- `neutralBarSeparatorOffsetX` (line 1362) → `divergingBar.neutralBar.separatorOffsetX`
- `divergingBarPercentOfInnerWidth` (line 1366) → `divergingBar.percentOfInnerWidth`

### Diff Column Object (lines 379-396)

These should be removed - they're in `diffColumn` object:

- `diffColumnActive` (line 1394) → `diffColumn.active`
- `diffColumnCategory` (line 1398) → `diffColumn.category`
- `diffColumnHeader` (line 1402) → `diffColumn.columnHeader`
- `diffColumnWidth` (line 1406) → `diffColumn.style.width`
- `diffColumnBackgroundColor` (line 1410) → `diffColumn.style.rectFill`
- `diffColumnMarginLeft` (line 1414) → `diffColumn.style.marginLeft`
- `diffColumnHeightOffset` (line 1418) → `diffColumn.style.heightOffset`
- `diffColumnAppearance` (line 1422) → `diffColumn.style.fontWeight` and `diffColumn.style.fontStyle`

### Annotations Object (lines 398-404)

These should be removed - they're in `annotations` object:

- `annotationsActive` (line 948) → `annotations.active`

### Data Render Object (lines 406-438)

These should be removed - they're in `dataRender` object:

- `dataRenderX` (line 618) → `dataRender.x`
- `dataRenderY` (line 622) → `dataRender.y`
- `sortKey` (line 649) → `dataRender.sortKey`
- `sortOrder` (line 644) → `dataRender.sortOrder`
- `categories` (line 1334) → `dataRender.categories`
- `groupBreaksActive` (line 973) → `dataRender.groupBreaksActive`
- `groupBreaksCategory` (line 977) → `dataRender.groupBreaksCategory`
- `groupBreaksCategoryValues` (line 981) → `dataRender.groupBreaksCategoryValues`
- `groupBreaksStyleVariation` (line 985) → `dataRender.groupBreaks.breakStyles.variation`
- `groupBreaksHeight` (line 990) → `dataRender.groupBreaks.breakStyles.height`
- `groupBreaks` (line 994) → `dataRender.groupBreaks` (entire object)

### Plot Bands Object (lines 57-65)

These should be removed - they're in `plotBands` object:

- `plotBandsActive` (line 944) → `plotBands.active`

### IO Object (lines 448-480)

These should be removed - they're in `io` object (except `id` which stays at root):

- `id` (line 490) → **kept at root level** (NOT moved to `io.id`) ✨
- `parentClass` (line 493) → `io.parentClass` (also in layout)
- `isConvertedChart` (line 497) → `io.isConvertedChart`
- `isStaticChart` (line 501) → `io.isStaticChart`
- `isFreeformChart` (line 505) → `io.isFreeformChart`
- `staticImageId` (line 509) → `io.staticImageId`
- `staticImageUrl` (line 512) → `io.staticImageUrl`
- `staticImageInnerHTML` (line 515) → `io.staticImageInnerHTML`
- `chartConverted` (line 518) → `io.chartConverted`
- `chartData` (line 526) → `io.chartData`
- `tableData` (line 529) → `io.tableData`
- `hasPreformattedData` (line 532) → `io.hasPreformattedData`
- `preformattedData` (line 536) → `io.preformattedData`
- `dateInputFormat` (line 626) → `io.dateInputFormat`
- `colorValue` (line 653) → `io.colorValue`
- `tabsActive` (line 661) → `io.tabsActive`
- `elementHasStroke` (line 657) → (used in bar and pie, not directly in io)
- `allowDataDownload` (line 1537) → `io.allowDataDownload`
- `isCustomChart` (line 1541) → `io.isCustomChart`
- `customAttributes` (line 1545) → `io.customAttributes`
- `defaultShouldRender` (line 1549) → `io.defaultShouldRender`
- `lock` (line 1553) → `io.lock` (in migration, but not in nested object default)
- `independentVariable` (line 1330) → `io.independentVariable`
- `availableCategories` (line 1390) → `io.availableCategories`
- `chartFamily` (line 562) → `io.chartFamily`

## Keys That May Be Intentionally Kept

These keys are kept at root level according to the migration file (line 70-72):

- `chartType` - Preserved at root for WordPress (used by get-config.js)
- `chartOrientation` - Preserved at root for WordPress

## Keys That May Be New Features (Not in Migration)

These keys exist in block.json but are not in the migration file's mappedKeys list:

- `xMultiLineTickLabels` (line 760)
- `xMultiLineTickLabelsBreak` (line 764)
- `yMultiLineTickLabels` (line 936)
- `yMultiLineTickLabelsBreak` (line 940)
- `yScaleFormat` (line 861)
- `mapAbbreviateLabels` (line 1435)
- `mapIgnoredLabels` (line 1443)
- `metaQuestionWordingActive` (line 1293)
- `metaQuestionWording` (line 1297)
- `svgUrl` (line 1316)
- `svgId` (line 1320)
- `pngUrl` (line 1323)
- `pngId` (line 1327)
- `test` (line 486)

## Total Count

**Approximately 150+ flat keys** that should be removed from block.json as they've been moved to nested objects.
