import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Bell, BellOff, BellRing, Building2, CheckCircle2, CloudCog, Database,
  Factory, HeartPulse, Home, KeyRound, Lock, LogOut, Megaphone, Menu, Network, PencilLine, Radio,
  Search, Send, Moon, Sun, Inbox, MessageSquarePlus, FlaskConical, Library, BedDouble, Shield, ShieldCheck, Siren, Sparkles, Trash2, UserX, UserCheck, Users, X, Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "./Button";
import { CampusBackground } from "./CampusBackground";
import {
  DEFAULT_THEME, eligibleAudience, accountBasedAlert, acknowledgeForUser, acknowledgementRate, createSimulatedAlert, defaultAlerts, defaultContent, defaultNotices,
  hashPassword, isAdminPassword, loginUser, normalizeUsername, timeAgo, validateSignup,
  createRequest, REQUEST_CATEGORIES, type RequestRecord, type AlertRecord, type AppUser, type Notice, type Severity, type SiteContent,
} from "@/lib/safesphere-data";

const KEYS = { alerts: "safesphere-alerts-v3", requests: "safesphere-requests-v1", theme: "safesphere-theme-v2", notices: "safesphere-notices-v1", users: "safesphere-users-v1", content: "safesphere-content-v3", session: "safesphere-session-v1" };
const ADMIN_SESSION = "safesphere-admin-unlocked";

const navItems = [
  { key: "dashboard", label: "Dashboard" }, { key: "alerts", label: "Alerts" },
  { key: "notices", label: "Notices" }, { key: "requests", label: "Requests" }, { key: "aws", label: "About AWS" },
];
const severityStyle: Record<Severity, string> = {
  Critical: "border-emergency/25 bg-emergency-muted text-emergency-soft",
  High: "border-warning/25 bg-warning-muted text-warning",
  Medium: "border-info/25 bg-info-muted text-info",
  Low: "border-success/25 bg-success-muted text-success",
};

function load<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

function pushNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification(title, { body, tag: `${title}-${Date.now()}` }); } catch { /* some mobile browsers only allow service-worker notifications */ }
}

