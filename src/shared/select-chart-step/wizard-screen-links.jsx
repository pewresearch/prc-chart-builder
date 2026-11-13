/**
 * WordPress Dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Intro sentences that open wizard screens: `prompt`, a `promptAction` link,
 * then `promptSuffix`.
 *
 * @param {Object}   props
 * @param {Object[]} props.screens      Entries from getWizardScreens().
 * @param {Function} props.onOpenScreen Receives the screen slug.
 */
export function WizardScreenPrompts({ screens, onOpenScreen }) {
	return screens.map((screen) => (
		<span key={screen.slug}>
			{screen.prompt}{' '}
			<Button variant="link" onClick={() => onOpenScreen(screen.slug)}>
				{screen.promptAction}
			</Button>{' '}
			{screen.promptSuffix}
		</span>
	));
}

/**
 * Links under the chart-type rail that open wizard screens.
 *
 * @param {Object}   props
 * @param {Object[]} props.screens      Entries from getWizardScreens().
 * @param {Function} props.onOpenScreen Receives the screen slug.
 */
export function WizardScreenLinks({ screens, onOpenScreen }) {
	return screens.map((screen) => (
		<Button
			key={screen.slug}
			variant="link"
			onClick={() => onOpenScreen(screen.slug)}
			className="prc-chart-wizard__screen-link"
		>
			{screen.label}
		</Button>
	));
}
