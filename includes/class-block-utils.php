<?php
namespace PRC\Platform\Chart_Builder;
// full on rip of platform core block utils class

class Block_Utils {
    /**
     * Request-scoped registry of DOM / Interactivity ids already claimed during
     * the current page render.
     *
     * Chart Builder ids are persisted in saved block content (the controller
     * seeds `attributes.id` from its first clientId; the chart derives
     * `${controllerId}-chart`). Copy/pasting a chart block therefore duplicates
     * those ids verbatim — including across separate chart posts that later
     * appear together on one page via the synced-chart block. Duplicate ids
     * collide throughout the render stack (wrapper DOM ids,
     * wp_interactivity_state() store keys, and the `data-prc-chart-id` lookup
     * that pairs a controller with its chart), so we deduplicate them here.
     *
     * @var array<int, string>
     */
    private static $claimed_render_ids = array();

    /**
     * Claim a render id for the current request and return a guaranteed-unique
     * value.
     *
     * The first caller to claim a given id keeps it verbatim — so stable ids
     * survive for the common single-instance case (and for caching/hydration).
     * Subsequent callers that request an already-claimed id receive a
     * deterministic `-2`, `-3`, … suffix.
     *
     * Empty / non-string ids are returned unchanged (the chart render callback
     * has its own fallback for genuinely missing ids).
     *
     * @param string $id The desired id.
     * @return string A unique id for this request.
     */
    public static function claim_unique_render_id( $id ) {
        if ( ! is_string( $id ) || '' === $id ) {
            return $id;
        }

        if ( ! in_array( $id, self::$claimed_render_ids, true ) ) {
            self::$claimed_render_ids[] = $id;
            return $id;
        }

        $suffix = 2;
        do {
            $candidate = $id . '-' . $suffix;
            ++$suffix;
        } while ( in_array( $candidate, self::$claimed_render_ids, true ) );

        self::$claimed_render_ids[] = $candidate;
        return $candidate;
    }

    /**
     * Reset the request-scoped render-id registry.
     *
     * The registry is naturally request-scoped in production and never needs
     * manual resetting there; this exists so tests can assert behaviour across
     * independent scenarios.
     *
     * @return void
     */
    public static function reset_render_id_registry() {
        self::$claimed_render_ids = array();
    }

    /**
     * Returns an array of attributes for a given block name, with the given attributes merged with the block's default attributes.
     *
     * @param string      $block_name The name of the block to get attributes for.
     * @param array       $given_attributes (optional) If no given attributes are provided, the default attributes will be returned.
     * @param string|null $desired_attribute (optional) If a desired attribute is provided, only that attribute will be returned.
     * @return array|string|null If a desired attribute is provided, only that attribute will be returned or null if no value can be found. Otherwise, an array of attributes will be returned.
     */
    public static function get_block_attributes( string $block_name, array $given_attributes = [], string|null $desired_attribute = null ) {
        $block = \WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
        $attributes = $block->get_attributes();
        $modified_attributes = array();

        foreach ( $attributes as $attr_name => $attr_data ) {
            if ( array_key_exists( $attr_name, $given_attributes ) ) {
                $modified_attributes[ $attr_name ] = $given_attributes[ $attr_name ];
            } elseif ( array_key_exists( 'default', $attr_data ) ) {
                $modified_attributes[ $attr_name ] = $attr_data['default'];
            } else {
                $modified_attributes[ $attr_name ] = null;
            }
        }

        if ( null !== $desired_attribute ) {
            return array_key_exists( $desired_attribute, $modified_attributes ) ? $modified_attributes[ $desired_attribute ] : null;
        }

        return $modified_attributes;
    }

	/**
	 * Promote legacy sibling *Mobile / *OnMobile attributes into viewport overrides.
	 *
	 * @param array $attributes Raw block attributes (not yet viewport-merged).
	 * @return array Attributes with legacy keys stripped and mobile.* populated.
	 */
	public static function migrate_legacy_mobile_attributes( $attributes ) {
		if ( ! is_array( $attributes ) ) {
			return $attributes;
		}

		$migrated   = $attributes;
		$mobile     = $attributes['mobile'] ?? array();
		$changed    = false;

		if ( isset( $migrated['labels']['labelCutoffMobile'] ) ) {
			$desktop_cutoff = $migrated['labels']['labelCutoff'] ?? 0;
			$mobile_cutoff  = $migrated['labels']['labelCutoffMobile'];

			if ( $mobile_cutoff !== $desktop_cutoff ) {
				$mobile['labels'] = array_merge(
					$mobile['labels'] ?? array(),
					array( 'labelCutoff' => $mobile_cutoff )
				);
				$changed = true;
			}

			unset( $migrated['labels']['labelCutoffMobile'] );
		}

		if ( array_key_exists( 'activeOnMobile', $migrated['tooltip'] ?? array() ) ) {
			$active_on_mobile = $migrated['tooltip']['activeOnMobile'];
			unset( $migrated['tooltip']['activeOnMobile'] );

			if ( ! empty( $migrated['tooltip']['active'] ) && false === $active_on_mobile ) {
				$mobile['tooltip'] = array_merge(
					$mobile['tooltip'] ?? array(),
					array( 'active' => false )
				);
				$changed = true;
			}
		}

		if ( array_key_exists( 'activeOnMobile', $migrated['annotations'] ?? array() ) ) {
			$active_on_mobile = $migrated['annotations']['activeOnMobile'];
			unset( $migrated['annotations']['activeOnMobile'] );

			if ( ! empty( $migrated['annotations']['active'] ) && false === $active_on_mobile ) {
				$mobile['annotations'] = array_merge(
					$mobile['annotations'] ?? array(),
					array( 'active' => false )
				);
				$changed = true;
			}
		}

		if ( ! empty( $migrated['annotations']['items'] ) && is_array( $migrated['annotations']['items'] ) ) {
			$migrated['annotations']['items'] = array_map(
				static function ( $item ) {
					if ( ! is_array( $item ) || ! array_key_exists( 'activeOnMobile', $item ) ) {
						return $item;
					}
					unset( $item['activeOnMobile'] );
					return $item;
				},
				$migrated['annotations']['items']
			);
		}

		if ( $changed || ! empty( $mobile ) ) {
			$migrated['mobile'] = $mobile;
		}

		return $migrated;
	}

	/**
	 * Merge viewport-specific overrides into base chart attributes.
	 *
	 * @param array  $attributes  The full block attributes object.
	 * @param string $device_type Current device type ('mobile', 'tablet', or 'desktop').
	 * @return array Merged attributes with viewport overrides applied.
	 */
	public static function merge_viewport_attributes( $attributes, $device_type ) {
		$attributes = self::migrate_legacy_mobile_attributes( $attributes );

		if ( ! $device_type || 'desktop' === $device_type ) {
			return $attributes;
		}

		$viewport_overrides = $attributes[ $device_type ] ?? array();

		if ( empty( $viewport_overrides ) ) {
			return $attributes;
		}

		$merged = $attributes;

		foreach ( $viewport_overrides as $attribute_group => $group_overrides ) {
			if ( isset( $merged[ $attribute_group ] ) && is_array( $merged[ $attribute_group ] ) && is_array( $group_overrides ) ) {
				$merged[ $attribute_group ] = array_merge( $merged[ $attribute_group ], $group_overrides );
			}
		}

		return $merged;
	}
}