
import { HAR } from '../types';

export function generateHAR(harData: HAR): string {
    if (!harData.log || !harData.log.version || !harData.log.creator || harData.log.entries === undefined) {
        throw new Error('Missing required fields in HAR data');
    }

    try {
        // You might add additional checks to ensure data integrity before serialization
        const jsonString = JSON.stringify(harData, null, 2);
        return jsonString;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to generate HAR file: ${message}`);
    }
}
