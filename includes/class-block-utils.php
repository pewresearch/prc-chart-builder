<?php
namespace PRC\Platform\Chart_Builder;
// full on rip of platform core block utils class

class Block_Utils {
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
}