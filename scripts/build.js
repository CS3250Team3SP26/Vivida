import { createWriteStream, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import archiver from 'archiver';

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = pkg.version;
const outputDir = './build';
const outputFile = join(outputDir, `vivida-${version}.zip`);

// Ensure build/ directory exists
mkdirSync(outputDir, { recursive: true });

const output = createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Built ${outputFile} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => { throw err; });

archive.pipe(output);

// Add entire src/ directory contents to the root of the zip
archive.directory('src/', false);

archive.finalize();