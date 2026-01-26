# Type Mapping: TypeScript configTypes to WordPress block.json

**Feature**: issue/1386 | **Date**: 2025-11-06
**Purpose**: Document how TypeScript types from PRC Charting Library's configTypes.ts map to WordPress block.json attribute types

## Overview

WordPress's block.json uses a limited type system compared to TypeScript. This guide provides conventions for representing complex TypeScript types in block.json while maintaining as much type safety as possible.

## Type System Comparison

| TypeScript                | WordPress block.json     | Validation Level     |
| ------------------------- | ------------------------ | -------------------- |
| Rich type system          | Basic JSON types         | Limited              |
| Interfaces, unions, enums | Objects with enum arrays | Enum validation only |
| Generic types             | Opaque objects           | None                 |
| Type guards               | N/A                      | N/A                  |

**Philosophy**: block.json provides _serialization structure_, TypeScript provides _type safety_ in editor code.

## Mapping Rules

### 1. Primitive Types (Direct Mapping)

**TypeScript → block.json (1:1)**

| TypeScript | block.json              | Example           |
| ---------- | ----------------------- | ----------------- |
| `string`   | `{ "type": "string" }`  | `label: string`   |
| `number`   | `{ "type": "number" }`  | `width: number`   |
| `boolean`  | `{ "type": "boolean" }` | `active: boolean` |

**Note**: Use `integer` type in block.json for whole numbers to enforce integer validation.

```json
// TypeScript
interface Layout {
  width: number;    // Can be float
  tickCount: number; // Should be integer
}

// block.json
{
  "layout": {
    "type": "object",
    "default": {
      "width": 640,      // type: number
      "tickCount": 5     // Should use integer type at root if possible
    }
  }
}
```

---

### 2. String Literal Unions → Enum Arrays

**TypeScript**:

```typescript
type ChartType = 'bar' | 'line' | 'area' | 'pie';
type Orientation = 'vertical' | 'horizontal';
```

**block.json**:

```json
{
	"chartType": {
		"type": "string",
		"enum": ["bar", "line", "area", "pie"],
		"default": "bar"
	},
	"orientation": {
		"type": "string",
		"enum": ["vertical", "horizontal"],
		"default": "vertical"
	}
}
```

**Benefits**:

- WordPress validates against enum values
- Editor dropdowns automatically use enum list
- Runtime type safety via enum validation

**Limitations**:

- Must keep enum lists manually synchronized between TypeScript and block.json
- No way to enforce this sync automatically

**Best Practice**: Reference TypeScript type when defining block.json enum:

```json
{
	"chartType": {
		"type": "string",
		"enum": ["bar", "line", "area", "pie"],
		"default": "bar",
		"_comment": "Sync with ChartType in configTypes.ts"
	}
}
```

---

### 3. Number Literal Unions → Enum Arrays

**TypeScript**:

```typescript
type PointSize = 1 | 2 | 3 | 4 | 5;
```

**block.json**:

```json
{
	"pointSize": {
		"type": "number",
		"enum": [1, 2, 3, 4, 5],
		"default": 3
	}
}
```

---

### 4. Optional Properties → Default Values

**TypeScript**:

```typescript
interface AxisConfig {
	label?: string;
	padding?: number;
}
```

**block.json**:

```json
{
	"axisConfig": {
		"type": "object",
		"default": {
			"label": "", // Empty string or null indicates optional
			"padding": 0 // 0 or null indicates optional
		}
	}
}
```

**Convention**: Use `null` or "empty" default values (`""`, `0`, `false`, `[]`, `{}`) to indicate optional properties.

---

### 5. Interfaces/Objects → Opaque Objects

**TypeScript**:

```typescript
interface IndependentAxis {
	active: boolean;
	label: string;
	scale: 'linear' | 'time' | 'log' | 'sqrt';
	domain: [number, number];
	tickCount: number;
}
```

**block.json**:

```json
{
	"independentAxis": {
		"type": "object",
		"default": {
			"active": true,
			"label": "",
			"scale": "linear",
			"domain": [0, 100],
			"tickCount": 5
		}
	}
}
```

**Limitations**:

- block.json cannot enforce nested property types
- No validation of object shape
- Default value serves as documentation only

**Workaround**: TypeScript enforces shape in editor code:

```typescript
// In editor control component
const { independentAxis } = attributes as { independentAxis: IndependentAxis };
setAttributes({
	independentAxis: {
		...independentAxis,
		active: true, // TypeScript ensures this matches IndependentAxis shape
	},
});
```

---

### 6. Arrays → Type + Items Hint

**TypeScript**:

```typescript
interface Config {
	colors: string[]; // Array of hex colors
	categories: string[]; // Array of category names
	domain: [number, number]; // Tuple of exactly 2 numbers
}
```

**block.json**:

```json
{
	"colors": {
		"type": "array",
		"default": ["#436983", "#bf3927"],
		"_comment": "Array of hex color strings"
	},
	"categories": {
		"type": "array",
		"default": [],
		"_comment": "Array of category name strings"
	},
	"domain": {
		"type": "array",
		"default": [0, 100],
		"_comment": "Tuple: [min: number, max: number]"
	}
}
```

