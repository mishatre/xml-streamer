

export const Type = {
    text: 'text',
    openTag: 'open-tag',
    closeTag: 'close-tag',
    attributeName: 'attribute-name',
    attributeValue: 'attribute-value',
};

const States = {
    DATA: 'state-data',
    CDATA: 'state-cdata',
    TAG_BEGIN: 'state-tag-begin',
    TAG_NAME: 'state-tag-name',
    TAG_END: 'state-tag-end',
    ATTRIBUTE_NAME_START: 'state-attribute-name-start',
    ATTRIBUTE_NAME: 'state-attribute-name',
    ATTRIBUTE_NAME_END: 'state-attribute-name-end',
    ATTRIBUTE_VALUE_BEGIN: 'state-attribute-value-begin',
    ATTRIBUTE_VALUE: 'state-attribute-value',
}

const Actions = {
    LT: 'action-lt',
    GT: 'action-gt',
    SPACE: 'action-space',
    EQUAL: 'action-equal',
    QUOTE: 'action-quote',
    SLASH: 'action-slash',
    CHAR: 'action-char',
    ERROR: 'action-error',
}

const charToAction = {
    ' ': Actions.SPACE,
    '\t': Actions.SPACE,
    '\n': Actions.SPACE,
    '\r': Actions.SPACE,
    '<': Actions.LT,
    '>': Actions.GT,
    '"': Actions.QUOTE,
    "'": Actions.QUOTE,
    '=': Actions.EQUAL,
    '/': Actions.SLASH,
};

const getAction = (char: keyof typeof charToAction | string) => charToAction[char as keyof typeof charToAction] || Actions.CHAR;

export default class XMLStateMachine {

    private strBuffer: String = '';
    private encoding: BufferEncoding = 'utf-8';

    private state = States.DATA;
    private data = '';
    private tagName = '';
    private attrName = '';
    private attrValue = '';
    private isClosing = false;
    private openingQuote = '';

    private queue: [string, string][] = [];

    stackBuffer(buffer: Buffer, encoding?: BufferEncoding) {
        if(encoding) {
            this.encoding = encoding;
        }

        if(this.strBuffer.length > 0) {
            throw new Error('Current chunk is not fully consumed');
        }

        this.strBuffer = buffer.toString(this.encoding);
    }

    nextToken() {

        if(this.queue.length > 0) {
            return this.queue.shift();
        }

        const length = this.strBuffer.length;
        for(let i = 0; i < length; i++) {
            const char = this.strBuffer[i];
            this.consumeChar(char);
            // If state machine add token to queue, stop consuming chars and immediately return this token 
            if(this.queue.length > 0) {

                // Slice all processed chars from buffer
                this.strBuffer = this.strBuffer.slice(i+1);

                return this.queue.shift();
            }
        }

        // At this point all buffer must be processed
        this.strBuffer = '';

    }

    private consumeChar(char: any) {

        this.nextStateAction(char);
        
        if (this.tagName[0] === '?' || this.tagName[0] === '!') {
            this.queue = [];
        }
    }

    private nextStateAction(char: any) {
        const actions = this.stateMachine[this.state];

        const charAction = getAction(char);
        const stateCharAction = actions[charAction];

        if(stateCharAction !== undefined) {
            if(stateCharAction === null) {
                return;
            }
            stateCharAction(char);
        } else if(actions[Actions.ERROR]) {
            actions[Actions.ERROR]?.(char);
        } else {
            actions[Actions.CHAR]?.(char);
        }

    }

    // State machine

