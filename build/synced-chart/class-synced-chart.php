<?php
/**
 * Synced Chart Block
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Synced Chart Block
 *
 * @package PRC\Platform\Chart_Builder
 */
class Synced_Chart {
	/**
	 * Fully-qualified block type for the synced-chart block.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'prc-chart-builder/synced-chart';

	/**
	 * The meta key for storing post IDs where synced charts are used.
	 *
	 * @var string
	 */
	public static $synced_chart_usage_meta_key = 'prc_synced_chart_used_in_posts';

	/**
	 * Parent-post meta: chart CPT IDs currently embedded via synced-chart blocks.
	 *
	 * Used as a reverse index so publish-pipeline updates can diff add/remove
	 * without scanning every chart on the site.
	 *
	 * @var string
	 */
	public static $synced_chart_refs_meta_key = '_prc_synced_chart_refs';

	/**
	 * Constructor
	 *
	 * @param object $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_action( 'enqueue_block_editor_assets', $this, 'enqueue_editor_assets' );

		// Usage tracking — post-publish pipeline (not frontend render).
		$loader->add_action( 'prc_platform_on_publish', $this, 'sync_usage_from_pipeline', 10, 2 );
		$loader->add_action( 'prc_platform_on_update', $this, 'sync_usage_from_pipeline', 10, 2 );
		$loader->add_action( 'prc_platform_on_untrash', $this, 'sync_usage_from_pipeline', 10, 2 );
		$loader->add_action( 'prc_platform_on_unpublish', $this, 'clear_usage_from_pipeline', 10, 2 );
		$loader->add_action( 'prc_platform_on_trash', $this, 'clear_usage_from_pipeline', 10, 2 );
	}

	/**
	 * Scan raw post content for synced-chart blocks and collect chart CPT refs.
	 *
	 * Also expands `core/block` (reusable/synced pattern) refs and scans their
	 * stored content, matching render-time expansion of those embeds.
	 *
	 * @param string $content        Raw post content.
	 * @param array  $seen_reusables Reusable post IDs already visited (recursion guard).
	 * @return int[] Chart post IDs (may contain duplicates; callers should dedupe).
	 */
	public static function extract_synced_chart_refs( string $content, array $seen_reusables = array() ): array {
		if ( '' === $content ) {
			return array();
		}

		$has_synced   = false !== strpos( $content, self::BLOCK_NAME );
		$has_reusable = false !== strpos( $content, 'wp:block ' )
			|| false !== strpos( $content, 'wp:block{' );

		if ( ! $has_synced && ! $has_reusable ) {
			return array();
		}

		$refs      = array();
		$processor = new \WP_Block_Processor( $content );

		while ( $processor->next_block() ) {
			if ( $processor->is_block_type( self::BLOCK_NAME ) ) {
				$attrs = $processor->allocate_and_return_parsed_attributes();

				if ( ! empty( $attrs['ref'] ) ) {
					$refs[] = (int) $attrs['ref'];
				}
				continue;
			}

			if ( ! $processor->is_block_type( 'core/block' ) ) {
				continue;
			}

			$attrs       = $processor->allocate_and_return_parsed_attributes();
			$reusable_id = ! empty( $attrs['ref'] ) ? (int) $attrs['ref'] : 0;

			if ( $reusable_id <= 0 || isset( $seen_reusables[ $reusable_id ] ) ) {
				continue;
			}

			$seen_reusables[ $reusable_id ] = true;
			$reusable                       = get_post( $reusable_id );

			if ( ! $reusable || empty( $reusable->post_content ) ) {
				continue;
			}

			$refs = array_merge(
				$refs,
				self::extract_synced_chart_refs( (string) $reusable->post_content, $seen_reusables )
			);
		}

		return $refs;
	}

