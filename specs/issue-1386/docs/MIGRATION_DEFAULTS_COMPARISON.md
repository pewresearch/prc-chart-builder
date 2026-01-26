# Migration Defaults vs block.json Audit

**Date**: December 5, 2025
**Purpose**: Verify all fallback values in v1.js migration match block.json defaults

---

## 🔍 Comparison Results

### ✅ Layout Object

| Property           | block.json Default                              | Migration Default                               | Match?          |
| ------------------ | ----------------------------------------------- | ----------------------------------------------- | --------------- |
| `name`             | `"wp-block-prc-block-chart-builder-controller"` | `'wp-block-prc-block-chart-builder-controller'` | ✅              |
| `type`             | `"bar"`                                         | `'bar'`                                         | ✅              |
| `orientation`      | `"vertical"`                                    | `'horizontal'`                                  | ❌ **MISMATCH** |
| `width`            | `640`                                           | `640`                                           | ✅              |
| `height`           | `400`                                           | `400`                                           | ✅              |
| `padding.top`      | `0`                                             | `20`                                            | ❌ **MISMATCH** |
| `padding.bottom`   | `0`                                             | `25`                                            | ❌ **MISMATCH** |
| `padding.left`     | `0`                                             | `60`                                            | ❌ **MISMATCH** |
| `padding.right`    | `0`                                             | `0`                                             | ✅              |
| `overflowX`        | `"responsive"`                                  | `'responsive'`                                  | ✅              |
| `horizontalRules`  | `true`                                          | `true`                                          | ✅              |
| `mobileBreakpoint` | `480`                                           | `480`                                           | ✅              |

**Issues Found**:

1. ❌ `orientation`: block.json = `"vertical"`, migration = `'horizontal'`
2. ❌ `padding.top`: block.json = `0`, migration = `20`
3. ❌ `padding.bottom`: block.json = `0`, migration = `25`
4. ❌ `padding.left`: block.json = `0`, migration = `60`

---

### ✅ Metadata Object

| Property   | block.json Default      | Migration Default       | Match?          |
| ---------- | ----------------------- | ----------------------- | --------------- |
| `active`   | `false`                 | `true` (via `??`)       | ❌ **MISMATCH** |
| `title`    | `""`                    | `''`                    | ✅              |
| `subtitle` | `""`                    | `''`                    | ✅              |
| `note`     | `""`                    | `''`                    | ✅              |
| `source`   | `""`                    | `''`                    | ✅              |
| `tag`      | `"PEW RESEARCH CENTER"` | `'PEW RESEARCH CENTER'` | ✅              |
| `alt`      | `""`                    | `''`                    | ✅              |

**Issues Found**:

1. ❌ `active`: block.json = `false`, migration = `true` (via `metaTextActive ?? true`)

---

### ✅ Independent Axis

| Property                    | block.json Default        | Migration Default         | Match?          |
| --------------------------- | ------------------------- | ------------------------- | --------------- |
| `active`                    | `true`                    | `true`                    | ✅              |
| `label`                     | `""`                      | `''`                      | ✅              |
| `scale`                     | `"linear"`                | `'linear'`                | ✅              |
| `dateFormat`                | `"%-m/%Y"`                | `'%-m/%Y'`                | ✅              |
| `domain`                    | `[0, 100]`                | `[0, 100]`                | ✅              |
| `domainPadding`             | `20`                      | `20`                      | ✅              |
| `showZero`                  | `false`                   | `false`                   | ✅              |
| `padding`                   | `60`                      | `60`                      | ✅              |
| `tickMarksActive`           | `true`                    | `true`                    | ✅              |
| `tickCount`                 | `5`                       | `5`                       | ✅              |
| `tickValues`                | `null`                    | `null`                    | ✅              |
| `tickFormat`                | `null`                    | `null`                    | ✅              |
| `ticksToLocaleString`       | `false`                   | `false`                   | ✅              |
| `abbreviateTicks`           | `false`                   | `false`                   | ✅              |
| `abbreviateTicksDecimals`   | `0`                       | `0`                       | ✅              |
| `tickUnit`                  | `""`                      | `''`                      | ✅              |
| `tickUnitPosition`          | `"end"`                   | `'end'`                   | ✅              |
| `tickLabels.fontSize`       | `12`                      | `12`                      | ✅              |
| `tickLabels.padding`        | `0`                       | `0`                       | ✅              |
| `tickLabels.angle`          | `0`                       | `0`                       | ✅              |
| `tickLabels.dx`             | `0`                       | `0`                       | ✅              |
| `tickLabels.dy`             | `0`                       | `0`                       | ✅              |
| `tickLabels.textAnchor`     | `"middle"`                | `'middle'`                | ✅              |
| `tickLabels.verticalAnchor` | `"start"`                 | `'start'`                 | ✅              |
| `tickLabels.fill`           | `"rgba(35, 31, 32, 0.7)"` | `'rgba(35, 31, 32, 0.7)'` | ✅              |
| `tickLabels.maxWidth`       | `50`                      | `50`                      | ✅              |
| `axisLabel.fontSize`        | `12`                      | `12`                      | ✅              |
| `axisLabel.fill`            | `"rgba(35, 31, 32, 0.7)"` | `'rgba(35, 31, 32, 0.7)'` | ✅              |
| `axisLabel.padding`         | `15`                      | `15`                      | ✅              |
| `axisLabel.maxWidth`        | `200`                     | `200`                     | ✅              |
| `axis.stroke`               | `"gray"`                  | `'gray'`                  | ✅              |
| `axis.strokeWidth`          | `1`                       | `1`                       | ✅              |
| `ticks.stroke`              | `"gray"`                  | `'gray'`                  | ✅              |
| `ticks.size`                | `5`                       | `5` (conditional)         | ✅              |
| `ticks.strokeWidth`         | `0`                       | `1`                       | ❌ **MISMATCH** |
| `grid.stroke`               | `""`                      | `''`                      | ✅              |
| `grid.strokeOpacity`        | `1`                       | `1`                       | ✅              |
| `grid.strokeWidth`          | `2`                       | `1`                       | ❌ **MISMATCH** |
| `grid.strokeDasharray`      | `".3,6"`                  | `''`                      | ❌ **MISMATCH** |

