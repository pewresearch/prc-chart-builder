import { RichText } from '@wordpress/block-editor';

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

const Footer = ({ metaNote, metaSource, metaTag, setAttributes }) => (
	<>
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

export { TitleSubtitle, Footer };
