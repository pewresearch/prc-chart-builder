/**
 * Hide the block toolbar while a block inside the chart CPT wizard is
 * selected. The wizard owns navigation and settings, so the toolbar only
 * surfaces controls (switcher, mover, align, lock, options) that editors
 * should not use there.
 *
 * Scoped by selection and toggled with a body class instead of block
 * supports: `__experimentalToolbar` is per block type, so it would also
 * strip the toolbar from these block types in posts and from generic
 * children (paragraphs, tables) everywhere. The site-wide Top toolbar
 * preference is never touched.
 */

const CHART = 'prc-chart-builder/chart';
const SYNCED_CHART = 'prc-chart-builder/synced-chart';
const FREEFORM_GROUP_CLASS = 'wp-chart-builder-freeform-chart';

/**
 * @typedef {Object} BlockRef
 * @property {string} clientId     Block clientId.
 * @property {string} name         Block type name.
 * @property {Object} [attributes] Block attributes.
 */

/**
 * Whether the selection sits inside the locked freeform group
 * (controller > chart > core/group.wp-chart-builder-freeform-chart).
 * Mirrors how Controller::render() finds the freeform content: the
 * controller's `isFreeform` attribute plus the group's class name.
 *
 * @param {Object}     controllerAttributes Controller attributes.
 * @param {number}     controllerIndex      Controller position in `ancestors`.
 * @param {BlockRef[]} ancestors            Root-first ancestors of the selection.
 * @return {boolean} True for content blocks inside the freeform group.
 */
function isInsideFreeformGroup(
	controllerAttributes,
	controllerIndex,
	ancestors
) {
	if (controllerAttributes?.isFreeform !== true || controllerIndex < 0) {
		return false;
	}
	const chart = ancestors[controllerIndex + 1];
	const group = ancestors[controllerIndex + 2];
	return (
		chart?.name === CHART &&
		group?.name === 'core/group' &&
		(group.attributes?.className || '')
			.split(/\s+/)
			.includes(FREEFORM_GROUP_CLASS)
	);
}

/**
 * @param {Object}        args
 * @param {string}        args.controllerClientId     Wizard-hosting controller clientId.
 * @param {Object}        [args.controllerAttributes] Wizard-hosting controller attributes.
 * @param {BlockRef|null} args.selected               Selection-start block.
 * @param {BlockRef[]}    args.ancestors              Root-first ancestors of the selected block.
 * @return {boolean} True when the selected block belongs to the wizard.
 */
export function shouldHideBlockToolbar({
	controllerClientId,
	controllerAttributes,
	selected,
	ancestors = [],
}) {
	if (!controllerClientId || !selected) {
		return false;
	}
	if (
		selected.name === SYNCED_CHART ||
		ancestors.some((block) => block.name === SYNCED_CHART)
	) {
		return false;
	}
	if (selected.clientId === controllerClientId) {
		return true;
	}
	const controllerIndex = ancestors.findIndex(
		(block) => block.clientId === controllerClientId
	);
	if (controllerIndex < 0) {
		return false;
	}
	return !isInsideFreeformGroup(
		controllerAttributes,
		controllerIndex,
		ancestors
	);
}
