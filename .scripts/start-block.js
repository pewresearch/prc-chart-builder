const { exec } = require('child_process');
const prompts = require('prompts');
const readline = require('readline');
const fs = require('fs');

(async () => {
	const response = await prompts([
		{
			type: 'text',
			name: 'blockName',
			message: 'Enter the block name'
		}
	]);

	const ellipses = ['.', '..', '...', ''];
	let ellipsesIndex = 0;
	const interval = setInterval(() => {
		readline.cursorTo(process.stdout, 0);
		process.stdout.write(`Building Block Name: ${response.blockName}${ellipses[ellipsesIndex]}`);
		ellipsesIndex = (ellipsesIndex + 1) % ellipses.length;
	}, 500);

	console.log(`Starting Block Name: ${response.blockName}`);

	const src = `./src/${response.blockName}`;
	const output = `./build/${response.blockName}`;

	// Check if src directory exists
	if (!fs.existsSync(src)) {
		console.warn(`Block does not exist at ${src}. Build process stopped.`);
		clearInterval(interval);
		process.exit(1);
	}

	// Clear the interval when the start process is done
	let command = `npx wp-scripts start --webpack-src-dir=${src} --output-path=${output} --webpack-copy-php --experimental-modules`;

	exec(command, (error, stdout, stderr) => {
		clearInterval(interval);
		readline.cursorTo(process.stdout, 0);
		console.log(' '.repeat(50)); // Clear the line
		readline.cursorTo(process.stdout, 0);

		if (error) {
			console.error(`Error: ${stderr}`);
		} else {
			console.log(stdout);
		}
	})
})();
