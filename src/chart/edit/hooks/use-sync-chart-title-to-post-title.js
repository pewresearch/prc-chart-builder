/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

/**
 * Plain text for a chart metadata title.
 *
 * @param {string} raw Title markup from the chart block.
 * @return {string} Plain title with markup removed.
 */
function plainChartTitle(raw) {
	const markup = new window.DOMParser().parseFromString(
		String(raw ?? ''),
		'text/html'
	);
	return (markup.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * On a chart post, copy a chart title the editor sets during this session
 * onto the post title. The title already stored when the editor opened is
 * left alone, so opening an existing chart does not rename it.
 *
 * @param {string} metadataTitle Chart block metadata.title.
 */
export function useSyncChartTitleToPostTitle(metadataTitle) {
	const { editPost } = useDispatch(editorStore);
	const isChartPost = useSelect(
		(select) => select(editorStore)?.getCurrentPostType?.() === 'chart',
		[]
	);
	const seenTitle = useRef(null);

	useEffect(() => {
		if (!isChartPost || typeof editPost !== 'function') {
			return;
		}

		const nextTitle = plainChartTitle(metadataTitle);
		if (seenTitle.current === null) {
			seenTitle.current = nextTitle;
			return;
		}
		if (nextTitle === seenTitle.current) {
			return;
		}

		seenTitle.current = nextTitle;
		editPost({ title: nextTitle });
	}, [editPost, isChartPost, metadataTitle]);
}
