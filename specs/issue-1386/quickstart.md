# Quickstart: Working with Nested Block Attributes

**Feature**: issue/1386 | **Audience**: Developers | **Date**: 2025-11-06
**Purpose**: Quick reference for developers working with the new nested attribute structure

## For Developers Adding New Features

### 1. Adding a New Chart Configuration Option

**Scenario**: PRC Charting Library adds `gridStyle` option to `independentAxis` config.

**Step 1**: Check TypeScript definition in PRC Charting Library

```typescript
// In prc-charting-library/src/@prc/charting-utilities/types/independentAxis.ts
export interface IndependentAxis {
	// ... existing props
	gridStyle?: 'solid' | 'dashed' | 'dotted';
}
```

**Step 2**: Add to block.json nested structure

```json
// src/chart/block.json
{
	"attributes": {
		"independentAxis": {
			"type": "object",
			"default": {
				// ... existing props
				"gridStyle": "solid"
			}
		}
	}
}
```

**Step 3**: Access in editor control

```jsx
// src/chart/edit/x-axis-controls.jsx
import { SelectControl } from '@wordpress/components';

export default function IndependentAxisControls({ attributes, setAttributes }) {
	const { independentAxis } = attributes;

	return (
		<SelectControl
			label="Grid Style"
			value={independentAxis.gridStyle}
			options={[
				{ label: 'Solid', value: 'solid' },
				{ label: 'Dashed', value: 'dashed' },
				{ label: 'Dotted', value: 'dotted' },
			]}
			onChange={(gridStyle) =>
				setAttributes({
					independentAxis: {
						...independentAxis,
						gridStyle,
					},
				})
			}
		/>
	);
}
```

**Step 4**: That's it! ✅

No changes needed to `get-config.js` - nested attributes pass directly to charting library.

---

### 2. Updating an Existing Editor Control

**Before (v1 flat)**:

```jsx
// Reading flat attributes
const { xAxisActive, xLabel, xScale } = attributes;

// Updating flat attributes
setAttributes({
	xAxisActive: true,
	xLabel: 'New Label',
});
```

**After (v2 nested)**:

```jsx
// Reading nested attributes
const { independentAxis } = attributes;
const { active, label, scale } = independentAxis;

// Updating nested attributes - MUST spread existing object
setAttributes({
	independentAxis: {
		...independentAxis, // ⚠️ CRITICAL: Don't lose other properties!
		active: true,
		label: 'New Label',
	},
});
```

**Common Pitfall**:

```jsx
// ❌ WRONG - This replaces entire object, losing other properties
setAttributes({
	independentAxis: {
		active: true,
		label: 'New Label',
	},
});

// ✅ CORRECT - Spread to preserve existing properties
setAttributes({
	independentAxis: {
		...independentAxis,
		active: true,
		label: 'New Label',
	},
});
```

---

### 3. Adding a Test Fixture

**Scenario**: Added new "diverging bar with diff column" feature, need to test migration.

**Step 1**: Create fixture file

```bash
touch tests/fixtures/chart-block/v1-diverging-bar-diff-column.json
```

**Step 2**: Define fixture structure

```json
{
	"name": "v1-diverging-bar-diff-column",
	"description": "Diverging bar chart with difference column feature",
	"blockVersion": "v1",
	"chartType": "diverging-bar",
	"featureTags": ["diverging-bar", "diff-column"],
	"serializedContent": "<!-- wp:prc-chart-builder/chart {\"chartType\":\"diverging-bar\",\"positiveCategories\":[\"y1\",\"y2\"],\"negativeCategories\":[\"y3\",\"y4\"],\"diffColumnActive\":true,\"diffColumnCategory\":\"y5\",\"diffColumnHeader\":\"Difference\"} -->\\n<div class=\"wp-block-prc-chart-builder-chart\"></div>\\n<!-- /wp:prc-chart-builder/chart -->",
	"expectedMigratedAttributes": {
		"_version": "v2",
		"layout": {
			"type": "diverging-bar"
		},
		"divergingBar": {
			"positiveCategories": ["y1", "y2"],
			"negativeCategories": ["y3", "y4"]
		},
		"diffColumn": {
			"active": true,
			"category": "y5",
			"columnHeader": "Difference"
		}
	},
	"validationRules": {
		"mustHave": ["divergingBar.positiveCategories", "diffColumn.active"],
		"mustNotHave": ["diffColumnActive", "positiveCategories"]
	}
}
```

