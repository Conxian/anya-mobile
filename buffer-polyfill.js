import { Buffer } from 'buffer';
import process from 'process';

console.log('Buffer polyfill loaded');

export { Buffer, process };
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
  globalThis.process = process;
}
