# Chart Inspector Sidebar Panel

This feature adds inspector sidebar panels to the chart post type editing interface.

## Features

### Design Slug (Post Status Info)

Adds a text input field in the **"Status & visibility"** section at the top of the sidebar where designers can input a design slug that follows their naming conventions. This is separate from the WordPress post slug and post title.

**Location**: Appears in the Post Status Info section (collapsed panel at top of sidebar showing Visibility, Publish date, etc.)

**Meta Field:**

- **Key**: `design_slug`
- **Type**: `string`
- **Post Type**: `chart`
- **Exposed in REST API**: Yes
- **Admin Column**: Displayed and sortable in the Charts list table

### Posts Referencing This Chart Panel

Displays all posts currently referencing the chart through Synced Chart blocks in a separate document settings panel.

**Features:**

- **Automatic Detection**: Uses the existing `prc_synced_chart_used_in_posts` meta key to find referencing posts
- **Quick Access**: Provides direct links to edit referencing posts
- **Status Information**: Shows post type, publication status, and other relevant details
- **Chart-Specific**: Only appears when editing chart post types

## Usage

1. Navigate to edit any chart in the WordPress admin
2. Look in the sidebar:
    - **"Status & visibility"** section (at top) - Click to expand and enter the design slug
    - **"Posts Referencing This Chart"** panel (below) - View all posts using this chart
3. The design slug also appears as a column in the Charts list table (All Charts screen)

## Technical Implementation

### PHP Components

- `Inspector_Sidebar_Panel` class handles registration and REST API
- REST endpoint: `GET /wp-json/prc-chart-builder/v1/chart/{id}/referencing-posts`
- Integrates with existing `Synced_Chart::get_chart_usage_post_ids()` method
- Design slug meta field registered in `Content_Type` class
- Admin list table columns for design slug

### JavaScript Components

- React-based panels using `PluginDocumentSettingPanel`
- Design Slug panel: Text input with `editPost` to update meta
- Inspector panel: Fetches and displays referencing posts via REST API
- Handles loading states and error conditions
- Only renders for chart post type

## Development

Build the assets:

```bash
npm run build
```

Or start the development watcher:

```bash
npm run start
```

## File Structure

```
includes/inspector-sidebar-panel/
├── class-inspector-sidebar-panel.php  # PHP class for registration and API
├── src/
│   ├── index.js                        # React components
│   └── editor.scss                     # Styles
├── build/
│   ├── index.js                        # Built JavaScript
│   ├── index.css                       # Built styles
│   └── index.asset.php                 # Asset dependencies
├── package.json                        # NPM dependencies
└── README.md                           # This file
```

## Permissions

- Requires `edit_posts` capability to:
    - Access the REST API endpoint
    - Edit the design slug meta field
- Panels only appear in WordPress admin for authenticated users
- Edit links respect user permissions for individual posts
