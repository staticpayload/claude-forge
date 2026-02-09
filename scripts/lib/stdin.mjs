// Timeout-protected stdin reader for hook scripts
export function readStdin(timeoutMs = 5000) {
  return new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        process.stdin.removeAllListeners();
        try { process.stdin.destroy(); } catch {}
        resolve(Buffer.concat(chunks).toString("utf-8"));
      }
    }, timeoutMs);
    process.stdin.on("data", (chunk) => { chunks.push(chunk); });
    process.stdin.on("end", () => {
      if (!settled) { settled = true; clearTimeout(timeout); resolve(Buffer.concat(chunks).toString("utf-8")); }
    });
    process.stdin.on("error", () => {
      if (!settled) { settled = true; clearTimeout(timeout); resolve(""); }
    });
    if (process.stdin.readableEnded) {
      if (!settled) { settled = true; clearTimeout(timeout); resolve(Buffer.concat(chunks).toString("utf-8")); }
    }
  });
}