type Toast = { id: number; title: string; body: string; tone: "alert" | "notice" };

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="grid gap-2 text-xs font-medium text-muted-foreground">{label}<input className="h-11 rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring" {...props} /></label>;
}
function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="grid gap-2 text-xs font-medium text-muted-foreground">{label}<textarea className="min-h-24 rounded-md border border-border bg-input p-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring" {...props} /></label>;
}
function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${severityStyle[severity]}`}><span className="size-1.5 rounded-full bg-current" />{severity}</span>;
}
function Blobs() {
  return <CampusBackground />;
}
function Logo({ name }: { name: string }) {
  return <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-signal"><Shield className="size-5" /></span><span className="text-left"><span className="block text-base font-bold">{name}</span><span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Campus safety</span></span></span>;
}

export function SafeSphereApp() {
  const [hydrated, setHydrated] = useState(false);
  const [alerts, setAlerts] = useState<AlertRecord[]>(defaultAlerts);
  const [notices, setNotices] = useState<Notice[]>(defaultNotices);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [session, setSession] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [view, setView] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminPrompt, setAdminPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">(DEFAULT_THEME);
  const [bigAlert, setBigAlert] = useState<AlertRecord | null>(null);
  const seen = useRef<{ alerts: Set<string>; notices: Set<string> }>({ alerts: new Set(), notices: new Set() });

  const toast = (t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((c) => [...c, { ...t, id }]);
    setTimeout(() => setToasts((c) => c.filter((x) => x.id !== id)), 6000);
  };

  useEffect(() => {
    const a = load(KEYS.alerts, defaultAlerts), n = load(KEYS.notices, defaultNotices);
    seen.current = { alerts: new Set(a.map((x) => x.id)), notices: new Set(n.map((x) => x.id)) };
    setAlerts(a); setNotices(n); setUsers(load(KEYS.users, [])); setContent(load(KEYS.content, defaultContent));
    setSession(load<string | null>(KEYS.session, null));
    setRequests(load(KEYS.requests, []));
    setTheme(load<"dark" | "light">(KEYS.theme, DEFAULT_THEME));
    setAdmin(window.sessionStorage.getItem(ADMIN_SESSION) === "1");
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem(KEYS.alerts, JSON.stringify(alerts)); }, [alerts, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(KEYS.notices, JSON.stringify(notices)); }, [notices, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(KEYS.users, JSON.stringify(users)); }, [users, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(KEYS.content, JSON.stringify(content)); }, [content, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(KEYS.requests, JSON.stringify(requests)); }, [requests, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEYS.theme, JSON.stringify(theme));
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme, hydrated]);
  const toggleTheme = () => {
    const el = document.documentElement; el.classList.add("theme-anim");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    window.setTimeout(() => el.classList.remove("theme-anim"), 450);
  };
  useEffect(() => { if (hydrated) localStorage.setItem(KEYS.session, JSON.stringify(session)); }, [session, hydrated]);

  // Notify when new alerts/notices appear (same tab or from the admin in another tab)
  useEffect(() => {
    if (!hydrated) return;
    alerts.forEach((a) => { if (!seen.current.alerts.has(a.id)) { seen.current.alerts.add(a.id); pushNotification(`🚨 ${a.severity} alert: ${a.title}`, `${a.location} — ${a.message}`); setBigAlert(a); } });
    notices.forEach((n) => { if (!seen.current.notices.has(n.id)) { seen.current.notices.add(n.id); pushNotification(`📢 Notice: ${n.title}`, n.body); toast({ title: `Notice · ${n.title}`, body: n.body, tone: "notice" }); } });
  }, [alerts, notices, hydrated]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.alerts) setAlerts(load(KEYS.alerts, defaultAlerts));
      if (e.key === KEYS.notices) setNotices(load(KEYS.notices, defaultNotices));
      if (e.key === KEYS.users) setUsers(load(KEYS.users, []));
      if (e.key === KEYS.requests) setRequests(load(KEYS.requests, []));
      if (e.key === KEYS.content) setContent(load(KEYS.content, defaultContent));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Kick out a user who gets blocked or removed by the admin
  const currentUser = users.find((u) => u.username === session);
  useEffect(() => {
    if (hydrated && session && (!currentUser || currentUser.blocked)) { setSession(null); toast({ title: "Signed out", body: "Your account was blocked or removed by the admin.", tone: "alert" }); }
  }, [hydrated, session, currentUser]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") { toast({ title: "Not supported", body: "This browser does not support notifications.", tone: "notice" }); return; }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") pushNotification("Notifications enabled", "You will now receive SafeSphere alerts.");
  };

  const navigate = (v: string) => { setView(v); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const displayedAlerts = alerts.map((alert) => accountBasedAlert(alert, users));
  const acknowledge = (id: string) => setAlerts((c) => c.map((a) => a.id === id ? acknowledgeForUser(accountBasedAlert(a, users), currentUser && !currentUser.blocked ? currentUser.username : null) : a));
  const resolve = (id: string) => setAlerts((c) => c.map((a) => a.id === id ? { ...a, status: "Resolved" } : a));
  const unlockAdmin = () => { sessionStorage.setItem(ADMIN_SESSION, "1"); setAdmin(true); setAdminPrompt(false); navigate("admin"); };
  const lockAdmin = () => { sessionStorage.removeItem(ADMIN_SESSION); setAdmin(false); navigate("dashboard"); };

  if (!hydrated) return <main className="min-h-screen bg-background"><Blobs /></main>;

  const signedIn = !!currentUser && !currentUser.blocked;
  const themeBtn = <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" title={theme === "dark" ? "Light mode" : "Dark mode"}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>;
  const alertOverlay = bigAlert && <div className="alert-overlay-in fixed inset-0 z-[70] grid place-items-center bg-overlay p-4 backdrop-blur-sm" onClick={() => setBigAlert(null)}>
    <div role="alertdialog" aria-label="New emergency alert" className="glass-modal alert-pop alert-glow relative w-full max-w-md overflow-hidden border-emergency/50 p-6 text-center" onClick={(e) => e.stopPropagation()}>
      <div className="emergency-line alert-flash absolute inset-x-0 top-0 h-1" />
      <div className="relative mx-auto grid size-20 place-items-center"><span className="alert-ring absolute inset-0 rounded-full bg-emergency/40" /><span className="alert-ring absolute inset-0 rounded-full bg-emergency/30 [animation-delay:.5s]" /><span className="relative grid size-16 place-items-center rounded-full bg-emergency text-emergency-foreground shadow-emergency"><Siren className="siren-shake size-8" /></span></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emergency-soft">New emergency alert · Simulated</p>
      <h2 className="mt-2 font-display text-2xl font-bold">{bigAlert.title}</h2>
      <div className="mt-3 flex justify-center"><SeverityPill severity={bigAlert.severity} /></div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{bigAlert.message}</p>
      <p className="mt-2 text-xs text-muted-foreground">{bigAlert.location}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">Sent by {bigAlert.sender || "Admin"}</p>
      <div className="mt-6 grid grid-cols-2 gap-2"><Button variant="primary" disabled={!currentUser || currentUser.blocked || !accountBasedAlert(bigAlert, users).recipients?.includes(currentUser.username)} onClick={() => { acknowledge(bigAlert.id); setBigAlert(null); }}><CheckCircle2 className="size-4" /> I'm safe</Button><Button onClick={() => { setBigAlert(null); navigate("alerts"); }}>View alerts</Button></div>
    </div>
  </div>;
  const toastLayer = <div className="fixed right-4 top-20 z-[60] grid w-[min(92vw,360px)] gap-2">{toasts.map((t) => <div key={t.id} className={`glass-modal toast-in flex gap-3 p-4 ${t.tone === "alert" ? "border-emergency/40" : ""}`}><span className={`metric-icon shrink-0 ${t.tone === "alert" ? "metric-danger" : "metric-primary"}`}>{t.tone === "alert" ? <Siren className="size-5" /> : <Megaphone className="size-5" />}</span><div className="min-w-0"><p className="text-sm font-bold">{t.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body}</p></div></div>)}</div>;
  const adminModal = adminPrompt && <AdminLoginModal onClose={() => setAdminPrompt(false)} onUnlock={unlockAdmin} />;

  if (!signedIn && !admin) {
    return <main className="relative min-h-screen bg-background text-foreground"><Blobs />
      <div className="absolute right-4 top-4 z-10">{themeBtn}</div>
      <AuthScreen content={content} users={users} onOpenAdmin={() => setAdminPrompt(true)}
        onLogin={(name) => { setSession(name); setView("dashboard"); if (permission === "default") void requestPermission(); }}
        onSignup={(u) => { setUsers((c) => [...c, u]); setSession(u.username); if (permission === "default") void requestPermission(); }} />
      <TeamFooter content={content} />{adminModal}{toastLayer}{alertOverlay}</main>;
  }

  const items = admin ? [...navItems, { key: "admin", label: "Admin Panel" }] : navItems;

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <Blobs />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <Button variant="ghost" className="h-auto px-0 text-foreground" onClick={() => navigate("dashboard")} aria-label="Go to dashboard"><Logo name={content.projectName} /></Button>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {items.map(({ key, label }) => <Button key={key} size="sm" variant={view === key ? "secondary" : "ghost"} onClick={() => navigate(key)}>{label}</Button>)}
          </nav>
          <div className="flex items-center gap-2">
            {themeBtn}
            {permission !== "unsupported" && <Button variant="ghost" size="icon" onClick={requestPermission} aria-label="Enable notifications" title={permission === "granted" ? "Notifications on" : "Enable notifications"}>{permission === "granted" ? <BellRing className="size-4 text-success" /> : permission === "denied" ? <BellOff className="size-4" /> : <Bell className="size-4" />}</Button>}
            {admin ? <Button variant="danger" size="sm" onClick={() => navigate("admin")}><ShieldCheck className="size-4" /><span className="hidden sm:inline">Admin</span></Button>
              : <Button variant="secondary" size="sm" onClick={() => setAdminPrompt(true)}><Lock className="size-4" /><span className="hidden sm:inline">Admin Panel</span></Button>}
            {signedIn && <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold xl:flex"><span className="status-pulse size-2 rounded-full bg-success" />@{currentUser.username}</span>}
            <Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={() => { if (admin) lockAdmin(); setSession(null); }}><LogOut className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen && <nav className="glass-panel animate-enter mx-4 mb-3 grid gap-1 p-2 lg:hidden">{items.map(({ key, label }) => <Button key={key} variant="ghost" className="justify-start" onClick={() => navigate(key)}>{label}</Button>)}</nav>}
      </header>

      {permission === "default" && <div className="relative mx-auto mt-4 max-w-[1280px] px-4 sm:px-6"><div className="glass-panel flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center"><p className="flex items-center gap-3 text-sm"><BellRing className="size-5 text-primary" /> Turn on notifications to get instant alerts and notices from the admin.</p><Button variant="primary" size="sm" onClick={requestPermission}>Allow notifications</Button></div></div>}

      <div key={view} className="animate-enter relative mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">
        {view === "dashboard" && <Dashboard content={content} alerts={displayedAlerts} username={currentUser?.username ?? null} notices={notices} navigate={navigate} acknowledge={acknowledge} resolve={resolve} admin={admin} />}
        {view === "alerts" && <AlertsView alerts={displayedAlerts} username={currentUser?.username ?? null} acknowledge={acknowledge} resolve={resolve} admin={admin} />}
        {view === "notices" && <NoticesView notices={notices} />}
        {view === "requests" && <RequestsView username={currentUser?.username ?? "admin"} requests={requests} setRequests={setRequests} toast={toast} />}
        {view === "aws" && <AwsView intro={content.awsIntro} />}
        {view === "admin" && admin && <AdminView alerts={displayedAlerts} setAlerts={setAlerts} notices={notices} setNotices={setNotices} requests={requests} setRequests={setRequests} users={users} setUsers={setUsers} content={content} setContent={setContent} onLock={lockAdmin} toast={toast} />}
      </div>
      <TeamFooter content={content} />
      {adminModal}{toastLayer}{alertOverlay}
    </main>
  );
}

function AuthScreen({ content, users, onLogin, onSignup, onOpenAdmin }: { content: SiteContent; users: AppUser[]; onLogin: (u: string) => void; onSignup: (u: AppUser) => void; onOpenAdmin: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "login") { const r = await loginUser(users, username, password); if (r.ok) onLogin(r.user.username); else setError(r.error); }
      else { const err = validateSignup(users, username, password); if (err) setError(err); else onSignup({ username: normalizeUsername(username), passwordHash: await hashPassword(password), blocked: false, createdAt: Date.now() }); }
    } finally { setBusy(false); }
  };
  return <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_.9fr]">
    <section className="animate-enter">
      <Logo name={content.projectName} />
      <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Smart campus alert platform</div>
      <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">{content.projectName}<br /><span className="text-primary">Campus safety.</span></h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">{content.projectInfo}</p>
      <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">{[[Siren, "Instant alerts"], [Megaphone, "Live notices"], [MessageSquarePlus, "Send requests"]].map(([Icon, label]) => { const I = Icon as typeof Siren; return <div key={label as string} className="glass-panel p-4 text-center"><I className="mx-auto size-5 text-primary" /><p className="mt-2 text-xs font-semibold">{label as string}</p></div>; })}</div>
    </section>
    <section className="glass-modal animate-enter p-6 sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-md border border-border bg-input p-1">{(["login", "signup"] as const).map((m) => <button key={m} onClick={() => { setMode(m); setError(""); }} className={`h-9 rounded text-sm font-semibold transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{m === "login" ? "Sign in" : "Create account"}</button>)}</div>
      <h2 className="font-display text-2xl font-bold">{mode === "login" ? "Welcome back" : "Join SafeSphere"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Sign in with your username and password." : "Pick a username and password to get started."}</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required maxLength={20} />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required maxLength={64} />
        {error && <p className="rounded-md border border-emergency/30 bg-emergency-muted px-3 py-2 text-sm text-emergency-soft">{error}</p>}
        <Button variant="primary" type="submit" disabled={busy}>{mode === "login" ? "Sign in" : "Create account"}</Button>
      </form>
      <div className="mt-6 border-t border-border pt-5"><Button variant="ghost" className="w-full" onClick={onOpenAdmin}><Lock className="size-4" /> Open Admin Panel</Button></div>
    </section>
  </div>;
}

function AdminLoginModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const [pw, setPw] = useState(""); const [error, setError] = useState(false);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4 backdrop-blur-sm" onClick={onClose}>
    <form className="glass-modal animate-enter w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (isAdminPassword(pw)) onUnlock(); else setError(true); }}>
      <div className="flex items-center justify-between"><span className="metric-icon metric-danger"><KeyRound className="size-5" /></span><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button></div>
      <h2 className="mt-4 font-display text-xl font-bold">Admin access</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter the admin password to continue.</p>
      <div className="mt-5"><Field label="Password" type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setError(false); }} /></div>
      {error && <p className="mt-3 text-sm text-emergency-soft">Incorrect password.</p>}
      <Button variant="danger" type="submit" className="mt-5 w-full"><ShieldCheck className="size-4" /> Unlock</Button>
    </form>
  </div>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}
function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <div className="glass-panel hover-lift p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><span className={`metric-icon ${tone}`}>{icon}</span></div><p className="mt-3 font-display text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function AlertCard({ alert, acknowledge, resolve, admin, username }: { username: string | null; alert: AlertRecord; acknowledge: (id: string) => void; resolve: (id: string) => void; admin: boolean }) {
  const rate = acknowledgementRate(alert);
  return <article className="glass-panel hover-lift p-5">
    <div className="flex flex-wrap items-center gap-2"><SeverityPill severity={alert.severity} /><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${alert.status === "Active" ? "bg-emergency-muted text-emergency-soft" : "bg-success-muted text-success"}`}>{alert.status}</span><span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">Simulated</span><span className="ml-auto text-xs text-muted-foreground">{timeAgo(alert.createdAt)}</span></div>
    <h3 className="mt-3 text-lg font-bold">{alert.title}</h3>
    <p className="mt-1 text-sm leading-6 text-muted-foreground">{alert.message}</p>
    <p className="mt-3 text-xs text-muted-foreground">{alert.location} · {alert.id}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">Sent by {alert.sender || "Admin"}</p>
    <div className="mt-4"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Acknowledged</span><span className="font-semibold">{alert.acknowledged}/{alert.audience} · {rate}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${rate}%` }} /></div></div>
    {alert.status === "Active" && <div className="mt-4 flex gap-2"><Button size="sm" variant="primary" disabled={!username || !alert.recipients?.includes(username) || alert.acknowledgedBy?.includes(username)} onClick={() => acknowledge(alert.id)}><CheckCircle2 className="size-4" />{username && alert.acknowledgedBy?.includes(username) ? "Acknowledged" : "I'm safe"}</Button>{admin && <Button size="sm" onClick={() => resolve(alert.id)}>Mark resolved</Button>}</div>}
  </article>;
}

