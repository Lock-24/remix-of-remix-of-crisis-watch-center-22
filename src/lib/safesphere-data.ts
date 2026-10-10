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
  createdAt: number;
  simulated: true;
  sender?: string;
  recipients?: string[];
  acknowledgedBy?: string[];
};

export type Notice = { id: string; title: string; body: string; createdAt: number };
export type AppUser = { username: string; passwordHash: string; blocked: boolean; createdAt: number };
export type RequestStatus = "Open" | "Resolved";
export type RequestRecord = { id: string; username: string; category: string; subject: string; message: string; status: RequestStatus; reply?: string | undefined; createdAt: number };
export const REQUEST_CATEGORIES = ["Safety concern", "Help needed", "Suggestion", "Report issue", "Other"] as const;

export function createRequest(username: string, input: { category: string; subject: string; message: string }): RequestRecord | string {
  const subject = input.subject.trim(), message = input.message.trim();
  if (subject.length < 3) return "Subject must be at least 3 characters.";
  if (message.length < 5) return "Message must be at least 5 characters.";
  return { id: `REQ-${Date.now()}`, username, category: input.category, subject: subject.slice(0, 80), message: message.slice(0, 600), status: "Open", createdAt: Date.now() };
}

export type TeamMember = { name: string; role: string };
export type SiteContent = { projectName: string; projectTagline: string; projectInfo: string; awsIntro: string; team: TeamMember[] };

export const ADMIN_PASSWORD = "awsteam";

const now = Date.now();
export const defaultAlerts: AlertRecord[] = [
  { id: "ALT-2048", title: "Fire drill in progress", message: "Block B evacuation drill is active. Please use the nearest marked exit.", location: "Block B · Academic", severity: "Critical", status: "Active", audience: 248, acknowledged: 192, createdAt: now - 2 * 60e3, simulated: true },
  { id: "ALT-2047", title: "Chemistry lab drill", message: "Chemistry lab corridor is temporarily restricted. Follow safety team instructions.", location: "Science Block · Lab 3", severity: "High", status: "Active", audience: 86, acknowledged: 71, createdAt: now - 8 * 60e3, simulated: true },
  { id: "ALT-2046", title: "Power backup test", message: "Emergency power switchover test completed successfully.", location: "Library · Ground floor", severity: "Medium", status: "Resolved", audience: 132, acknowledged: 128, createdAt: now - 34 * 60e3, simulated: true },
  { id: "ALT-2045", title: "Security check", message: "Visitor verification drill complete. All campus gates are operational.", location: "Main Gate", severity: "Low", status: "Resolved", audience: 64, acknowledged: 61, createdAt: now - 60 * 60e3, simulated: true },
];

export const defaultNotices: Notice[] = [
  { id: "NTC-1", title: "Monthly safety drill", body: "A campus-wide evacuation drill is scheduled for Friday at 11:00 AM.", createdAt: now - 3 * 3600e3 },
  { id: "NTC-2", title: "Update your contact info", body: "Please make sure your emergency contact details are up to date.", createdAt: now - 26 * 3600e3 },
];

export const defaultContent: SiteContent = {
  projectName: "SafeSphere",
  projectTagline: "Every student, every second — campus safety in control.",
  projectInfo: "A smart emergency alert and response platform built for college campuses — students, faculty and staff stay informed in seconds.",
  awsIntro: "The proposed AWS architecture makes SafeSphere scalable, secure and event-driven. The services below are a blueprint for future implementation — this demo has no live AWS integration.",
  team: [
    { name: "Ankur", role: "Project Lead & Product" },
    { name: "Ankush", role: "Frontend & Experience" },
    { name: "Priya Sharma", role: "Cloud Architecture" },
    { name: "Rohan Mehta", role: "Research & Testing" },
  ],
};

export function createSimulatedAlert(input: Omit<AlertRecord, "id" | "status" | "acknowledged" | "createdAt" | "simulated">, sequence: number): AlertRecord {
  return { ...input, id: `ALT-${sequence}`, status: "Active", acknowledged: 0, createdAt: Date.now(), simulated: true };
}

export const DEFAULT_THEME = "light";

export function eligibleAudience(users: AppUser[]): string[] {
  return [...new Set(users.filter((user) => !user.blocked).map((user) => user.username))];
}

export function accountBasedAlert(alert: AlertRecord, users: AppUser[]): AlertRecord {
  const recipients = alert.recipients ?? eligibleAudience(users);
  const acknowledgedBy = [...new Set(alert.acknowledgedBy ?? [])].filter((name) => recipients.includes(name));
  return { ...alert, sender: alert.sender?.trim() || "Admin", recipients, acknowledgedBy, audience: recipients.length, acknowledged: acknowledgedBy.length };
}

export function acknowledgeForUser(alert: AlertRecord, username: string | null): AlertRecord {
  if (!username || alert.status !== "Active" || !alert.recipients?.includes(username) || alert.acknowledgedBy?.includes(username)) return alert;
  const acknowledgedBy = [...(alert.acknowledgedBy ?? []), username];
  return { ...alert, acknowledgedBy, acknowledged: acknowledgedBy.length };
}

export function acknowledgementRate(alert: AlertRecord) {
  if (alert.audience === 0) return 0;
  return Math.round((alert.acknowledged / alert.audience) * 100);
}

export function isAdminPassword(input: string) {
  return input === ADMIN_PASSWORD;
}

export function normalizeUsername(name: string) {
  return name.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(`safesphere:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type LoginResult = { ok: true; user: AppUser } | { ok: false; error: string };

export async function loginUser(users: AppUser[], username: string, password: string): Promise<LoginResult> {
  const user = users.find((u) => u.username === normalizeUsername(username));
  if (!user || user.passwordHash !== (await hashPassword(password))) return { ok: false, error: "Invalid username or password." };
  if (user.blocked) return { ok: false, error: "Your account has been blocked by the admin." };
  return { ok: true, user };
}

export function validateSignup(users: AppUser[], username: string, password: string): string | null {
  const name = normalizeUsername(username);
  if (!/^[a-z0-9_.]{3,20}$/.test(name)) return "Username must be 3–20 characters (letters, numbers, _ or .).";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (users.some((u) => u.username === name)) return "This username is already taken.";
  return null;
}

export function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
