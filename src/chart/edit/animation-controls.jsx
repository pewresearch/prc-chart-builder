// V2
/**
 * Animation Inspector panel (PRC-17 slice 3c → 3d).
 *
 * Author-facing controls for `config.animation`. Slice 3c shipped the two
 * simplest settings — an `enabled` toggle and a shared `duration` range.
 * Slice 3d completes the generic control surface (before the consuming
 * primitives fan out to the other chart families in 3e+):
 *
 *   - shared `easing` SelectControl (the default timing curve)
 *   - entrance `type` SelectControl, with options resolved per chart family
 *   - per-section `enabled` + `duration` for the `initial` (entrance) and
 *     `update` (data-change) sections
 *
 * Every field maps 1:1 onto the resolution hierarchy implemented once in
 * `useAnimationConfig` (section value ?? top-level value ?? hard default,
 * see `types/animation.ts`). The panel only writes what the author touches;
 * unset fields fall back through that hierarchy in the hook.
 *
 * Mirrors the bar-controls.jsx pattern: viewport-aware reads/writes via
 * `useViewportAttributes`, focusable PanelBody via `useFocusedPanel`.
 *
 * Animation is DISABLED by default (`baseConfig.animation.enabled` is
 * false and the block attribute defaults to `{}`), so an untouched chart
 * renders statically. Flipping the toggle on writes
 * `animation.enabled = true`, which `get-config.js` merges into
 * `config.animation` for both the editor preview and the serialized
 * frontend render.
 */

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	LINE_CHART_TYPES,
	NODE_CHART_TYPES,
	POINT_CHART_TYPES,
} from '../utils/chart-types';
import { useFocusedPanel } from './inspector-focus-context';
import { useViewportAttributes } from './use-viewport-attributes';

const DEFAULT_DURATION = 400;
const DEFAULT_EASING = 'easeInOutCubic';

/**
 * Curated easing options — mirrors the `AnimationEasing` union in
 * `types/animation.ts`. The hook maps each name to the corresponding
 * `@react-spring/web` `easings[name]` function, so this list is the
 * single author-facing surface for that union.
 */
const EASING_OPTIONS = [
	{ value: 'linear', label: __('Linear') },
	{ value: 'easeInOutQuad', label: __('Smooth — ease in-out (quad)') },
	{ value: 'easeInOutCubic', label: __('Smooth — ease in-out (cubic)') },
	{ value: 'easeInOutSine', label: __('Smooth — ease in-out (sine)') },
	{ value: 'easeOutCubic', label: __('Decelerate — ease out (cubic)') },
	{ value: 'easeOutQuint', label: __('Decelerate — ease out (quint)') },
	// Removed playful easings for now from "serious charts".
	// { value: 'easeOutBack', label: __('Playful — overshoot (back)') },
	// { value: 'easeOutBounce', label: __('Playful — bounce') },
	// { value: 'easeOutElastic', label: __('Playful — elastic') },
];

/**
 * The natural entrance for each chart family — what `'auto'` resolves to in
 * `useAnimationConfig`. Used both to label the "Automatic" option and to
 * offer the family-native concrete type alongside the universal `fade`/`none`.
 */
const FAMILY_NATIVE_ENTRANCE = {
	bar: { value: 'grow', label: __('Grow') },
	circle: { value: 'pop', label: __('Pop') },
	line: { value: 'draw', label: __('Draw on') },
	area: { value: 'draw', label: __('Draw on') },
	pie: { value: 'sweep', label: __('Sweep') },
};

/**
 * Resolve a chart-builder layout type to an animation family. Mirrors the
 * `AnimationFamily` union the hook resolves `'auto'` against. Which chart
 * types show this panel is gated by `ANIMATED_CHART_TYPES` in
 * `utils/chart-types.js`.
 *
 * @param {string} chartType The `layout.type` attribute value.
 * @return {'bar'|'line'|'area'|'circle'|'pie'} The animation family.
 */
function resolveFamily(chartType) {
	if (LINE_CHART_TYPES.includes(chartType)) {
		return 'area' === chartType || 'stacked-area' === chartType
			? 'area'
			: 'line';
	}
	if (
		NODE_CHART_TYPES.includes(chartType) ||
		POINT_CHART_TYPES.includes(chartType)
	) {
		return 'circle';
	}
	if ('pie' === chartType) {
		return 'pie';
	}
	return 'bar';
}

/**
 * Build the entrance-type options for a family: Automatic (labelled with the
 * family-native entrance), the concrete native type, then the universal
 * `fade` and `none`.
 *
 * @param {'bar'|'line'|'area'|'circle'|'pie'} family Animation family.
 * @return {Array<{value:string,label:string}>} SelectControl options.
 */
function entranceOptionsForFamily(family) {
	const native = FAMILY_NATIVE_ENTRANCE[family] ?? FAMILY_NATIVE_ENTRANCE.bar;
	const options = [
		{
			value: 'auto',
			/* translators: %s is the family's natural entrance, e.g. "Grow". */
			label: sprintf(__('Automatic (%s)'), native.label),
		},
		native,
	];
	if ('pie' === family) {
		options.push({ value: 'clockwise', label: __('Clockwise wipe') });
	}
	options.push(
		{ value: 'fade', label: __('Fade') },
		{ value: 'none', label: __('None (appear instantly)') }
	);
	return options;
}

