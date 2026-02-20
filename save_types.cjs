
const fs = require('fs');
const path = require('path');

// Ensure backslashes are escaped properly in JS string
const inputPath = 'C:\\Users\\geova\\.gemini\\antigravity\\brain\\0395137a-1367-4cdc-b876-60c5955fad1b\\.system_generated\\steps\\199\\output.txt';
const outputPath = path.join(__dirname, 'src', 'types', 'database.types.ts');

try {
    console.log(`Reading from: ${inputPath}`);
    const content = fs.readFileSync(inputPath, 'utf8');
    console.log('File read successfully. Parsing JSON...');
    const json = JSON.parse(content);

    if (!json.types) {
        throw new Error('JSON does not contain "types" property');
    }

    console.log(`Writing to: ${outputPath}`);
    fs.writeFileSync(outputPath, json.types);
    console.log('Successfully wrote database types to ' + outputPath);
} catch (err) {
    console.error('Error processing types:', err);
    process.exit(1);
}
