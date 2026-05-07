import { describe, expect, it } from "vitest";
import { buildServiceSpec } from "./service.js";

describe("buildServiceSpec", () => {
  it("builds a macOS LaunchDaemon for the HTTPS proxy", () => {
    const spec = buildServiceSpec({
      platform: "darwin",
      nodePath: "/usr/local/bin/node",
      entryScript: "/usr/local/lib/node_modules/portless/dist/cli.js",
      userHome: "/Users/alice",
      uid: "501",
      gid: "20",
    });

    expect(spec.platform).toBe("darwin");
    if (spec.platform !== "darwin") throw new Error("Expected macOS service spec");
    expect(spec.plistPath).toBe("/Library/LaunchDaemons/sh.portless.proxy.plist");
    expect(spec.programArguments).toEqual([
      "/usr/local/bin/node",
      "/usr/local/lib/node_modules/portless/dist/cli.js",
      "proxy",
      "start",
      "--foreground",
      "--port",
      "443",
      "--https",
      "--skip-trust",
    ]);
    expect(spec.plist).toContain("<key>RunAtLoad</key>");
    expect(spec.plist).toContain("<key>KeepAlive</key>");
    expect(spec.plist).toContain("<key>PORTLESS_STATE_DIR</key>");
    expect(spec.plist).toContain("<string>/Users/alice/.portless</string>");
    expect(spec.plist).toContain("<key>SUDO_UID</key>");
    expect(spec.plist).toContain("<string>501</string>");
  });

  it("builds a Linux systemd unit for the HTTPS proxy", () => {
    const spec = buildServiceSpec({
      platform: "linux",
      nodePath: "/usr/bin/node",
      entryScript: "/usr/lib/node_modules/portless/dist/cli.js",
      userHome: "/home/alice",
      uid: "1000",
      gid: "1000",
    });

    expect(spec.platform).toBe("linux");
    if (spec.platform !== "linux") throw new Error("Expected Linux service spec");
    expect(spec.unitPath).toBe("/etc/systemd/system/portless.service");
    expect(spec.execStart).toEqual([
      "/usr/bin/node",
      "/usr/lib/node_modules/portless/dist/cli.js",
      "proxy",
      "start",
      "--foreground",
      "--port",
      "443",
      "--https",
      "--skip-trust",
    ]);
    expect(spec.unit).toContain("Description=Portless HTTPS proxy");
    expect(spec.unit).toContain('Environment=PORTLESS_STATE_DIR="/home/alice/.portless"');
    expect(spec.unit).toContain('Environment=SUDO_UID="1000"');
    expect(spec.unit).toContain(
      'ExecStart="/usr/bin/node" "/usr/lib/node_modules/portless/dist/cli.js" "proxy" "start" "--foreground" "--port" "443" "--https" "--skip-trust"'
    );
    expect(spec.unit).toContain("WantedBy=multi-user.target");
  });

  it("builds a Windows startup task for the HTTPS proxy", () => {
    const spec = buildServiceSpec({
      platform: "win32",
      nodePath: "C:\\Program Files\\nodejs\\node.exe",
      entryScript: "C:\\Users\\Alice\\AppData\\Roaming\\npm\\node_modules\\portless\\dist\\cli.js",
      userHome: "C:\\Users\\Alice",
    });

    expect(spec.platform).toBe("win32");
    if (spec.platform !== "win32") throw new Error("Expected Windows service spec");
    expect(spec.taskName).toBe("Portless Proxy");
    expect(spec.createArgs).toContain("/SC");
    expect(spec.createArgs).toContain("ONSTART");
    expect(spec.createArgs).toContain("/RU");
    expect(spec.createArgs).toContain("SYSTEM");
    expect(spec.scriptPath).toBe("C:\\ProgramData\\portless\\service\\portless-service.cmd");
    expect(spec.taskRun).toBe('"C:\\ProgramData\\portless\\service\\portless-service.cmd"');
    expect(spec.script).toContain("PORTLESS_STATE_DIR=C:\\Users\\Alice\\.portless");
    expect(spec.script).toContain('"C:\\Program Files\\nodejs\\node.exe"');
    expect(spec.script).toContain("proxy");
    expect(spec.script).toContain("--port");
    expect(spec.script).toContain("443");
    expect(spec.script).toContain("--https");
    expect(spec.script).toContain("--skip-trust");
  });
});
