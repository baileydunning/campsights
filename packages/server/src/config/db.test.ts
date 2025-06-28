import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { seedDB, db } from "./db";
import campsites from "../../data/campsites.json";

describe("seedDB", () => {
    let putMock: ReturnType<typeof vi.fn>;
    let transactionMock: ReturnType<typeof vi.fn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        putMock = vi.fn().mockResolvedValue(undefined);
        transactionMock = vi.fn().mockImplementation(async (fn: Function) => {
            await fn();
        });

        // @ts-ignore
        db.put = putMock;
        // @ts-ignore
        db.transaction = transactionMock;

        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should seed all campsites and log the correct count", async () => {
        await seedDB();

        expect(transactionMock).toHaveBeenCalledTimes(1);
        expect(putMock).toHaveBeenCalledTimes(campsites.length);

        campsites.forEach((campsite: any, idx: number) => {
            expect(putMock).toHaveBeenNthCalledWith(idx + 1, campsite.id, campsite);
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            `[INFO] Seeded ${campsites.length} campsites`
        );
    });

    it("should log and throw error if transaction fails", async () => {
        const error = new Error("Transaction failed");
        transactionMock.mockRejectedValueOnce(error);

        await expect(seedDB()).rejects.toThrow(error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[ERROR] Failed to seed database:",
            error
        );
    });
});