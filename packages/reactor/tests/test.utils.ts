import { ExpectStatic } from "vitest";

export function extendExpect(expect: ExpectStatic) {
    expect.extend({
        toMatchIgnoringMocksiTags(received: string, expected: string) {
            // Remove mocksi attributes
    
            received = received.replace(/ mocksi-id="[^"]*"/g, '');
            received = received.replace(/ mocksi-modified-[^=]+="[^"]*"/g, '');
            
            return {
                message: () => `\n\x1B[32mexpected\x1B[0m\n\x1B[31mreceived\x1B[0m\n\n\x1B[32m${expected}\x1B[0m\n\x1B[31m${received}\x1B[0m`,
                pass: received === expected,
            }
        }
    });    
}
