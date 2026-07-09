import { getThemeFontName } from './theme-fonts';

/**
 * Human-readable shipped default for the config grid "Default" column.
 *
 * @param {unknown} value
 * @param {import('./field-registry/types').FieldDefinition['type']} fieldType
 * @return {string}
 */
export function formatShippedDefaultValue(value, fieldType) {
	if (value === undefined || value === null) {
		return '—';
	}

	if (fieldType === 'numberPair') {
		if (Array.isArray(value) && value.length >= 2) {
			return `[${value[0]}, ${value[1]}]`;
		}
		return String(value);
	}

	if (fieldType === 'boolean') {
		return value ? 'true' : 'false';
	}

	if (fieldType === 'font') {
		return getThemeFontName(String(value));
	}

	return String(value);
}