**Issues Found**:

1. ❌ `ticks.strokeWidth`: block.json = `0`, migration = `1`
2. ❌ `grid.strokeWidth`: block.json = `2`, migration = `1`
3. ❌ `grid.strokeDasharray`: block.json = `".3,6"`, migration = `''` (but this is intentional - we preserve empty strings)

---

### ✅ Dependent Axis

| Property                    | block.json Default        | Migration Default         | Match?          |
| --------------------------- | ------------------------- | ------------------------- | --------------- |
| `active`                    | `true`                    | `true`                    | ✅              |
| `label`                     | `""`                      | `''`                      | ✅              |
| `scale`                     | `"linear"`                | `'linear'`                | ✅              |
| `domain`                    | `[0, 100]`                | `[0, 100]`                | ✅              |
| `showZero`                  | `false`                   | `false`                   | ✅              |
| `tickMarksActive`           | `true`                    | `true`                    | ✅              |
| `tickCount`                 | `5`                       | `5`                       | ✅              |
| `tickValues`                | `null`                    | `null`                    | ✅              |
| `tickFormat`                | `null`                    | `null`                    | ✅              |
| `tickAngle`                 | `0`                       | `0`                       | ✅              |
| `ticksToLocaleString`       | `false`                   | `false`                   | ✅              |
| `abbreviateTicks`           | `true`                    | `true`                    | ✅              |
| `abbreviateTicksDecimals`   | `0`                       | `0`                       | ✅              |
| `tickUnit`                  | `""`                      | `''`                      | ✅              |
| `tickUnitPosition`          | `"end"`                   | `'end'`                   | ✅              |
| `tickLabels.fontSize`       | `12`                      | `12`                      | ✅              |
| `tickLabels.padding`        | `15`                      | `15`                      | ✅              |
| `tickLabels.angle`          | `0`                       | `0`                       | ✅              |
| `tickLabels.dx`             | `0`                       | `0`                       | ✅              |
| `tickLabels.dy`             | `0`                       | `0`                       | ✅              |
| `tickLabels.textAnchor`     | `"end"`                   | `'end'`                   | ✅              |
| `tickLabels.verticalAnchor` | `"middle"`                | `'middle'`                | ✅              |
| `tickLabels.fill`           | `"rgba(35, 31, 32, 0.7)"` | `'rgba(35, 31, 32, 0.7)'` | ✅              |
| `tickLabels.maxWidth`       | `50`                      | `50`                      | ✅              |
| `axisLabel.fontSize`        | `12`                      | `12`                      | ✅              |
| `axisLabel.fill`            | `"rgba(35, 31, 32, 0.7)"` | `'rgba(35, 31, 32, 0.7)'` | ✅              |
| `axisLabel.padding`         | `30`                      | `30`                      | ✅              |
| `axisLabel.angle`           | `270`                     | `270`                     | ✅              |
| `axisLabel.maxWidth`        | `200`                     | `200`                     | ✅              |
| `axis.stroke`               | `"gray"`                  | `'gray'`                  | ✅              |
| `axis.strokeWidth`          | `1`                       | `1`                       | ✅              |
| `ticks.stroke`              | `"gray"`                  | `'gray'`                  | ✅              |
| `ticks.size`                | `5`                       | `5` (conditional)         | ✅              |
| `ticks.strokeWidth`         | `0`                       | `1`                       | ❌ **MISMATCH** |
| `grid.stroke`               | `""`                      | `''`                      | ✅              |
| `grid.strokeOpacity`        | `1`                       | `1`                       | ✅              |
| `grid.strokeWidth`          | `1`                       | `1`                       | ✅              |
| `grid.strokeDasharray`      | `""`                      | `''`                      | ✅              |

