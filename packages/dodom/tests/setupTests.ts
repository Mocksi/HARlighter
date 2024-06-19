import { JSDOM } from 'jsdom';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// biome-ignore lint/suspicious/noExplicitAny: tests
function copyProps(src: any, target: any) {
    const props = Object.getOwnPropertyNames(src)
        .filter(prop => typeof target[prop] === 'undefined')
        .reduce((result, prop) => ({
            // biome-ignore lint/performance/noAccumulatingSpread: tests
            ...result,
            [prop]: Object.getOwnPropertyDescriptor(src, prop),
        }), {});
    Object.defineProperties(target, props);
}

global.window = window as unknown as Window & typeof globalThis;
global.document = window.document;
global.navigator = {
    userAgent: 'node.js',
} as Navigator;

copyProps(window, global);