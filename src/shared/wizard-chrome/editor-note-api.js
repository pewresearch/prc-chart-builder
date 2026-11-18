/**
 * Read Gutenberg's private `selectNote` action.
 *
 * The note composer is not on the public editor store. `unlock` reaches the
 * private action the collab sidebar uses. A missing or unlocked-incompatible
 * dispatch result returns null so the caller can fall back.
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/editor'
);

/**
 * @param {Object|null|undefined} dispatchResult Result of `dispatch(editorStore)`.
 * @return {Function|null} `selectNote`, or null when the private action is unavailable.
 */
export function readSelectNote(dispatchResult) {
	if (!dispatchResult) {
		return null;
	}
	try {
		const actions = unlock(dispatchResult);
		return typeof actions?.selectNote === 'function'
			? actions.selectNote
			: null;
	} catch {
		return null;
	}
}