**Step 3**: Run tests

```bash
npm test -- tests/integration/block-deprecation.test.js
```

**Step 4**: Verify fixture passes

```
✓ migrates v1-diverging-bar-diff-column correctly (45ms)
```

---

## For Developers Debugging Migration Issues

### Problem: "Block validation failed"

**Symptom**: Opening an old chart shows "This block contains unexpected or invalid content."

**Diagnosis**:

1. Check browser console for migration errors
2. Look for deprecation warnings:

```
Chart Block Migration
├─ Migrated from v1 (flat) to v2 (nested)
├─ Original attributes: { chartType: 'bar', xAxisActive: true, ... }
├─ New attributes: { _version: 'v2', layout: { ... } }
└─ ⚠️ Legacy attributes preserved: { experimentalFeature: true }
```

**Common Causes**:

1. **Missing attribute mapping in migrate function**

```javascript
// ❌ Forgot to map an attribute
migrate(oldAttributes) {
  return {
    layout: {
      type: oldAttributes.chartType,
      width: oldAttributes.width,
      // Missing: height!
    }
  };
}

// ✅ Map all attributes
migrate(oldAttributes) {
  return {
    layout: {
      type: oldAttributes.chartType,
      width: oldAttributes.width,
      height: oldAttributes.height,
    }
  };
}
```

2. **Wrong nesting level**

```javascript
// ❌ Flat structure in nested object
migrate(oldAttributes) {
  return {
    independentAxis: {
      xAxisActive: oldAttributes.xAxisActive,  // Should be 'active'
      xLabel: oldAttributes.xLabel,             // Should be 'label'
    }
  };
}

// ✅ Use correct nested names
migrate(oldAttributes) {
  return {
    independentAxis: {
      active: oldAttributes.xAxisActive,
      label: oldAttributes.xLabel,
    }
  };
}
```

3. **Type mismatch**

```javascript
// ❌ String where array expected
migrate(oldAttributes) {
  return {
    independentAxis: {
      domain: "0,100",  // Should be array
    }
  };
}

// ✅ Correct type
migrate(oldAttributes) {
  return {
    independentAxis: {
      domain: [
        oldAttributes.xMinDomain,
        oldAttributes.xMaxDomain
      ],
    }
  };
}
```

### Problem: "Lost customizations after opening chart"

**Symptom**: Chart opened fine, but custom colors/labels disappeared.

**Diagnosis**: Attribute was lost during migration.

**Fix**: Add missing mapping to `src/chart/deprecations/v1.js`

```javascript
migrate(oldAttributes) {
  return {
    // ... existing mappings
    colors: oldAttributes.customColors || [],  // ← Add this
  };
}
```

**Test**: Create fixture with that specific attribute and verify migration.

---

## For Developers Adding New Nested Objects

### Scenario: Adding `annotations` nested object

**Step 1**: Define in block.json

```json
{
	"attributes": {
		"annotations": {
			"type": "object",
			"default": {
				"active": false,
				"activeOnMobile": false,
				"items": []
			}
		}
	}
}
```

**Step 2**: Update deprecation migrate function

```javascript
// src/chart/deprecations/v1.js
migrate(oldAttributes) {
  return {
    // ... existing nested objects
    annotations: {
      active: oldAttributes.annotationsActive || false,
      activeOnMobile: oldAttributes.annotationsActiveOnMobile || false,
      items: oldAttributes.annotations || [],
    },
  };
}
```

