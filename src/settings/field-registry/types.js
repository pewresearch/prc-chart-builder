/**
 * @typedef {'string' | 'number' | 'boolean' | 'color' | 'numberPair' | 'font'} FieldType
 */

/**
 * @typedef {Object} FieldDefinition
 * @property {string[]} path Dot-path segments relative to the config group root.
 * @property {FieldType} type
 * @property {boolean} themeable
 * @property {string} description
 * @property {string[]=} enum Allowed values for select controls.
 */

export {};
