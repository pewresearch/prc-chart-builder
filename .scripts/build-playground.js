const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../playground');
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Function to create a zip file for a specific directory
async function createZipForDirectory(sourceDir, outputFileName) {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(
			path.join(outputDir, outputFileName)
		);
		const archive = archiver('zip', {
			zlib: { level: 9 }, // Maximum compression
		});

		archive.on('error', (err) => {
			reject(err);
		});

		archive.on('warning', (err) => {
			if (err.code === 'ENOENT') {
				console.warn('Warning:', err);
			} else {
				reject(err);
			}
		});

		output.on('close', () => {
			console.log(
				`${outputFileName} created successfully! Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`
			);
			resolve();
		});

		archive.pipe(output);

		// Add files to the archive, excluding specified directories
		archive.glob('**/*', {
			cwd: sourceDir,
			ignore: [
				'src/**',
				'tests/**',
				'node_modules/**',
				'.vscode/**',
				'playground/**',
				'.git/**',
				'package.json',
				'package-lock.json',
				'yarn.lock',
			],
		});

		archive.finalize();
	});
}

// Create zip files for both directories
async function createAllZips() {
	try {
		const chartBuilderDir = path.join(__dirname, '..');
		const chartingLibraryDir = path.join(
			__dirname,
			'../../prc-charting-library'
		);

		await createZipForDirectory(chartBuilderDir, 'prc-chart-builder.zip');
		await createZipForDirectory(
			chartingLibraryDir,
			'prc-charting-library.zip'
		);

		// Read and encode blueprint.json
		const blueprintPath = path.join(outputDir, 'blueprint.json');
		const blueprintContent = fs.readFileSync(blueprintPath, 'utf8');
		const encodedBlueprint =
			Buffer.from(blueprintContent).toString('base64');

		console.log('All archives created successfully!');
		console.log(
			'Updated playground will be available upon next release of PRC Chart Builder on prc-platform.'
		);
		console.log(
			'\u001b]8;;%s\u0007%s\u001b]8;;\u0007',
			`https://playground.wordpress.net/#${encodedBlueprint}`,
			`Open Chart Builder Playground ::: https://playground.wordpress.net/#${encodedBlueprint}`
		);
	} catch (error) {
		console.error('Error creating archives:', error);
		process.exit(1);
	}
}

// Run the script
createAllZips();
