/* eslint-disable @wordpress/i18n-text-domain */
/* eslint-disable @wordpress/i18n-translator-comments */
import { Button, TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { dragHandle, trash } from '@wordpress/icons';
import { List } from 'react-movable';

import { TEXT_DOMAIN } from '../constants';
import { getPaletteColors, getPalettes } from '../model';
import { store } from '../store';
import {
	colorForPreviewMode,
	getColorDisplayValue,
	getThemeColorName,
} from '../site-theme';
import PaletteDeleteDialog from './palette-delete-dialog';
import ThemeColorPicker from './theme-color-picker';

/**
 * Middle column: rename the palette, arrange its ordered colors, and pick
 * swatches from the site's registered theme.json palette.
 *
 * @param {{ slug: string }} props
 */
export default function PaletteEditor({ slug }) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const { settings, colorPreviewMode } = useSelect(
		(select) => ({
			settings: select(store).getSettings(),
			colorPreviewMode: select(store).getColorPreviewMode(),
		}),
		[]
	);
	const {
		renamePalette,
		deletePalette,
		setPaletteColors,
		togglePaletteColor,
		reorderPaletteColors,
	} = useDispatch(store);

	const palette = getPalettes(settings).find((entry) => entry.value === slug);
	const swatches = getPaletteColors(settings, slug);
	const selectedHexes = new Set(swatches);

	if (!palette) {
		return null;
	}

	return (
		<div className="prc-palette-designer__editor">
			<div className="prc-palette-designer__field">
				<div className="prc-palette-designer__field-row">
					<TextControl
						label={__('Palette name', TEXT_DOMAIN)}
						value={palette.label}
						onChange={(value) => renamePalette(slug, value)}
						className="prc-palette-designer__name-input"
						__nextHasNoMarginBottom
					/>
					<Button
						variant="tertiary"
						isDestructive
						icon={trash}
						className="prc-palette-designer__delete"
						onClick={() => setShowDeleteDialog(true)}
					>
						{__('Delete', TEXT_DOMAIN)}
					</Button>
				</div>
				<p className="prc-palette-designer__slug-hint">
					<code>{slug}</code>
				</p>
			</div>

			<div className="prc-palette-designer__columns">
				<div className="prc-palette-designer__ordered">
					<h3 className="prc-palette-designer__subhead">
						{__('Ordered colors', TEXT_DOMAIN)}
						<span className="prc-palette-designer__subhead-hint">
							{__('Drag rows to rearrange', TEXT_DOMAIN)}
						</span>
					</h3>
					{swatches.length === 0 ? (
						<p className="prc-chart-theme-settings__empty">
							{__(
								'No colors yet — pick from the theme colors on the right.',
								TEXT_DOMAIN
							)}
						</p>
					) : (
						<List
							values={swatches}
							onChange={({ oldIndex, newIndex }) =>
								reorderPaletteColors(slug, oldIndex, newIndex)
							}
							renderList={({ children, props }) => (
								<ul
									{...props}
									className="prc-palette-designer__ordered-list"
								>
									{children}
								</ul>
							)}
							renderItem={({
								value,
								props,
								index,
								isDragged,
							}) => (
								<li
									{...props}
									className="prc-palette-designer__ordered-row"
									style={{
										...props.style,
										cursor: isDragged
											? 'grabbing'
											: undefined,
									}}
								>
									<span
										data-movable-handle
										className="prc-palette-designer__drag-handle"
										aria-label={__(
											'Drag to reorder',
											TEXT_DOMAIN
										)}
									>
										{dragHandle}
									</span>
									<span
										className="prc-palette-designer__ordered-swatch"
										style={{
											backgroundColor:
												colorForPreviewMode(
													value,
													colorPreviewMode
												),
										}}
									/>
									<span className="prc-palette-designer__ordered-color">
										<span className="prc-palette-designer__ordered-name">
											{getThemeColorName(value)}
										</span>
										<code className="prc-palette-designer__ordered-value">
											{getColorDisplayValue(value)}
										</code>
									</span>
									{/* <span className="prc-palette-designer__ordered-index">
										#{index + 1}
									</span> */}
									<Button
										size="small"
										icon={trash}
										label={__('Remove color', TEXT_DOMAIN)}
										onClick={() =>
											setPaletteColors(
												slug,
												swatches.filter(
													(_, i) => i !== index
												)
											)
										}
									/>
								</li>
							)}
						/>
					)}
				</div>

				<div className="prc-palette-designer__picker">
					<h3 className="prc-palette-designer__subhead">
						{__('Theme color picker', TEXT_DOMAIN)}
					</h3>
					<p className="prc-chart-theme-settings__empty prc-palette-designer__picker-hint">
						Only registered colors registered in{' '}
						<code>theme.json</code> are available.
					</p>
					<ThemeColorPicker
						selectedHexes={selectedHexes}
						colorPreviewMode={colorPreviewMode}
						onToggle={(hex) => togglePaletteColor(slug, hex)}
					/>
				</div>
			</div>

			{showDeleteDialog && (
				<PaletteDeleteDialog
					slug={slug}
					label={palette.label}
					onCancel={() => setShowDeleteDialog(false)}
					onConfirm={() => {
						deletePalette(slug);
						setShowDeleteDialog(false);
					}}
				/>
			)}
		</div>
	);
}
