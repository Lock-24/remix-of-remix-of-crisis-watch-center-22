import { describe, expect, it } from "vitest";
import { acknowledgementRate, createSimulatedAlert } from "@/lib/safesphere-data";

describe("SafeSphere simulated alerts", () => {
  it("always labels a newly created demo alert as simulated and active", () => {
    const alert = createSimulatedAlert({ title: "Drill", message: "Evacuate", location: "Block A", severity: "Critical", audience: 50 }, 2051);
    expect(alert.simulated).toBe(true);
    expect(alert.status).toBe("Active");
    expect(alert.acknowledged).toBe(0);
  });

  it("calculates acknowledgement percentage from concrete audience values", () => {
    const alert = createSimulatedAlert({ title: "Drill", message: "Evacuate", location: "Block A", severity: "High", audience: 50 }, 2052);
    expect(acknowledgementRate({ ...alert, acknowledged: 40 })).toBe(80);
  });
});