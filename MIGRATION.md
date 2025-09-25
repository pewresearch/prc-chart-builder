# Block Name Migration Guide

This document explains the block name migration process for PRC Chart Builder plugin version 3.0.1.

## Overview

The PRC Chart Builder plugin has been updated to use new block names that better reflect the plugin's namespace. This migration automatically updates existing posts to use the new block names.

## Block Name Changes

| Old Block Name                       | New Block Name                   |
| ------------------------------------ | -------------------------------- |
| `prc-block/chart`                    | `prc-chart-builder/synced-chart` |
| `prc-block/chart-builder-controller` | `prc-chart-builder/controller`   |
| `prc-block/chart-builder`            | `prc-chart-builder/chart`        |

## Automatic Migration

The migration runs automatically when the plugin is activated or updated. It will:

1. Search for all published posts containing the old block names
2. Update the block names in post content
3. Update any related post meta data
4. Display an admin notice with migration results
5. Log migration activity to the error log

## Manual Migration Control

### Using WP-CLI

You can control the migration process using WP-CLI commands:

```bash
# Check migration status
wp prc-chart-builder migration_status

# Run migration manually
wp prc-chart-builder migrate_blocks

# Run migration with dry-run to see what would be changed
wp prc-chart-builder migrate_blocks --dry-run

# Force re-run migration (reset and run again)
wp prc-chart-builder migrate_blocks --force

# Migrate a single chart
wp prc-chart-builder migrate_single_post 123456

```

### Using Code

You can also trigger the migration programmatically:

```php
// Get migration status
$loader = new \PRC\Platform\Chart_Builder\Loader();
$migration = new \PRC\Platform\Chart_Builder\Block_Migration( $loader );
$status = $migration->get_migration_status();

// Run migration manually
$result = $migration->manual_migration();
```

## Migration Safety

The migration process is designed to be safe:

- **Non-destructive**: Original content is preserved, only block names are updated
- **Reversible**: You can manually revert changes if needed
- **Logged**: All migration activity is logged to the error log
- **Tested**: Migration logic is thoroughly tested
- **Idempotent**: Running the migration multiple times is safe

## What Gets Migrated

The migration updates:

1. **Post Content**: Block names in the `post_content` field
2. **Post Meta**: Block references in relevant meta fields
3. **All Post Types**: Pages, posts, and custom post types
4. **Published Content Only**: Only published posts are migrated

## Migration Status

The migration status is stored in WordPress options:

- `prc_chart_builder_block_migration_completed`: Boolean indicating if migration is complete
- `prc_chart_builder_block_migration_status`: String status ('completed', 'completed_no_posts', etc.)
- `prc_chart_builder_block_migration_stats`: Array with migration statistics

## Troubleshooting

### Migration Not Running

If the migration doesn't run automatically:

1. Check that you have administrator privileges
2. Ensure the plugin is properly activated
3. Check the error log for any issues
4. Try running the migration manually via WP-CLI

### Partial Migration

If the migration appears to be incomplete:

1. Check the migration status via WP-CLI
2. Review the error log for any errors
3. Run the migration again with `--force` flag
4. Contact support if issues persist

### Reverting Changes

If you need to revert the migration:

1. Restore from a database backup taken before the migration
2. Or manually update the block names back to the old format
3. Reset the migration status options to allow re-migration

## Testing

A test script is available to verify the migration logic:

```bash
php tests/test-block-migration.php
```

This script tests the migration logic without affecting the database.

## Support

If you encounter any issues with the migration:

1. Check the error log for detailed information
2. Run the test script to verify the migration logic
3. Use WP-CLI commands to check status and run dry-runs
4. Contact the development team with specific error messages

## Version History

- **3.0.1**: Initial block name migration implementation
- **3.0.0**: Original block names (pre-migration)
