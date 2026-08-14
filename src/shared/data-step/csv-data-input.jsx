/**
 * CsvDataInput — composable CSV drop zone + editable textarea.
 *
 * Accepts a CSV file via drag-and-drop or file browse, reads it as text,
 * and displays it in an editable textarea. The value is always a plain
 * CSV string — callers own state and pass it down via `csvText`/`onCsvChange`.
 *
 * Used in:
 *  - AICreateStep — CSV context for the AI generation endpoint
 *  - DataStep / CPT wizard — upload-button variant loads data into the table
 *
 * @package PRC\Platform\Chart_Builder
 */
import {
	Button,
	Flex,
	FlexItem,
	Icon,
	TextareaControl,
} from '@wordpress/components';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, closeSmall, upload } from '@wordpress/icons';

/**
 * Read a File object as plain text.
 *
 * @param {File} file
 * @return {Promise<string>}
 */
function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

/**
 * @param {Object}   props
 * @param {string}   [props.csvText]        Current CSV string value (controlled).
 * @param {Function} props.onCsvChange      Called with the new CSV string.
 * @param {boolean}  [props.disabled]       Disable all inputs.
 * @param {string}   [props.label]          Section label above the textarea.
 * @param {string}   [props.placeholder]    Textarea placeholder text.
 * @param {number}   [props.rows]           Textarea row count (default 6).
 * @param {'full'|'upload-button'} [props.variant] Full drop zone or upload button only.
 * @param {string}   [props.uploadLabel]    Label for the upload-button variant.
 */
export default function CsvDataInput({
	csvText = '',
	onCsvChange,
	disabled = false,
	label,
	placeholder,
	rows = 6,
	variant = 'full',
	uploadLabel,
}) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [fileName, setFileName] = useState(null);
	const fileInputRef = useRef(null);

	const loadFile = useCallback(
		async (file) => {
			if (!file) {
				return;
			}
			const isCsv =
				file.type === 'text/csv' ||
				file.name.toLowerCase().endsWith('.csv');
			if (!isCsv) {
				return;
			}
			const text = await readFileAsText(file);
			if (variant === 'full') {
				setFileName(file.name);
			}
			onCsvChange(text);
		},
		[onCsvChange, variant]
	);

	const handleDrop = useCallback(
		(event) => {
			event.preventDefault();
			setIsDragOver(false);
			loadFile(event.dataTransfer.files[0]);
		},
		[loadFile]
	);

	const handleFileInput = useCallback(
		(event) => {
			loadFile(event.target.files?.[0]);
			event.target.value = '';
		},
		[loadFile]
	);

	const handleClear = useCallback(() => {
		setFileName(null);
		onCsvChange('');
	}, [onCsvChange]);

	if (variant === 'upload-button') {
		return (
			<div className="prc-chart-wizard__data-upload">
				<Button
					variant="secondary"
					icon={upload}
					onClick={() => fileInputRef.current?.click()}
					disabled={disabled}
				>
					{uploadLabel || __('Upload data', 'prc-chart-builder')}
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,text/csv"
					className="prc-chart-wizard__data-upload-input"
					onChange={handleFileInput}
					disabled={disabled}
				/>
			</div>
		);
	}

	const hasData = csvText.trim().length > 0;

	return (
		<div
			className={[
				'prc-csv-input',
				isDragOver && 'prc-csv-input--drag-over',
				hasData && 'prc-csv-input--has-data',
			]
				.filter(Boolean)
				.join(' ')}
			onDragOver={(event) => {
				event.preventDefault();
				setIsDragOver(true);
			}}
			onDragLeave={() => setIsDragOver(false)}
			onDrop={handleDrop}
		>
			{label && <span className="prc-csv-input__label">{label}</span>}

			<TextareaControl
				value={csvText}
				onChange={(value) => {
					if (fileName) {
						setFileName(null);
					}
					onCsvChange(value);
				}}
				placeholder={
					placeholder ||
					__(
						'Drop a .csv file here, or paste CSV data…',
						'prc-chart-builder'
					)
				}
				rows={rows}
				disabled={disabled}
				__nextHasNoMarginBottom
			/>

			<Flex
				className="prc-csv-input__footer"
				justify="space-between"
				align="center"
				gap={2}
			>
				<FlexItem>
					{fileName && hasData ? (
						<Flex align="center" gap={1}>
							<Icon icon={check} size={14} />
							<span className="prc-csv-input__filename">
								{fileName}
							</span>
						</Flex>
					) : null}
				</FlexItem>
				<FlexItem>
					<Flex align="center" gap={2}>
						{hasData && (
							<Button
								variant="link"
								isDestructive
								icon={closeSmall}
								onClick={handleClear}
								disabled={disabled}
								label={__(
									'Clear CSV data',
									'prc-chart-builder'
								)}
							>
								{__('Clear', 'prc-chart-builder')}
							</Button>
						)}
						<Button
							variant="link"
							icon={upload}
							onClick={() => fileInputRef.current?.click()}
							disabled={disabled}
						>
							{__('Upload CSV', 'prc-chart-builder')}
						</Button>
					</Flex>
				</FlexItem>
			</Flex>

			{isDragOver && (
				<div className="prc-csv-input__overlay" aria-hidden="true">
					{__('Drop CSV file to load data', 'prc-chart-builder')}
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				style={{ display: 'none' }}
				onChange={handleFileInput}
				disabled={disabled}
			/>
		</div>
	);
}
