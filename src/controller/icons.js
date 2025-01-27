/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const barIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 448 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M448 320l0-128L0 192 0 320l448 0zM256 480l0-128L0 352 0 480l256 0zM384 32L0 32 0 160l384 0 0-128z" />
	</SVG>
);

export const groupedBarIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path
			class="fa-primary"
			d="M384 112C384 138.5 362.5 160 336 160H48C21.49 160 0 138.5 0 112V80C0 53.49 21.49 32 48 32H336C362.5 32 384 53.49 384 80V112zM256 432C256 458.5 234.5 480 208 480H48C21.49 480 0 458.5 0 432V400C0 373.5 21.49 352 48 352H208C234.5 352 256 373.5 256 400V432z"
		/>
		<Path
			class="fa-secondary"
			fill-opacity="0.4"
			d="M48 320C21.49 320 0 298.5 0 272V240C0 213.5 21.49 192 48 192H400C426.5 192 448 213.5 448 240V272C448 298.5 426.5 320 400 320H48z"
		/>
	</SVG>
);

export const groupedColumnIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path
			className="fa-primary"
			d="M400 96C426.5 96 448 117.5 448 144V432C448 458.5 426.5 480 400 480H368C341.5 480 320 458.5 320 432V144C320 117.5 341.5 96 368 96H400zM80 224C106.5 224 128 245.5 128 272V432C128 458.5 106.5 480 80 480H48C21.49 480 0 458.5 0 432V272C0 245.5 21.49 224 48 224H80z"
		/>
		<Path
			className="fa-secondary"
			fillOpacity="0.4"
			d="M160 80C160 53.49 181.5 32 208 32H240C266.5 32 288 53.49 288 80V432C288 458.5 266.5 480 240 480H208C181.5 480 160 458.5 160 432V80z"
		/>
	</SVG>
);

export const stackedBarIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M448 128v32H320V128H448zM64 64H0v64 32 64H64 448h64V160 128 64H448 64zM448 384H192V352H448v32zM64 288H0v64 32 64H64 448h64V384 352 288H448 64z" />
	</SVG>
);

export const stackedColumnIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 -512 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path
			d="M448 128v32H320V128H448zM64 64H0v64 32 64H64 448h64V160 128 64H448 64zM448 384H192V352H448v32zM64 288H0v64 32 64H64 448h64V384 352 288H448 64z"
			transform="rotate(270)"
		/>
	</SVG>
);

export const lineIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M64 64V32H0V64 448v32H32 480h32V416H480 64V64zM342.6 278.6l128-128-45.3-45.3L320 210.7l-57.4-57.4L240 130.7l-22.6 22.6-112 112 45.3 45.3L240 221.3l57.4 57.4L320 301.3l22.6-22.6z" />
	</SVG>
);

export const areaIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M64 64V32H0V64 448v32H32 480h32V416H480 64V64zm64 288H480V240L384 128l-64 64L240 96 128 224V352z" />
	</SVG>
);
export const scatterIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M64 64V32H0V64 448v32H32 480h32V416H480 64V64zm160 64H160v64h64V128zM192 288H128v64h64V288zm128-64H256v64h64V224zm32 128h64V288H352v64zM448 96H384v64h64V96z" />
	</SVG>
);

export const dotPlotIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 512 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path
			className="fa-primary"
			d="M96 96C96 122.5 74.51 144 48 144C21.49 144 0 122.5 0 96C0 69.49 21.49 48 48 48C74.51 48 96 69.49 96 96zM96 256C96 282.5 74.51 304 48 304C21.49 304 0 282.5 0 256C0 229.5 21.49 208 48 208C74.51 208 96 229.5 96 256zM0 416C0 389.5 21.49 368 48 368C74.51 368 96 389.5 96 416C96 442.5 74.51 464 48 464C21.49 464 0 442.5 0 416z"
		/>
		<Path
			className="fa-secondary"
			fillOpacity="0.4"
			d="M256 96C256 122.5 234.5 144 208 144C181.5 144 160 122.5 160 96C160 69.49 181.5 48 208 48C234.5 48 256 69.49 256 96zM256 256C256 282.5 234.5 304 208 304C181.5 304 160 282.5 160 256C160 229.5 181.5 208 208 208C234.5 208 256 229.5 256 256zM160 416C160 389.5 181.5 368 208 368C234.5 368 256 389.5 256 416C256 442.5 234.5 464 208 464C181.5 464 160 442.5 160 416z"
		/>
	</SVG>
);

