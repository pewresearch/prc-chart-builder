# Default Value Inconsistencies: v1 vs v2

**Date**: December 2025
**Purpose**: List of default value mismatches between `block_v1.json` and `block.json` that cause unexpected migrations

---

## 🔴 CRITICAL INCONSISTENCIES

### Layout Padding (Major Visual Impact)

| v1 Attribute    | v1 Default | v2 Path                 | v2 Default | Status          |
| --------------- | ---------- | ----------------------- | ---------- | --------------- |
| `paddingTop`    | `20`       | `layout.padding.top`    | `0`        | ❌ **MISMATCH** |
| `paddingLeft`   | `60`       | `layout.padding.left`   | `0`        | ❌ **MISMATCH** |
| `paddingBottom` | `25`       | `layout.padding.bottom` | `0`        | ❌ **MISMATCH** |
| `paddingRight`  | `0`        | `layout.padding.right`  | `0`        | ✅ Match        |

**Impact**: Charts will lose their padding when migrating, causing visual layout issues.

---

### Independent Axis (X-axis) - Tick Marks

| v1 Attribute       | v1 Default | v2 Path                           | v2 Default | Status          |
| ------------------ | ---------- | --------------------------------- | ---------- | --------------- |
| `xTickMarksActive` | `false`    | `independentAxis.tickMarksActive` | `true`     | ❌ **MISMATCH** |

**Impact**: Tick marks will appear when they shouldn't (or vice versa), changing chart appearance.

---

### Independent Axis (X-axis) - Label Configuration

| v1 Attribute               | v1 Default  | v2 Path                                     | v2 Default                | Status                   |
| -------------------------- | ----------- | ------------------------------------------- | ------------------------- | ------------------------ |
| `xLabelPadding`            | `30`        | `independentAxis.padding`                   | `60`                      | ❌ **MISMATCH**          |
| `xLabelMaxWidth`           | `100`       | `independentAxis.axisLabel.maxWidth`        | `200`                     | ❌ **MISMATCH**          |
| `xLabelTextFill`           | `"#231F20"` | `independentAxis.axisLabel.fill`            | `"rgba(35, 31, 32, 0.7)"` | ⚠️ **FORMAT DIFFERENCE** |
| `xLabelTextFill`           | `"#231F20"` | `independentAxis.tickLabels.fill`           | `"rgba(35, 31, 32, 0.7)"` | ⚠️ **FORMAT DIFFERENCE** |
| `xTickLabelVerticalAnchor` | `"end"`     | `independentAxis.tickLabels.verticalAnchor` | `"start"`                 | ❌ **MISMATCH**          |
| `showXMinDomainLabel`      | `true`      | `independentAxis.showZero`                  | `false`                   | ❌ **MISMATCH**          |

**Impact**: Label positioning, sizing, and visibility will change unexpectedly.

---

### Independent Axis (X-axis) - Date Format

| v1 Attribute  | v1 Default | v2 Path                      | v2 Default | Status          |
| ------------- | ---------- | ---------------------------- | ---------- | --------------- |
| `xDateFormat` | `"%Y"`     | `independentAxis.dateFormat` | `"%-m/%Y"` | ❌ **MISMATCH** |

**Impact**: Date formatting will change from "2025" to "1/2025" format.

---

### Independent Axis (X-axis) - Axis & Grid Styling

| v1 Attribute   | v1 Default  | v2 Path                              | v2 Default | Status          |
| -------------- | ----------- | ------------------------------------ | ---------- | --------------- |
| `xAxisStroke`  | `"#756f6a"` | `independentAxis.axis.stroke`        | `"gray"`   | ❌ **MISMATCH** |
| `xAxisStroke`  | `"#756f6a"` | `independentAxis.ticks.stroke`       | `"gray"`   | ❌ **MISMATCH** |
| `xGridOpacity` | `0.2`       | `independentAxis.grid.strokeOpacity` | `1`        | ❌ **MISMATCH** |

**Impact**: Axis and grid lines will have different colors and opacity.

---

### Dependent Axis (Y-axis) - Grid Styling

| v1 Attribute   | v1 Default | v2 Path                            | v2 Default | Status          |
| -------------- | ---------- | ---------------------------------- | ---------- | --------------- |
| `yGridOpacity` | `0.2`      | `dependentAxis.grid.strokeOpacity` | `1`        | ❌ **MISMATCH** |

**Impact**: Y-axis grid lines will be more opaque than expected.

---

### Dependent Axis (Y-axis) - Axis Styling

| v1 Attribute  | v1 Default  | v2 Path                      | v2 Default | Status          |
| ------------- | ----------- | ---------------------------- | ---------- | --------------- |
| `yAxisStroke` | `"#756f6a"` | `dependentAxis.axis.stroke`  | `"gray"`   | ❌ **MISMATCH** |
| `yAxisStroke` | `"#756f6a"` | `dependentAxis.ticks.stroke` | `"gray"`   | ❌ **MISMATCH** |

**Impact**: Y-axis lines will have different color.

---

### Metadata - Source Text

