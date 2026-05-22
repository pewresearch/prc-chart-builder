/**
 * WordPress Dependencies
 */
import { usePresenceUsers } from '@prc/hooks';
import { useEffect } from '@wordpress/element';

/**
 * When true, the lock fires even when the current user is the one present in the
 * chart room. Set to true during development so you can test the full lock flow
 * with two browser tabs under a single account. Flip to false (or remove the
 * constant entirely) before shipping to production.
 */
const PRESENCE_LOCK_SELF = true;

/**
 * When true, emit verbose presence diagnostics to the console under the
 * `[chart-presence]` tag. Flip to false to silence.
 */
const PRESENCE_DEBUG = false;

/**
 * Presence room for the chart CPT editor, matching `wp_presence_post_room()` in PHP.
 *
 * @param {number} ref Chart post ID.
 * @return {string} Room identifier.
 */
function chartPresenceRoom(ref) {
	return `postType/chart:${ref}`;
}

/**
 * Subscribes to Presence API data for a chart entity referenced by a synced-chart block.
 *
 * When the Presence API plugin is not loaded on the site, `usePresenceUsers`
 * detects that internally (via `window.prcPlatform.presenceApiEnabled`) and
 * becomes a no-op — so callers don't need to gate on it here. That flag is a
 * temporary platform bridge; it should disappear when Presence is integrated
 * more deeply and `@prc/hooks` no longer needs a separate opt-in.
 *
 * @param {number|undefined} ref Chart post ID from the synced-chart `ref` attribute.
 * @return {{
 *   isLocked: boolean,
 *   editors: Array<{ userId: number, displayName: string, data: Object }>
 * }}
 */
export default function useChartPresence(ref) {
	const room = ref ? chartPresenceRoom(ref) : null;

	const { isPresent, users } = usePresenceUsers(room, {
		includeSelf: PRESENCE_LOCK_SELF,
		debug: PRESENCE_DEBUG ? 'chart-presence' : false,
	});

	useEffect(() => {
		if (!PRESENCE_DEBUG) return;
		// eslint-disable-next-line no-console
		console.log('[chart-presence] room state', {
			ref,
			room,
			isLocked: isPresent,
			editorCount: users.length,
			editors: users.map((u) => ({
				userId: u.userId,
				displayName: u.displayName,
				data: u.data,
			})),
		});
	}, [ref, room, isPresent, users]);

	return {
		isLocked: isPresent,
		editors: users,
	};
}
