/**
 * Resizable split state for the CPT wizard's two-panel steps (PRC-1252).
 */
import { useRefEffect } from '@wordpress/compose';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { clampSplit, getKeyboardSplit, snapSplit } from './wizard-split';

const DEFAULT_SPLIT = 50;
const DRAG_THRESHOLD_PX = 4;

/**
 * @param {'data'|'configure'|'preview'} step Two-panel wizard step.
 * @return {{containerProps: Object, handleProps: Object, view: string, setView: Function}}
 *         Props to spread onto the panel row and the separator, plus the
 *         panel (`'start'` or `'end'`) a narrow canvas shows instead of
 *         stacking both.
 */
export default function useWizardSplit(step) {
	const [splits, setSplits] = useState({});
	const [view, setView] = useState('start');
	const [isResizing, setIsResizing] = useState(false);
	const containerRef = useRef(null);
	const dragStartRef = useRef(null);
	const pointerStartRef = useRef(null);
	const split = splits[step] ?? DEFAULT_SPLIT;
	const splitRef = useRef(split);
	splitRef.current = split;

	const setSplit = useCallback(
		(next) => setSplits((prev) => ({ ...prev, [step]: next })),
		[step]
	);

	const splitAtPointer = useCallback(
		(clientX) => {
			const bounds = containerRef.current?.getBoundingClientRect();
			if (!bounds?.width) {
				return;
			}
			setSplit(
				clampSplit(((clientX - bounds.left) / bounds.width) * 100)
			);
		},
		[setSplit]
	);

	// The CSS transition is off while dragging and back on here, so a release
	// that collapses a panel or settles at the middle animates there.
	const stopResizing = useCallback(() => {
		const from = dragStartRef.current;
		if (from === null) {
			return;
		}
		dragStartRef.current = null;
		setIsResizing(false);
		setSplits((prev) => ({
			...prev,
			[step]: snapSplit(prev[step] ?? DEFAULT_SPLIT, from),
		}));
	}, [step]);

	// The handle sits inside the block canvas, where writing flow cancels
	// arrow keys for block navigation. A listener on the handle itself runs
	// before writing flow's, and stopping the event keeps it from moving
	// focus or selection.
	const keyboardRef = useRefEffect(
		(node) => {
			const onKeyDown = (event) => {
				const next = getKeyboardSplit(splitRef.current, event.key);
				if (next === null) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				setSplit(next);
			};
			node.addEventListener('keydown', onKeyDown);
			return () => node.removeEventListener('keydown', onKeyDown);
		},
		[setSplit]
	);

	let collapsed;
	if (split === 0) {
		collapsed = 'start';
	} else if (split === 100) {
		collapsed = 'end';
	}

	return {
		containerProps: {
			ref: containerRef,
			'data-split-collapsed': collapsed,
			'data-split-view': view,
			'data-resizing': isResizing ? 'true' : undefined,
			style: { '--prc-chart-wizard-split': split },
		},
		view,
		setView,
		handleProps: {
			ref: keyboardRef,
			role: 'separator',
			tabIndex: 0,
			'aria-orientation': 'vertical',
			'aria-label': __('Resize panels', 'prc-chart-builder'),
			'aria-valuemin': 0,
			'aria-valuemax': 100,
			'aria-valuenow': Math.round(split),
			'aria-valuetext': sprintf(
				/* translators: 1: left panel width, 2: right panel width, in percent. */
				__('%1$d%% left, %2$d%% right', 'prc-chart-builder'),
				Math.round(split),
				100 - Math.round(split)
			),
			onPointerDown(event) {
				if (event.button !== 0) {
					return;
				}
				// preventDefault() below also blocks the focus a click would
				// give, so focus here to keep the arrow keys working after a drag.
				event.currentTarget.focus({ preventScroll: true });
				event.preventDefault();
				// Capture keeps move events on the handle while the pointer
				// crosses the chart canvas and data table.
				event.currentTarget.setPointerCapture(event.pointerId);
				dragStartRef.current = splitRef.current;
				pointerStartRef.current = event.clientX;
				setIsResizing(true);
			},
			onPointerMove(event) {
				if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
					return;
				}
				// A click to focus the handle should not move the split.
				if (
					pointerStartRef.current !== null &&
					Math.abs(event.clientX - pointerStartRef.current) <
						DRAG_THRESHOLD_PX
				) {
					return;
				}
				pointerStartRef.current = null;
				splitAtPointer(event.clientX);
			},
			onPointerUp: stopResizing,
			onPointerCancel: stopResizing,
			onLostPointerCapture: stopResizing,
		},
	};
}