	/**
	 * Sync chart usage meta from a published/updated/untrashed parent post.
	 *
	 * Only records usage when the current status is `publish`. The untrash
	 * hook also fires for trash → draft, which must not rewrite usage meta.
	 *
	 * @hook prc_platform_on_publish 10
	 * @hook prc_platform_on_update  10
	 * @hook prc_platform_on_untrash 10
	 *
	 * @param object $post       Extended WP_Post-like object from the pipeline.
	 * @param bool   $has_blocks Whether the post contains block markup.
	 */
	public function sync_usage_from_pipeline( $post, bool $has_blocks ): void {
		if ( ! isset( $post->ID, $post->post_type, $post->post_status ) ) {
			return;
		}

		if ( 'publish' !== $post->post_status ) {
			return;
		}

		if ( Content_Type::$post_type === $post->post_type ) {
			return;
		}

		$parent_id = (int) $post->ID;
		$old_refs  = get_post_meta( $parent_id, self::$synced_chart_refs_meta_key, true );

		if ( ! is_array( $old_refs ) ) {
			// Legacy parents may lack the reverse index; discover charts that
			// still list this parent in usage meta so removals can clear them.
			$old_refs = $this->find_charts_referencing_parent( $parent_id );
		} else {
			$old_refs = array_map( 'intval', $old_refs );
		}

		$new_refs = array();
		if ( $has_blocks && ! empty( $post->post_content ) ) {
			$new_refs = array_values(
				array_unique(
					self::extract_synced_chart_refs( (string) $post->post_content )
				)
			);
		}

		$new_refs = $this->filter_valid_chart_ids( $new_refs );

		foreach ( array_diff( $new_refs, $old_refs ) as $chart_id ) {
			$this->add_post_id_to_chart_usage( $chart_id, $parent_id );
		}

		foreach ( array_diff( $old_refs, $new_refs ) as $chart_id ) {
			$this->remove_post_id_from_chart_usage( $chart_id, $parent_id );
		}

		if ( empty( $new_refs ) ) {
			delete_post_meta( $parent_id, self::$synced_chart_refs_meta_key );
		} else {
			update_post_meta( $parent_id, self::$synced_chart_refs_meta_key, $new_refs );
		}
	}

	/**
	 * Remove a parent post from chart usage meta on unpublish/trash.
	 *
	 * @hook prc_platform_on_unpublish 10
	 * @hook prc_platform_on_trash     10
	 *
	 * @param object $post       Extended WP_Post-like object from the pipeline.
	 * @param bool   $has_blocks Whether the post contains block markup.
	 */
	public function clear_usage_from_pipeline( $post, bool $has_blocks = false ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		if ( ! isset( $post->ID, $post->post_type ) ) {
			return;
		}

		if ( Content_Type::$post_type === $post->post_type ) {
			return;
		}

		$parent_id = (int) $post->ID;
		$refs      = get_post_meta( $parent_id, self::$synced_chart_refs_meta_key, true );

		if ( ! is_array( $refs ) ) {
			// Legacy parents may lack the reverse index; discover charts that
			// still list this parent in usage meta so stale entries clear.
			$refs = $this->find_charts_referencing_parent( $parent_id );
		}

		foreach ( array_unique( array_map( 'intval', $refs ) ) as $chart_id ) {
			$this->remove_post_id_from_chart_usage( $chart_id, $parent_id );
		}

		delete_post_meta( $parent_id, self::$synced_chart_refs_meta_key );
	}

