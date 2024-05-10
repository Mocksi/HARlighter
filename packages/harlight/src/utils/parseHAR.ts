import { HAR } from '../types';

export function parseHAR(jsonString: string): HAR {
    try {
        const parsed: HAR = JSON.parse(jsonString);

        // Validate 'log' object is present
        if (!parsed.log) {
            throw new Error("Invalid HAR file: Missing required 'log' object.");
        }

        // Validate 'creator' and 'entries' fields within 'log'
        if (!parsed.log.creator || !Array.isArray(parsed.log.entries)) {
            throw new Error("Invalid HAR file: Missing required 'creator' object or 'entries' array in 'log'.");
        }

        return parsed;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse HAR file: ${message}`);
    }
}
