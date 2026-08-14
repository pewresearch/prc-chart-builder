<?php
/**
 * Playground-safe WP-CLI registration for chart theme seeding (PRC-528 slice 10).
 *
 * The main WP_CLI_Commands class requires WPCOM_VIP_CLI_Command (VIP-only).
 * Visual regression and local Playground use this lightweight command instead.
 * On VIP, class-wp-cli-commands.php registers the same subcommands — skip here
 * to avoid duplicate WP-CLI command registration.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

// VIP loads class-wp-cli-commands.php, which registers these as subcommands.
if ( class_exists( 'WPCOM_VIP_CLI_Command' ) ) {
	return;
}

/**
 * Seed the fallback chart theme when no active theme is configured.
 */
function register_theme_seeder_cli_command(): void {
	\WP_CLI::add_command(
		'prc chart-builder seed-theme',
		static function (): void {
			$result = Theme_Seeder::seed_if_empty();

			if ( is_wp_error( $result ) ) {
				\WP_CLI::error( $result->get_error_message() );
			}

			if ( false === $result ) {
				\WP_CLI::log( 'Chart theme already configured; seed skipped (idempotent no-op).' );
				return;
			}

			\WP_CLI::success( 'Seeded chart theme from chart-theme.json.' );
		}
	);

	\WP_CLI::add_command(
		'prc chart-builder repair-theme',
		static function (): void {
			$raw          = get_option( Settings::OPTION_KEY, false );
			$before       = is_array( $raw ) ? $raw : array();
			$before_count = Settings::count_palette_colors( $before );

			if ( $before_count > 0 ) {
				\WP_CLI::log(
					sprintf(
						'Palette colors already valid (%d palettes).',
						$before_count
					)
				);
				return;
			}

			if ( false === $raw || array() === $before ) {
				$result = Theme_Seeder::seed_if_empty();
				if ( is_wp_error( $result ) ) {
					\WP_CLI::error( $result->get_error_message() );
				}

				$after_count = Settings::count_palette_colors( Settings::get_active_theme() );

				if ( 0 === $after_count ) {
					\WP_CLI::error(
						'Could not restore the chart theme. Confirm chart-theme.json exists on this environment.'
					);
				}

				\WP_CLI::success(
					sprintf(
						'Seeded chart theme from chart-theme.json (%d palette catalogs).',
						$after_count
					)
				);
				return;
			}

			Settings::get_active_theme();

			$after_count = Settings::count_palette_colors( Settings::get_active_theme() );

			if ( 0 === $after_count ) {
				\WP_CLI::error(
					'Could not repair palette colors. Confirm chart-theme.json exists on this environment.'
				);
			}

			\WP_CLI::success(
				sprintf(
					'Repaired palette colors (%d palette catalogs).',
					$after_count
				)
			);
		}
	);

	\WP_CLI::add_command(
		'prc chart-builder font-tokens-audit',
		static function ( array $args, array $assoc_args ): void {
			unset( $args );
			Theme_Font_Tokens_Migration::run_cli_audit(
				array_merge(
					array( 'dry_run' => false ),
					Theme_Font_Tokens_Migration::parse_cli_batch_args( $assoc_args )
				)
			);
		}
	);

	\WP_CLI::add_command(
		'prc chart-builder font-tokens-migrate',
		static function ( array $args, array $assoc_args ): void {
			unset( $args );
			Theme_Font_Tokens_Migration::run_cli_migrate(
				array_merge(
					array(
						'dry_run'    => isset( $assoc_args['dry-run'] ),
						'skip_probe' => isset( $assoc_args['skip-probe'] ),
						'sample'     => isset( $assoc_args['probe-sample'] ) ? (int) $assoc_args['probe-sample'] : 25,
					),
					Theme_Font_Tokens_Migration::parse_cli_batch_args( $assoc_args )
				)
			);
		}
	);
}

register_theme_seeder_cli_command();
