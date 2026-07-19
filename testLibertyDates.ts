import fs from 'fs';
import pdfParse from 'pdf-parse';
import { parseLibertyPolicy } from './dist/services/parsers/libertyParser.js';

async function testPdf(pdfPath: string) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    console.log(`\n=== Testing ${pdfPath} ===`);
    if (data.text.toLowerCase().includes('liberty')) {
        console.log("Detected as Liberty!");
        const parsed = parseLibertyPolicy(data.text);
        console.log("Start Date:", parsed.startDate);
        console.log("End Date:", parsed.expiryDate);
        
        // Show the specific lines for debugging
        const lines = data.text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes('period of insurance') || lines[i].toLowerCase().includes('from')) {
                console.log(`\nLines around 'period of insurance / from':`);
                console.log(lines.slice(i, i + 8).join('\n'));
                break;
            }
        }
    } else {
        console.log("Not a Liberty policy.");
    }
}

async function main() {
    const paths = [
        "C:/Users/Sahil/.gemini/antigravity-ide/brain/e70f90bd-1f6d-4e2c-abca-4040ac9824b8/.tempmediaStorage/media_e70f90bd-1f6d-4e2c-abca-4040ac9824b8_1784394919520.pdf",
        "C:/Users/Sahil/.gemini/antigravity-ide/brain/e70f90bd-1f6d-4e2c-abca-4040ac9824b8/.tempmediaStorage/media_e70f90bd-1f6d-4e2c-abca-4040ac9824b8_1784394919529.pdf",
        "C:/Users/Sahil/.gemini/antigravity-ide/brain/e70f90bd-1f6d-4e2c-abca-4040ac9824b8/.tempmediaStorage/media_e70f90bd-1f6d-4e2c-abca-4040ac9824b8_1784394919622.pdf"
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            await testPdf(p);
        }
    }
}

main().catch(console.error);
