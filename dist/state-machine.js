"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var state_machine_exports = {};
__export(state_machine_exports, {
  Type: () => Type,
  default: () => XMLStateMachine
});
module.exports = __toCommonJS(state_machine_exports);
const Type = {
  text: "text",
  openTag: "open-tag",
  closeTag: "close-tag",
  attributeName: "attribute-name",
  attributeValue: "attribute-value"
};
const States = {
  DATA: "state-data",
  CDATA: "state-cdata",
  TAG_BEGIN: "state-tag-begin",
  TAG_NAME: "state-tag-name",
  TAG_END: "state-tag-end",
  ATTRIBUTE_NAME_START: "state-attribute-name-start",
  ATTRIBUTE_NAME: "state-attribute-name",
  ATTRIBUTE_NAME_END: "state-attribute-name-end",
  ATTRIBUTE_VALUE_BEGIN: "state-attribute-value-begin",
  ATTRIBUTE_VALUE: "state-attribute-value"
};
const Actions = {
  LT: "action-lt",
  GT: "action-gt",
  SPACE: "action-space",
  EQUAL: "action-equal",
  QUOTE: "action-quote",
  SLASH: "action-slash",
  CHAR: "action-char",
  ERROR: "action-error"
};
const charToAction = {
  " ": Actions.SPACE,
  "	": Actions.SPACE,
  "\n": Actions.SPACE,
  "\r": Actions.SPACE,
  "<": Actions.LT,
  ">": Actions.GT,
  '"': Actions.QUOTE,
  "'": Actions.QUOTE,
  "=": Actions.EQUAL,
  "/": Actions.SLASH
};
const getAction = (char) => charToAction[char] || Actions.CHAR;
class XMLStateMachine {
  constructor() {
    this.strBuffer = "";
    this.encoding = "utf-8";
    this.state = States.DATA;
    this.data = "";
    this.tagName = "";
    this.attrName = "";
    this.attrValue = "";
    this.isClosing = false;
    this.openingQuote = "";
    this.queue = [];
    this.stateMachine = {
      [States.DATA]: {
        [Actions.LT]: () => {
          if (this.data.trim()) {
            this.queue.push([Type.text, this.data]);
          }
          this.tagName = "";
          this.isClosing = false;
          this.state = States.TAG_BEGIN;
        },
        [Actions.CHAR]: (char) => {
          this.data += char;
        }
      },
      [States.CDATA]: {
        [Actions.CHAR]: (char) => {
          this.data += char;
        }
      },
      [States.TAG_BEGIN]: {
        [Actions.SPACE]: null,
        [Actions.CHAR]: (char) => {
          this.tagName = char;
          this.state = States.TAG_NAME;
        },
        [Actions.SLASH]: () => {
          this.tagName = "";
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
          this.data = "";
          this.state = States.DATA;
        },
        [Actions.SLASH]: () => {
          this.state = States.TAG_END;
          this.queue.push([Type.openTag, this.tagName]);
        },
        [Actions.CHAR]: (char) => {
          this.tagName += char;
          if (this.tagName === "![CDATA[") {
            this.state = States.CDATA;
            this.data = "";
            this.tagName = "";
          }
        }
      },
      [States.TAG_END]: {
        [Actions.GT]: () => {
          this.queue.push([Type.closeTag, this.tagName]);
          this.data = "";
          this.state = States.DATA;
        },
        [Actions.CHAR]: null
      },
      [States.ATTRIBUTE_NAME_START]: {
        [Actions.CHAR]: (char) => {
          this.attrName = char;
          this.state = States.ATTRIBUTE_NAME;
        },
        [Actions.GT]: () => {
          this.data = "";
          this.state = States.DATA;
        },
        [Actions.SPACE]: null,
        [Actions.SLASH]: () => {
          this.isClosing = true;
          this.state = States.TAG_END;
        }
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
          this.attrValue = "";
          this.queue.push([Type.attributeName, this.attrName]);
          this.queue.push([Type.attributeValue, this.attrValue]);
          this.data = "";
          this.state = States.DATA;
        },
        [Actions.SLASH]: () => {
          this.isClosing = true;
          this.attrValue = "";
          this.queue.push([Type.attributeName, this.attrName]);
          this.queue.push([Type.attributeValue, this.attrValue]);
          this.state = States.TAG_END;
        },
        [Actions.CHAR]: (char) => {
          this.attrName += char;
        }
      },
      [States.ATTRIBUTE_NAME_END]: {
        [Actions.SPACE]: null,
        [Actions.EQUAL]: () => {
          this.queue.push([Type.attributeName, this.attrName]);
          this.state = States.ATTRIBUTE_VALUE_BEGIN;
        },
        [Actions.GT]: () => {
          this.attrValue = "";
          this.queue.push([Type.attributeName, this.attrName]);
          this.queue.push([Type.attributeValue, this.attrValue]);
          this.data = "";
          this.state = States.DATA;
        },
        [Actions.CHAR]: (char) => {
          this.attrValue = "";
          this.queue.push([Type.attributeName, this.attrName]);
          this.queue.push([Type.attributeValue, this.attrValue]);
          this.attrName = char;
          this.state = States.ATTRIBUTE_NAME;
        }
      },
      [States.ATTRIBUTE_VALUE_BEGIN]: {
        [Actions.SPACE]: null,
        [Actions.QUOTE]: (char) => {
          this.openingQuote = char;
          this.attrValue = "";
          this.state = States.ATTRIBUTE_VALUE;
        },
        [Actions.GT]: () => {
          this.attrValue = "";
          this.queue.push([Type.attributeValue, this.attrValue]);
          this.data = "";
          this.state = States.DATA;
        },
        [Actions.CHAR]: (char) => {
          this.openingQuote = "";
          this.attrValue = char;
          this.state = States.ATTRIBUTE_VALUE;
        }
      },
      [States.ATTRIBUTE_VALUE]: {
        [Actions.SPACE]: (char) => {
          if (this.openingQuote) {
            this.attrValue += char;
          } else {
            this.queue.push([Type.attributeValue, this.attrValue]);
            this.state = States.ATTRIBUTE_NAME_START;
          }
        },
        [Actions.QUOTE]: (char) => {
          if (this.openingQuote === char) {
            this.queue.push([Type.attributeValue, this.attrValue]);
            this.state = States.ATTRIBUTE_NAME_START;
          } else {
            this.attrValue += char;
          }
        },
        [Actions.GT]: (char) => {
          if (this.openingQuote) {
            this.attrValue += char;
          } else {
            this.queue.push([Type.attributeValue, this.attrValue]);
            this.data = "";
            this.state = States.DATA;
          }
        },
        [Actions.SLASH]: (char) => {
          if (this.openingQuote) {
            this.attrValue += char;
          } else {
            this.queue.push([Type.attributeValue, this.attrValue]);
            this.isClosing = true;
            this.state = States.TAG_END;
          }
        },
        [Actions.CHAR]: (char) => {
          this.attrValue += char;
        }
      }
    };
  }
  stackBuffer(buffer, encoding) {
    if (encoding) {
      this.encoding = encoding;
    }
    if (this.strBuffer.length > 0) {
      throw new Error("Current chunk is not fully consumed");
    }
    this.strBuffer = buffer.toString(this.encoding);
  }
  nextToken() {
    if (this.queue.length > 0) {
      return this.queue.shift();
    }
    const length = this.strBuffer.length;
    for (let i = 0; i < length; i++) {
      const char = this.strBuffer[i];
      this.consumeChar(char);
      if (this.queue.length > 0) {
        this.strBuffer = this.strBuffer.slice(i + 1);
        return this.queue.shift();
      }
    }
    this.strBuffer = "";
  }
  consumeChar(char) {
    this.nextStateAction(char);
    if (this.tagName[0] === "?" || this.tagName[0] === "!") {
      this.queue = [];
    }
  }
  nextStateAction(char) {
    var _a, _b;
    const actions = this.stateMachine[this.state];
    const charAction = getAction(char);
    const stateCharAction = actions[charAction];
    if (stateCharAction !== void 0) {
      if (stateCharAction === null) {
        return;
      }
      stateCharAction(char);
    } else if (actions[Actions.ERROR]) {
      (_a = actions[Actions.ERROR]) == null ? void 0 : _a.call(actions, char);
    } else {
      (_b = actions[Actions.CHAR]) == null ? void 0 : _b.call(actions, char);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Type
});
