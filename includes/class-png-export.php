<?php
/**
 * PNG Export Orchestrator
 *
 * Hooks into the PRC post-publish pipeline to detect when a chart's
 * rendering attributes have changed, then schedules an async Action Scheduler
 * job to call the ScreenshotOne API and save the resulting PNG to the
 * media library as the chart's featured image and pre-JS fallback.
 *
 * Storage model:
 *  - _thumbnail_id          WordPress featured image (set via set_post_thumbnail())
 *  - _chart_attributes_hash Post meta on chart CPT post (change detection)
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * PNG Export Orchestrator
 */
class PNG_Export {

	/**
	 * Action Scheduler hook for async PNG generation.
	 *
	 * @var string
	 */
	const ACTION_HOOK = 'prc_chart_generate_png';

	/**
	 * Action Scheduler group name.
	 *
	 * @var string
	 */
	const ACTION_GROUP = 'prc-chart-builder';

	/**
	 * Attachment post meta: screenshot provider slug.
	 *
	 * @var string
	 */
	public const ATTACHMENT_PROVIDER_META_KEY = '_prc_chart_screenshot_provider';

	/**
	 * IO attribute keys that are outputs of the PNG/SVG export process itself
	 * and must be excluded from the change-detection hash. These are written
	 * back to block attributes after export, so including them would cause
	 * every save after PNG generation to appear as a change.
	 *
	 * Everything else in io (colorValue, customColors, elementHasStroke,
	 * isCustomChart, customAttributes, availableCategories, chartData, etc.)
	 * directly affects chart rendering and IS included in the hash.
	 *
	 * @var string[]
	 */
	const IO_HASH_EXCLUDED_KEYS = array(
		// PNG export outputs.
		'pngUrl',
		'pngId',
		'pngGeneratedAt',
		'pngAttributesHash',
		// SVG export outputs.
		'svgUrl',
		'svgId',
		'svgGeneratedAt',
		'svgAttributesHash',
		// Static image outputs (set when a user uploads a static image).
		'staticImageUrl',
		'staticImageId',
		'staticImageInnerHTML',
	);

	/**
	 * The Screenshot_Service instance.
	 *
	 * @var Screenshot_Service
	 */
	private $screenshot_service;

	/**
	 * Constructor.
	 *
	 * @param Loader             $loader             The loader instance.
	 * @param Screenshot_Service $screenshot_service The screenshot service.
	 */
	public function __construct( $loader, Screenshot_Service $screenshot_service ) {
		$this->screenshot_service = $screenshot_service;

		// Hook into the post-publish pipeline for chart posts.
		$loader->add_action( 'prc_platform_on_chart_publish', $this, 'maybe_schedule_png_generation' );
		$loader->add_action( 'prc_platform_on_chart_update', $this, 'maybe_schedule_png_generation' );

		// Expose a REST endpoint so editors can force-schedule PNG regeneration.
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );

		// Register the Action Scheduler callback. Must be registered on every
		// request (not just WP-CLI) so the hook is available when AS processes
		// queued jobs. Mirrors the pattern in prc-pdf-extraction.
		self::register_action_hook( $this );

