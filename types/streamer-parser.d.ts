export interface ParserOptions {
    streamingTag?: string;
    ignoreAttrs?: boolean;
}
export default class XMLStreamerParser {
    private options;
    private streaming;
    private stack;
    constructor(options: ParserOptions);
    produce(type: string, value: string): object | undefined;
    private parseToken;
    private assignValue;
    private castValue;
    private parseTagName;
    private parser;
}
