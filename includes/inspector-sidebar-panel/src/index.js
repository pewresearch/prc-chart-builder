/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { Spinner, Notice, ExternalLink } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import apiFetch from '@wordpress/api-fetch';

/**
 * Styles
 */
import './editor.scss';

/**
 * Component to display a single referencing post.
 *
 * @param {Object} props Component props
 * @param {Object} props.post Post data
 */
function ReferencingPostItem({ post }) {
	const getPostTypeLabel = (postType) => {
		const labels = {
			post: __('Post', 'prc-chart-builder'),
			page: __('Page', 'prc-chart-builder'),
			'short-read': __('Short Read', 'prc-chart-builder'),
			'fact-sheet': __('Fact Sheet', 'prc-chart-builder'),
			feature: __('Feature', 'prc-chart-builder'),
			quiz: __('Quiz', 'prc-chart-builder'),
		};
		return labels[postType] || postType;
	};

	const getStatusBadge = (status) => {
		const statusMap = {
			publish: __('Published', 'prc-chart-builder'),
			draft: __('Draft', 'prc-chart-builder'),
			private: __('Private', 'prc-chart-builder'),
			pending: __('Pending', 'prc-chart-builder'),
			future: __('Scheduled', 'prc-chart-builder'),
		};
		const statusLabel = statusMap[status] || status;

		return (
			<span className={`status-badge status-${status}`}>
				{statusLabel}
			</span>
		);
	};

	return (
		<div className="referencing-post-item">
			<div className="post-header">
				<div className="post-content">
					<h4 className="post-title">
						<ExternalLink href={post.edit_url}>
							{post.title || __('(No title)', 'prc-chart-builder')}
						</ExternalLink>
						{getStatusBadge(post.status)}
					</h4>
					<p className="post-meta">
						{getPostTypeLabel(post.type)} • ID: {post.id}
					</p>
					{post.status === 'publish' && (
						<p className="post-view-link">
							<ExternalLink href={post.permalink}>
								{__('View Post', 'prc-chart-builder')}
							</ExternalLink>
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Chart Inspector Panel Component
 */
function ChartInspectorPanel() {
	const [referencingPosts, setReferencingPosts] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const { postId, postType } = useSelect((select) => ({
		postId: select(editorStore).getCurrentPostId(),
		postType: select(editorStore).getCurrentPostType(),
	}), []);

	// Only show panel for chart post type
	if (postType !== 'chart') {
		return null;
	}

	useEffect(() => {
		if (!postId) {
			return;
		}

		setIsLoading(true);
		setError(null);

		apiFetch({
			path: `prc-chart-builder/v1/chart/${postId}/referencing-posts`,
		})
			.then((posts) => {
				setReferencingPosts(posts);
				setIsLoading(false);
			})
			.catch((fetchError) => {
				setError(fetchError.message || __('Failed to load referencing posts', 'prc-chart-builder'));
				setIsLoading(false);
			});
	}, [postId]);

	return (
		<PluginDocumentSettingPanel
			name="prc-chart-builder-referencing-posts"
			title={__('Posts Using This Chart', 'prc-chart-builder')}
			className="prc-chart-builder-inspector-panel"
		>
			{isLoading && (
				<div className="loading-container">
					<Spinner />
					<span className="loading-text">
						{__('Loading referencing posts...', 'prc-chart-builder')}
					</span>
				</div>
			)}

			{error && (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			)}

			{!isLoading && !error && referencingPosts.length === 0 && (
				<p className="empty-state">
					{__('This chart is not currently used in any posts.', 'prc-chart-builder')}
				</p>
			)}

			{!isLoading && !error && referencingPosts.length > 0 && (
				<div>
					<p className="posts-list-header">
						{referencingPosts.length === 1
							? __('This chart is used in 1 post:', 'prc-chart-builder')
							: `${__('This chart is used in', 'prc-chart-builder')} ${referencingPosts.length} ${__('posts:', 'prc-chart-builder')}`
						}
					</p>
					{referencingPosts.map((post) => (
						<ReferencingPostItem key={post.id} post={post} />
					))}
				</div>
			)}
		</PluginDocumentSettingPanel>
	);
}

// Register the plugin
registerPlugin('prc-chart-builder-inspector-panel', {
	render: ChartInspectorPanel,
});
