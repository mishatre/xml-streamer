"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  default: () => XMLStreamer
});
module.exports = __toCommonJS(src_exports);
var import_stream = require("stream");
var import_state_machine = __toESM(require("./state-machine"));
var import_streamer_parser = __toESM(require("./streamer-parser"));
class XMLStreamer extends import_stream.Transform {
  constructor(options) {
    super({
      readableObjectMode: true
    });
    if (options.stateMachine) {
      this.stateMachine = new options.stateMachine();
    } else {
      this.stateMachine = new import_state_machine.default();
    }
    this.parser = new import_streamer_parser.default(options);
  }
  _transform(chunk, encoding, callback) {
    const items = [];
    this.stateMachine.stackBuffer(chunk);
    let nextToken = void 0;
    while ((nextToken = this.stateMachine.nextToken()) !== void 0) {
      if (nextToken) {
        const producedObject = this.parser.produce(nextToken[0], nextToken[1]);
        if (producedObject) {
          items.push(producedObject);
        }
      }
    }
    if (items.length > 0) {
      this.push(items, encoding);
      callback();
    } else {
      callback();
    }
  }
  _flush(callback) {
    callback();
  }
  pushWithBackpressure(chunks, encoding, callback = null, $index = 0) {
    console.log($index);
    chunks = [].concat(chunks).filter((x) => x !== void 0);
    if ($index >= chunks.length) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    } else if (!this.push(chunks[$index], ...[encoding].filter(Boolean))) {
      const pipedStreams = [].concat(
        (this._readableState || {}).pipes || this
      ).filter(Boolean);
      let listenerCalled = false;
      const drainListener = () => {
        if (listenerCalled) {
          return;
        }
        listenerCalled = true;
        for (const stream of pipedStreams) {
          stream.removeListener("drain", drainListener);
        }
        this.pushWithBackpressure(chunks, encoding, callback, $index + 1);
      };
      for (const stream of pipedStreams) {
        stream.once("drain", drainListener);
      }
      return;
    }
    return this.pushWithBackpressure(chunks, encoding, callback, $index + 1);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
