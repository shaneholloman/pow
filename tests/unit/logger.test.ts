import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { log } from "../../src/logger.js";

describe("logger", () => {
    // biome-ignore lint/suspicious/noExplicitAny: Vitest spy typing is complex and any is acceptable for test utilities
    let consoleLogSpy: any;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test("log.info outputs INFO prefix", () => {
        log.info("test message");
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const call = consoleLogSpy.mock.calls[0];
        expect(call[0]).toContain("INFO");
        expect(call[1]).toBe("test message");
    });

    test("log.success outputs SUCCESS prefix", () => {
        log.success("test message");
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const call = consoleLogSpy.mock.calls[0];
        expect(call[0]).toContain("SUCCESS");
        expect(call[1]).toBe("test message");
    });

    test("log.warning outputs WARNING prefix", () => {
        log.warning("test message");
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const call = consoleLogSpy.mock.calls[0];
        expect(call[0]).toContain("WARNING");
        expect(call[1]).toBe("test message");
    });

    test("log.error outputs ERROR prefix", () => {
        log.error("test message");
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const call = consoleLogSpy.mock.calls[0];
        expect(call[0]).toContain("ERROR");
        expect(call[1]).toBe("test message");
    });

    test("log.action outputs ACTION prefix", () => {
        log.action("test message");
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const call = consoleLogSpy.mock.calls[0];
        expect(call[0]).toContain("ACTION");
        expect(call[1]).toBe("test message");
    });
});
