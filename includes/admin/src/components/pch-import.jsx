/**
 * PRC Chart Handoff (PCH) import step.
 *
 * Renders the import UI inside the existing "Add New Chart" modal when the
 * user clicks "Import from pewplots" on the chart-type picker screen.
 * Validates the JSON client-side, shows any warnings[], then POSTs to the
 * REST endpoint and redirects to the new chart's edit screen.
 */

/**
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Flex,
	FlexItem,
	Notice,
	Spinner,
	TextareaControl,
} from '@wordpress/components';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronLeft, upload } from '@wordpress/icons';

import {
	buildChartEditUrl,
	CHART_FLOW_CREATE,
} from '../../../../src/shared/chart-flow-handoff';

const SUPPORTED_SCHEMA = 'prc-chart-handoff/v1';

/**
 * Parse and lightly validate a PCH JSON string.
 * Returns { pch, error } — exactly one will be non-null.
 *
 * @param {string} text Raw JSON string.
 * @returns {{ pch: object|null, error: string|null }}
 */
function parsePch(text) {
	if (!text.trim()) {
		return { pch: null, error: null };
	}
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return {
			pch: null,
			error: __(
				'Invalid JSON — could not parse the pasted text.',
				'prc-chart-builder'
			),
		};
	}
	if (parsed.$schema !== SUPPORTED_SCHEMA) {
		return {
			pch: null,
			error: `${__('Unsupported schema', 'prc-chart-builder')}: "${parsed.$schema}". ${__('Expected', 'prc-chart-builder')} "${SUPPORTED_SCHEMA}".`,
		};
	}
	if (!parsed.chartType || !parsed.data?.values) {
		return {
			pch: null,
			error: __(
				'PCH file is missing required fields (chartType, data.values).',
				'prc-chart-builder'
			),
		};
	}
	return { pch: parsed, error: null };
}

function getEditUrl(postId) {
	return buildChartEditUrl(postId, { chartFlow: CHART_FLOW_CREATE });
}

/**
 * PCH import step — rendered inside the existing "Add New Chart" modal.
 *
 * @param {object}   props
 * @param {Function} props.onBack Called when the user wants to go back to the
 *   chart-type picker.
 */
export default function PchImportStep({ onBack }) {
	const [jsonText, setJsonText] = useState('');
	const [parseError, setParseError] = useState(null);
	const [warnings, setWarnings] = useState([]);
	const [pch, setPch] = useState(null);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState(null);
	const fileInputRef = useRef(null);

	const handleTextChange = useCallback((value) => {
		setJsonText(value);
		setImportError(null);

		if (!value.trim()) {
			setPch(null);
			setParseError(null);
			setWarnings([]);
			return;
		}

		const { pch: parsed, error } = parsePch(value);
		setParseError(error);
		setPch(parsed);
		setWarnings(parsed?.warnings ?? []);
	}, []);

	const handleFileUpload = useCallback(
		(event) => {
			const file = event.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (e) => handleTextChange(e.target.result ?? '');
			reader.readAsText(file);
			event.target.value = '';
		},
		[handleTextChange]
	);

	const handleImport = useCallback(async () => {
		if (!pch) return;
		setIsImporting(true);
		setImportError(null);
		try {
			const result = await apiFetch({
				path: '/prc-chart-builder/v1/import-pch',
				method: 'POST',
				data: pch,
			});
			window.location.href = getEditUrl(result.post_id);
		} catch (err) {
			setImportError(
				err?.message ||
					__('Import failed. Please try again.', 'prc-chart-builder')
			);
			setIsImporting(false);
		}
	}, [pch]);

	const isReady = !!pch && !parseError;

	return (
		<div className="prc-chart-modal__pch-import">
			<p className="prc-chart-modal__step-label">
				{__(
					'Paste the contents of a .pch.json file exported from pewplots, or upload the file directly.',
					'prc-chart-builder'
				)}
			</p>

			<Flex gap={2} align="center" style={{ marginBottom: '12px' }}>
				<FlexItem>
					<Button
						variant="secondary"
						icon={upload}
						onClick={() => fileInputRef.current?.click()}
						disabled={isImporting}
					>
						{__('Upload .pch.json', 'prc-chart-builder')}
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".json,.pch.json"
						style={{ display: 'none' }}
						onChange={handleFileUpload}
					/>
				</FlexItem>
				{pch && (
					<FlexItem>
						<span style={{ color: '#1e8a44', fontWeight: 500 }}>
							{`✓ ${pch.chartType} chart detected`}
						</span>
					</FlexItem>
				)}
			</Flex>

			<TextareaControl
				label={__('Or paste PCH JSON here', 'prc-chart-builder')}
				value={jsonText}
				onChange={handleTextChange}
				rows={10}
				placeholder={
					'{\n  "$schema": "prc-chart-handoff/v1",\n  "chartType": "bar",\n  ...\n}'
				}
				disabled={isImporting}
				style={{ fontFamily: 'monospace', fontSize: '12px' }}
				__nextHasNoMarginBottom
			/>

			{parseError && (
				<Notice
					status="error"
					isDismissible={false}
					style={{ marginTop: '8px' }}
				>
					{parseError}
				</Notice>
			)}

			{warnings.length > 0 && (
				<Notice
					status="warning"
					isDismissible={false}
					style={{ marginTop: '8px' }}
				>
					<strong>
						{__('Chart import warnings:', 'prc-chart-builder')}
					</strong>
					<ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
						{warnings.map((w, i) => (
							<li key={i}>
								{typeof w === 'string' ? w : w.message}
							</li>
						))}
					</ul>
				</Notice>
			)}

			{importError && (
				<Notice
					status="error"
					isDismissible={false}
					style={{ marginTop: '8px' }}
				>
					{importError}
				</Notice>
			)}

			<Flex justify="flex-start" gap={3} style={{ marginTop: '16px' }}>
				<FlexItem>
					<Button
						variant="primary"
						onClick={handleImport}
						disabled={!isReady || isImporting}
					>
						{isImporting ? (
							<Flex gap={2}>
								<Spinner />
								{__('Importing…', 'prc-chart-builder')}
							</Flex>
						) : (
							__('Import Chart', 'prc-chart-builder')
						)}
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						variant="secondary"
						icon={chevronLeft}
						onClick={onBack}
						disabled={isImporting}
					>
						{__('Back', 'prc-chart-builder')}
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}
