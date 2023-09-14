<?php
namespace PRC;

class Legacy_Conversion extends PRC_Chart_Builder {
	public function __construct($init = false) {
		if ( true === $init ) {
			add_action( 'rest_api_init', array( $this, 'register_rest_endpoint' ) );
		}
	}

	public function register_rest_endpoint() {
		register_rest_route(
			'prc-api/v2',
			'/chart-builder-migration',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'restfully_get_chart_settings' ),
				'args'                => array(
					'postId' => array(
						'validate_callback' => function( $param, $request, $key ) {
							return is_string( $param );
						},
					),
				),
				'permission_callback' => function () {
					return true;
				},
			)
		);
	}

	public function restfully_get_chart_settings( \WP_REST_Request $request ) {
		$post_id = $request->get_param( 'postId' );

		$chart_title = get_the_title($post_id);
		$chart_meta = get_post_meta($post_id);
		$chart_meta = array_map(function($item) {
			return $item[0];
		}, $chart_meta);

		// check if chart_meta has a cb_type key. if not then check for chart_meta and json_decode it and check for charttype in there.
		if ( array_key_exists('chart_meta', $chart_meta) && ! empty($chart_meta['chart_meta']) ) {
			$legacy_meta = maybe_unserialize($chart_meta['chart_meta']);
			if ( ! array_key_exists('cb_type', $chart_meta) && is_array( $legacy_meta ) && array_key_exists('charttype', $legacy_meta) ) {
				$chart_meta['cb_type'] = $legacy_meta['charttype'];
			}

			if ( ! array_key_exists('cb_xaxis_type', $chart_meta) && is_array( $legacy_meta ) && array_key_exists('xaxistype', $legacy_meta) ) {
				$chart_meta['cb_xaxis_type'] = $legacy_meta['xaxistype'];
			}
			if ( ! array_key_exists('cb_xaxis_label', $chart_meta) && is_array( $legacy_meta ) && array_key_exists('xaxislabel', $legacy_meta) ) {
				$chart_meta['cb_xaxis_label'] = $legacy_meta['xaxislabel'];
			}

			if ( ! array_key_exists('cb_yaxis_label', $chart_meta) && is_array( $legacy_meta ) && array_key_exists('yaxislabel', $legacy_meta) ) {
				$chart_meta['cb_yaxis_label'] = $legacy_meta['yaxislabel'];
			}
			if ( ! array_key_exists('cb_yaxis_max_value', $chart_meta) && is_array( $legacy_meta ) && array_key_exists('yaxislabel', $legacy_meta) ) {
				$chart_meta['cb_yaxis_max_value'] = $legacy_meta['yaxismax'];
			}

			if ( ! array_key_exists('cb_subtitle', $chart_meta) && is_array( $legacy_meta ) && array_key_exists('chartsubtitle', $legacy_meta) ) {
				$chart_meta['cb_subtitle'] = $legacy_meta['chartsubtitle'];
			}
		}
		

		return array(
			'chartTitle' => $chart_title,
			'chartMeta' => $chart_meta,
		);
	}
}
