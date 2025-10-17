import { RichText } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

import { Icon } from '@prc/icons';

const TitleSubtitle = ({ metaTitle, metaSubtitle, setAttributes }) => (
	<>
		<RichText
			className="cb__title"
			value={metaTitle}
			onChange={(content) =>
				setAttributes({
					metaTitle: content,
				})
			}
			placeholder={metaTitle}
		/>
		<RichText
			className="cb__subtitle"
			value={metaSubtitle}
			onChange={(content) =>
				setAttributes({
					metaSubtitle: content,
				})
			}
			placeholder={metaSubtitle}
		/>
	</>
);

const Footer = ({
	metaQuestionWording,
	metaQuestionWordingActive,
	metaNote,
	metaSource,
	metaTag,
	setAttributes,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const toggleQuestionWordingExpanded = () => {
		setIsOpen(!isOpen);
	};
	return (
		<>
			{metaQuestionWordingActive && (
				<>
					<div
						className="cb__note cb__note--question-wording-button"
						onClick={() => toggleQuestionWordingExpanded()}
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
								value={metaQuestionWording}
								onChange={(content) =>
									setAttributes({
										metaQuestionWording: content,
									})
								}
								placeholder={metaQuestionWording}
							/>
						</>
					)}
				</>
			)}
			<RichText
				className="cb__note"
				value={metaNote}
				onChange={(content) =>
					setAttributes({
						metaNote: content,
					})
				}
				placeholder={metaNote}
			/>
			<RichText
				className="cb__note"
				value={metaSource}
				onChange={(content) =>
					setAttributes({
						metaSource: content,
					})
				}
				placeholder={metaSource}
			/>
			<RichText
				className="cb__tag"
				value={metaTag}
				onChange={(content) =>
					setAttributes({
						metaTag: content,
					})
				}
				placeholder={metaTag}
			/>
		</>
	);
};

export { TitleSubtitle, Footer };
