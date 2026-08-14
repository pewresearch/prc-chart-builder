/**
 * True when another controller block in the editor shares this Chart ID.
 *
 * @param {Array<{clientId: string, attributes?: {id?: string}}>} controllers Controllers in the editor.
 * @param {string}                                                clientId    Current controller client id.
 * @param {string}                                                id          Chart id to check.
 * @return {boolean} Whether a sibling controller uses the same id.
 */
export function hasSiblingDuplicateChartId(controllers, clientId, id) {
	if (!id || !Array.isArray(controllers)) {
		return false;
	}

	return controllers.some(
		(block) => block?.clientId !== clientId && block?.attributes?.id === id
	);
}