**Limitations**:

- Cannot enforce array item type in block.json
- Cannot enforce tuple length
- Comments are for developer documentation only

**TypeScript Enforcement**:

```typescript
// Editor code has full type safety
const colors: string[] = attributes.colors;
const domain: [number, number] = attributes.domain;
```

---

### 7. Nested Interfaces → Nested Objects

**TypeScript**:

```typescript
interface AxisLabel {
	fontSize: number;
	fill: string;
	padding: number;
}

interface IndependentAxis {
	active: boolean;
	label: string;
	axisLabel: AxisLabel;
}
```

**block.json**:

```json
{
	"independentAxis": {
		"type": "object",
		"default": {
			"active": true,
			"label": "",
			"axisLabel": {
				"fontSize": 12,
				"fill": "#231F20",
				"padding": 15
			}
		}
	}
}
```

**Note**: WordPress block.json doesn't support JSON Schema's `properties` for nested validation. Entire object is opaque.

---

### 8. Union Types (Non-Literal) → Base Type

**TypeScript**:

```typescript
type LabelColor = 'inherit' | 'contrast' | 'black' | 'white' | string; // Allows any string
type TickFormat = ((value: number) => string) | null; // Function or null
```

**block.json**:

```json
{
	"labelColor": {
		"type": "string",
		"enum": ["inherit", "contrast", "black", "white"],
		"default": "inherit",
		"_comment": "Also accepts custom hex colors in code, but enum provides common options"
	},
	"tickFormat": {
		"type": ["string", "null"],
		"default": null,
		"_comment": "TypeScript: Function or null. Serialized as string function name or null."
	}
}
```

**Strategy for Function Types**:

- **Don't serialize functions directly** (JSON doesn't support functions)
- Options:
    1. Use string enum of named functions: `"formatPercent" | "formatCurrency" | null`
    2. Use null/undefined to indicate "use default formatting"
    3. For custom functions: Handle in editor code only, don't persist

---

### 9. Readonly Properties → Same as Mutable

**TypeScript**:

```typescript
interface Config {
	readonly width: number;
}
```

**block.json**:

```json
{
	"width": {
		"type": "number",
		"default": 640
	}
}
```

**Note**: readonly modifier is a TypeScript compile-time feature; doesn't affect serialization.

---

### 10. Complex Union Types → Simplify

**TypeScript**:

```typescript
type Padding =
	| number
	| { top: number; right: number; bottom: number; left: number };
```

**Strategy 1 - Always Use Object Form**:

```json
{
	"padding": {
		"type": "object",
		"default": {
			"top": 0,
			"right": 0,
			"bottom": 0,
			"left": 0
		}
	}
}
```

**Strategy 2 - Separate Attributes**:

```json
{
	"paddingUniform": {
		"type": "number",
		"default": 0
	},
	"paddingCustom": {
		"type": "object",
		"default": { "top": 0, "right": 0, "bottom": 0, "left": 0 }
	}
}
```

**Recommendation**: Prefer Strategy 1 (always object) for consistency.

---

## Special Cases

### Functions

**Problem**: JSON cannot serialize functions.

**Solutions**:

1. **Named Function References** (Preferred):

```typescript
// TypeScript
type TickFormatter = 'default' | 'percent' | 'currency' | 'abbreviated';

// block.json
{
  "tickFormatter": {
    "type": "string",
    "enum": ["default", "percent", "currency", "abbreviated"],
    "default": "default"
  }
}

// Implementation (get-config.js)
const tickFormatFunctions = {
  default: (d) => d.toString(),
  percent: (d) => `${d}%`,
  currency: (d) => `$${d}`,
  abbreviated: abbreviateNumber(d),
};

const tickFormat = tickFormatFunctions[attributes.tickFormatter];
```

2. **Null for "Use Default"**:

```json
{
	"customTickFormat": {
		"type": "null",
		"default": null,
		"_comment": "Custom function not serializable; handle in editor code only"
	}
}
```

### Callbacks and Event Handlers

**Don't Serialize**: Event handlers are editor/runtime only.

```typescript
// TypeScript (NOT in block attributes)
interface EditorOnlyProps {
	onClick?: (event: MouseEvent) => void;
}

// These live in component props, not block attributes
```

---

## Validation Strategy

### What block.json CAN Validate

✅ Type (string, number, boolean, object, array)
✅ Enum values for strings and numbers
✅ Integer vs float (using `integer` type)
✅ Required vs optional (via presence in attributes object)

### What block.json CANNOT Validate

❌ Object shape/properties
❌ Array item types
❌ Tuple lengths
❌ Number ranges (min/max)
❌ String patterns (regex)
❌ Union types (beyond enums)
❌ Function signatures

### Validation Layers

1. **block.json**: Basic type and enum validation (WordPress built-in)
2. **TypeScript**: Full type checking in editor code (compile-time)
3. **Runtime Validation** (optional): Add validation functions if needed

