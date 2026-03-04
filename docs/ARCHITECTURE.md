# Chart Builder Architecture & State Management

## Overview

This document outlines architectural decisions for the PRC Chart Builder, particularly around data persistence, state management, and interactive features.

---

## Current Architecture

### Data Flow

```
Table Block (source)
  ↓
chartData (derived via formatCellContent)
  ↓
Block Attributes (persisted)
  ↓
Charting Library (rendered)
```

### Key Concepts

**Block Attributes**

- WordPress-native storage mechanism
- Saves with post content
- Automatically syncs in real-time collaboration
- Accessible via `@wordpress/data` store

**Hidden Attributes Pattern**
Data points can include "hidden" attributes prefixed with `__`:

```javascript
{
  x: "2020",
  Category: 42,
  __labels: { Category: "42%" },
  __tooltips: { Category: "<strong>42%</strong> of respondents..." },
  __labelPositions: { Category: { dx: 10, dy: -5 } }
}
```

**Benefits:**

- Unified data structure
- Positions travel with data points
- Intuitive relationship (position tied to x-value + category)

---

## Problem: Data Persistence vs. Derivation

### The Challenge

When table data changes → `chartData` is regenerated → custom positions are lost.

**Example:**

1. User customizes label positions by dragging
2. User fixes typo in table data ("Demcorats" → "Democrats")
3. `chartData` regenerates from table
4. All custom `__labelPositions` disappear

This is technically correct (derived data should be pure) but frustrating for users.

---

## Solution Options Considered

### Option 1: Smart Merge on Data Update ⭐ RECOMMENDED

**Preserve `__labelPositions` when x-values match between old and new data**

```javascript
useEffect(() => {
	if (!chartData || !memoizedChartData) return;

	// Check if we have custom positions to preserve
	const hasCustomPositions = chartData.some(
		(d) => d.__labelPositions && Object.keys(d.__labelPositions).length > 0
	);

	if (hasCustomPositions) {
		// Create lookup map of old positions by x-value
		const positionsMap = new Map();
		chartData.forEach((d) => {
			if (d.__labelPositions) {
				positionsMap.set(d.x, d.__labelPositions);
			}
		});

		// Merge positions into new data where x-values match
		const mergedData = memoizedChartData.map((d) => {
			const existingPositions = positionsMap.get(d.x);
			if (existingPositions) {
				return { ...d, __labelPositions: existingPositions };
			}
			return d;
		});

		setAttributes({ chartData: mergedData });
	} else {
		setAttributes({ chartData: memoizedChartData });
	}
}, [memoizedChartData]);
```

**Pros:**

- ✅ Maintains unified data structure
- ✅ Positions survive data updates when x-values match
- ✅ Intuitive behavior (positions tied to x-value)
- ✅ Automatically handles removed data points
- ✅ Simple implementation

**Cons:**

- ⚠️ Positions lost if x-values change (e.g., "2020" → "2021")
- ⚠️ Need to handle category name changes (could match by index as fallback)

**Edge Cases:**

