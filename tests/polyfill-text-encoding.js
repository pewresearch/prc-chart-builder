/**
 * Jest/jsdom may omit TextEncoder/TextDecoder; react-dom/server expects them.
 */
const { TextDecoder, TextEncoder } = require('util');

if (typeof globalThis.TextEncoder === 'undefined') {
	globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
	globalThis.TextDecoder = TextDecoder;
}
