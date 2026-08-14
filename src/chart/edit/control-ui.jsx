/**
 * Shared inspector/curated control UI primitives.
 *
 * Prefer these over `@emotion/styled` so generated class names stay human-readable
 * (`prc-chart-controls__*`) in both the block inspector and the Style Chart wizard.
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';

/**
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 * @param {string}                    [props.className]
 */
export function PanelDescription({ children, className = '', ...props }) {
	return (
		<div
			className={['prc-chart-controls__description', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		>
			{children}
		</div>
	);
}

/**
 * ToolsPanelItem that spans the full ToolsPanel grid width.
 *
 * @param {Object} props ToolsPanelItem props.
 */
export function WidePanelItem({ className = '', ...props }) {
	return (
		<ToolsPanelItem
			className={['prc-chart-controls__wide-item', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		/>
	);
}

/**
 * ToolsPanelItem constrained to a single grid column.
 *
 * @param {Object} props ToolsPanelItem props.
 */
export function SingleColumnItem({ className = '', ...props }) {
	return (
		<ToolsPanelItem
			className={['prc-chart-controls__single-item', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		/>
	);
}

/**
 * Uppercase section label inside a ToolsPanel.
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 * @param {string}                    [props.className]
 */
export function StyledLabel({ children, className = '', ...props }) {
	return (
		<div
			className={['prc-chart-controls__label', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		>
			{children}
		</div>
	);
}

/**
 * Muted help text under a control.
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 * @param {string}                    [props.className]
 */
export function Help({ children, className = '', ...props }) {
	return (
		<div
			className={['prc-chart-controls__help', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		>
			{children}
		</div>
	);
}
