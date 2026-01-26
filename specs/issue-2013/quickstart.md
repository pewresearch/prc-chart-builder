# Quickstart: Chart Block ID Structure

**Audience**: Developers working with the chart block
**Purpose**: Reference guide for proper ID attribute usage

## Overview

The chart block stores its ID at the **root level** of attributes, not nested in the `io` object.

```javascript
// ✅ CORRECT Structure
{
  "_version": "v2",
  "id": "controller-id-chart",  // ID at root
  "io": {
    // ... other properties, NO id here
  }
}

// ❌ INCORRECT Structure (old/incorrect pattern)
{
  "_version": "v2",
  "io": {
    "id": "controller-id-chart",  // ❌ Don't put ID here
    // ...
  }
}
```

## JavaScript Usage

### Accessing the ID

```javascript
import { useBlockProps } from '@wordpress/block-edit';

function ChartEdit({ attributes, setAttributes }) {
	const { id } = attributes; // ✅ Get ID from root

	// ❌ WRONG - Don't do this:
	// const id = attributes.io.id; // Will be undefined!

	return (
		<div {...useBlockProps()}>
			<p>Chart ID: {id}</p>
		</div>
	);
}
```

### Setting the ID

```javascript
import { useEffect, useContext } from '@wordpress/element';
import { Context } from '../controller/context';

function ChartEdit({ attributes, setAttributes }) {
	const { controllerId } = useContext(Context);
	const { id } = attributes;

	// Set ID based on controller ID
	useEffect(() => {
		if (controllerId) {
			const expectedChartId = `${controllerId}-chart`;
			if (id !== expectedChartId) {
				setAttributes({ id: expectedChartId }); // ✅ Set at root
			}
		}
	}, [controllerId, id, setAttributes]);

	// ❌ WRONG - Don't do this:
	// setAttributes({ io: { ...io, id: newId } });

	return <div>...</div>;
}
```

## PHP Usage

### Accessing the ID

```php
<?php
/**
 * Render callback for chart block
 */
function render_block_callback( $attributes, $content, $block ) {
	// ✅ CORRECT - Get ID from root
	$chart_id = $attributes['id'] ?? '';

	// ❌ WRONG - Don't do this:
	// $chart_id = $attributes['io']['id'] ?? ''; // Won't exist!

	// Use the ID
	$wrapper_attrs = sprintf(
		'id="%s" class="chart-wrapper"',
		esc_attr( $chart_id )
	);

	return sprintf(
		'<div %s>%s</div>',
		$wrapper_attrs,
		$content
	);
}
```

### Validating Block Attributes

```php
<?php
/**
 * Validate chart block attributes
 */
function validate_chart_attributes( $attributes ) {
	// Check that ID exists at root
	if ( empty( $attributes['id'] ) ) {
		return new WP_Error(
			'missing_id',
			'Chart block must have an ID at root level'
		);
	}

	// Check that io.id does NOT exist (would be incorrect)
	if ( isset( $attributes['io']['id'] ) ) {
		return new WP_Error(
			'incorrect_structure',
			'ID should be at root level, not in io object'
		);
	}

	return true;
}
```

## Block Schema

### block.json Structure

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "prc-chart-builder/chart",
	"attributes": {
		"_version": {
			"type": "string",
			"enum": ["v1", "v2"],
			"default": "v2"
		},
		"id": {
			"type": "string",
			"default": ""
		},
		"layout": {
			"type": "object",
			"default": {}
		},
		"metadata": {
			"type": "object",
			"default": {}
		},
		"io": {
			"type": "object",
			"default": {
				"parentClass": "wp-chart-builder-wrapper",
				"isConvertedChart": false,
				"chartData": []
				// NOTE: No "id" property here!
			}
		}
	}
}
```

**Key Points**:

- `id` is defined at root level
- `io.default` does NOT include an `id` property
- `_version` defaults to "v2"

## Common Patterns

### Pattern 1: Getting Chart ID in Component

```javascript
function MyChartComponent({ attributes }) {
	const chartId = attributes.id; // ✅ Simple and correct

	return <div id={chartId}>Chart content</div>;
}
```

### Pattern 2: Conditional ID Check

```javascript
function ChartWrapper({ attributes, setAttributes }) {
	const { id, io } = attributes;

	// ✅ Check if ID exists
	if (!id) {
		console.warn('Chart is missing ID');
	}

	// ❌ Don't check io.id
	// if (!io.id) { ... } // Wrong!

	return <div>...</div>;
}
```

### Pattern 3: Deriving Chart ID from Controller

```javascript
import { useContext, useEffect } from '@wordpress/element';
import { Context } from '../controller/context';

