import test from "node:test";
import assert from "node:assert/strict";
import { escapeReceiptHtml } from "../src/utils/receiptHtml.js";

test("receipt fields render stored HTML and script payloads as text", () => {
    assert.equal(escapeReceiptHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    assert.equal(escapeReceiptHtml("</td><script>opener.alert('x')</script>"), "&lt;/td&gt;&lt;script&gt;opener.alert(&#39;x&#39;)&lt;/script&gt;");
});

test("receipt escaping preserves Vietnamese and handles missing values", () => {
    assert.equal(escapeReceiptHtml("Nguyễn Văn An & phòng khám"), "Nguyễn Văn An &amp; phòng khám");
    assert.equal(escapeReceiptHtml(null), "");
    assert.equal(escapeReceiptHtml(123), "123");
});