function Dashboard({ content, alerts, notices, navigate, acknowledge, resolve, admin, username }: { username: string | null; content: SiteContent; alerts: AlertRecord[]; notices: Notice[]; navigate: (v: string) => void; acknowledge: (id: string) => void; resolve: (id: string) => void; admin: boolean }) {
  const active = alerts.filter((a) => a.status === "Active");
  const aud = active.reduce((s, a) => s + a.audience, 0), ack = active.reduce((s, a) => s + a.acknowledged, 0);
  const audienceCount = new Set(active.flatMap((alert) => alert.recipients ?? [])).size;
  const chartData = [...alerts].sort((a, b) => a.createdAt - b.createdAt).map((alert) => ({ time: new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), alerts: alert.audience, response: acknowledgementRate(alert) }));
  const locations = [...new Set(alerts.map((alert) => alert.location))];
  return <div>
    <section className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
      <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary"><span className="size-2 rounded-full bg-primary" /> CAMPUS SAFETY OVERVIEW</p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your campus, in safe hands.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{content.projectTagline}</p>
      </div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => navigate("requests")}><MessageSquarePlus className="size-4" /> Send a request</Button><Button variant="primary" onClick={() => navigate("alerts")}><Siren className="size-4" /> View alerts</Button></div>
    </section>
    <section className="stagger mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<AlertTriangle className="size-5" />} label="Active alerts" value={String(active.length)} detail="Currently in progress" tone="metric-danger" />
      <Metric icon={<CheckCircle2 className="size-5" />} label="Response rate" value={`${aud ? Math.round((ack / aud) * 100) : 0}%`} detail="People marked safe" tone="metric-success" />
      <Metric icon={<Users className="size-5" />} label="Alert audience" value={String(audienceCount)} detail="Unique local registered recipients" tone="metric-info" />
      <Metric icon={<Megaphone className="size-5" />} label="Notices" value={String(notices.length)} detail="Published by admin" tone="metric-primary" />
    </section>
    <section className="mb-6 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
      <div className="min-w-0 border-y border-border py-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Response overview</h2><p className="mt-1 text-xs text-muted-foreground">Recorded alert responses · This browser</p></div><span className="flex items-center gap-2 text-xs text-primary"><span className="size-2 rounded-full bg-primary" /> Response rate</span></div>
        <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--info)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--info)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} /><Area type="monotone" dataKey="response" stroke="var(--primary)" fill="url(#g1)" strokeWidth={2} name="Response %" /><Area type="monotone" dataKey="alerts" stroke="var(--info)" fill="url(#g2)" strokeWidth={2} name="Registered recipients" /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="border-y border-border py-5"><h2 className="mb-1 font-semibold">Alert locations</h2><p className="mb-4 text-xs text-muted-foreground">Locations from recorded alerts</p><div className="grid gap-3">{locations.map((location) => <div key={location} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><span className="metric-icon metric-primary"><Building2 className="size-4" /></span><span className="flex-1 text-sm font-semibold">{location}</span></div>)}</div></div>
    </section>
    <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Active alerts</h2><Button size="sm" variant="ghost" onClick={() => navigate("alerts")}>View all</Button></div>
    <div className="grid gap-4 md:grid-cols-2">{active.length ? active.slice(0, 4).map((a) => <AlertCard key={a.id} alert={a} username={username} acknowledge={acknowledge} resolve={resolve} admin={admin} />) : <p className="glass-panel p-6 text-sm text-muted-foreground">No active alerts. All clear.</p>}</div>
  </div>;
}

