
import { Transform, Duplex, TransformCallback } from 'stream';
import XMLStateMachine from './state-machine';
import XMLStreamerParser, { ParserOptions } from './streamer-parser';

interface StreamerOptions {
    stateMachine?: any;
}

export default class XMLStreamer extends Transform {

    private stateMachine: any;
    private parser: XMLStreamerParser;

    constructor(options: ParserOptions & StreamerOptions) {
        super({
            readableObjectMode: true,
        });

        if(options.stateMachine) {
            this.stateMachine = new options.stateMachine();
        } else {
            this.stateMachine = new XMLStateMachine();
        }

        this.parser = new XMLStreamerParser(options);
    }

    _transform(chunk: string | Buffer, encoding: BufferEncoding, callback: TransformCallback) {

        const items = [] as object[];

        this.stateMachine.stackBuffer(chunk as any);
        let nextToken = undefined;

        while((nextToken = this.stateMachine.nextToken()) !== undefined) {
            if(nextToken) {
                const producedObject = this.parser.produce(nextToken[0], nextToken[1]);

                if(producedObject) {
                    items.push(producedObject);
                }
            }

        }
        if(items.length > 0) {
            this.push(items, encoding);
            callback();
        } else {
            callback();
        }

        // callback();


        // if (Buffer.isBuffer(chunk)) {
        //     chunk = chunk.toString();
        // }

        // this.cb = callback;

        // const items = [];

        // for (const char of chunk) {

        //     const tokens = this.stateMachine.next(char);

        //     for (const [type, value] of tokens) {
        //         const object = this.parser.produce(type, value);
        //         if (object) {
        //             items.push(object);
        //         }
        //     }

        // }

        // if(items.length > 0) {
        //     this.pushWithBackpressure(items, encoding, callback);
        // } else {
        //     callback();
        // }

    }

    _flush(callback: TransformCallback) {
        callback();
    }

    private pushWithBackpressure(chunks: any, encoding: BufferEncoding, callback: TransformCallback | null = null, $index = 0): void {
        console.log($index);
        chunks = [].concat(chunks).filter(x => x !== undefined);
        if ($index >= chunks.length) {
            if (typeof callback === 'function') {
                callback()
            }
            return
        } else if (!this.push(chunks[$index], ...([encoding].filter(Boolean)))) {
            const pipedStreams: Duplex[] = [].concat(
                // @ts-ignore
                (this._readableState || {}).pipes || this
            ).filter(Boolean);
            let listenerCalled = false
            const drainListener = () => {
                if (listenerCalled) {
                    return
                }
                listenerCalled = true
                for (const stream of pipedStreams) {
                    stream.removeListener('drain', drainListener)
                }
                this.pushWithBackpressure(chunks, encoding, callback, $index + 1)
            }
            for (const stream of pipedStreams) {
                stream.once('drain', drainListener)
            }
            return
        }
        return this.pushWithBackpressure(chunks, encoding, callback, $index + 1)
    }

}
