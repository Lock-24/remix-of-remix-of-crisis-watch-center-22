import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, eligibleAudience, accountBasedAlert, acknowledgeForUser, createRequest, type AppUser, acknowledgementRate, createSimulatedAlert, hashPassword, isAdminPassword, loginUser, validateSignup } from "@/lib/safesphere-data";

describe("SafeSphere rules", () => {
  it("defaults to light", () => {
    expect(DEFAULT_THEME).toBe("light");
  });

  const accounts: AppUser[] = [
    { username: "ravi", blocked: false, passwordHash: "", createdAt: 0 },
    { username: "ankur", blocked: false, passwordHash: "", createdAt: 0 },
    { username: "blocked", blocked: true, passwordHash: "", createdAt: 0 },
  ];

  it("uses real eligible accounts instead of invented audience numbers", () => {
    const alert = accountBasedAlert(createSimulatedAlert({ title: "Drill", message: "Test", location: "Library", severity: "High", audience: 334 }, 1), accounts);
    expect(eligibleAudience(accounts)).toEqual(["ravi", "ankur"]);
    expect(alert.audience).toBe(2);
    expect(alert.acknowledged).toBe(0);
    expect(accountBasedAlert(alert, []).audience).toBe(2);
  });

  it("counts a recipient once and rejects anonymous and non-recipient responses", () => {
    const alert = accountBasedAlert(createSimulatedAlert({ title: "Drill", message: "Test", location: "Library", severity: "High", audience: 100 }, 2), accounts);
    const acknowledged = acknowledgeForUser(alert, "ravi");
    expect(acknowledged.acknowledged).toBe(1);
    expect(acknowledgeForUser(acknowledged, "ravi").acknowledged).toBe(1);
    expect(acknowledgeForUser(alert, null).acknowledged).toBe(0);
    expect(acknowledgeForUser(alert, "blocked").acknowledged).toBe(0);
  });

  it("preserves organisation sender and defaults older alerts to Admin", () => {
    const alert = createSimulatedAlert({ title: "Drill", message: "Test", location: "Library", severity: "High", audience: 0, sender: "College Safety Office" }, 3);
    expect(accountBasedAlert(alert, []).sender).toBe("College Safety Office");
    expect(accountBasedAlert({ ...alert, sender: "" }, []).sender).toBe("Admin");
  });
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