function AlertsView({ alerts, acknowledge, resolve, admin, username }: { username: string | null; alerts: AlertRecord[]; acknowledge: (id: string) => void; resolve: (id: string) => void; admin: boolean }) {
  const [filter, setFilter] = useState("All"); const [q, setQ] = useState("");
  const list = useMemo(() => alerts.filter((a) => (filter === "All" || a.status === filter || a.severity === filter) && `${a.title} ${a.location} ${a.id}`.toLowerCase().includes(q.toLowerCase())), [alerts, filter, q]);
  return <div>
    <SectionHeading eyebrow="Alerts" title="All emergency alerts" description="Track every alert by severity, location and response. All alerts are simulated." />
    <div className="glass-panel mb-5 flex flex-col gap-3 p-3 md:flex-row md:items-center"><label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-border bg-input px-3"><Search className="size-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts…" className="w-full bg-transparent text-sm outline-none" /></label><div className="flex flex-wrap gap-1">{["All", "Active", "Resolved", "Critical", "High", "Medium", "Low"].map((f) => <Button key={f} size="sm" variant={filter === f ? "primary" : "ghost"} onClick={() => setFilter(f)}>{f}</Button>)}</div></div>
    <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((a) => <AlertCard key={a.id} alert={a} username={username} acknowledge={acknowledge} resolve={resolve} admin={admin} />)}{!list.length && <p className="text-sm text-muted-foreground">No alerts match your filters.</p>}</div>
  </div>;
}

function NoticesView({ notices }: { notices: Notice[] }) {
  return <div><SectionHeading eyebrow="Notices" title="Announcements from admin" description="Important updates and instructions published by your safety team." />
    <div className="grid gap-4 md:grid-cols-2">{notices.map((n) => <article key={n.id} className="glass-panel hover-lift p-5"><div className="flex items-center gap-3"><span className="metric-icon metric-primary"><Megaphone className="size-5" /></span><div><h3 className="font-bold">{n.title}</h3><p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p></div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{n.body}</p></article>)}{!notices.length && <p className="text-sm text-muted-foreground">No notices yet.</p>}</div></div>;
}