- X-value changes → Accept loss (it's a different data point)
- Category renames → Could implement index-based fallback matching
- Data point removed → Positions automatically discarded (correct behavior)

**Status:** Accepted as the pragmatic solution. Solves 90% of use cases.

---

### Option 2: Separate Attribute with Key-Based Lookup

**Store positions separately from chartData**

```javascript
// In block attributes
customLabelPositions: {
  type: 'object',
  default: {},
  // Structure: { "2020|Category1": { dx: 10, dy: -5 } }
}

// In wp-editor-functions.js
onDragEnd: (x, category, finalDx, finalDy) => {
  const key = `${x}|${category}`;
  setAttributes({
    customLabelPositions: {
      ...attrs.customLabelPositions,
      [key]: { dx: finalDx, dy: finalDy }
    }
  });
}
```

**Pros:**

- ✅ Positions survive all data changes
- ✅ Simple key-based lookup
- ✅ Clear separation of concerns

**Cons:**

- ❌ Two sources of truth
- ❌ Loses unified structure
- ❌ Need to clean up orphaned positions
- ❌ More complex merge logic at render time

**Status:** Not chosen, but valid alternative if Option 1 proves insufficient.

---

### Option 3: Hybrid Approach

Combine Option 1 with enhanced UX:

1. Store in chartData (unified structure)
2. Add merge logic (preserve on updates)
3. Add visual indicators (show which labels are customized)
4. Add bulk operations (clear all, reset specific points)

**Status:** Future enhancement if users need better visibility into customizations.

---

### Option 4: Version/Snapshot System

Keep history of custom positions with data hashes:

```javascript
labelPositionHistory: [
  { dataHash: 'abc123', positions: {...} },
  { dataHash: 'def456', positions: {...} }
]
```

**Status:** Too complex for current needs. Consider only if required by specific use case.

---

## State Management Considerations

### Question: Should We Use Redux or External State Management?

**Short Answer: No, not for this use case.**

### Why Not Redux?

The problem isn't about _where_ data is stored, but about **data derivation logic**:

```
Table Changes → Derived Data → Need Smart Merge
```

Redux wouldn't change this fundamental flow. You'd still need merge logic.

### WordPress Already Has Redux-Like Patterns

WordPress uses `@wordpress/data` which is heavily inspired by Redux:

- Actions, selectors, stores (Redux concepts)
- Already integrated with Gutenberg
- Block attributes are already in this system
- Provides real-time collaboration out of the box

```javascript
// WordPress data API (similar to Redux)
const { updateBlockAttributes } = useDispatch('core/block-editor');
const blocks = useSelect((select) => select('core/block-editor').getBlocks());
```

---

## Future Use Cases Analysis

### 1. Real-Time Collaboration

**Answer: Already Handled by WordPress**

Gutenberg's data layer automatically syncs block attributes:

```javascript
// Editor A updates
dispatch('core/block-editor').updateBlockAttributes(clientId, { chartData });

// Editor B's UI updates automatically
const chartData =
	select('core/block-editor').getBlockAttributes(clientId).chartData;
```

Custom positions in `__labelPositions` sync automatically because they're in block attributes.

**No external store needed.**

---

### 2. Cross-Block Communication

**Example:** A button block elsewhere in the post updates chart data.

#### Option A: Block Context (Simple, for related blocks)

```javascript
// Controller block provides context
<ChartContext.Provider value={{ updateChartData }}>
	<InnerBlocks />
</ChartContext.Provider>;

// Button consumes context
const { updateChartData } = useBlockContext();
```

**Use when:** Blocks have parent-child relationship (already used in codebase).

#### Option B: Custom WordPress Data Store (For unrelated blocks)

```javascript
import { createReduxStore, register } from '@wordpress/data';

const chartStore = createReduxStore('prc/chart-data', {
	reducer: (state = {}, action) => {
		switch (action.type) {
			case 'UPDATE_CHART':
				return { ...state, [action.chartId]: action.data };
			default:
				return state;
		}
	},
	actions: {
		updateChart: (chartId, data) => ({
			type: 'UPDATE_CHART',
			chartId,
			data,
		}),
	},
	selectors: {
		getChartData: (state, chartId) => state[chartId],
	},
});

register(chartStore);

// Button block (anywhere in post)
const { updateChart } = useDispatch('prc/chart-data');
updateChart('chart-123', newData);

// Chart block
const chartData = useSelect((select) =>
	select('prc/chart-data').getChartData(clientId)
);
```

**Use when:**

- Blocks aren't parent-child related
- Multiple blocks need same data
- Complex interactions between blocks

**Decision:** Implement only when this use case actually arises.

---

### 3. Scrollytelling with Dynamic Data

**Architecture:**

#### Editor (Design Time)

Store all possible datasets in block attributes:

```javascript
{
	scrollytellingData: {
		scenes: [
			{
				scroll: 0,
				data: [
					/* dataset 1 */
				],
				annotations: [
					/* scene 1 annotations */
				],
				__labelPositions: {
					/* scene 1 positions */
				},
			},
			{
				scroll: 500,
				data: [
					/* dataset 2 */
				],
				annotations: [
					/* scene 2 annotations */
				],
				__labelPositions: {
					/* scene 2 positions */
				},
			},
			{
				scroll: 1000,
				data: [
					/* dataset 3 */
				],
				annotations: [
					/* scene 3 annotations */
				],
				__labelPositions: {
					/* scene 3 positions */
				},
			},
		];
	}
}
```

#### Frontend (Runtime)

Use WordPress Interactivity API for runtime state:

```javascript
import { store } from '@wordpress/interactivity';

store('prc-chart/scrollytelling', {
	state: {
		currentScene: 0,
		get currentData() {
			return state.scenes[state.currentScene].data;
		},
	},
	actions: {
		onScroll: () => {
			const scrollY = window.scrollY;
			state.currentScene = calculateScene(scrollY);
			// Chart re-renders with new data
		},
	},
});
```

**Key Insight:** Scrollytelling is a _frontend interaction_, not editor state.

**Use:**

- **Block attributes** for storing all scenes (persists with post)
- **Interactivity API** for runtime state (which scene is currently active)
- **No Redux needed**

---

## Decision Matrix: When to Use What

### Use Block Attributes When:

- ✅ Data needs to persist with the post
- ✅ Standard block-level data
- ✅ Real-time collaboration needed (automatic)
- ✅ Simple parent-child relationships

### Use Block Context When:

- ✅ Parent-child block communication
- ✅ Sharing functions/callbacks to nested blocks
- ✅ Temporary runtime state

### Use WordPress Data Store When:

- ✅ Complex state shared across 5+ unrelated blocks
- ✅ Need centralized state management
- ✅ Complex computed/derived state
- ✅ Need middleware (logging, analytics, async operations)
- ✅ Building interconnected "dashboard" of charts

### Use WordPress Interactivity API When:

- ✅ Frontend-only interactions
- ✅ User-triggered state changes (scroll, click, hover)
- ✅ Lightweight runtime state
- ✅ No persistence needed

### Use External Redux When:

- ❌ **Almost never for WordPress blocks**
- Only if you need features not provided by WordPress data stores
- Consider if building a completely separate React app within WordPress

---

## Recommendations

### Immediate (v1.3.12)

1. ✅ **Implement smart merge logic** (Option 1)

    - Solves 90% of use cases
    - Simple, maintainable
    - Preserves unified data structure

2. ✅ **Document architecture** (this file)
    - Reference for future decisions
    - Captures rationale

### Near Future (v1.4.x)

3. **Add visual indicators** for customized labels

    - Icon or highlight on labels with custom positions
    - Helps users understand what they've changed

4. **Enhance reset functionality**
    - Per-label reset (individual undo)
    - Bulk reset by category
    - Reset all (already implemented)

### Future Considerations (v2.x+)

**Monitor for these pain points:**

- Need to update charts from unrelated blocks → Consider WordPress data store
- Complex scrollytelling features → Implement Interactivity API pattern
- Users frequently lose positions on data updates → Enhance merge logic or add warnings

**The WordPress Way:**

> Start simple, add complexity only when needed, prefer platform-native solutions.

---

## Current Implementation Status

### Completed (v1.3.12)

- ✅ Draggable annotations with `wpEditorFunctions` architecture
- ✅ Draggable labels using `DraggableLabel` component
- ✅ `__labelPositions` stored in chartData
- ✅ Editor-only interactivity (frontend renders static)
- ✅ Reset button for clearing custom positions
- ✅ Refactored `wpEditorFunctions` into separate module
- ✅ Smart merge logic to preserve positions on data updates (Option 1)

### To Be Implemented

- ⏳ Visual indicators for customized elements
- ⏳ Per-element reset functionality

### Future Enhancements

- 📋 Cross-block communication patterns (when needed)
- 📋 Scrollytelling support (when needed)
- 📋 Advanced state management (only if pain points emerge)

---

## Related Documentation

- [WordPress Data Package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/)
- [WordPress Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/)
- [Block Context](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/)
- [Creating Custom Stores](https://developer.wordpress.org/block-editor/reference-guides/data/data-core-block-editor/)

---

## Questions for Future Discussion

1. Should we implement category rename detection for smarter merging?
2. Do we need undo/redo beyond WordPress's native system?
3. Should custom positions be exportable/importable separately?
4. Would a "lock positions" toggle be useful during major data updates?

---

_Last Updated: 2025-10-02_
_Version: 1.3.12_
_Implementation: Smart merge logic added to preserve custom label positions on data updates_
