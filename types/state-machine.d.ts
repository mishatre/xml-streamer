/// <reference types="node" />
export declare const Type: {
    text: string;
    openTag: string;
    closeTag: string;
    attributeName: string;
    attributeValue: string;
};
export default class XMLStateMachine {
    private strBuffer;
    private encoding;
    private state;
    private data;
    private tagName;
    private attrName;
    private attrValue;
    private isClosing;
    private openingQuote;
    private queue;
    stackBuffer(buffer: Buffer, encoding?: BufferEncoding): void;
    nextToken(): [string, string] | undefined;
    private consumeChar;
    private nextStateAction;
    private stateMachine;
}