export const columnIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 448 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M160 32H288V480H160V32zM0 224H128V480H0V224zM448 96V480H320V96H448z" />
	</SVG>
);

export const pieIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/SVG"
		viewBox="0 0 576 512"
		preserveAspectRatio="xMidYMid meet"
		height={20}
	>
		<Path d="M304 240V.6c5.3-.4 10.6-.6 16-.6C443.7 0 544 100.3 544 224c0 5.4-.2 10.7-.6 16H304zM32 272C32 144.8 130.9 40.8 256 32.5V288L425 457c-41.5 34.4-94.8 55-153 55C139.5 512 32 404.6 32 272zm288 16H575.5C571 355.9 538.3 416.1 489 457L320 288z" />
	</SVG>
);

export const USAMap = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
		<Path d="M32 0C49.7 0 64 14.3 64 32l0 16 69-17.2c38.1-9.5 78.3-5.1 113.5 12.5c46.3 23.2 100.8 23.2 147.1 0l9.6-4.8C423.8 28.1 448 43.1 448 66.1l0 36.1-44.7 16.2c-42.8 15.6-90 13.9-131.6-4.6l-16.1-7.2c-20.3-9-41.8-14.7-63.6-16.9l0 32.2c17.4 2.1 34.4 6.7 50.6 13.9l16.1 7.2c49.2 21.9 105 23.8 155.6 5.4L448 136.3l0 62-44.7 16.2c-42.8 15.6-90 13.9-131.6-4.6l-16.1-7.2c-40.2-17.9-85-22.5-128.1-13.3L64 203.1l0 32.7 70.2-15.1c36.4-7.8 74.3-3.9 108.4 11.3l16.1 7.2c49.2 21.9 105 23.8 155.6 5.4L448 232.3l0 62-44.7 16.2c-42.8 15.6-90 13.9-131.6-4.6l-16.1-7.2c-40.2-17.9-85-22.5-128.1-13.3L64 299.1l0 32.7 70.2-15.1c36.4-7.8 74.3-3.9 108.4 11.3l16.1 7.2c49.2 21.9 105 23.8 155.6 5.4L448 328.3l0 33.5c0 13.3-8.3 25.3-20.8 30l-34.7 13c-46.2 17.3-97.6 14.6-141.7-7.4c-37.9-19-81.3-23.7-122.5-13.4L64 400l0 80c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64 0-70.5 0-32.7 0-63.3 0-32.7 0-63.3 0-32.7L0 64 0 32C0 14.3 14.3 0 32 0zm80 96A16 16 0 1 0 80 96a16 16 0 1 0 32 0zm32 0a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm-32 48a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm32 0a16 16 0 1 0 0-32 16 16 0 1 0 0 32z" />
	</SVG>
);

export const USABlockMap = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
		<Path d="M384 476.1L192 421.2l0-385.3L384 90.8l0 385.3zm32-1.2l0-386.5L543.1 37.5c15.8-6.3 32.9 5.3 32.9 22.3l0 334.8c0 9.8-6 18.6-15.1 22.3L416 474.8zM15.1 95.1L160 37.2l0 386.5L32.9 474.5C17.1 480.8 0 469.2 0 452.2L0 117.4c0-9.8 6-18.6 15.1-22.3z" />
	</SVG>
);

export const worldMap = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
		<Path d="M23 359l-17 17L40 409.9l17-17 10.5-10.5c34.3 27.7 74.9 43.8 116.5 48.3l0 33.3L64 464l0 48 288 0 0-48-120 0 0-33.3c49.1-5.3 96.8-26.7 134.4-64.3c81.7-81.7 87.1-211 16.1-298.9L393 57l17-17L376 6.1 359 23 332.5 49.6l-17 17 17 17c68.7 68.7 68.7 180.2 0 248.9s-180.2 68.7-248.9 0l-17-17-17 17L23 359zm185-7a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
	</SVG>
);
