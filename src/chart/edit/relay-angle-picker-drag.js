/**
 * AnglePickerControl listens for mousemove and mouseup on the script document.
 * Wizard controls render in the canvas iframe, so a drag there never ends.
 * Forward the gesture from the control's document to the script document.
 *
 * @param {Document|null|undefined} ownerDocument Document that contains the dial.
 * @return {Function} Removes the listener.
 */
export default function relayAnglePickerDrag(ownerDocument) {
	if (!ownerDocument || ownerDocument === document) {
		return () => {};
	}

	const onMouseDown = (event) => {
		const circle = event.target?.closest?.(
			'.components-angle-picker-control__angle-circle'
		);
		if (!circle || circle.ownerDocument !== ownerDocument) {
			return;
		}

		const forward = (type, source) => {
			document.body.dispatchEvent(
				new window.MouseEvent(type, {
					bubbles: true,
					cancelable: true,
					clientX: source.clientX,
					clientY: source.clientY,
				})
			);
		};
		const onMove = (mouseEvent) => forward('mousemove', mouseEvent);
		const stop = () => {
			ownerDocument.removeEventListener('mousemove', onMove, true);
			ownerDocument.removeEventListener('mouseup', onUp, true);
		};
		const onUp = (mouseEvent) => {
			stop();
			forward('mouseup', mouseEvent);
		};

		ownerDocument.addEventListener('mousemove', onMove, true);
		ownerDocument.addEventListener('mouseup', onUp, true);
	};

	ownerDocument.addEventListener('mousedown', onMouseDown, true);
	return () =>
		ownerDocument.removeEventListener('mousedown', onMouseDown, true);
}