function AwsView({ intro }: { intro: string }) {
  const services = [[Zap, "AWS Lambda", "Serverless functions process and route alerts instantly."], [Send, "Amazon SNS", "Fan-out push, SMS and email notifications at scale."], [Database, "DynamoDB", "Low-latency storage for alerts, users and acknowledgements."], [Network, "API Gateway", "Secure, throttled entry point for all clients."], [CloudCog, "CloudWatch", "Monitoring, logs and automatic incident dashboards."], [ShieldCheck, "Cognito", "User sign-in, roles and access control."]] as const;
  return <div><SectionHeading eyebrow="About AWS" title="Cloud architecture blueprint" description={intro} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{services.map(([Icon, t, d]) => <div key={t} className="glass-panel hover-lift p-5"><span className="metric-icon metric-primary"><Icon className="size-5" /></span><h3 className="mt-4 font-bold">{t}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{d}</p></div>)}</div></div>;
}

function TeamFooter({ content }: { content: SiteContent }) {
  return <footer className="relative mt-10 border-t border-border bg-card/40">
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div className="lg:max-w-xs"><Logo name={content.projectName} /><p className="mt-4 text-xs leading-6 text-muted-foreground">Made by {content.team[0]?.name ?? "the SafeSphere team"}<br />A safer campus. A shared responsibility.</p></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 lg:gap-x-10">{content.team.map((m, i) => <div key={i}><p className="text-sm font-semibold">{m.name}</p><p className="mt-1 max-w-36 text-xs leading-5 text-muted-foreground">{m.role}</p></div>)}</div>
      </div>
      <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground"><span>© {new Date().getFullYear()} {content.projectName} · Campus safety</span><span>Demonstration only · All alerts are simulated</span></div>
    </div>
  </footer>;
}

