/**
 * RichText Tooltip Template control with token insert buttons.
 *
 * Mirrors the per-point custom tooltip RichText (bold / italic / br) and adds
 * insert chips for virtual tokens plus every flat-data column header.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { useMemo } from '@wordpress/element';
import { RichText } from '@wordpress/block-editor';
import {
	Button,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import {
	TOOLTIP_TEMPLATE_TOKENS,
	appendTooltipToken,
	getTooltipTemplateDataTokens,
	getTooltipTokenExamples,
} from '../utils/tooltip-template-tokens';
import { Help, PanelDescription, StyledLabel } from './control-ui';

/**
 * @param {Object}        props
 * @param {?string}       props.value       Current template HTML (null when unused).
 * @param {Function}      props.onChange    (nextTemplate: string|null) => void
 * @param {boolean}       [props.disabled]  Whether the control is disabled.
 * @param {Array<Object>} [props.chartData] Current `io.chartData` rows.
 */
export default function TooltipTemplateControl({
	value,
	onChange,
	disabled = false,
	chartData = [],
}) {
	const dataTokens = useMemo(
		() => getTooltipTemplateDataTokens(chartData),
		[chartData]
	);
	const examples = useMemo(
		() => getTooltipTokenExamples(chartData),
		[chartData]
	);

	const insertToken = (token) => {
		if (disabled) {
			return;
		}
		const next = appendTooltipToken(value, token);
		onChange(next.length > 0 ? next : null);
	};

	const renderTokenRows = (tokens, ariaPrefix) =>
		tokens.map(({ token, label }) => {
			const example = examples[token];
			return (
				<Button
					key={token}
					variant="tertiary"
					disabled={disabled}
					onClick={() => insertToken(token)}
					aria-label={sprintf(
						// translators: %1$s: token group, %2$s: token label.
						__('Insert %1$s %2$s token', 'prc-chart-builder'),
						ariaPrefix,
						label
					)}
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'baseline',
						gap: '8px',
						width: '100%',
						height: 'auto',
						minHeight: '28px',
						padding: '2px 6px',
						textAlign: 'left',
					}}
				>
					<span
						style={{
							fontFamily: 'monospace',
							fontSize: '11px',
							whiteSpace: 'nowrap',
						}}
					>
						{token}
					</span>
					{example && (
						<span
							style={{
								color: '#757575',
								fontSize: '11px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
							// The value can be long; the row must not grow.
							title={example}
						>
							{example}
						</span>
					)}
				</Button>
			);
		});

	return (
		<>
			<StyledLabel>{__('Tooltip Template')}</StyledLabel>
			<div
				className="cb__tooltip-template-richtext"
				style={{
					marginTop: '4px',
					padding: '8px',
					minHeight: '48px',
					border: '1px solid #d3d3d3',
					borderRadius: '2px',
					background: disabled ? '#f0f0f0' : '#fff',
					pointerEvents: disabled ? 'none' : 'auto',
					opacity: disabled ? 0.6 : 1,
				}}
			>
				<RichText
					tagName="div"
					value={value ?? ''}
					allowedFormats={['core/bold', 'core/italic']}
					placeholder={__('Write a tooltip…')}
					onChange={(val) => onChange(val.length > 0 ? val : null)}
				/>
			</div>
			<VStack
				spacing={3}
				className="cb__tooltip-token-list"
				style={{ marginTop: '12px' }}
			>
				<VStack spacing={0}>
					<Text
						size="11px"
						weight={600}
						upperCase
						style={{ color: '#757575', marginBottom: '4px' }}
					>
						{__('Hovered point', 'prc-chart-builder')}
					</Text>
					{renderTokenRows(TOOLTIP_TEMPLATE_TOKENS, 'point')}
				</VStack>
				{dataTokens.length > 0 && (
					<VStack spacing={0}>
						<Text
							size="11px"
							weight={600}
							upperCase
							style={{ color: '#757575', marginBottom: '4px' }}
						>
							{__('Data columns', 'prc-chart-builder')}
						</Text>
						{renderTokenRows(dataTokens, 'data')}
					</VStack>
				)}
			</VStack>
			<PanelDescription>
				<Help>
					{__(
						'Click a token to add it. Values shown are previews from the first data row. Select text and press Ctrl/Cmd+B or I for bold and italics. Add .isColor() to a token for its series color. Leave empty to use the default format.'
					)}
				</Help>
			</PanelDescription>
		</>
	);
}