/**
 * Track the OS `prefers-reduced-motion: reduce` setting, live. Mirrors the
 * accessibility contract in `useAnimationConfig`: the preview must never
 * override reduced motion, so the button reads this to disable itself.
 *
 * @return {boolean} Whether the user prefers reduced motion.
 */
function usePrefersReducedMotion() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		if (
			typeof window === 'undefined' ||
			typeof window.matchMedia !== 'function'
		) {
			return undefined;
		}
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		setPrefersReducedMotion(query.matches);
		const handleChange = (event) => setPrefersReducedMotion(event.matches);
		query.addEventListener('change', handleChange);
		return () => query.removeEventListener('change', handleChange);
	}, []);

	return prefersReducedMotion;
}

function AnimationControls({
	attributes,
	setAttributes,
	onPreviewAnimation,
	isPreviewingAnimation,
}) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('animation');
	const prefersReducedMotion = usePrefersReducedMotion();

	const layout = getCurrentValue('layout') || {};
	const family = resolveFamily(layout.type);

	// Read the merged animation group so we can spread nested sections on
	// write. Falls back to `{}` for charts saved before the attribute existed.
	const animation = getCurrentValue('animation') || {};
	const enabled = animation.enabled ?? false;
	const duration = animation.duration ?? DEFAULT_DURATION;
	const easing = animation.easing ?? DEFAULT_EASING;

	const triggerOnViewport = animation.triggerOnViewport ?? false;
	const viewportDelay = animation.viewportDelay ?? 0;

	const initial = animation.initial ?? {};
	const update = animation.update ?? {};
	const entranceEnabled = initial.enabled ?? true;
	const entranceType = initial.type ?? 'auto';
	const entranceDuration = initial.duration ?? duration;
	const updateEnabled = update.enabled ?? true;
	const updateDuration = update.duration ?? duration;

	// "Follow" (secondary) entrance: a dependent element that plays after the
	// primary finishes. One generic control surface covers every family —
	// line/area markers (wait for the line to draw) and the dot-plot connector
	// (waits for the dots to pop). Only shown when the chart actually renders
	// that dependent element.
	const isLineFamily = 'line' === family || 'area' === family;
	const isDotPlot = 'dot-plot' === layout.type;
	const lineNodesActive = getCurrentValue('line', 'showPoints') ?? false;
	const dotConnectActive =
		getCurrentValue('dotPlot', 'connectPoints') ?? false;
	const showFollow =
		(isLineFamily && lineNodesActive) || (isDotPlot && dotConnectActive);
	const followNoun = isDotPlot
		? __('connector line')
		: __('data-point nodes');

	const follow = initial.follow ?? {};
	const followEnabled = follow.enabled ?? true;
	const followDuration = follow.duration ?? entranceDuration;
	const followDelay = follow.delay ?? 0;

	// Nested-section writers spread the current section so a single field
	// edit doesn't drop sibling overrides.
	const updateInitial = (patch) => {
		updateAttributeForDevice('animation', {
			initial: { ...initial, ...patch },
		});
	};
	const updateUpdate = (patch) => {
		updateAttributeForDevice('animation', {
			update: { ...update, ...patch },
		});
	};
	const updateFollow = (patch) => {
		updateInitial({ follow: { ...follow, ...patch } });
	};

	const entranceOptions = entranceOptionsForFamily(family);

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Animation')}
				opened={isOpen}
				onToggle={onToggle}
				initialOpen={false}
			>
				<ToggleControl
					label={__('Enable animation')}
					checked={enabled}
					help={__(
						'Animate the chart when its data changes (e.g. via scroll-driven or button-driven updates). Off by default. Readers who prefer reduced motion always see instant updates.'
					)}
					onChange={(value) => {
						updateAttributeForDevice('animation', {
							enabled: value,
						});
					}}
				/>
				{enabled && (
					<>
						<RangeControl
							label={__('Duration (ms)')}
							value={duration}
							min={0}
							max={2000}
							step={50}
							withInputField
							help={__(
								'Default transition length, in milliseconds. Each section can override it below.'
							)}
							onChange={(value) => {
								updateAttributeForDevice('animation', {
									duration: value ?? DEFAULT_DURATION,
								});
							}}
						/>
						<SelectControl
							label={__('Easing')}
							value={easing}
							options={EASING_OPTIONS}
							help={__(
								'The default timing curve shared by the entrance and data-change transitions.'
							)}
							onChange={(value) => {
								updateAttributeForDevice('animation', {
									easing: value,
								});
							}}
						/>

						<BaseControl.VisualLabel>
							{__('Entrance (first render)')}
						</BaseControl.VisualLabel>
						<ToggleControl
							label={__('Animate entrance')}
							checked={entranceEnabled}
							help={__(
								'Animate elements in when the chart first appears. Turn off for smooth data updates with no entrance.'
							)}
							onChange={(value) => {
								updateInitial({ enabled: value });
							}}
						/>
						{entranceEnabled && (
							<ToggleControl
								label={__('Trigger on scroll into view')}
								checked={triggerOnViewport}
								help={__(
									"Hold the entrance animation until this chart scrolls into the reader's viewport. Useful for charts below the fold."
								)}
								onChange={(value) => {
									updateAttributeForDevice('animation', {
										triggerOnViewport: value,
									});
								}}
							/>
						)}
						{entranceEnabled && triggerOnViewport && (
							<RangeControl
								label={__('Entrance delay (ms)')}
								value={viewportDelay}
								min={0}
								max={2000}
								step={50}
								withInputField
								help={__(
									'How long to wait after the chart enters the viewport before the entrance animation begins drawing. The chart renders immediately — only the animation is held.'
								)}
								onChange={(value) => {
									updateAttributeForDevice('animation', {
										viewportDelay: value ?? 0,
									});
								}}
							/>
						)}
						{entranceEnabled && (
							<>
								<SelectControl
									label={__('Entrance style')}
									value={entranceType}
									options={entranceOptions}
									help={__(
										'How elements appear on first render. "Automatic" picks the natural entrance for this chart type.'
									)}
									onChange={(value) => {
										updateInitial({ type: value });
									}}
								/>
								{'none' !== entranceType && (
									<RangeControl
										label={__('Entrance duration (ms)')}
										value={entranceDuration}
										min={0}
										max={2000}
										step={50}
										withInputField
										help={__(
											'Overrides the shared duration for the entrance.'
										)}
										onChange={(value) => {
											updateInitial({
												duration:
													value ?? DEFAULT_DURATION,
											});
										}}
									/>
								)}
								{'none' !== entranceType && showFollow && (
									<>
										<ToggleControl
											label={sprintf(
												/* translators: %s is the secondary element, e.g. "data-point nodes". */
												__(
													'Sequence %s after the primary'
												),
												followNoun
											)}
											checked={followEnabled}
											help={sprintf(
												/* translators: %s is the secondary element, e.g. "connector line". */
												__(
													'Hold the %s until the primary entrance finishes, then animate it in. Turn off to animate it together with the primary.'
												),
												followNoun
											)}
											onChange={(value) => {
												updateFollow({
													enabled: value,
												});
											}}
										/>
										{followEnabled && (
											<>
												<RangeControl
													label={__(
														'Secondary entrance duration (ms)'
													)}
													value={followDuration}
													min={0}
													max={2000}
													step={50}
													withInputField
													help={sprintf(
														/* translators: %s is the secondary element, e.g. "data-point nodes". */
														__(
															'How long the %s take to animate in once they start. Lets a slow primary be topped with a snappy secondary.'
														),
														followNoun
													)}
													onChange={(value) => {
														updateFollow({
															duration:
																value ??
																DEFAULT_DURATION,
														});
													}}
												/>
												<RangeControl
													label={__(
														'Delay after primary (ms)'
													)}
													value={followDelay}
													min={0}
													max={1000}
													step={50}
													withInputField
													help={__(
														'Extra pause inserted between the primary finishing and the secondary starting.'
													)}
													onChange={(value) => {
														updateFollow({
															delay: value ?? 0,
														});
													}}
												/>
											</>
										)}
									</>
								)}
							</>
						)}

						<BaseControl.VisualLabel>
							{__('Data updates')}
						</BaseControl.VisualLabel>
						<ToggleControl
							label={__('Animate data changes')}
							checked={updateEnabled}
							help={__(
								'Smoothly interpolate between values when the data changes. Turn off to snap instantly while still animating the entrance.'
							)}
							onChange={(value) => {
								updateUpdate({ enabled: value });
							}}
						/>
						{updateEnabled && (
							<RangeControl
								label={__('Update duration (ms)')}
								value={updateDuration}
								min={0}
								max={2000}
								step={50}
								withInputField
								help={__(
									'Overrides the shared duration for data-change transitions.'
								)}
								onChange={(value) => {
									updateUpdate({
										duration: value ?? DEFAULT_DURATION,
									});
								}}
							/>
						)}

						{onPreviewAnimation && (
							<BaseControl
								__nextHasNoMarginBottom
								help={
									prefersReducedMotion
										? __(
												'Preview is unavailable because your system prefers reduced motion. The chart will animate for readers who have not enabled that setting.'
											)
										: __(
												'Replays the entrance once in the editor. Editing is otherwise instant — readers see the animation on the published page.'
											)
								}
							>
								<Button
									variant="secondary"
									onClick={onPreviewAnimation}
									isBusy={isPreviewingAnimation}
									disabled={
										prefersReducedMotion ||
										isPreviewingAnimation
									}
									__next40pxDefaultSize
								>
									{isPreviewingAnimation
										? __('Previewing…')
										: __('Preview animation')}
								</Button>
							</BaseControl>
						)}
					</>
				)}
			</PanelBody>
		</div>
	);
}

export default AnimationControls;
