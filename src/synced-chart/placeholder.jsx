/**
 * External Dependencies
 */
import styled from '@emotion/styled';
import { useState } from '@wordpress/element';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Placeholder as WPComPlaceholder,
	Spinner,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import ChartCreate from './chart-create';
import ChartSearch from './chart-search';

const LoadingIndicator = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ToggleLink = ({ showCreateForm, toggleCreateForm }) => {
	return (
		<Button variant="link" onClick={toggleCreateForm}>
			{showCreateForm ? __('Cancel') : __('Create New Chart')}
		</Button>
	);
};

export default function Placeholder({
	attributes,
	setAttributes,
	disableNewChartCreation = false,
	isNew,
	isResolving,
}) {
	const [showCreateForm, setShowCreateForm] = useState(false);
	const toggleCreateForm = () => setShowCreateForm(!showCreateForm);

	return (
		<WPComPlaceholder
			instructions="Search for an existing chart or create a new one"
			label="Synced Chart"
			icon="chart-area"
		>
			<div style={{ width: '100%' }}>
				{!isNew && isResolving && (
					<LoadingIndicator>
						<span>Loading Chart... </span>
						<Spinner />
					</LoadingIndicator>
				)}
				{isNew && (
					<>
						{!showCreateForm && (
							<ChartSearch setAttributes={setAttributes} />
						)}
						{showCreateForm && (
							<ChartCreate {...{ setAttributes }} />
						)}
						{false === disableNewChartCreation && (
							<ToggleLink
								showCreateForm={showCreateForm}
								toggleCreateForm={toggleCreateForm}
							/>
						)}
					</>
				)}
			</div>
		</WPComPlaceholder>
	);
}
