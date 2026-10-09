import { describe, expect, it } from "vitest";
import { createRequest, type AppUser, acknowledgementRate, createSimulatedAlert, hashPassword, isAdminPassword, loginUser, validateSignup } from "@/lib/safesphere-data";

describe("SafeSphere rules", () => {
  it("labels a new alert as simulated and active", () => {
    const alert = createSimulatedAlert({ title: "Drill", message: "Evacuate", location: "Block A", severity: "Critical", audience: 50 }, 2051);
    expect(alert.simulated).toBe(true);
    expect(alert.status).toBe("Active");
  });

  it("calculates acknowledgement percentage", () => {
    const alert = createSimulatedAlert({ title: "Drill", message: "Evacuate", location: "Block A", severity: "High", audience: 50 }, 2052);
    expect(acknowledgementRate({ ...alert, acknowledged: 40 })).toBe(80);
  });

  it("admin panel opens only with password awsteam", () => {
    expect(isAdminPassword("awsteam")).toBe(true);
    expect(isAdminPassword("AWSTEAM")).toBe(false);
  });

  it("blocked users cannot log in", async () => {
    const users: AppUser[] = [{ username: "ravi", passwordHash: await hashPassword("secret1"), blocked: true, createdAt: 0 }];
    const res = await loginUser(users, "ravi", "secret1");
    expect(res.ok).toBe(false);
    const ok = await loginUser(users.map((u) => ({ ...u, blocked: false })), "Ravi", "secret1");
    expect(ok.ok).toBe(true);
  });

  it("rejects duplicate usernames", () => {
    expect(validateSignup([{ username: "ravi", passwordHash: "", blocked: false, createdAt: 0 }], "ravi", "secret1")).not.toBeNull();
  });

  it("user request starts Open and rejects too-short subject", () => {
    const r = createRequest("ravi", { category: "Help needed", subject: "Lift stuck", message: "Lift in Block A is stuck" });
    expect(typeof r === "object" && r.status).toBe("Open");
    expect(typeof createRequest("ravi", { category: "Other", subject: "a", message: "hello there" })).toBe("string");
  });
});
