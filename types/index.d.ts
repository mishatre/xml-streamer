/// <reference types="node" />
/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
import { ParserOptions } from './streamer-parser';
interface StreamerOptions {
    stateMachine?: any;
}
export default class XMLStreamer extends Transform {
    private stateMachine;
    private parser;
    constructor(options: ParserOptions & StreamerOptions);
    _transform(chunk: string | Buffer, encoding: BufferEncoding, callback: TransformCallback): void;
    _flush(callback: TransformCallback): void;
    private pushWithBackpressure;
}
export {};