**Issues Found**:

1. ❌ `ticks.strokeWidth`: block.json = `0`, migration = `1`

---

### ✅ Tooltip Object

| Property                | block.json Default     | Migration Default        | Match?             |
| ----------------------- | ---------------------- | ------------------------ | ------------------ |
| `active`                | `true`                 | `true`                   | ✅                 |
| `activeOnMobile`        | `true`                 | `true`                   | ✅                 |
| `headerActive`          | `true`                 | `true`                   | ✅                 |
| `headerValue`           | `"independentValue"`   | `'independentValue'`     | ✅                 |
| `format`                | `"{{row}}: {{value}}"` | `'{{row}}: {{value}}'`   | ✅                 |
| `offsetX`               | `10`                   | `10`                     | ✅                 |
| `offsetY`               | `10`                   | `10`                     | ✅                 |
| `abbreviateValue`       | `false`                | `false`                  | ✅                 |
| `absoluteValue`         | `false`                | `false`                  | ✅                 |
| `toFixedDecimal`        | `0`                    | `0`                      | ✅                 |
| `toLocaleString`        | `true`                 | `true`                   | ✅                 |
| `customFormat`          | `null`                 | `null`                   | ✅                 |
| `rlsFormat`             | `false`                | `false`                  | ✅                 |
| `dateFormat`            | `"%-m/%Y"`             | `'%-m/%Y'`               | ✅                 |
| `caretPosition`         | `"bottom"`             | `undefined` (no default) | ⚠️ **INTENTIONAL** |
| `deemphasizeSiblings`   | `false`                | `false`                  | ✅                 |
| `deemphasizeOpacity`    | `0.5`                  | `0.5`                    | ✅                 |
| `emphasizeStrokeActive` | `false`                | `false`                  | ✅                 |
| `emphasizeStrokeColor`  | `"black"`              | `'black'`                | ✅                 |
| `emphasizeStrokeWidth`  | `1`                    | `1`                      | ✅                 |
| `style.minWidth`        | `50`                   | `50`                     | ✅                 |
| `style.maxWidth`        | `150`                  | `150`                    | ✅                 |
| `style.maxHeight`       | `400`                  | `400`                    | ✅                 |
| `style.minHeight`       | `20`                   | `20`                     | ✅                 |
| `style.fontSize`        | `"13px"`               | `'13px'`                 | ✅                 |
| `style.border`          | `"1px solid black"`    | `'1px solid black'`      | ✅                 |
| `style.borderRadius`    | `"5px"`                | `'5px'`                  | ✅                 |

**Issues Found**:

- ⚠️ `caretPosition`: Intentionally no default in migration (we removed it earlier)

---

### ✅ Legend Object

| Property         | block.json Default                | Migration Default                 | Match?             |
| ---------------- | --------------------------------- | --------------------------------- | ------------------ |
| `active`         | `false`                           | `false`                           | ✅                 |
| `orientation`    | `"row"`                           | `'row'`                           | ✅                 |
| `title`          | `""`                              | `''`                              | ✅                 |
| `alignment`      | `"center"`                        | `'center'`                        | ✅                 |
| `offsetX`        | `0`                               | `0`                               | ✅                 |
| `offsetY`        | `0`                               | `0`                               | ✅                 |
| `markerStyle`    | `"rect"`                          | `'rect'`                          | ✅                 |
| `borderStroke`   | `""`                              | `undefined` (no default)          | ⚠️ **INTENTIONAL** |
| `fill`           | `""`                              | `undefined` (no default)          | ⚠️ **INTENTIONAL** |
| `categories`     | `[]`                              | `[]`                              | ✅                 |
| `labelDelimiter` | `"to"`                            | `'to'`                            | ✅                 |
| `labelLower`     | `"Less than "`                    | `'Less than '`                    | ✅                 |
| `labelUpper`     | `"More than "`                    | `'More than '`                    | ✅                 |
| `fontSize`       | `12`                              | `12`                              | ✅                 |
| `margin`         | `{top:0,right:5,bottom:0,left:0}` | `{top:0,right:5,bottom:0,left:0}` | ✅                 |

