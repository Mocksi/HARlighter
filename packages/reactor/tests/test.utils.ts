import { ExpectStatic } from "vitest";

export function extendExpect(expect: ExpectStatic) {
    expect.extend({
        toMatchIgnoringMocksiTags(received: string, expected: string) {
            // Remove mocksi attributes
    
            received = received.replace(/ mocksi-id="[^"]*"/g, '');
            received = received.replace(/ mocksi-modified-[^=]+="[^"]*"/g, '');
            
            return {
                message: () => `expected ${received} to match ${expected}`,
                pass: received === expected,
            }
        }
    });    
}