	/**
	 * Discover chart CPT IDs that still list a parent in usage meta.
	 *
	 * Used when a legacy parent has no reverse index yet.
	 *
	 * @param int $parent_id Parent post ID.
	 * @return int[]
	 */
	private function find_charts_referencing_parent( int $parent_id ): array {
		if ( $parent_id <= 0 ) {
			return array();
		}

		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$candidate_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id
				FROM {$wpdb->postmeta} pm
				INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
				WHERE pm.meta_key = %s
					AND pm.meta_value LIKE %s
					AND p.post_type = %s",
				self::$synced_chart_usage_meta_key,
				'%' . $wpdb->esc_like( 'i:' . $parent_id . ';' ) . '%',
				Content_Type::$post_type
			)
		);

		if ( empty( $candidate_ids ) ) {
			return array();
		}

		$chart_ids = array();
		foreach ( array_map( 'intval', $candidate_ids ) as $chart_id ) {
			$usage = get_post_meta( $chart_id, self::$synced_chart_usage_meta_key, true );
			if ( ! is_array( $usage ) ) {
				continue;
			}

			$usage = array_map( 'intval', $usage );
			if ( in_array( $parent_id, $usage, true ) ) {
				$chart_ids[] = $chart_id;
			}
		}

		return $chart_ids;
	}

	/**
	 * Keep only IDs that resolve to chart CPT posts.
	 *
	 * @param int[] $ids Candidate post IDs.
	 * @return int[]
	 */
	private function filter_valid_chart_ids( array $ids ): array {
		$valid = array();

		foreach ( array_unique( array_map( 'intval', $ids ) ) as $id ) {
			if ( $this->is_valid_chart_id( $id ) ) {
				$valid[] = $id;
			}
		}

		return $valid;
	}

	/**
	 * Whether a post ID is a chart CPT.
	 *
	 * @param int $chart_post_id Post ID.
	 * @return bool
	 */
	private function is_valid_chart_id( int $chart_post_id ): bool {
		if ( $chart_post_id <= 0 ) {
			return false;
		}

		$chart = get_post( $chart_post_id );
		return $chart instanceof \WP_Post && Content_Type::$post_type === $chart->post_type;
	}

	/**
	 * Add a post ID to the chart's usage tracking meta.
	 *
	 * @param int $chart_post_id The chart post ID.
	 * @param int $current_post_id The post ID where the chart is being used.
	 * @return void
	 */
	private function add_post_id_to_chart_usage( $chart_post_id, $current_post_id ) {
		if ( ! is_numeric( $chart_post_id ) || ! is_numeric( $current_post_id ) ) {
			return;
		}

		$chart_post_id   = (int) $chart_post_id;
		$current_post_id = (int) $current_post_id;

		if ( ! $this->is_valid_chart_id( $chart_post_id ) ) {
			return;
		}

		if ( $chart_post_id === $current_post_id || wp_is_post_revision( $current_post_id ) || wp_is_post_autosave( $current_post_id ) ) {
			return;
		}

		$existing_post_ids = get_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, true );

		if ( ! is_array( $existing_post_ids ) ) {
			$existing_post_ids = array();
		}

		if ( ! in_array( $current_post_id, $existing_post_ids, true ) ) {
			$existing_post_ids[] = $current_post_id;
			update_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, $existing_post_ids );
		}
	}

	/**
	 * Remove a parent post ID from a chart's usage tracking meta.
	 *
	 * @param int $chart_post_id The chart post ID.
	 * @param int $parent_post_id The parent post ID to remove.
	 * @return void
	 */
	private function remove_post_id_from_chart_usage( $chart_post_id, $parent_post_id ) {
		if ( ! is_numeric( $chart_post_id ) || ! is_numeric( $parent_post_id ) ) {
			return;
		}

		$chart_post_id  = (int) $chart_post_id;
		$parent_post_id = (int) $parent_post_id;

		$existing_post_ids = get_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, true );
		if ( ! is_array( $existing_post_ids ) ) {
			return;
		}

		$filtered = array_values(
			array_filter(
				$existing_post_ids,
				static function ( $id ) use ( $parent_post_id ) {
					return (int) $id !== $parent_post_id;
				}
			)
		);

		if ( count( $filtered ) === count( $existing_post_ids ) ) {
			return;
		}

		if ( empty( $filtered ) ) {
			delete_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key );
		} else {
			update_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, $filtered );
		}
	}

	/**
	 * Get the list of post IDs where a specific chart is used.
	 *
	 * @param int $chart_post_id The chart post ID.
	 * @return array Array of post IDs where the chart is used.
	 */
	public static function get_chart_usage_post_ids( $chart_post_id ) {
		if ( ! is_numeric( $chart_post_id ) ) {
			return array();
		}

		$chart_post_id = (int) $chart_post_id;
		$post_ids      = get_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, true );

		if ( ! is_array( $post_ids ) ) {
			return array();
		}

		$post_ids = array_unique(
			array_filter(
				$post_ids,
				static function ( $id ) {
					return ! wp_is_post_revision( $id ) && ! wp_is_post_autosave( $id );
				}
			)
		);

		return array_values( $post_ids );
	}

	/**
	 * Apply optional align wrapper around rendered content.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content    Rendered HTML.
	 * @return string
	 */
	private function apply_align_wrapper( array $attributes, string $content ): string {
		if ( empty( $attributes['align'] ) ) {
			return $content;
		}

		return sprintf(
			'<div %1$s>%2$s</div>',
			get_block_wrapper_attributes(),
			$content
		);
	}

	/**
	 * Render block callback
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content Block content.
	 * @return string Block content.
	 */
	public function render_block_callback( $attributes, $content ) {
		static $seen_refs = array();

		if ( empty( $attributes['ref'] ) ) {
			return '';
		}

		$synced_chart_block = get_post( $attributes['ref'] );
		if ( ! $synced_chart_block || Content_Type::$post_type !== $synced_chart_block->post_type ) {
			return '';
		}

		// When previewing, use the active fork if the chart has one.
		$is_fork_preview = false;
		if ( is_preview() ) {
			$active_fork_id = get_post_meta( $synced_chart_block->ID, '_prc_active_fork', true );
			if ( $active_fork_id ) {
				$fork_post = get_post( $active_fork_id );
				if ( $fork_post && Content_Type::$post_type === $fork_post->post_type ) {
					$synced_chart_block = $fork_post;
					$attributes['ref']  = $fork_post->ID;
					$is_fork_preview    = true;
				}
			}
		}

		$ref = (int) $attributes['ref'];

		if ( isset( $seen_refs[ $ref ] ) ) {
			// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
			// is set in `wp_debug_mode()`.
			$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

			return $is_debug ?
				// translators: Visible only in the front end, this warning takes the place of a faulty block.
				__( '[block rendering halted]' ) :
				'';
		}

		$allowed_statuses = array( 'publish' );
		if ( is_user_logged_in() || is_preview() ) {
			$allowed_statuses[] = 'draft';
			$allowed_statuses[] = 'future';
			$allowed_statuses[] = 'private';
		} elseif ( ! empty( $synced_chart_block->post_password ) ) {
			return '';
		}

		if ( ! in_array( $synced_chart_block->post_status, $allowed_statuses, true ) ) {
			return '';
		}

		$seen_refs[ $ref ] = true;

		// Handle embeds for synced chart blocks.
		global $wp_embed;
		$content = $wp_embed->run_shortcode( $synced_chart_block->post_content );
		$content = $wp_embed->autoembed( $content );

		// Render blocks manually so we can pass refId context through to child
		// blocks (e.g. the controller block). do_blocks() discards parent context,
		// but WP_Block::render() with $available_context propagates it correctly.
		// Each embed must re-render so Block_Utils::claim_unique_render_id() can
		// assign distinct DOM / Interactivity ids for duplicate charts on a page.
		$parsed  = parse_blocks( $content );
		$content = '';
		foreach ( $parsed as $parsed_block ) {
			$content .= ( new \WP_Block(
				$parsed_block,
				array( 'refId' => $ref )
			) )->render();
		}

		if ( $is_fork_preview && class_exists( '\PRC\Platform\Revisions\Future_Revisions' ) ) {
			$content = \PRC\Platform\Revisions\Future_Revisions::get_future_revision_banner_html(
				array(
					'label' => __( 'Previewing future revision', 'prc-chart-builder' ),
				)
			) . $content;
		}

		unset( $seen_refs[ $ref ] );

		return $this->apply_align_wrapper( $attributes, $content );
	}

	/**
	 * Block init
	 *
	 * @hook init
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_CHART_BUILDER_DIR . '/build/synced-chart',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}

	/**
	 * Localize Chart Library data for the create-new-chart modal in the block editor.
	 *
	 * @hook enqueue_block_editor_assets
	 */
	public function enqueue_editor_assets() {
		$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( 'prc-chart-builder/synced-chart' );
		if ( ! $block_type || empty( $block_type->editor_script_handles ) ) {
			return;
		}

		wp_localize_script(
			$block_type->editor_script_handles[0],
			'prcChartBuilderLibrary',
			Admin::get_library_localized_data()
		);
	}
}