		add_filter( 'attachment_fields_to_edit', array( $this, 'add_attachment_fields' ), 10, 2 );
	}

	/**
	 * Register the Action Scheduler hook so the queue processor can invoke
	 * generate_png() when a job is dequeued.
	 *
	 * Separated from the constructor to mirror the explicit init() pattern
	 * used in prc-pdf-extraction, making the registration intent clear.
	 *
	 * @param PNG_Export $instance The instance whose generate_png() will handle the action.
	 */
	public static function register_action_hook( PNG_Export $instance ): void {
		add_action( self::ACTION_HOOK, array( $instance, 'generate_png' ), 10, 1 );
	}

	/**
	 * Extract the first prc-chart-builder/chart block from post content.
	 *
	 * Searches top-level blocks first, then descends one level into inner
	 * blocks to find the chart inside a controller block.
	 *
	 * @param string $post_content Raw post content.
	 * @return array|null Block array or null if not found.
	 */
	private function get_chart_block( string $post_content ): ?array {
		$blocks = parse_blocks( $post_content );

		foreach ( $blocks as $block ) {
			if ( 'prc-chart-builder/chart' === $block['blockName'] ) {
				return $block;
			}
			// Chart is nested inside prc-chart-builder/controller.
			if ( ! empty( $block['innerBlocks'] ) ) {
				foreach ( $block['innerBlocks'] as $inner ) {
					if ( 'prc-chart-builder/chart' === $inner['blockName'] ) {
						return $inner;
					}
				}
			}
		}

		return null;
	}

	/**
	 * Build a safe filename stem from chart post title for PNG media uploads.
	 * Strips punctuation; keeps letters, digits, hyphens, and underscores.
	 *
	 * @param string $raw Chart title or empty string.
	 * @return string Non-empty slug.
	 */
	private function sanitize_png_filename_stem( string $raw ): string {
		$s = strtolower( $raw );
		$s = preg_replace( '/\s+/u', '_', $s );
		$s = preg_replace( '/[^\p{L}\p{N}\-_]/u', '', $s );
		$s = preg_replace( '/_+/u', '_', $s );
		$s = preg_replace( '/^[\-_]+|[\-_]+$/u', '', $s );
		return '' !== $s ? $s : 'chart';
	}

	/**
	 * Compute a change-detection hash from chart block attributes.
	 *
	 * Strips image/export-related io keys that don't affect visual rendering
	 * so that saving a new PNG does not immediately trigger another regeneration.
	 *
	 * @param array $attrs Block attributes array.
	 * @return string MD5 hash.
	 */
	public function compute_attributes_hash( array $attrs ): string {
		// Deep-strip non-rendering io keys.
		if ( isset( $attrs['io'] ) && is_array( $attrs['io'] ) ) {
			foreach ( self::IO_HASH_EXCLUDED_KEYS as $key ) {
				unset( $attrs['io'][ $key ] );
			}
		}

		// Also strip internal migration fields.
		unset( $attrs['_legacy'], $attrs['_v1Original'], $attrs['_migrationMeta'] );

		return md5( wp_json_encode( $attrs ) );
	}

	/**
	 * Check whether a PNG generation action is already pending or running for a post.
	 *
	 * Uses as_get_scheduled_actions with explicit status checks (PENDING + RUNNING)
	 * so a currently-executing job also blocks duplicate scheduling.
	 *
	 * @param int $post_id Chart post ID.
	 * @return bool
	 */
	private function is_action_pending( int $post_id ): bool {
		if ( ! function_exists( 'as_get_scheduled_actions' ) ) {
			return false;
		}

		$actions = as_get_scheduled_actions(
			array(
				'hook'                  => self::ACTION_HOOK,
				'status'                => array(
					\ActionScheduler_Store::STATUS_PENDING,
					\ActionScheduler_Store::STATUS_RUNNING,
				),
				'group'                 => self::ACTION_GROUP,
				'args'                  => array( 'post_id' => $post_id ),
				'partial_args_matching' => 'like',
				'per_page'              => 1,
				'offset'                => 0,
			),
			'ids'
		);

		return ! empty( $actions );
	}

	/**
	 * Determine whether a PNG needs to be generated and schedule the async job.
	 *
	 * Called by both prc_platform_on_chart_publish and prc_platform_on_chart_update.
	 * Skips scheduling if:
	 *   - Action Scheduler is unavailable
	 *   - ScreenshotOne is not configured
	 *   - The chart block is not found in post content
	 *   - The attributes hash has not changed since the last PNG was generated
	 *   - A job is already pending for this post
	 *
	 * @param \WP_Post $ref_post The chart post object from the pipeline.
	 */
	public function maybe_schedule_png_generation( $ref_post ): void {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			return;
		}

		if ( ! $this->screenshot_service->is_configured() ) {
			return;
		}

		$post_id = (int) $ref_post->ID;

		$chart_block = $this->get_chart_block( $ref_post->post_content );
		if ( null === $chart_block ) {
			return;
		}

		$new_hash    = $this->compute_attributes_hash( $chart_block['attrs'] ?? array() );
		$stored_hash = get_post_meta( $post_id, '_chart_attributes_hash', true );

		// No change -- skip.
		if ( $new_hash === $stored_hash ) {
			return;
		}

		// Already queued -- skip.
		if ( $this->is_action_pending( $post_id ) ) {
			return;
		}

		as_enqueue_async_action(
			self::ACTION_HOOK,
			array( 'post_id' => $post_id ),
			self::ACTION_GROUP
		);
	}

	/**
	 * Action Scheduler callback: generate and store the chart PNG.
	 *
	 * Throwing an exception causes Action Scheduler to mark the job as failed
	 * and schedule an automatic retry.
	 *
	 * @param int    $post_id              Chart post ID.
	 * @param string $base_url             Optional origin rewrite for the export URL.
	 * @param string $export_url_override  Optional full export URL override.
	 * @throws \RuntimeException When screenshot or media sideload fails.
	 */
	public function generate_png( int $post_id, string $base_url = '', string $export_url_override = '' ): void {
		$post = get_post( $post_id );
		if ( ! $post || 'publish' !== $post->post_status ) {
			return;
		}

		// Build the export URL. An explicit override takes highest priority
		// (useful for local testing against alpha URLs). Otherwise rewrite the
		// origin when a base URL is provided, falling back to the local permalink.
		if ( ! empty( $export_url_override ) ) {
			$export_url = $export_url_override;
		} elseif ( ! empty( $base_url ) ) {
			$permalink  = trailingslashit( get_permalink( $post_id ) ) . 'export/';
			$site_url   = rtrim( site_url(), '/' );
			$export_url = rtrim( $base_url, '/' ) . substr( $permalink, strlen( $site_url ) );
		} else {
			$export_url = trailingslashit( get_permalink( $post_id ) ) . 'export/';
		}

		// Extract chart dimensions from block attributes.
		$chart_block = $this->get_chart_block( $post->post_content );
		if ( null === $chart_block ) {
			throw new \RuntimeException( 'Chart block not found in post content.' );
		}
		$layout       = $chart_block['attrs']['layout'] ?? array();
		$settings     = Screenshot_Settings::get_settings();
		$chart_width  = isset( $layout['width'] ) ? (int) $layout['width'] : (int) $settings['default_chart_width'];
		$chart_height = isset( $layout['height'] ) ? (int) $layout['height'] : (int) $settings['default_chart_height'];

		// Compute hash before the screenshot so we can store it on success.
		$new_hash = $this->compute_attributes_hash( $chart_block['attrs'] ?? array() );

		// Call the ScreenshotOne API.
		$png_binary = $this->screenshot_service->take( $export_url, $chart_width, $chart_height );

		if ( is_wp_error( $png_binary ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log(
				sprintf(
					'prc-chart-builder: PNG generation failed for post %d: %s',
					$post_id,
					$png_binary->get_error_message()
				)
			);
			throw new \RuntimeException( $png_binary->get_error_message() );
		}

		// Write binary to a temp file for media_handle_sideload().
		$tmp_file = wp_tempnam( "chart-{$post_id}.png" );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $tmp_file, $png_binary );

		$chart_title = isset( $chart_block['attrs']['metadata']['title'] ) ? (string) $chart_block['attrs']['metadata']['title'] : '';
		$raw         = '' !== trim( $chart_title ) ? $chart_title : (string) $post->post_title;
		$stem        = $this->sanitize_png_filename_stem( $raw );
		$file_array  = array(
			'name'     => sprintf( '%s-%d-%d.png', $stem, $post_id, time() ),
			'tmp_name' => $tmp_file,
			'type'     => 'image/png',
			'error'    => 0,
			'size'     => filesize( $tmp_file ),
		);

		// Sideload into the media library, attached to the chart post.
		$attachment_id = media_handle_sideload( $file_array, $post_id );

		// Clean up temp file regardless of outcome.
		@unlink( $tmp_file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		if ( is_wp_error( $attachment_id ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log(
				sprintf(
					'prc-chart-builder: media_handle_sideload failed for post %d: %s',
					$post_id,
					$attachment_id->get_error_message()
				)
			);
			throw new \RuntimeException( $attachment_id->get_error_message() );
		}

		// Tag the attachment as hidden so it is excluded from the media library UI.
		wp_set_object_terms( $attachment_id, 'hidden', '_media_visibility' );

		$this->store_screenshot_attachment_meta( (int) $attachment_id );

		// Delete the previous server-generated PNG attachment if one exists.
		$previous_attachment_id = (int) get_post_thumbnail_id( $post_id );
		if ( $previous_attachment_id && $previous_attachment_id !== $attachment_id ) {
			wp_delete_attachment( $previous_attachment_id, true );
		}

		update_post_meta( $post_id, '_chart_attributes_hash', $new_hash );

		// The featured image is the canonical reference to the server-generated PNG.
		set_post_thumbnail( $post_id, $attachment_id );
	}

	/**
	 * Persist the provider slug on a captured PNG attachment.
	 *
	 * @param int $attachment_id Sideloaded attachment ID.
	 */
	private function store_screenshot_attachment_meta( int $attachment_id ): void {
		$meta = $this->screenshot_service->get_last_capture_meta();
		if ( ! is_array( $meta ) || empty( $meta['provider'] ) ) {
			return;
		}

		update_post_meta(
			$attachment_id,
			self::ATTACHMENT_PROVIDER_META_KEY,
			sanitize_key( (string) $meta['provider'] )
		);
	}

	/**
	 * Show the screenshot provider on attachments in the media modal.
	 *
	 * @param array    $fields Attachment fields.
	 * @param \WP_Post $post   Attachment post.
	 * @return array
	 */
	public function add_attachment_fields( array $fields, $post ): array {
		if ( ! $post instanceof \WP_Post ) {
			return $fields;
		}

		$provider = get_post_meta( $post->ID, self::ATTACHMENT_PROVIDER_META_KEY, true );
		if ( ! is_string( $provider ) || '' === $provider ) {
			return $fields;
		}

		$fields['prc_chart_screenshot_provider'] = array(
			'label' => __( 'Screenshot provider', 'prc-chart-builder' ),
			'input' => 'html',
			'html'  => '<span>' . esc_html( $provider ) . '</span>',
		);

		return $fields;
	}

	/**
	 * Register REST routes for editor-side PNG regeneration.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_routes(): void {
		register_rest_route(
			'prc-chart-builder/v1',
			'/chart/(?P<id>\d+)/regenerate-png',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_force_regenerate_rest' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * REST callback: force-schedule PNG regeneration for a chart post.
	 *
	 * Clears the stored attributes hash so that the next publish/update also
	 * triggers a fresh capture, then immediately enqueues an async Action
	 * Scheduler job if one is not already pending.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function handle_force_regenerate_rest( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			return new \WP_Error(
				'action_scheduler_unavailable',
				__( 'Action Scheduler is not available.', 'prc-chart-builder' ),
				array( 'status' => 503 )
			);
		}

		$post_id = $request->get_param( 'id' );
		$post    = get_post( $post_id );

		if ( ! $post || Content_Type::$post_type !== $post->post_type ) {
			return new \WP_Error(
				'invalid_chart',
				__( 'Chart not found.', 'prc-chart-builder' ),
				array( 'status' => 404 )
			);
		}

		if ( ! $this->screenshot_service->is_configured() ) {
			return new \WP_Error(
				'service_not_configured',
				__( 'Screenshot service is not configured.', 'prc-chart-builder' ),
				array( 'status' => 503 )
			);
		}

		// Clear the stored hash so the next save also triggers regeneration.
		delete_post_meta( $post_id, '_chart_attributes_hash' );

		// Schedule immediately unless a job is already in the queue.
		$scheduled = false;
		if ( ! $this->is_action_pending( $post_id ) ) {
			as_enqueue_async_action(
				self::ACTION_HOOK,
				array( 'post_id' => $post_id ),
				self::ACTION_GROUP
			);
			$scheduled = true;
		}

		return new \WP_REST_Response(
			array(
				'scheduled' => $scheduled,
				'post_id'   => $post_id,
			),
			200
		);
	}
}
