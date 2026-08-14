/**
 * react-movable binds its drag listeners to the module-scope `document`, i.e. the
 * top window's. The block inspector lives there, but the CPT wizard renders inside
 * the block canvas iframe, so pointer events on a sorter never reach those listeners
 * and a drag silently never starts. Clicks still work because React delegates from
 * its own root, which is inside the iframe.
 *
 * This relays the events react-movable listens for from the iframe's document to the
 * top document, and hands back the iframe body as the drag ghost's container so the
 * ghost's fixed coordinates match the iframe-relative rects react-movable measured.
 *
 * Touch is not relayed — the wizard is a desktop authoring surface.
 */
import { useCallback, useRef, useState } from '@wordpress/element';

function relayToTopDocument(event) {
	const clone = new window.MouseEvent(event.type, {
		// Only react-movable's own `document` listeners need this; keep it off the
		// bubble path so unrelated top-document handlers don't see a phantom click.
		bubbles: false,
		cancelable: event.cancelable,
		button: event.button,
		buttons: event.buttons,
		clientX: event.clientX,
		clientY: event.clientY,
		screenX: event.screenX,
		screenY: event.screenY,
		ctrlKey: event.ctrlKey,
		shiftKey: event.shiftKey,
		altKey: event.altKey,
		metaKey: event.metaKey,
	});

	// Dispatching would report `document` as the target. react-movable matches the
	// target against the list's children to work out which row was grabbed, so an
	// own property has to shadow the inherited getter before it goes out.
	Object.defineProperty(clone, 'target', { value: event.target });

	document.dispatchEvent(clone);

	if (clone.defaultPrevented && event.cancelable) {
		event.preventDefault();
	}
}

export function useMovableDocumentBridge() {
	const [container, setContainer] = useState(undefined);
	const teardownRef = useRef(null);

	const ref = useCallback((node) => {
		teardownRef.current?.();
		teardownRef.current = null;

		if (!node) {
			return;
		}

		const ownerDocument = node.ownerDocument;

		if (!ownerDocument || ownerDocument === document) {
			setContainer(undefined);
			return;
		}

		setContainer(ownerDocument.body);

		const relay = (event) => relayToTopDocument(event);

		const stopTracking = () => {
			ownerDocument.removeEventListener('mousemove', relay);
			ownerDocument.removeEventListener('mouseup', endDrag);
			document.removeEventListener('mouseup', stopTracking);
		};

		function endDrag(event) {
			relayToTopDocument(event);
			stopTracking();
		}

		const startDrag = (event) => {
			if (!node.contains(event.target)) {
				return;
			}
			relayToTopDocument(event);
			ownerDocument.addEventListener('mousemove', relay);
			ownerDocument.addEventListener('mouseup', endDrag);
			// Releasing outside the iframe ends react-movable's drag via the real
			// event; this keeps the relay from outliving it.
			document.addEventListener('mouseup', stopTracking);
		};

		ownerDocument.addEventListener('mousedown', startDrag);

		teardownRef.current = () => {
			ownerDocument.removeEventListener('mousedown', startDrag);
			stopTracking();
		};
	}, []);

	return { ref, container };
}