**Step 3**: Create editor control

```jsx
// src/chart/edit/annotation-controls.jsx
export default function AnnotationControls({ attributes, setAttributes }) {
	const { annotations } = attributes;

	return (
		<ToggleControl
			label="Enable Annotations"
			checked={annotations.active}
			onChange={(active) =>
				setAttributes({
					annotations: {
						...annotations,
						active,
					},
				})
			}
		/>
	);
}
```

**Step 4**: Add test fixtures

- Fixture with annotations enabled
- Fixture with annotations + mobile active
- Fixture with empty annotations array

**Step 5**: Update data-model.md documentation

---

## Common Patterns

### Pattern: Conditional Nested Updates

```jsx
// Update nested object only if it exists
const updateAxisLabel = (newLabel) => {
	if (!attributes.independentAxis) return;

	setAttributes({
		independentAxis: {
			...attributes.independentAxis,
			label: newLabel,
		},
	});
};
```

### Pattern: Deep Nested Updates

```jsx
// Updating deeply nested property: independentAxis.tickLabels.fontSize
const updateTickLabelFontSize = (fontSize) => {
	const { independentAxis } = attributes;

	setAttributes({
		independentAxis: {
			...independentAxis,
			tickLabels: {
				...independentAxis.tickLabels, // Preserve other tickLabel props
				fontSize,
			},
		},
	});
};
```

### Pattern: Multiple Nested Objects

```jsx
// Updating multiple nested objects at once
const applyTheme = (theme) => {
	const updates = {};

	if (theme.colors) {
		updates.colors = theme.colors;
	}

	if (theme.axisStyle) {
		updates.independentAxis = {
			...attributes.independentAxis,
			...theme.axisStyle,
		};
	}

	setAttributes(updates);
};
```

### Pattern: Resetting Nested Object

```jsx
// Reset to default - use default from block.json
import blockMetadata from '../block.json';

const resetAxisConfig = () => {
	setAttributes({
		independentAxis: blockMetadata.attributes.independentAxis.default,
	});
};
```

---

## Testing Checklist

Before submitting PR with attribute changes:

- [ ] Updated block.json nested structure
- [ ] Updated relevant deprecation migrate function
- [ ] Updated editor controls to use nested paths
- [ ] Created test fixture for new feature
- [ ] Verified fixture test passes
- [ ] Manually tested old chart migrates correctly
- [ ] Checked browser console for migration warnings
- [ ] Updated data-model.md if adding new nested object
- [ ] Verified get-config.js doesn't need updates (should be automatic)

---

## Quick Reference: File Locations

| Task             | File Path                                                 |
| ---------------- | --------------------------------------------------------- |
| Add attribute    | `src/chart/block.json`                                    |
| Update migration | `src/chart/deprecations/v1.js`                            |
| Editor controls  | `src/chart/edit/*-controls.jsx`                           |
| Test fixtures    | `tests/fixtures/chart-block/*.json`                       |
| Run tests        | `npm test -- tests/integration/block-deprecation.test.js` |
| Type reference   | PRC Charting Library `configTypes.ts`                     |
| Data model doc   | `specs/issue-1386/data-model.md`                          |

---

## Getting Help

1. **Check migration logs**: Browser console (dev mode) shows detailed migration steps
2. **Review fixtures**: See `tests/fixtures/chart-block/` for examples
3. **Check type definitions**: PRC Charting Library's `baseConfig.ts` and `configTypes.ts`
4. **Read data model**: `specs/issue-1386/data-model.md` for complete attribute mapping
5. **Check type mapping**: `specs/issue-1386/type-mapping.md` for TypeScript→block.json conventions

---

## TL;DR

**Reading attributes**:

```javascript
const { independentAxis } = attributes;
```

**Updating attributes**:

```javascript
setAttributes({
	independentAxis: {
		...independentAxis, // ← Don't forget to spread!
		label: 'New Value',
	},
});
```

**That's 90% of what you need to know.** ✅
