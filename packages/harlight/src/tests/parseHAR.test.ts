import { describe, it, expect } from 'vitest';
import { parseHAR } from '../utils/parseHAR';
import * as fs from 'fs';
import * as path from 'path';

describe('parseHAR', () => {
    it('should parse all contents from the fixture', () => {
        const currentDir = path.dirname(__filename);
        const harFilePath = path.join(currentDir, './harfile.json');

        const harFileContents = fs.readFileSync(harFilePath, 'utf-8');
        const result = parseHAR(harFileContents);

        expect(result.log.version).toBe("1.2");
        expect(result.log.creator.name).toBe("WebInspector");
        expect(Array.isArray(result.log.entries)).toBeTruthy();
        expect(result.log.entries.length).toBe(78);
    });
    it('should correctly parse a valid HAR JSON string', () => {
        const validHARJson = `{
            "log": {
                "version": "1.2",
                "creator": {
                    "name": "Firebug",
                    "version": "2.0"
                },
                "browser": {
                    "name": "Firefox",
                    "version": "65.0"
                },
                "entries": []
            }
        }`;

        const result = parseHAR(validHARJson);
        expect(result.log.version).toBe("1.2");
        expect(result.log.creator.name).toBe("Firebug");
        expect(result.log.browser!.name).toBe("Firefox");
        expect(Array.isArray(result.log.entries)).toBeTruthy();
    });

    it('should throw an error for invalid JSON', () => {
        const invalidJSON = `{ "log": { "version": "1.2", "creator": { "name": "Firebug", }`;
        expect(() => parseHAR(invalidJSON)).toThrow('Failed to parse HAR file');
    });

    it('should throw an error if required fields are missing', () => {
        const incompleteJSON = `{
            "log": {
                "version": "1.2"
            }
        }`;
        expect(() => parseHAR(incompleteJSON)).toThrow('Failed to parse HAR file: Invalid HAR file: Missing required \'creator\' object or \'entries\' array in \'log\'.');
    });
});