function ChartEdit({ attributes, setAttributes }) {
	const { controllerId } = useContext(Context);
	const { id } = attributes;

	useEffect(() => {
		if (controllerId && !id) {
			// Generate ID on first render
			const newId = `${controllerId}-chart`;
			setAttributes({ id: newId });
		}
	}, [controllerId, id, setAttributes]);

	return <div>Chart: {id}</div>;
}
```

## Testing & Verification

### Quick Verification

To verify that a chart block is using the correct structure:

```javascript
// In browser console while editing a chart block
const block = wp.data.select('core/block-editor').getSelectedBlock();
console.log('ID at root:', block.attributes.id); // Should show the ID
console.log('ID in io:', block.attributes.io.id); // Should be undefined
```

### Test Checklist

- [ ] **New Chart Creation**
    - Create controller block
    - Insert chart block
    - Verify `attributes.id` is set
    - Verify `attributes.io.id` is undefined

- [ ] **Existing Chart**
    - Open post with existing chart
    - Inspect attributes in console or React DevTools
    - Confirm ID is at root level

- [ ] **Copy/Paste**
    - Copy a chart block
    - Paste it elsewhere
    - Verify new unique ID is generated at root

- [ ] **Table Sync**
    - Create chart with table
    - Update table data
    - Verify chart updates correctly
    - Verify ID relationship maintained

### Debugging

If you encounter issues:

1. **ID is undefined**

    ```javascript
    // Check if ID exists
    if (!attributes.id) {
    	console.error('ID missing - check controller context');
    }
    ```

2. **Wrong structure (io.id exists)**

    ```javascript
    // This indicates incorrect implementation
    if (attributes.io.id) {
    	console.error('ID should be at root, not in io object');
    }
    ```

3. **ID not syncing with controller**
    ```javascript
    // Check controller context
    const { controllerId } = useContext(Context);
    console.log('Controller ID:', controllerId);
    console.log('Expected Chart ID:', `${controllerId}-chart`);
    console.log('Actual Chart ID:', attributes.id);
    ```

## Common Mistakes to Avoid

### ❌ Mistake 1: Accessing ID from io object

```javascript
// WRONG
const chartId = attributes.io.id; // Will be undefined!

// CORRECT
const chartId = attributes.id;
```

### ❌ Mistake 2: Setting ID in io object

```javascript
// WRONG
setAttributes({
	io: {
		...attributes.io,
		id: newId,
	},
});

// CORRECT
setAttributes({ id: newId });
```

### ❌ Mistake 3: Including id in io defaults

```json
// WRONG - block.json
{
  "io": {
    "type": "object",
    "default": {
      "id": "",  // ❌ Don't include id here!
      "chartData": []
    }
  }
}

// CORRECT - block.json
{
  "id": {
    "type": "string",
    "default": ""
  },
  "io": {
    "type": "object",
    "default": {
      "chartData": []  // ✅ No id property
    }
  }
}
```

### ❌ Mistake 4: PHP array access without checking

```php
// WRONG - Might cause errors
$chart_id = $attributes['io']['id'];

// CORRECT - Check root level with fallback
$chart_id = $attributes['id'] ?? '';
```

## Best Practices

### 1. Always Access ID from Root

```javascript
// ✅ Good
const { id } = attributes;

// ✅ Good
const chartId = attributes.id;

// ❌ Bad
const chartId = attributes.io?.id;
```

### 2. Use Destructuring for Clarity

```javascript
// ✅ Good - Clear what comes from where
function ChartEdit({ attributes, setAttributes }) {
	const { id, io, layout, metadata } = attributes;
	const { chartData, isStaticChart } = io;

	// Use id directly
	console.log('Chart ID:', id);
}
```

### 3. Validate ID Structure

```javascript
// ✅ Good - Defensive programming
function validateChartId(id, controllerId) {
	const expectedId = `${controllerId}-chart`;

	if (id !== expectedId) {
		console.warn(`Chart ID mismatch. Expected: ${expectedId}, Got: ${id}`);
		return false;
	}

	return true;
}
```

### 4. Type Safety with TypeScript

```typescript
// ✅ Good - Define proper types
interface ChartBlockAttributes {
	_version: 'v1' | 'v2';
	id: string; // At root level
	layout: LayoutObject;
	metadata: MetadataObject;
	io: {
		// Note: no id property here
		chartData: ChartDataItem[];
		isStaticChart: boolean;
		parentClass: string;
	};
}

// This will catch errors at compile time
function getChartId(attrs: ChartBlockAttributes): string {
	return attrs.id; // ✅ Correct
	// return attrs.io.id; // ❌ TypeScript error!
}
```

## Related Documentation

- **Data Model**: `data-model.md` - Complete attribute structure reference
- **Spec**: `spec.md` - Feature specification and implementation details
- **Architecture**: `/docs/ARCHITECTURE.md` - Overall system architecture
- **Migration**: `/specs/issue-1386/` - v1→v2 migration reference

## Summary

**Key Takeaway**: The chart block ID is stored at `attributes.id`, **not** `attributes.io.id`.

```javascript
// Quick Reference
{
  "_version": "v2",
  "id": "controller-id-chart",  // ✅ ID is here
  "io": {
    // ❌ Not here
    "chartData": [...],
    "parentClass": "..."
  }
}
```

Always access: `attributes.id`
Never access: `attributes.io.id`

---

**Last Updated**: 2026-01-12
**Status**: Active Documentation