    private stateMachine = {
        [States.DATA]: {
            [Actions.LT]: () => {
                if (this.data.trim()) {
                    this.queue.push([Type.text, this.data]);
                }
                this.tagName = '';
                this.isClosing = false;
                this.state = States.TAG_BEGIN;
            },
            [Actions.CHAR]: (char: string) => {
                this.data += char;
            }
        },
        [States.CDATA]: {
            [Actions.CHAR]: (char: string) => {
                this.data += char;
            }
        },
        [States.TAG_BEGIN]: {
            [Actions.SPACE]: null,
            [Actions.CHAR]: (char: string) => {
                this.tagName = char;
                this.state = States.TAG_NAME;
            },
            [Actions.SLASH]: () => {
                this.tagName = '';
                this.isClosing = true;
            }
        },
        [States.TAG_NAME]: {
            [Actions.SPACE]: () => {
                if (this.isClosing) {
                    this.state = States.TAG_END;
                } else {
                    this.state = States.ATTRIBUTE_NAME_START;
                    this.queue.push([Type.openTag, this.tagName]);
                }
            },
            [Actions.GT]: () => {
                if (this.isClosing) {
                    this.queue.push([Type.closeTag, this.tagName]);
                } else {
                    this.queue.push([Type.openTag, this.tagName]);
                }
                this.data = '';
                this.state = States.DATA;
            },
            [Actions.SLASH]: () => {
                this.state = States.TAG_END;
                this.queue.push([Type.openTag, this.tagName]);
            },
            [Actions.CHAR]: (char: string) => {
                this.tagName += char;
                if (this.tagName === '![CDATA[') {
                    this.state = States.CDATA;
                    this.data = '';
                    this.tagName = '';
                }
            },
        },
        [States.TAG_END]: {
            [Actions.GT]: () => {
                this.queue.push([Type.closeTag, this.tagName]);
                this.data = '';
                this.state = States.DATA;
            },
            [Actions.CHAR]: null,
        },
        [States.ATTRIBUTE_NAME_START]: {
            [Actions.CHAR]: (char: string) => {
                this.attrName = char;
                this.state = States.ATTRIBUTE_NAME;
            },
            [Actions.GT]: () => {
                this.data = '';
                this.state = States.DATA;
            },
            [Actions.SPACE]: null,
            [Actions.SLASH]: () => {
                this.isClosing = true;
                this.state = States.TAG_END;
            },
        },
        [States.ATTRIBUTE_NAME]: {
            [Actions.SPACE]: () => {
                this.state = States.ATTRIBUTE_NAME_END;
            },
            [Actions.EQUAL]: () => {
                this.queue.push([Type.attributeName, this.attrName]);
                this.state = States.ATTRIBUTE_VALUE_BEGIN;
            },
            [Actions.GT]: () => {
                this.attrValue = '';
                this.queue.push([Type.attributeName, this.attrName]);
                this.queue.push([Type.attributeValue, this.attrValue]);
                this.data = '';
                this.state = States.DATA;
            },
            [Actions.SLASH]: () => {
                this.isClosing = true;
                this.attrValue = '';
                this.queue.push([Type.attributeName, this.attrName]);
                this.queue.push([Type.attributeValue, this.attrValue]);
                this.state = States.TAG_END;
            },
            [Actions.CHAR]: (char: string) => {
                this.attrName += char;
            },
        },
        [States.ATTRIBUTE_NAME_END]: {
            [Actions.SPACE]: null,
            [Actions.EQUAL]: () => {
                this.queue.push([Type.attributeName, this.attrName]);
                this.state = States.ATTRIBUTE_VALUE_BEGIN;
            },
            [Actions.GT]: () => {
                this.attrValue = '';
                this.queue.push([Type.attributeName, this.attrName]);
                this.queue.push([Type.attributeValue, this.attrValue]);
                this.data = '';
                this.state = States.DATA;
            },
            [Actions.CHAR]: (char: string) => {
                this.attrValue = '';
                this.queue.push([Type.attributeName, this.attrName]);
                this.queue.push([Type.attributeValue, this.attrValue]);
                this.attrName = char;
                this.state = States.ATTRIBUTE_NAME;
            },
        },
        [States.ATTRIBUTE_VALUE_BEGIN]: {
            [Actions.SPACE]: null,
            [Actions.QUOTE]: (char: string) => {
                this.openingQuote = char;
                this.attrValue = '';
                this.state = States.ATTRIBUTE_VALUE;
            },
            [Actions.GT]: () => {
                this.attrValue = '';
                this.queue.push([Type.attributeValue, this.attrValue]);
                this.data = '';
                this.state = States.DATA;
            },
            [Actions.CHAR]: (char: string) => {
                this.openingQuote = '';
                this.attrValue = char;
                this.state = States.ATTRIBUTE_VALUE;
            },
        },
        [States.ATTRIBUTE_VALUE]: {
            [Actions.SPACE]: (char: string) => {
                if (this.openingQuote) {
                    this.attrValue += char;
                } else {
                    this.queue.push([Type.attributeValue, this.attrValue]);
                    this.state = States.ATTRIBUTE_NAME_START;
                }
            },
            [Actions.QUOTE]: (char: string) => {
                if (this.openingQuote === char) {
                    this.queue.push([Type.attributeValue, this.attrValue]);
                    this.state = States.ATTRIBUTE_NAME_START;
                } else {
                    this.attrValue += char;
                }
            },
            [Actions.GT]: (char: string) => {
                if (this.openingQuote) {
                    this.attrValue += char;
                } else {
                    this.queue.push([Type.attributeValue, this.attrValue]);
                    this.data = '';
                    this.state = States.DATA;
                }
            },
            [Actions.SLASH]: (char: string) => {
                if (this.openingQuote) {
                    this.attrValue += char;
                } else {
                    this.queue.push([Type.attributeValue, this.attrValue]);
                    this.isClosing = true;
                    this.state = States.TAG_END;
                }
            },
            [Actions.CHAR]: (char: string) => {
                this.attrValue += char;
            },
        },
    }

}
