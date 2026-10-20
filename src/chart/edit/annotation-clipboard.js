import { stripRichText } from '@prc/charting-utilities';

export const CLONE_OFFSET_PX = 10;
export const COPY_SUFFIX = ' (Copy)';

export function cloneAnnotation(item) {
	if (!item) {
		return null;
	}
	return {
		...item,
		x: (item.x ?? 0) + CLONE_OFFSET_PX,
		y: (item.y ?? 0) + CLONE_OFFSET_PX,
		text: `${item.text ?? ''}${COPY_SUFFIX}`,
	};
}

export function appendClonedAnnotation(items, sourceIndex) {
	if (!Array.isArray(items)) {
		return { items: [], newIndex: -1 };
	}
	if (sourceIndex < 0 || sourceIndex >= items.length) {
		return { items, newIndex: -1 };
	}
	const clone = cloneAnnotation(items[sourceIndex]);
	return { items: [...items, clone], newIndex: items.length };
}

export function createAnnotationClipboard() {
	let snapshot = null;
	return {
		copy(item) {
			snapshot = item ? { ...item } : null;
		},
		paste() {
			if (!snapshot) {
				return null;
			}
			return cloneAnnotation(snapshot);
		},
		hasSnapshot() {
			return snapshot !== null;
		},
	};
}

export function getFocusAfterClone(newIndex) {
	if (newIndex < 0) {
		return null;
	}
	return {
		selectedAnnotationId: String(newIndex),
		expandedDrawerIndex: newIndex,
	};
}

export function createAnnotationActions({
	getItems,
	setItems,
	clipboard,
	onFocusClone,
}) {
	return {
		duplicate(sourceIndex) {
			const { items, newIndex } = appendClonedAnnotation(
				getItems(),
				sourceIndex
			);
			if (newIndex < 0) {
				return;
			}
			setItems(items);
			onFocusClone(getFocusAfterClone(newIndex));
		},
		copySelected(sourceIndex) {
			const item = getItems()?.[sourceIndex];
			if (!item) {
				return;
			}
			clipboard.copy(item);
		},
		paste() {
			const cloned = clipboard.paste();
			if (!cloned) {
				return;
			}
			const items = [...getItems(), cloned];
			setItems(items);
			onFocusClone(getFocusAfterClone(items.length - 1));
		},
	};
}

export function getAnnotationDrawerTitle(annotation, index) {
	const text = stripRichText(annotation?.text).trim();
	if (text !== '') {
		return text;
	}
	return `Annotation ${index + 1}`;
}

export function isAnnotationDrawerOpen(index, selectedIndex) {
	return (
		selectedIndex !== null &&
		selectedIndex !== undefined &&
		index === selectedIndex
	);
}

export function isEditableHotkeyTarget(target) {
	if (!target) {
		return false;
	}
	const tag = target.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
		return true;
	}
	if (target.isContentEditable) {
		return true;
	}
	return Boolean(
		target.closest?.('input, textarea, select, [contenteditable="true"]')
	);
}

export function shouldHandleAnnotationClipboardKeydown(
	event,
	{ isAnnotationSelected }
) {
	if (!isAnnotationSelected) {
		return false;
	}
	if (!event.metaKey && !event.ctrlKey) {
		return false;
	}
	const key = event.key?.toLowerCase();
	if (key !== 'c' && key !== 'v') {
		return false;
	}
	if (isEditableHotkeyTarget(event.target)) {
		return false;
	}
	return true;
}
