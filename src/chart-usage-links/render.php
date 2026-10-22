<?php
/**
 * Render chart usage links.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

$chart_post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : 0;
if ( $chart_post_id <= 0 || Content_Type::$post_type !== get_post_type( $chart_post_id ) ) {
	return;
}

$links = Chart_Usage_Links::render_links( $chart_post_id );
if ( '' === $links ) {
	return;
}

printf(
	'<div %1$s>%2$s</div>',
	get_block_wrapper_attributes(),
	$links // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
);
