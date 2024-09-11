/**
 * External Dependencies
 */
import { useFetch } from '@prc/hooks';

/**
 * WordPress Dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useEffect, useState, useMemo } from 'react';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';

export default function WaybackHelper({ postId }) {
	const [foundMatch, setMatch] = useState(null);

	const [permalink, setPermalink] = useEntityProp(
		'postType',
		'chart',
		'link',
		postId
	);

	const newPermalink = permalink?.replace(
		window.location.hostname,
		'www.pewresearch.org'
	);

	const { status, error, data } = useFetch(
		`https://archive.org/wayback/available?url=${newPermalink}`
	);

	useEffect(() => {
		if (
			'fetched' === status &&
			data &&
			data.archived_snapshots.closest &&
			data.archived_snapshots.closest.url
		) {
			setMatch(data.archived_snapshots.closest.url);
		}
	}, [data, status]);

	const enabled = useMemo(() => {
		if (postId) {
			return true;
		}
		return false;
	}, [postId]);

	const found = useMemo(() => {
		if (false !== foundMatch && null !== foundMatch) {
			return true;
		}
		return false;
	}, [foundMatch]);

	if (!enabled) {
		return null;
	}

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					onClick={() => {
						if (false !== found) {
							window.open(foundMatch, '_blank');
						}
					}}
					label={
						false !== found
							? 'View Wayback Snapshot'
							: 'No Wayback Snapshot To Preview'
					}
					icon={false !== found ? 'cloud-saved' : 'cloud'}
					showTooltip
					disabled={'fetched' === status && true !== found}
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
