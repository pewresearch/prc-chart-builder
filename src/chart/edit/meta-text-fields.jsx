import { RichText } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

import { Icon } from '@prc/icons';
import { useViewportAttributes } from './hooks/use-viewport-attributes';

const TitleSubtitle = ({ attributes, setAttributes }) => {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const title = getCurrentValue('metadata', 'title');
	const subtitle = getCurrentValue('metadata', 'subtitle');

	return (
		<>
			<RichText
				className="cb__title"
				value={title}
				onChange={(content) =>
					updateAttributeForDevice('metadata', { title: content })
				}
				placeholder={title}
			/>
			<RichText
				className="cb__subtitle"
				value={subtitle}
				onChange={(content) =>
					updateAttributeForDevice('metadata', { subtitle: content })
				}
				placeholder={subtitle}
			/>
		</>
	);
};

const Footer = ({ attributes, setAttributes }) => {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const io = attributes.io || {}; // io is not viewport-aware
	const { questionWording, questionWordingActive } = io;
	const note = getCurrentValue('metadata', 'note');
	const source = getCurrentValue('metadata', 'source');
	const tag = getCurrentValue('metadata', 'tag');

	const [isOpen, setIsOpen] = useState(false);
	const toggleQuestionWordingExpanded = () => {
		setIsOpen(!isOpen);
	};
	return (
		<>
			{questionWordingActive && (
				<>
					<div
						className="cb__note cb__note--question-wording-button"
						onClick={() => toggleQuestionWordingExpanded()}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								toggleQuestionWordingExpanded();
							}
						}}
					>
						<Icon
							icon={isOpen ? 'circle-minus' : 'circle-plus'}
							library="light"
						/>
						<span hidden={isOpen}>
							Expand to find question wording
						</span>

						<span hidden={!isOpen}>Collapse question wording</span>
					</div>
					{isOpen && (
						<>
							<RichText
								className="cb__note cb__note--question-wording"
								value={questionWording}
								onChange={(content) =>
									setAttributes({
										io: {
											...io,
											questionWording: content,
										},
									})
								}
								placeholder={questionWording}
							/>
						</>
					)}
				</>
			)}
			<RichText
				className="cb__note"
				value={note}
				onChange={(content) =>
					updateAttributeForDevice('metadata', { note: content })
				}
				placeholder={note}
			/>
			<RichText
				className="cb__note"
				value={source}
				onChange={(content) =>
					updateAttributeForDevice('metadata', { source: content })
				}
				placeholder={source}
			/>
			<RichText
				className="cb__tag"
				value={tag}
				onChange={(content) =>
					updateAttributeForDevice('metadata', { tag: content })
				}
				placeholder={tag}
			/>
		</>
	);
};

export { TitleSubtitle, Footer };