function AdminView({ alerts, setAlerts, notices, setNotices, requests, setRequests, users, setUsers, content, setContent, onLock, toast }: {
  alerts: AlertRecord[]; setAlerts: React.Dispatch<React.SetStateAction<AlertRecord[]>>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; requests: RequestRecord[]; setRequests: React.Dispatch<React.SetStateAction<RequestRecord[]>>;
  users: AppUser[]; setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>; content: SiteContent; setContent: React.Dispatch<React.SetStateAction<SiteContent>>; onLock: () => void; toast: (t: Omit<Toast, "id">) => void;
}) {
  const [tab, setTab] = useState("alert");
  const [a, setA] = useState({ title: "", message: "", location: "", severity: "High" as Severity, sender: "Admin" });
  const [n, setN] = useState({ title: "", body: "" });
  const [draft, setDraft] = useState(content);
  const tabs = [["alert", Siren, "Send alert"], ["notice", Megaphone, "Post notice"], ["requests", Inbox, `Requests (${requests.filter((r) => r.status === "Open").length})`], ["users", Users, `Users (${users.length})`], ["manage", AlertTriangle, "Manage alerts"], ["content", PencilLine, "Edit content"]] as const;
  return <div>
    <SectionHeading eyebrow="Admin Panel" title="Control center" description="Send alerts, publish notices, manage users and edit website content." action={<Button onClick={onLock}><Lock className="size-4" /> Lock admin</Button>} />
    <div className="glass-panel mb-5 flex gap-1 overflow-x-auto p-2">{tabs.map(([k, Icon, l]) => <Button key={k} size="sm" variant={tab === k ? "primary" : "ghost"} onClick={() => setTab(k)}><Icon className="size-4" />{l}</Button>)}</div>
    <div key={tab} className="animate-enter">
    {tab === "alert" && <form className="glass-panel grid gap-4 p-5 sm:p-6 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!a.title.trim() || !a.message.trim()) return; setAlerts((c) => [createSimulatedAlert({ ...a, sender: a.sender.trim() || "Admin", recipients: eligibleAudience(users), acknowledgedBy: [], audience: eligibleAudience(users).length, title: a.title.trim().slice(0, 80), message: a.message.trim().slice(0, 400), location: a.location.trim().slice(0, 80) || "All locations" }, 2050 + c.length + 1), ...c]); setA({ ...a, title: "", message: "" }); }}>
      <Field label="Alert title" required maxLength={80} value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="e.g. Fire in Block C" />
      <Field label="Location" maxLength={80} value={a.location} onChange={(e) => setA({ ...a, location: e.target.value })} placeholder="e.g. Block C · Second floor" />
      <div className="md:col-span-2"><TextArea label="Message" required maxLength={400} value={a.message} onChange={(e) => setA({ ...a, message: e.target.value })} placeholder="What should people do?" /></div>
      <div className="grid gap-2 text-xs font-medium text-muted-foreground">Severity<div className="grid grid-cols-4 gap-2">{(["Critical", "High", "Medium", "Low"] as Severity[]).map((s) => <button type="button" key={s} onClick={() => setA({ ...a, severity: s })} className={`h-10 rounded-md border text-xs font-bold transition ${a.severity === s ? severityStyle[s] : "border-border text-muted-foreground"}`}>{s}</button>)}</div></div>
      <Field label="Sender / organisation name" maxLength={80} value={a.sender} onChange={(e) => setA({ ...a, sender: e.target.value })} placeholder="Admin or your college name" />
      <p className="text-xs leading-6 text-muted-foreground md:col-span-2">Audience: {eligibleAudience(users).length} registered, unblocked users in this browser. This is an account count, not confirmed delivery.</p>
      <div className="md:col-span-2"><Button variant="danger" type="submit"><Send className="size-4" /> Broadcast alert</Button></div>
    </form>}
    {tab === "notice" && <div className="grid gap-5 lg:grid-cols-2">
      <form className="glass-panel grid gap-4 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); if (!n.title.trim() || !n.body.trim()) return; setNotices((c) => [{ id: `NTC-${Date.now()}`, title: n.title.trim().slice(0, 80), body: n.body.trim().slice(0, 600), createdAt: Date.now() }, ...c]); setN({ title: "", body: "" }); }}>
        <Field label="Notice title" required maxLength={80} value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} />
        <TextArea label="Notice" required maxLength={600} value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} />
        <Button variant="primary" type="submit"><Megaphone className="size-4" /> Publish notice</Button>
      </form>
      <div className="grid content-start gap-3">{notices.map((x) => <div key={x.id} className="glass-panel flex items-start gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-semibold">{x.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{x.body}</p></div><Button size="icon" variant="ghost" aria-label="Delete notice" onClick={() => setNotices((c) => c.filter((y) => y.id !== x.id))}><Trash2 className="size-4" /></Button></div>)}</div>
    </div>}
    {tab === "requests" && <AdminRequests requests={requests} setRequests={setRequests} toast={toast} />}
    {tab === "users" && <div className="glass-panel overflow-hidden">{users.length ? users.map((u) => <div key={u.username} className="flex flex-wrap items-center gap-3 border-b border-border p-4 last:border-0"><span className="grid size-10 place-items-center rounded-full bg-primary/15 font-bold text-primary">{(u.username[0] ?? "?").toUpperCase()}</span><div className="flex-1"><p className="font-semibold">@{u.username}</p><p className="text-xs text-muted-foreground">Joined {timeAgo(u.createdAt)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${u.blocked ? "bg-emergency-muted text-emergency-soft" : "bg-success-muted text-success"}`}>{u.blocked ? "Blocked" : "Active"}</span><Button size="sm" onClick={() => { setUsers((c) => c.map((x) => x.username === u.username ? { ...x, blocked: !x.blocked } : x)); toast({ title: u.blocked ? "User unblocked" : "User blocked", body: `@${u.username}`, tone: "notice" }); }}>{u.blocked ? <><UserCheck className="size-4" /> Unblock</> : <><UserX className="size-4" /> Block</>}</Button><Button size="sm" variant="danger" onClick={() => { if (confirm(`Remove @${u.username}?`)) setUsers((c) => c.filter((x) => x.username !== u.username)); }}><Trash2 className="size-4" /> Remove</Button></div>) : <p className="p-6 text-sm text-muted-foreground">No users have signed up yet.</p>}</div>}
    {tab === "manage" && <div className="glass-panel overflow-hidden">{alerts.map((x) => <div key={x.id} className="flex flex-wrap items-center gap-3 border-b border-border p-4 last:border-0"><SeverityPill severity={x.severity} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{x.title}</p><p className="text-xs text-muted-foreground">{x.location} · {x.status} · Sent by {x.sender || "Admin"} · {timeAgo(x.createdAt)}</p></div>{x.status === "Active" && <Button size="sm" onClick={() => setAlerts((c) => c.map((y) => y.id === x.id ? { ...y, status: "Resolved" } : y))}>Resolve</Button>}<Button size="icon" variant="ghost" aria-label="Delete alert" onClick={() => setAlerts((c) => c.filter((y) => y.id !== x.id))}><Trash2 className="size-4" /></Button></div>)}</div>}
    {tab === "content" && <form className="glass-panel grid gap-4 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); setContent(draft); toast({ title: "Saved", body: "Website content updated.", tone: "notice" }); }}>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Project name" maxLength={40} value={draft.projectName} onChange={(e) => setDraft({ ...draft, projectName: e.target.value })} /><Field label="Tagline" maxLength={120} value={draft.projectTagline} onChange={(e) => setDraft({ ...draft, projectTagline: e.target.value })} /></div>
      <TextArea label="Project info" maxLength={400} value={draft.projectInfo} onChange={(e) => setDraft({ ...draft, projectInfo: e.target.value })} />
      <TextArea label="About AWS intro" maxLength={500} value={draft.awsIntro} onChange={(e) => setDraft({ ...draft, awsIntro: e.target.value })} />
      <p className="text-xs font-bold uppercase tracking-wide text-primary">Team</p>
      {draft.team.map((m, i) => <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><Field label="Name" maxLength={40} value={m.name} onChange={(e) => setDraft({ ...draft, team: draft.team.map((t, j) => j === i ? { ...t, name: e.target.value } : t) })} /><Field label="Role" maxLength={60} value={m.role} onChange={(e) => setDraft({ ...draft, team: draft.team.map((t, j) => j === i ? { ...t, role: e.target.value } : t) })} /><Button type="button" size="icon" variant="ghost" aria-label="Remove member" onClick={() => setDraft({ ...draft, team: draft.team.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button></div>)}
      <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => setDraft({ ...draft, team: [...draft.team, { name: "New member", role: "Role" }] })}><Users className="size-4" /> Add member</Button><Button variant="primary" type="submit">Save changes</Button></div>
    </form>}
    </div>
  </div>;
}

function RequestItem({ r, children }: { r: RequestRecord; children?: React.ReactNode }) {
  return <article className="glass-panel hover-lift p-5">
    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{r.category}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${r.status === "Open" ? "bg-warning-muted text-warning" : "bg-success-muted text-success"}`}>{r.status}</span><span className="ml-auto text-xs text-muted-foreground">@{r.username} · {timeAgo(r.createdAt)}</span></div>
    <h3 className="mt-3 font-bold">{r.subject}</h3>
    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{r.message}</p>
    {r.reply && <p className="mt-3 rounded-md border border-success/25 bg-success-muted p-3 text-sm"><span className="font-semibold text-success">Admin reply: </span>{r.reply}</p>}
    {children}
  </article>;
}

function RequestsView({ username, requests, setRequests, toast }: { username: string; requests: RequestRecord[]; setRequests: React.Dispatch<React.SetStateAction<RequestRecord[]>>; toast: (t: Omit<Toast, "id">) => void }) {
  const [f, setF] = useState({ category: REQUEST_CATEGORIES[0] as string, subject: "", message: "" });
  const [error, setError] = useState("");
  const mine = requests.filter((r) => r.username === username);
  return <div>
    <SectionHeading eyebrow="Requests" title="Send a request to the admin" description="Have a safety concern, need help, or want to suggest something? Your request goes straight to the campus admin team." />
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <form className="glass-panel grid content-start gap-4 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); const r = createRequest(username, f); if (typeof r === "string") { setError(r); return; } setRequests((c) => [r, ...c]); setF({ ...f, subject: "", message: "" }); setError(""); toast({ title: "Request sent", body: "The admin team will review it soon.", tone: "notice" }); }}>
        <div className="grid gap-2 text-xs font-medium text-muted-foreground">Category<div className="flex flex-wrap gap-2">{REQUEST_CATEGORIES.map((c) => <button type="button" key={c} onClick={() => setF({ ...f, category: c })} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${f.category === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>{c}</button>)}</div></div>
        <Field label="Subject" required maxLength={80} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="e.g. Broken fire extinguisher in Block A" />
        <TextArea label="Message" required maxLength={600} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Describe what you need…" />
        {error && <p className="text-sm text-emergency-soft">{error}</p>}
        <Button variant="primary" type="submit"><Send className="size-4" /> Send request</Button>
      </form>
      <div><h2 className="mb-3 font-display text-lg font-bold">My requests</h2><div className="stagger grid gap-3">{mine.length ? mine.map((r) => <RequestItem key={r.id} r={r} />) : <p className="glass-panel p-6 text-sm text-muted-foreground">You haven't sent any requests yet.</p>}</div></div>
    </div>
  </div>;
}

function AdminRequests({ requests, setRequests, toast }: { requests: RequestRecord[]; setRequests: React.Dispatch<React.SetStateAction<RequestRecord[]>>; toast: (t: Omit<Toast, "id">) => void }) {
  const [replies, setReplies] = useState<Record<string, string>>({});
  if (!requests.length) return <p className="glass-panel p-6 text-sm text-muted-foreground">No requests from users yet.</p>;
  return <div className="stagger grid gap-4 md:grid-cols-2">{requests.map((r) => <RequestItem key={r.id} r={r}>
    <div className="mt-4 flex flex-wrap gap-2">
      {r.status === "Open" && <><input value={replies[r.id] ?? ""} onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })} maxLength={300} placeholder="Write a reply (optional)…" className="h-9 min-w-0 flex-1 rounded-md border border-border bg-input px-3 text-sm outline-none focus:border-primary" />
      <Button size="sm" variant="primary" onClick={() => { setRequests((c) => c.map((x) => x.id === r.id ? { ...x, status: "Resolved", reply: (replies[r.id] ?? "").trim() || x.reply } : x)); toast({ title: "Request resolved", body: r.subject, tone: "notice" }); }}><CheckCircle2 className="size-4" /> Resolve</Button></>}
      <Button size="sm" variant="ghost" aria-label="Delete request" onClick={() => setRequests((c) => c.filter((x) => x.id !== r.id))}><Trash2 className="size-4" /> Delete</Button>
    </div>
  </RequestItem>)}</div>;
}
