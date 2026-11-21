import assert from "node:assert/strict";
import test from "node:test";
import {bookLoadMessage} from "./reader-errors.mjs";

test("book loading guidance distinguishes direct file access from hosted and local HTTP", () => {
  assert.match(bookLoadMessage("file:"), /start-reader.cmd/);
  for (const protocol of ["https:", "http:"]) {
    assert.match(bookLoadMessage(protocol), /Go to retry/);
    assert.doesNotMatch(bookLoadMessage(protocol), /local web server|HTTP 404/);
  }
});
