export type Severity = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Active" | "Resolved";

export type AlertRecord = {
  id: string;
  title: string;
  message: string;
  location: string;
  severity: Severity;
  status: AlertStatus;
  audience: number;
  acknowledged: number;
  time: string;
  simulated: true;
};

export type TeamMember = { name: string; role: string };

export type SiteContent = {
  projectName: string;
  projectTagline: string;
  projectInfo: string;
  awsIntro: string;
  team: TeamMember[];
};

export const defaultAlerts: AlertRecord[] = [
  { id: "ALT-2048", title: "Fire drill initiated", message: "Block B evacuation drill active hai. Nearest marked exit use karein.", location: "College · Block B", severity: "Critical", status: "Active", audience: 248, acknowledged: 192, time: "2 min pehle", simulated: true },
  { id: "ALT-2047", title: "Chemical spill drill", message: "Lab corridor temporarily restricted hai. Safety team instructions follow karein.", location: "Factory · Zone 3", severity: "High", status: "Active", audience: 86, acknowledged: 71, time: "8 min pehle", simulated: true },
  { id: "ALT-2046", title: "Power backup test", message: "Emergency power switchover test successfully complete hua.", location: "Hospital · East Wing", severity: "Medium", status: "Resolved", audience: 132, acknowledged: 128, time: "34 min pehle", simulated: true },
  { id: "ALT-2045", title: "Security check", message: "Visitor verification drill complete. Sabhi entry gates operational hain.", location: "Office · HQ", severity: "Low", status: "Resolved", audience: 64, acknowledged: 61, time: "1 hr pehle", simulated: true },
];

export const defaultContent: SiteContent = {
  projectName: "SafeSphere",
  projectTagline: "Har jagah, har second — safety in control.",
  projectInfo: "Colleges, offices, factories, hospitals aur homes ke liye ek unified emergency response experience.",
  awsIntro: "AWS par proposed architecture SafeSphere ko scalable, secure aur event-driven bana sakta hai. Neeche ke services future implementation ka blueprint hain — current demo mein koi live AWS integration nahi hai.",
  team: [
    { name: "Ankur", role: "Project Lead & Product" },
    { name: "Ankush", role: "Frontend & Experience" },
    { name: "Priya Sharma", role: "Cloud Architecture" },
    { name: "Rohan Mehta", role: "Research & Testing" },
  ],
};

export function createSimulatedAlert(input: Omit<AlertRecord, "id" | "status" | "acknowledged" | "time" | "simulated">, sequence: number): AlertRecord {
  return { ...input, id: `ALT-${sequence}`, status: "Active", acknowledged: 0, time: "abhi", simulated: true };
}

export function acknowledgementRate(alert: AlertRecord) {
  if (alert.audience === 0) return 0;
  return Math.round((alert.acknowledged / alert.audience) * 100);
}