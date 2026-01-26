# Implementation Tasks: Chart Type Switching in Editor (Simplified)

**Issue**: `issue-2016`
**Feature**: Enable switching chart types on existing charts without errors
**Created**: 2025-12-11
**Updated**: 2025-12-11 (Simplified approach - eliminate chartType)
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

---

## Approach: Eliminate `chartType`, Use Single Source of Truth

**Key Insight**: The controller's `chartType` attribute is vestigial - all rendering uses `layout.type` from the chart block. By eliminating `chartType` and making the variation picker read from the inner chart's `layout.type`, we fix the root cause: there's only one source of truth, so it can't get out of sync.

---

## Phase 1: Remove `chartType` from Controller

**Purpose**: Remove the redundant `chartType` attribute from controller block definition.

- [x] T001 Add `chartType` to controller's `providesContext` in `src/controller/block.json` (REVERTED - not needed)
- [x] T002 Add `chartType` to chart's `usesContext` in `src/chart/block.json` (REVERTED - not needed)
- [x] T003 Remove `chartType` from controller's `attributes` in `src/controller/block.json`
- [x] T004 Remove `chartType` from variation attribute definitions in `src/controller/variations.js` (Note: chartType kept in variation attributes for backward compatibility, but isActive no longer uses it)

**Checkpoint**: Controller no longer stores `chartType` attribute.

---

## Phase 2: Update Variation `isActive` to Read Inner Chart

**Purpose**: Make variation picker highlight correct icon by reading `layout.type` from inner chart block.

- [x] T005 Create mapping from variation names to `layout.type` values in `src/controller/variations.js`
- [x] T006 Update `isActive` function to read inner chart's `layout.type` in `src/controller/variations.js`
- [x] T007 Handle special cases (column vs bar orientation) in `isActive` function

**Checkpoint**: Variation picker correctly highlights based on actual chart configuration.

---

## Phase 3: Update UI References

**Purpose**: Update any UI code that references `chartType` to use inner chart's `layout.type` instead.

- [x] T008 Update map warning to check inner chart's `layout.type` in `src/controller/Edit.jsx`
- [x] T009 Remove `chartType` check from PHP static chart detection in `src/controller/class-controller.php`

**Checkpoint**: All UI references updated to use inner chart's `layout.type`.

---

## Phase 4: Testing & Validation

**Purpose**: Verify the changes work correctly and don't break existing functionality.

- [ ] T010 Test variation picker highlights correct icon when switching chart types
- [ ] T011 Test existing posts still work correctly (backward compatibility)
- [ ] T012 Test new chart creation flows work as expected
- [ ] T013 Verify no console errors when switching between chart types

**Checkpoint**: All functionality verified, no regressions.

---

## Dependencies & Execution Order

```
Phase 1 (Remove chartType)
    ↓
Phase 2 (Update isActive)
    ↓
Phase 3 (Update UI references)
    ↓
Phase 4 (Testing)
```

**All tasks are sequential** - each phase depends on the previous one completing.

---

## Summary

| Metric          | Count |
| --------------- | ----- |
| Total Tasks     | 13    |
| Phase 1 Tasks   | 2     |
| Phase 2 Tasks   | 3     |
| Phase 3 Tasks   | 2     |
| Phase 4 Tasks   | 4     |
| Files to Modify | 3     |

**No new dependencies required** - uses existing WordPress packages and codebase utilities.

---

## Notes

- This simplified approach eliminates the need for context communication and synchronization
- Single source of truth (`layout.type`) prevents sync issues
- Backward compatible - existing posts with `chartType` in database are simply ignored
- Much simpler than the original 37-task plan