```typescript
// Example runtime validation
function validateIndependentAxis(axis: IndependentAxis): boolean {
	if (!axis || typeof axis !== 'object') return false;
	if (typeof axis.active !== 'boolean') return false;
	if (axis.domain.length !== 2) return false;
	if (axis.tickCount < 0) return false;
	return true;
}
```

---

## Synchronization Best Practices

### 1. Single Source of Truth

**Designate TypeScript configTypes as source of truth** for structure and types.

```typescript
// configTypes.ts (Source of Truth)
export interface IndependentAxis {
  active: boolean;
  label: string;
  scale: 'linear' | 'time' | 'log' | 'sqrt';
  domain: [number, number];
}

// block.json (Derived, kept in sync)
{
  "independentAxis": {
    "type": "object",
    "default": {
      "active": true,
      "label": "",
      "scale": "linear",
      "domain": [0, 100]
    }
  }
}
```

### 2. Reference Comments

Add comments in block.json referencing TypeScript types:

```json
{
  "independentAxis": {
    "type": "object",
    "_sync": "See IndependentAxis in configTypes.ts",
    "default": { ... }
  }
}
```

### 3. Version Markers

Use `_version` attribute to track schema changes:

```json
{
	"_version": {
		"type": "string",
		"default": "v2",
		"_comment": "Schema version for migration tracking"
	}
}
```

### 4. Deprecation Functions Bridge Gap

Migration functions handle any discrepancies:

```javascript
migrate(oldAttributes) {
  // Transform block.json structure to match configTypes
  return {
    independentAxis: {
      active: oldAttributes.xAxisActive,
      label: oldAttributes.xLabel,
      scale: oldAttributes.xScale,
      domain: [oldAttributes.xMinDomain, oldAttributes.xMaxDomain],
    }
  };
}
```

---

## Quick Reference Table

| TypeScript Pattern        | block.json Pattern                            | Validation   | Notes                      |
| ------------------------- | --------------------------------------------- | ------------ | -------------------------- |
| `string`                  | `{ "type": "string" }`                        | ✅ Type      | Direct                     |
| `number`                  | `{ "type": "number" }`                        | ✅ Type      | Direct                     |
| `boolean`                 | `{ "type": "boolean" }`                       | ✅ Type      | Direct                     |
| `'a' \| 'b' \| 'c'`       | `{ "type": "string", "enum": ["a","b","c"] }` | ✅ Enum      | Keep in sync               |
| `1 \| 2 \| 3`             | `{ "type": "number", "enum": [1,2,3] }`       | ✅ Enum      | Keep in sync               |
| `string[]`                | `{ "type": "array" }`                         | ✅ Type only | Item type not enforced     |
| `[number, number]`        | `{ "type": "array" }`                         | ✅ Type only | Length not enforced        |
| `interface { a: string }` | `{ "type": "object" }`                        | ✅ Type only | Shape not enforced         |
| `a?: string`              | `{ "type": "string", "default": "" }`         | ✅ Type      | Default indicates optional |
| `() => void`              | Don't serialize                               | ❌ N/A       | Handle in editor code only |

---

## Example: Full Type Migration

**TypeScript (configTypes.ts)**:

```typescript
export interface TooltipConfig {
	active: boolean;
	activeOnMobile: boolean;
	format: string;
	offsetX: number;
	offsetY: number;
	dateFormat?: string;
	customFormat?: ((datum: any) => string) | null;
	style: {
		fontSize: string;
		maxWidth: number;
		background: string;
	};
}
```

**block.json**:

```json
{
	"tooltip": {
		"type": "object",
		"_sync": "See TooltipConfig in configTypes.ts",
		"default": {
			"active": true,
			"activeOnMobile": true,
			"format": "{{row}}: {{value}}",
			"offsetX": 10,
			"offsetY": 10,
			"dateFormat": "%-m/%Y",
			"customFormat": null,
			"style": {
				"fontSize": "13px",
				"maxWidth": 150,
				"background": "white"
			}
		}
	}
}
```

**Notes**:

- `customFormat` function → `null` (not serializable)
- `style` object → opaque object (shape not enforced)
- `dateFormat` optional → empty default
- Default value documents full structure

---

## When to Deviate

Acceptable reasons to diverge from strict TypeScript mapping:

1. **WordPress-Specific Needs**: block.json may need metadata not in configTypes (e.g., `io` object)
2. **Serialization Constraints**: Functions, circular references, etc. can't be serialized
3. **Performance**: Flattening deeply nested structures for faster access
4. **Backward Compatibility**: Maintaining deprecated attributes during migration

Always document deviations with `_comment` or `_note` fields in block.json.

---

## Summary

- **TypeScript = Type Safety** (compile-time, editor code)
- **block.json = Structure** (serialization, WordPress validation)
- **Use enums** where possible for runtime validation
- **Default values** document expected structure
- **Comments** link block.json to TypeScript types
- **Migration functions** bridge any gaps

**Key Principle**: Pragmatic balance between TypeScript's rich types and WordPress's simple serialization format.
