# Devtools console helpers (PRC-17 slice 4)

Ships in the `@prc/chart-builder` view bundle (`prc-chart-builder/src/chart/view.js`). Rebuild
`@prc/chart-builder` and hard-reload after any changes to the debug module.

> For the architecture behind these helpers — the addressable store, the action
> surface, the `useChartStore` hook, the data↔config coupling + color contracts,
> and consumer-block recipes — see [`reactive-store.md`](reactive-store.md).

## Debug surface

All handles live under `window.prcChartBuilder`. The `.debug` sub-object holds the full API;
`.update` and `.randomize` are convenience aliases at the top level.

```text
window.prcChartBuilder
  .debug
    .listCharts()
    .getChart(chartId)                       → { data, config, tableData }
    .setChart(chartId, { data?, config?, tableData? })
    .setConfig(chartId, partial)             → same merge rules as setChart's config
    .setData(chartId, data)
    .setTableData(chartId, tableData)
    .randomize(chartId?, { min, max })
    .update(chartId?, opts)
  .update(chartId?, opts)                    → alias for .debug.update
  .randomize(chartId?, { min, max })         → alias for .debug.randomize
```

## Same merge rules everywhere

`setConfig`, `setChart({ config })`, and `prcChartBuilder.update({ config })` all use `applyDeepPatch`:

- **Objects** — merge per-key (siblings preserved).
- **Most arrays** — replace wholesale (`colors`, `dataRender.categories`, …).
- **`annotations.items` only** — merge **per index**; `undefined`/`null` slots are skipped so you can patch one annotation without resending the full list.

## `setConfig`-shaped updates (including one annotation)

```js
const id = prcChartBuilder.debug.listCharts()[0];

// Low-level — identical merge semantics
prcChartBuilder.debug.setConfig(id, {
  independentAxis: { domain: [0, 50] },
  annotations: {
    items: [undefined, undefined, undefined, { text: '2030' }],
  },
});

// Atomic with data via prcChartBuilder.update (same config partial)
prcChartBuilder.update(id, {
  scale: 1.3,
  config: {
    independentAxis: { domain: [0, 50] },
    annotations: {
      items: [undefined, undefined, undefined, { text: '2030' }],
    },
  },
});

// Or sparse array literal (index 3 only)
prcChartBuilder.update(id, {
  config: {
    annotations: {
      items: [, , , { text: '2030' }],
    },
  },
});
```

Other `annotations` keys still object-merge (`active`, etc.); only `items` uses per-index merge.

**Horizontal diverging bar:** value axis is `independentAxis.domain`, not `dependentAxis`.

## `update` convenience knobs

These are folded into `config` before `setChart` (same as passing them under `config` yourself):

| Option | Maps to |
| --- | --- |
| `colors` | `config.colors` (array replace) |
| `animationDuration` | `config.animation.duration` |
| `config` | deep-merge partial |
| `scale` / `jitter` / `data` | data array transform |

Implementation: [`src/debug/chartUpdate.js`](../src/debug/chartUpdate.js), [`src/chart/utils/apply-deep-patch.js`](../src/chart/utils/apply-deep-patch.js).

## Testing table and metadata sync

On any frontend page with a chart controller + underlying-numbers table, open
DevTools after a hard reload (rebuild `@prc/chart-builder` first if you changed
source):

```js
const id = prcChartBuilder.debug.listCharts()[0];

// Table: adds a row via setTableData and polls store vs DOM for ~3s
await prcChartBuilder.debug.smokeTestAddRow(id);

// Metadata: patch config.metadata (sanitized HTML on [data-meta-field])
prcChartBuilder.debug.setConfig(id, {
  metadata: {
    subtitle: 'Updated — <em>with HTML</em>',
    note: 'See <a href="https://example.com">link</a>.',
  },
});
```

Open the **Data** tab before table probes so `.chart-builder-data-table` is in
the DOM. See [`reactive-store.md`](reactive-store.md#one-update-funnel) for the
full update-funnel architecture.
