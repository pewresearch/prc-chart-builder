/**
 * Chart Block Deprecations
 *
 * This file exports all deprecations for the Chart block. Deprecations handle
 * migrating old attribute structures to the current nested structure.
 *
 * WordPress tries deprecations in reverse chronological order (most recent first)
 * until it finds one that validates, then runs the migrate function.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/
 */

import v1 from './v1';

/**
 * Deprecations array
 * Order: Most recent first (v1 is the only deprecation for now)
 */
export default [v1];
