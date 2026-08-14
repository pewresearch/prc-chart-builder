<?php
/**
 * Chart theme payload validation (PRC-528).
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;

/**
 * Validates and sanitizes chart theme REST payloads.
 */
class Theme_Validator {

	/**
	 * Allowed top-level theme keys persisted to the option.
	 *
	 * `$schema` is accepted on input (IDE pointer on the committed seed / downloads)
	 * but stripped before persistence — see sanitize().
	 *
	 * @var list<string>
	 */
	public const ALLOWED_ROOT_KEYS = array(
		'config',
		'palettes',
	);

	/**
	 * Non-persisted root keys accepted on input.
	 *
	 * @var list<string>
	 */
	public const TRANSIENT_ROOT_KEYS = array(
		'$schema',
	);

	/**
	 * Validate and sanitize a theme payload for persistence.
	 *
	 * @param mixed $input Raw request body.
	 * @return array<string, mixed>|WP_Error Sanitized theme or error.
	 */
	public static function validate( $input ) {
		if ( ! is_array( $input ) ) {
			return new WP_Error(
				'invalid_theme_payload',
				__( 'Theme payload must be a JSON object.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		if ( array_is_list( $input ) ) {
			return new WP_Error(
				'invalid_theme_payload',
				__( 'Theme payload must be an object, not a list.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		$allowed_input_keys = array_merge( self::ALLOWED_ROOT_KEYS, self::TRANSIENT_ROOT_KEYS );

		foreach ( array_keys( $input ) as $key ) {
			if ( ! in_array( $key, $allowed_input_keys, true ) ) {
				return new WP_Error(
					'invalid_theme_key',
					sprintf(
						/* translators: %s: disallowed key name */
						__( 'Unknown theme key "%s".', 'prc-chart-builder' ),
						(string) $key
					),
					array( 'status' => 400 )
				);
			}
		}

		if ( isset( $input['config'] ) && ! self::is_assoc_array( $input['config'] ) ) {
			return new WP_Error(
				'invalid_theme_config',
				__( 'Theme config must be an object.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		if ( isset( $input['palettes'] ) && ! self::is_assoc_array( $input['palettes'] ) ) {
			return new WP_Error(
				'invalid_theme_palettes',
				__( 'Theme palettes must be an object.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		return self::sanitize( $input );
	}

	/**
	 * @param array<string, mixed> $input Validated theme input.
	 * @return array<string, mixed>
	 */
	private static function sanitize( array $input ): array {
		$output = array();

		if ( isset( $input['config'] ) ) {
			$output['config'] = $input['config'];
		}

		if ( isset( $input['palettes'] ) ) {
			$output['palettes'] = self::sanitize_palettes( $input['palettes'] );
		}

		return $output;
	}

	/**
	 * @param array<string, mixed> $palettes Raw palettes object.
	 * @return array<string, mixed>
	 */
	private static function sanitize_palettes( array $palettes ): array {
		$output = array();

		if ( isset( $palettes['colors'] ) && is_array( $palettes['colors'] ) && ! array_is_list( $palettes['colors'] ) ) {
			$colors = array();
			foreach ( $palettes['colors'] as $slug => $swatches ) {
				if ( ! is_string( $slug ) || ! is_array( $swatches ) || ! array_is_list( $swatches ) ) {
					continue;
				}
				$colors[ sanitize_key( $slug ) ] = array_values(
					array_filter(
						array_map( 'sanitize_hex_color', $swatches ),
						static fn( $color ) => is_string( $color ) && '' !== $color
					)
				);
			}
			$output['colors'] = $colors;
		}

		if ( isset( $palettes['colorNames'] ) && is_array( $palettes['colorNames'] ) && array_is_list( $palettes['colorNames'] ) ) {
			$color_names = array();
			foreach ( $palettes['colorNames'] as $entry ) {
				if ( ! is_array( $entry ) || array_is_list( $entry ) ) {
					continue;
				}
				$label = isset( $entry['label'] ) ? sanitize_text_field( (string) $entry['label'] ) : '';
				$value = isset( $entry['value'] ) ? sanitize_key( (string) $entry['value'] ) : '';
				if ( '' === $label || '' === $value ) {
					continue;
				}
				$color_names[] = array(
					'label' => $label,
					'value' => $value,
				);
			}
			$output['colorNames'] = $color_names;
		}

		return $output;
	}

	/**
	 * @param mixed $value Candidate array.
	 */
	private static function is_assoc_array( $value ): bool {
		return is_array( $value ) && ! array_is_list( $value );
	}
}