| v1 Attribute | v1 Default                       | v2 Path           | v2 Default                    | Status          |
| ------------ | -------------------------------- | ----------------- | ----------------------------- | --------------- |
| `metaSource` | `"Source: This is your source."` | `metadata.source` | `"Source: this is a source."` | ❌ **MISMATCH** |

**Impact**: Default source text will change (minor, but inconsistent).

---

### Tooltip - Header Value

| v1 Attribute         | v1 Default        | v2 Path               | v2 Default           | Status          |
| -------------------- | ----------------- | --------------------- | -------------------- | --------------- |
| `tooltipHeaderValue` | `"categoryValue"` | `tooltip.headerValue` | `"independentValue"` | ❌ **MISMATCH** |

**Impact**: Tooltip header will show different values by default.

---

### Tooltip - Max Width/Height

| v1 Attribute       | v1 Default | v2 Path                   | v2 Default | Status          |
| ------------------ | ---------- | ------------------------- | ---------- | --------------- |
| `tooltipMaxWidth`  | `200`      | `tooltip.style.maxWidth`  | `150`      | ❌ **MISMATCH** |
| `tooltipMaxHeight` | `100`      | `tooltip.style.maxHeight` | `400`      | ❌ **MISMATCH** |

**Impact**: Tooltip size constraints will change.

---

### Labels - Cutoff Values

| v1 Attribute           | v1 Default | v2 Path                    | v2 Default | Status          |
| ---------------------- | ---------- | -------------------------- | ---------- | --------------- |
| `barLabelCutoff`       | `10`       | `labels.labelCutoff`       | `5`        | ❌ **MISMATCH** |
| `barLabelCutoffMobile` | `5`        | `labels.labelCutoffMobile` | `10`       | ❌ **MISMATCH** |
| `labelCutoff`          | `10`       | (not in v2)                | N/A        | ⚠️ **MISSING**  |
| `labelToFixedDecimal`  | `3`        | `labels.toFixedDecimal`    | `0`        | ❌ **MISMATCH** |
| `labelFontSize`        | `10`       | `labels.fontSize`          | `12`       | ❌ **MISMATCH** |

**Impact**: Label visibility thresholds and formatting will change.

---

### Data Render - Sort Configuration

| v1 Attribute | v1 Default | v2 Path                | v2 Default    | Status          |
| ------------ | ---------- | ---------------------- | ------------- | --------------- |
| `sortOrder`  | `"none"`   | `dataRender.sortOrder` | `"ascending"` | ❌ **MISMATCH** |
| `sortKey`    | `"x"`      | `dataRender.sortKey`   | `"y"`         | ❌ **MISMATCH** |

**Impact**: Data sorting behavior will change by default.

---

### Map - County Boundaries

| v1 Attribute           | v1 Default | v2 Path                    | v2 Default | Status          |
| ---------------------- | ---------- | -------------------------- | ---------- | --------------- |
| `showCountyBoundaries` | `true`     | `map.showCountyBoundaries` | `false`    | ❌ **MISMATCH** |

**Impact**: County boundaries will be hidden by default in v2.

---

### Diverging Bar - Neutral Bar Active

| v1 Attribute       | v1 Default | v2 Path                          | v2 Default | Status          |
| ------------------ | ---------- | -------------------------------- | ---------- | --------------- |
| `neutralBarActive` | `true`     | `divergingBar.neutralBar.active` | `false`    | ❌ **MISMATCH** |

**Impact**: Neutral bar will be hidden by default in v2.

---

### Independent Axis - axisLabel.textAnchor

| v1 Attribute | v1 Default | v2 Path                                | v2 Default | Status             |
| ------------ | ---------- | -------------------------------------- | ---------- | ------------------ |
| (not in v1)  | N/A        | `independentAxis.axisLabel.textAnchor` | `"end"`    | ⚠️ **NEW DEFAULT** |

**Note**: v1 didn't have this property, but v2 defaults to `"end"`. Need to verify what v1 behavior was.

---

## 📊 Summary

**Total Inconsistencies Found**: 25+

**Categories**:

- **Layout**: 3 padding mismatches (critical)
- **Independent Axis**: 10+ mismatches (critical)
- **Dependent Axis**: 3 mismatches
- **Metadata**: 1 mismatch (minor)
- **Tooltip**: 3 mismatches
- **Labels**: 5 mismatches
- **Data Render**: 2 mismatches
- **Map**: 1 mismatch
- **Diverging Bar**: 1 mismatch

---

## 🎯 Recommended Actions

1. **Update v2 defaults** to match v1 defaults for all mismatched values
2. **Verify migration code** uses v1 defaults when values are not set
3. **Test migration** with actual v1 charts to ensure visual parity
4. **Document** any intentional changes (if defaults were intentionally changed)

---

## ⚠️ Notes

- Color format differences (`#231F20` vs `rgba(35, 31, 32, 0.7)`) are functionally equivalent but should be consistent
- Some v2 defaults may be intentional improvements, but they should be documented
- Missing attributes in v2 (like `labelCutoff`) need to be handled in migration