**Issues Found**:

- ⚠️ `borderStroke` and `fill`: Intentionally no default in migration (we removed them earlier)

---

### ✅ Labels Object

| Property                  | block.json Default | Migration Default        | Match?             |
| ------------------------- | ------------------ | ------------------------ | ------------------ |
| `active`                  | `false`            | `false`                  | ✅                 |
| `showFirstLastPointsOnly` | `false`            | `false`                  | ✅                 |
| `color`                   | `"inherit"`        | `undefined` (no default) | ⚠️ **INTENTIONAL** |
| `fontWeight`              | `200`              | `200`                    | ✅                 |
| `fontSize`                | `12`               | `12`                     | ✅                 |
| `labelPositionBar`        | `"inside"`         | `'inside'`               | ✅                 |
| `labelCutoff`             | `5`                | `5`                      | ✅                 |
| `labelCutoffMobile`       | `10`               | `10`                     | ✅                 |
| `labelPositionDX`         | `-25`              | `-25`                    | ✅                 |
| `labelPositionDY`         | `0`                | `0`                      | ✅                 |
| `pieLabelRadius`          | `60`               | `60`                     | ✅                 |
| `abbreviateValue`         | `false`            | `false`                  | ✅                 |
| `absoluteValue`           | `false`            | `false`                  | ✅                 |
| `toLocaleString`          | `true`             | `true`                   | ✅                 |
| `truncateDecimal`         | `true`             | `true`                   | ✅                 |
| `toFixedDecimal`          | `0`                | `0`                      | ✅                 |
| `labelUnit`               | `""`               | `''`                     | ✅                 |
| `labelUnitPosition`       | `"end"`            | `'end'`                  | ✅                 |
| `textAnchor`              | `"middle"`         | `'middle'`               | ✅                 |
| `customLabelFormat`       | `null`             | `null`                   | ✅                 |

**Issues Found**:

- ⚠️ `color`: Intentionally no default in migration (we removed it earlier)

---

### ✅ Bar Object

| Property          | block.json Default | Migration Default | Match? |
| ----------------- | ------------------ | ----------------- | ------ |
| `barPadding`      | `0.2`              | `0.2`             | ✅     |
| `barGroupPadding` | `0.2`              | `0.2`             | ✅     |
| `hasRectStroke`   | `false`            | `false`           | ✅     |
| `stackOffset`     | `"none"`           | `'none'`          | ✅     |

---

### ✅ Line Object

| Property          | block.json Default | Migration Default               | Match? |
| ----------------- | ------------------ | ------------------------------- | ------ |
| `interpolation`   | `"curveLinear"`    | `'curveLinear'`                 | ✅     |
| `strokeDasharray` | `""`               | `''`                            | ✅     |
| `strokeWidth`     | `3`                | `3`                             | ✅     |
| `showPoints`      | `true`             | `true`                          | ✅     |
| `showArea`        | `false`            | `false` (or true if area chart) | ✅     |
| `areaFillOpacity` | `0.4`              | `0.4`                           | ✅     |

---

### ✅ Other Objects

**Dot Plot, Pie, Nodes, Map, Diverging Bar, Diff Column, Annotations, Data Render, Animate, IO**: All match ✅

---

## 🔧 Required Fixes

### Critical Mismatches (Should Match block.json):

1. **layout.orientation**: `'horizontal'` → `'vertical'`
2. **layout.padding.top**: `20` → `0`
3. **layout.padding.bottom**: `25` → `0`
4. **layout.padding.left**: `60` → `0`
5. **metadata.active**: `true` → `false`
6. **independentAxis.ticks.strokeWidth**: `1` → `0`
7. **independentAxis.grid.strokeWidth**: `1` → `2`
8. **dependentAxis.ticks.strokeWidth**: `1` → `0`

### Intentional Differences (OK to keep):

- `tooltip.caretPosition`: No default (intentional)
- `legend.borderStroke`: No default (intentional)
- `legend.fill`: No default (intentional)
- `labels.color`: No default (intentional)
- `grid.strokeDasharray`: Empty string preserved (intentional)

---

**Next Steps**: Fix the 8 critical mismatches listed above.
