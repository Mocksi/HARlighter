import { describe, it, expect } from 'vitest';
import { generateHAR } from '../utils/generateHAR';
import { HAR } from '../types';

// Sample HAR object for testing
const sampleHAR: HAR = {
    log: {
        version: "1.2",
        creator: {
            name: "Firebug",
            version: "2.0"
        },
        entries: []
    }
};

describe('generateHAR', () => {
    it('should correctly serialize a valid HAR object to JSON', () => {
        const jsonOutput = generateHAR(sampleHAR);
        expect(jsonOutput).toContain('Firebug'); // Check if the output contains part of the expected content
        expect(jsonOutput).toContain('"version": "1.2"');
        expect(jsonOutput).toContain('"entries": []');
    });

    it('should throw an error when required fields are missing', () => {
        // Creating an object that misses required fields intentionally
        const invalidHAR = {
            log: {
                version: "1.2",
                creator: {
                    name: "Firebug" // Version is missing, which should be required
                    // Entries field is missing
                }
            }
        } as unknown as HAR;

        // Expecting the serialization to fail due to missing fields
        expect(() => generateHAR(invalidHAR)).toThrow('Missing required fields in HAR data');
    });
});
