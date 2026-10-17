import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const fixture = spawn("dotnet", ["run", "--no-build", "--no-restore", "-c", "Release", "--project", "tests/UiRefreshVerification"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => fixture.once("exit", resolve));
let ready = false;
let buffer = "";
const timeout = setTimeout(() => { process.exitCode = 1; fixture.stdin.end('{"command":"stop"}\n'); }, 180000);
fixture.stdout.on("data", chunk => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
        if (line.startsWith("UI_FIXTURE:")) {
            // This IPC record contains a temporary password; report only non-secret metadata.
            const metadata = JSON.parse(line.slice("UI_FIXTURE:".length));
            ready = true;
            clearTimeout(timeout);
            console.log(`READY migrationCount=${metadata.migrationCount} checks=${metadata.checks} schedules=${metadata.scheduleIds.length} requests=${metadata.requestIds.length}`);
            fixture.stdin.end('{"command":"stop"}\n');
        } else if (line.startsWith("PASS ") || line.startsWith("UI_FIXTURE_CLEANUP:")) console.log(line);
    }
});
fixture.stderr.on("data", chunk => process.stderr.write(chunk));
fixture.once("error", error => { console.error(error.message); process.exitCode = 1; });
const code = await Promise.race([finished, delay(210000, undefined, { ref: false }).then(() => { fixture.kill(); return 1; })]);
clearTimeout(timeout);
if (!ready || code !== 0) process.exitCode = 1;
