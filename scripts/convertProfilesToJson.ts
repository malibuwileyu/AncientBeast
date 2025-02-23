import * as fs from 'fs';
import * as path from 'path';

const PROFILES_DIR = path.join(__dirname, '../src/ai/profiles');
const JSON_DIR = path.join(PROFILES_DIR, 'json');

// Ensure JSON directory exists
if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
}

// Get list of TypeScript profile files
const profileFiles = fs.readdirSync(PROFILES_DIR)
    .filter(file => file.endsWith('.ts') && file !== 'ProfileLoader.ts');

for (const file of profileFiles) {
    const tsPath = path.join(PROFILES_DIR, file);
    const jsonPath = path.join(JSON_DIR, file.replace('.ts', '.json'));
    
    // Read TypeScript file
    const tsContent = fs.readFileSync(tsPath, 'utf8');
    
    // Convert to JSON
    // Remove imports, exports, and convert to JSON structure
    let jsonContent = tsContent
        .replace(/import.*?;\n/g, '')
        .replace(/export const (\w+)Profile: UnitProfile = /g, '')
        .replace(/\n\s*\/\/ /g, '\n    // ');
    
    // Parse and format
    const profile = JSON.parse(jsonContent);
    
    // Write JSON file
    fs.writeFileSync(jsonPath, JSON.stringify(profile, null, 4));
    
    console.log(`Converted ${file} to JSON`);
}

console.log('All profiles converted to JSON'); 