# Chart Builder Admin

Creation modal / wizard source for the chart CPT, plus the shared-shell DataViews provider.

## Chart list (shared shell)

The **Charts → All Charts** screen is registered on [`prc-wp-admin-dataview`](../../../prc-wp-admin-dataview/README.md) via [`class-chart-list.php`](class-chart-list.php) and [`src/admin-dataview/`](../../src/admin-dataview/).

- Page slug: `prc-chart-builder-library` (stable URL)
- Rows: shell fields + static PNG `featuredImage`, `chartType`, `designSlug`
- Filters: chart type (primary), status; gallery excludes charts without a `chart_type` term
- Actions: shell edit / view / trash + Duplicate (full GET then POST)
- Menu declutter keeps All Charts, Add New, and Settings on the Charts flyout

Build: `npm run build:admin-dataview` (also part of `npm run build`).

## Localization helpers

[`class-admin.php`](class-admin.php) still owns `Admin::get_library_localized_data()` / `get_chart_type_terms()` for `window.prcChartBuilderLibrary` on controller, synced-chart, and creation wizard consumers.

## Creation modal / wizard source

`src/components/` (create-new-chart-modal, chart wizard, AI step, CSV helpers) is imported from block editor bundles. It is not a separate DataViews mount.
