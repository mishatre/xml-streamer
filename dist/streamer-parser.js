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
var streamer_parser_exports = {};
__export(streamer_parser_exports, {
  default: () => XMLStreamerParser
});
module.exports = __toCommonJS(streamer_parser_exports);
var import_state_machine = require("./state-machine");
class XMLStreamerParser {
  constructor(options) {
    this.options = options;
    this.streaming = true;
    this.stack = [];
    this.parser = {
      [import_state_machine.Type.openTag]: (value) => {
        this.stack.push({
          $name: this.parseTagName(value)
        });
      },
      [import_state_machine.Type.closeTag]: () => {
        let tagName = null;
        let current = this.stack.pop();
        if (this.stack.length === 0 && !this.streaming) {
          return current;
        }
        const parent = this.stack.at(-1);
        if (typeof current === "object") {
          tagName = current.$name;
          delete current.$name;
          if (Object.keys(current).length === 1 && "value" in current) {
            current = current.value;
          } else {
            current = current;
          }
        }
        if (!tagName) {
          tagName = "value";
        }
        if (parent && typeof parent === "object") {
          if (current !== void 0) {
            this.assignValue(parent, tagName, current);
          }
        }
        if (this.streaming && tagName === this.options.streamingTag) {
          return current;
        }
      },
      [import_state_machine.Type.attributeName]: (value) => {
        if (this.options.ignoreAttrs === true) {
          return;
        }
        this.stack.push(this.parseTagName(value));
      },
      [import_state_machine.Type.attributeValue]: (value) => {
        if (this.options.ignoreAttrs === true) {
          return;
        }
        const attrName = this.stack.pop();
        const current = this.stack.at(-1);
        if (typeof attrName === "string" && current !== void 0 && typeof current === "object") {
          this.assignValue(current, attrName, value);
        }
      },
      [import_state_machine.Type.text]: (value) => {
        const current = this.stack.at(-1);
        if (current && typeof current === "object") {
          this.assignValue(current, "value", value);
        }
      }
    };
    if (!options.streamingTag) {
      this.streaming = false;
    }
  }
  produce(type, value) {
    return this.parseToken(type, value);
  }
  parseToken(type, value) {
    return this.parser[type](value);
  }
  assignValue(object, key, value) {
    if (typeof value === "string") {
      value = this.castValue(value);
    }
    if (!(key in object)) {
      object[key] = value;
    } else {
      if (!Array.isArray(object[key])) {
        object[key] = [object[key]];
      }
      object[key].push(value);
    }
  }
  castValue(value) {
    const trimmed = value.trim();
    if (trimmed === "true") {
      return true;
    } else if (trimmed === "false") {
      return false;
    }
    return value;
  }
  parseTagName(value) {
    const [_, localName] = value.indexOf(":") !== -1 ? value.split(":") : ["", value];
    return localName;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
