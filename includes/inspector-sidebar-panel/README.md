# Chart Inspector Panel

This feature adds an inspector sidebar panel to the chart post type editing interface that displays all posts currently referencing the chart.

## Features

- **Automatic Detection**: Uses the existing `prc_synced_chart_used_in_posts` meta key to find referencing posts
- **Quick Access**: Provides direct links to edit referencing posts
- **Status Information**: Shows post type, publication status, and other relevant details
- **Chart-Specific**: Only appears when editing chart post types

## Usage

1. Navigate to edit any chart in the WordPress admin
2. Look for the "Posts Using This Chart" panel in the sidebar
3. The panel will display:
   - List of all posts that reference this chart
   - Post title with link to edit
   - Post type and status indicators
   - Links to view published posts

## Technical Implementation

### PHP Components

- `Inspector_Sidebar_Panel` class handles registration and REST API
- REST endpoint: `GET /wp-json/prc-chart-builder/v1/chart/{id}/referencing-posts`
- Integrates with existing `Synced_Chart::get_chart_usage_post_ids()` method

### JavaScript Components

- React-based inspector panel using `PluginDocumentSettingPanel`
- Automatically fetches and displays referencing posts
- Handles loading states and error conditions
- Only renders for chart post type

### Data Flow

1. Chart usage is tracked when synced chart blocks are rendered
2. Post IDs are stored in chart meta using `prc_synced_chart_used_in_posts` key
3. Inspector panel fetches this data via REST API when editing a chart
4. Panel displays formatted list with edit links and post information

## File Structure

```
includes/inspector-sidebar-panel/
├── class-inspector-sidebar-panel.php  # PHP class for registration and API
├── src/
│   └── index.js                        # React component
├── build/
│   ├── index.js                        # Built JavaScript
│   └── index.asset.php                 # Asset dependencies
├── package.json                        # NPM dependencies
└── webpack.config.js                   # Build configuration
```

## Permissions

- Requires `edit_posts` capability to access the REST API endpoint
- Panel only appears in WordPress admin for authenticated users
- Edit links respect user permissions for individual posts