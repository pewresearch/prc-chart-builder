const closeSVG = (
	<svg
		width="10"
		height="10"
		viewBox="0 0 44 44"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M0.549989 4.44999L4.44999 0.549988L43.45 39.55L39.55 43.45L0.549989 4.44999Z" />
		<path d="M39.55 0.549988L43.45 4.44999L4.44999 43.45L0.549988 39.55L39.55 0.549988Z" />
	</svg>
);

const ShareModal = ({
	onClickFacebook,
	onClickTwitter,
	pngAttrs,
	elementId,
}) => {
	function hideModal(id) {
		document
			.querySelector(`#modal-overlay-${id}`)
			.classList.remove('active');
		document.querySelector(`#modal-${id}`).classList.remove('active');
	}

	const { id, url } = pngAttrs;
	return (
		<>
			<div
				className="share-modal__overlay"
				id={`modal-overlay-${elementId}`}
				onClick={(e) => {
					e.preventDefault();
					hideModal(elementId);
				}}
			></div>
			<div className="share-modal" id={`modal-${elementId}`}>
				<div className="share-modal__inner">
					<div className="share-modal__header">
						<h2 className="share-modal__title">
							Share this chart:
						</h2>
						{/* close button */}
						<button
							type="button"
							aria-label="Close"
							className="share-modal__close"
							onClick={(e) => {
								e.preventDefault();
								hideModal(elementId);
							}}
						>
							{closeSVG}
						</button>
					</div>
					<div className="share-modal__body">
						{/* share on twitter button */}
						<button
							className="share-modal__button share-modal__button--twitter"
							onClick={onClickTwitter}
						>
							<span>Share on Twitter</span>
						</button>
						{/* share on facebook button */}
						<button
							className="share-modal__button share-modal__button--facebook"
							onClick={onClickFacebook}
						>
							<span>Share on Facebook</span>
						</button>
						{pngAttrs.id && (
							<>
								{/* download png button */}
								<a
									className="share-modal__download-png"
									href={url}
									download={`chart-${id}.png`}
								>
									<span>Download .png image</span>
								</a>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default ShareModal;
