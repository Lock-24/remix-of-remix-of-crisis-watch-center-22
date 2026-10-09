import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BellRing, Building2, Check, CheckCircle2, ChevronRight,
  CloudCog, Database, Factory, Gauge, HeartPulse, History, Home, KeyRound,
  MapPin, Menu, Network, PencilLine, Radio, RotateCcw, Search, Send, Zap,
  Shield, ShieldCheck, Siren, Sparkles, Users, X,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "./Button";
import {
  acknowledgementRate, createSimulatedAlert, defaultAlerts, defaultContent,
  type AlertRecord, type Severity, type SiteContent,
} from "@/lib/safesphere-data";

const ALERTS_KEY = "safesphere-alerts-v1";
const CONTENT_KEY = "safesphere-content-v1";
const chartData = [
  { time: "08:00", alerts: 2, response: 72 }, { time: "10:00", alerts: 4, response: 79 },
  { time: "12:00", alerts: 3, response: 76 }, { time: "14:00", alerts: 7, response: 88 },
  { time: "16:00", alerts: 5, response: 91 }, { time: "18:00", alerts: 3, response: 94 },
];
const navItems = [
  { key: "dashboard", label: "Dashboard" }, { key: "alerts", label: "Alerts" },
  { key: "aws", label: "About AWS" }, { key: "team", label: "Team" },
  { key: "admin", label: "Admin Studio" },
];
const locationCoverage = [
  { icon: Building2, label: "College", count: "4 zones" },
  { icon: Factory, label: "Factory", count: "3 zones" },
  { icon: HeartPulse, label: "Hospital", count: "2 zones" },
  { icon: Home, label: "Homes", count: "3 zones" },
];

const severityStyle: Record<Severity, string> = {
  Critical: "border-emergency/25 bg-emergency-muted text-emergency-soft",
  High: "border-warning/25 bg-warning-muted text-warning",
  Medium: "border-info/25 bg-info-muted text-info",
  Low: "border-success/25 bg-success-muted text-success",
};

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="grid gap-2 text-xs font-medium text-muted-foreground">{label}<input className="h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring" {...props} /></label>;
}

function StatusPill({ alert }: { alert: AlertRecord }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${severityStyle[alert.severity]}`}><span className="size-1.5 rounded-full bg-current" />{alert.severity}</span>;
}

export function SafeSphereApp() {
  const [alerts, setAlerts] = useState<AlertRecord[]>(defaultAlerts);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [activeView, setActiveView] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setAlerts(loadStored(ALERTS_KEY, defaultAlerts));
    setContent(loadStored(CONTENT_KEY, defaultContent));
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); }, [alerts, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(CONTENT_KEY, JSON.stringify(content)); }, [content, hydrated]);

  const activeAlerts = alerts.filter((alert) => alert.status === "Active");
  const totalAudience = activeAlerts.reduce((sum, item) => sum + item.audience, 0);
  const totalAck = activeAlerts.reduce((sum, item) => sum + item.acknowledged, 0);
  const overallRate = totalAudience ? Math.round((totalAck / totalAudience) * 100) : 0;
  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    const matchesFilter = filter === "All" || alert.status === filter || alert.severity === filter;
    const needle = query.toLowerCase();
    return matchesFilter && `${alert.title} ${alert.location} ${alert.id}`.toLowerCase().includes(needle);
  }), [alerts, filter, query]);

  const navigate = (view: string) => { setActiveView(view); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const acknowledge = (id: string) => setAlerts((current) => current.map((a) => a.id === id ? { ...a, acknowledged: Math.min(a.audience, a.acknowledged + 1) } : a));
  const resolve = (id: string) => setAlerts((current) => current.map((a) => a.id === id ? { ...a, status: "Resolved" } : a));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="ambient-grid fixed inset-0 pointer-events-none" />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-3" onClick={() => navigate("dashboard")} aria-label="SafeSphere dashboard">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-signal"><Shield className="size-5" /></span>
            <span className="text-left"><span className="block text-base font-bold">{content.projectName}</span><span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Emergency command</span></span>
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map(({ key, label }) => <Button key={key} size="sm" variant={activeView === key ? "secondary" : "ghost"} onClick={() => navigate(key)}>{label}</Button>)}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-success/20 bg-success-muted px-3 py-1.5 text-xs font-semibold text-success sm:flex"><span className="status-pulse size-2 rounded-full bg-success" />System ready</span>
            <Button variant="danger" size="sm" onClick={() => setCreateOpen(true)}><Siren className="size-4" /> <span className="hidden sm:inline">Simulate alert</span></Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen && <nav className="glass-panel mx-4 mb-3 grid gap-1 p-2 md:hidden">{navItems.map(({ key, label }) => <Button key={key} variant="ghost" className="justify-start" onClick={() => navigate(key)}>{label}</Button>)}</nav>}
      </header>

      <div className="relative mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8">
        {activeView === "dashboard" && <Dashboard content={content} alerts={alerts} overallRate={overallRate} setCreateOpen={setCreateOpen} navigate={navigate} acknowledge={acknowledge} resolve={resolve} />}
        {activeView === "alerts" && <AlertsView alerts={filteredAlerts} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} acknowledge={acknowledge} resolve={resolve} setCreateOpen={setCreateOpen} />}
        {activeView === "aws" && <AwsView intro={content.awsIntro} />}
        {activeView === "team" && <TeamView content={content} navigate={navigate} />}
        {activeView === "admin" && <AdminView content={content} setContent={setContent} alerts={alerts} setAlerts={setAlerts} saved={saved} onSave={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }} />}
      </div>
      <footer className="relative border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">SafeSphere demo · Sabhi alerts simulated hain · Koi external notification ya live AWS integration active nahi hai.</footer>

      {createOpen && <CreateAlertModal onClose={() => setCreateOpen(false)} onCreate={(alert) => { setAlerts((current) => [alert, ...current]); setCreateOpen(false); setActiveView("alerts"); }} sequence={2050 + alerts.length} />}
    </main>
  );
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}

function Dashboard({ content, alerts, overallRate, setCreateOpen, navigate, acknowledge, resolve }: { content: SiteContent; alerts: AlertRecord[]; overallRate: number; setCreateOpen: (v:boolean)=>void; navigate:(v:string)=>void; acknowledge:(id:string)=>void; resolve:(id:string)=>void }) {
  const active = alerts.filter((a) => a.status === "Active");
  return <div className="animate-enter">
    <section className="mb-6 grid gap-5 lg:grid-cols-[1.45fr_.55fr]">
      <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
        <div className="emergency-line absolute inset-x-0 top-0 h-px" />
        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Smart emergency response demo</div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">Safety response, <span className="text-primary">ek clear command</span> mein.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{content.projectTagline} {content.projectInfo}</p>
          <div className="mt-7 flex flex-wrap gap-3"><Button variant="danger" onClick={() => setCreateOpen(true)}><Radio className="size-4" />Simulate emergency</Button><Button onClick={() => navigate("alerts")}><History className="size-4" />Alert history</Button></div>
        </div>
      </div>
      <div className="glass-panel flex min-h-64 flex-col justify-between p-6">
        <div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-md bg-emergency-muted text-emergency-soft"><Activity className="size-6" /></span><span className="rounded-full border border-success/25 bg-success-muted px-2.5 py-1 text-[10px] font-bold uppercase text-success">Live demo</span></div>
        <div><p className="text-sm text-muted-foreground">Current readiness</p><p className="mt-2 font-display text-5xl font-bold">98.7<span className="text-xl text-primary">%</span></p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[98.7%] rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">All simulated response modules operational</p></div>
      </div>
    </section>
    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Siren />} label="Active alerts" value={String(active.length)} detail={`${active.filter(a=>a.severity==='Critical').length} critical`} tone="danger" />
      <Metric icon={<CheckCircle2 />} label="Acknowledged" value={`${overallRate}%`} detail="active alerts ka response" tone="success" />
      <Metric icon={<MapPin />} label="Locations" value="12" detail="5 facility types covered" tone="info" />
      <Metric icon={<Gauge />} label="Avg. response" value="42s" detail="simulated response time" tone="primary" />
    </section>
    <section className="mb-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <div className="glass-panel p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-bold">Response intelligence</h2><p className="mt-1 text-xs text-muted-foreground">Aaj ka simulated acknowledgement trend</p></div><span className="flex items-center gap-2 text-xs text-success"><span className="size-2 rounded-full bg-success" />Response %</span></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="responseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4}/><stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false}/><XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/><YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} /><Area type="monotone" dataKey="response" stroke="var(--primary)" strokeWidth={2} fill="url(#responseFill)" /></AreaChart></ResponsiveContainer></div></div>
      <div className="glass-panel p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Location coverage</h2><p className="mt-1 text-xs text-muted-foreground">Connected zones ka demo view</p></div><MapPin className="size-5 text-primary" /></div><div className="grid gap-3">{locationCoverage.map(({ icon: Icon, label, count })=><div key={label} className="flex items-center gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"><span className="grid size-9 place-items-center rounded-md bg-accent text-primary"><Icon className="size-4" /></span><span className="flex-1 text-sm font-medium">{label}</span><span className="text-xs text-muted-foreground">{count}</span><ChevronRight className="size-4 text-muted-foreground" /></div>)}</div></div>
    </section>
    <AlertTable alerts={alerts.slice(0,4)} acknowledge={acknowledge} resolve={resolve} onAll={() => navigate("alerts")} />
  </div>;
}

function Metric({ icon, label, value, detail, tone }: { icon:React.ReactNode; label:string; value:string; detail:string; tone:string }) { return <div className="glass-panel p-5"><div className={`metric-icon metric-${tone}`}>{icon}</div><p className="mt-5 text-xs font-medium text-muted-foreground">{label}</p><div className="mt-1 flex items-end justify-between gap-3"><p className="font-display text-3xl font-bold">{value}</p><p className="pb-1 text-right text-[10px] text-muted-foreground">{detail}</p></div></div>; }

function AlertTable({ alerts, acknowledge, resolve, onAll }: { alerts:AlertRecord[]; acknowledge:(id:string)=>void; resolve:(id:string)=>void; onAll?:()=>void }) { return <div className="glass-panel overflow-hidden"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-display text-lg font-bold">Recent alerts</h2><p className="mt-1 text-xs text-muted-foreground">Latest simulated activity aur response status</p></div>{onAll && <Button variant="ghost" size="sm" onClick={onAll}>View all <ChevronRight className="size-4" /></Button>}</div><div className="divide-y divide-border">{alerts.map(alert=><div key={alert.id} className="grid gap-4 p-4 transition hover:bg-accent/40 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className={`grid size-10 place-items-center rounded-md ${severityStyle[alert.severity]}`}><AlertTriangle className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{alert.title}</p><StatusPill alert={alert}/><span className="rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">Simulated</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{alert.location} · {alert.time} · {alert.id}</p><div className="mt-2 flex items-center gap-2"><div className="h-1 w-28 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${acknowledgementRate(alert)}%`}} /></div><span className="text-[10px] text-muted-foreground">{alert.acknowledged}/{alert.audience} ack</span></div></div><div className="flex gap-2">{alert.status === 'Active' ? <><Button size="sm" variant="ghost" onClick={()=>acknowledge(alert.id)} aria-label={`Acknowledge ${alert.title}`}><Check className="size-4" /> Ack</Button><Button size="sm" onClick={()=>resolve(alert.id)}>Resolve</Button></> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="size-4"/>Resolved</span>}</div></div>)}</div></div>; }

function AlertsView({ alerts, query, setQuery, filter, setFilter, acknowledge, resolve, setCreateOpen }: { alerts:AlertRecord[]; query:string; setQuery:(v:string)=>void; filter:string; setFilter:(v:string)=>void; acknowledge:(id:string)=>void; resolve:(id:string)=>void; setCreateOpen:(v:boolean)=>void }) { return <div className="animate-enter"><SectionHeading eyebrow="Alert center" title="Har signal, ek jagah." description="Simulated emergencies ko monitor, acknowledge aur resolve karein. Koi real notification send nahi hoti." action={<Button variant="danger" onClick={()=>setCreateOpen(true)}><BellRing className="size-4"/>New simulation</Button>} /><div className="mb-4 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Alert, location ya ID search karein" className="h-11 w-full rounded-md border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary" /></label><div className="flex gap-1 overflow-x-auto rounded-md border border-border bg-card p-1">{['All','Active','Resolved','Critical','High'].map(item=><Button key={item} size="sm" variant={filter===item?'primary':'ghost'} onClick={()=>setFilter(item)}>{item}</Button>)}</div></div><AlertTable alerts={alerts} acknowledge={acknowledge} resolve={resolve}/></div>; }

const awsServices = [
  { icon:Zap, title:'AWS Lambda', text:'Alert create hote hi server manage kiye bina response logic run kar sakta hai.' },
  { icon:Database, title:'DynamoDB', text:'Alerts, acknowledgement aur history ko fast, scalable database mein store kar sakta hai.' },
  { icon:Network, title:'API Gateway', text:'Website aur cloud functions ke beech secure entry point aur request control de sakta hai.' },
  { icon:KeyRound, title:'Amazon Cognito', text:'Admin aur responders ke secure sign-in, roles aur access permissions manage kar sakta hai.' },
];
function AwsView({ intro }: { intro:string }) { return <div className="animate-enter"><SectionHeading eyebrow="Proposed cloud architecture" title="About AWS — future-ready blueprint" description={intro}/><div className="mb-6 border border-warning/30 bg-warning-muted p-4 text-sm text-warning"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0"/><p><strong>Important:</strong> Yeh sirf proposed AWS architecture hai. Current SafeSphere demo browser ke andar run karta hai; actual AWS, API ya external notification integration implement nahi ki gayi hai.</p></div></div><div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{awsServices.map(({icon:Icon,title,text},index)=><div className="glass-panel p-5" key={title}><div className="mb-8 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-5"/></span><span className="font-mono text-xs text-muted-foreground">0{index+1}</span></div><h2 className="font-display font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div><div className="glass-panel p-6"><div className="mb-6 flex items-center gap-3"><CloudCog className="size-6 text-primary"/><div><h2 className="font-display text-lg font-bold">Proposed alert flow</h2><p className="text-xs text-muted-foreground">Implementation ke baad possible data journey</p></div></div><div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">{['Secure user','API Gateway','Lambda logic','DynamoDB'].map((item,index)=><div className="contents" key={item}><div className="rounded-md border border-border bg-accent p-4 text-center text-sm font-semibold">{item}</div>{index<3&&<ChevronRight className="mx-auto size-4 rotate-90 text-primary md:rotate-0"/>}</div>)}</div></div></div>; }

function TeamView({ content, navigate }: { content:SiteContent; navigate:(v:string)=>void }) { return <div className="animate-enter"><SectionHeading eyebrow="The people behind SafeSphere" title="Made by Ankur, built with purpose." description="Ek focused hackathon team jo emergency communication ko simple, fast aur accountable banana chahti hai." action={<Button onClick={()=>navigate('admin')}><PencilLine className="size-4"/>Edit team</Button>}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{content.team.map((member,index)=><article className="glass-panel group overflow-hidden p-5" key={`${member.name}-${index}`}><div className="mb-10 flex items-start justify-between"><div className="grid size-14 place-items-center rounded-md border border-primary/20 bg-primary/10 font-display text-xl font-bold text-primary">{member.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><span className="font-mono text-xs text-muted-foreground">0{index+1}</span></div><h2 className="font-display text-xl font-bold">{member.name}</h2><p className="mt-1 text-sm text-primary">{member.role}</p><div className="mt-5 h-px bg-border transition group-hover:bg-primary/40"/></article>)}</div><div className="glass-panel mt-6 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center"><div><h2 className="font-display text-lg font-bold">{content.projectName} Project</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{content.projectInfo}</p></div><ShieldCheck className="size-10 shrink-0 text-primary"/></div></div>; }

function AdminView({ content, setContent, alerts, setAlerts, saved, onSave }: { content:SiteContent; setContent:React.Dispatch<React.SetStateAction<SiteContent>>; alerts:AlertRecord[]; setAlerts:React.Dispatch<React.SetStateAction<AlertRecord[]>>; saved:boolean; onSave:()=>void }) { const updateMember=(index:number,key:'name'|'role',value:string)=>setContent(c=>({...c,team:c.team.map((m,i)=>i===index?{...m,[key]:value}:m)})); const reset=()=>{setContent(defaultContent);setAlerts(defaultAlerts);window.localStorage.removeItem(CONTENT_KEY);window.localStorage.removeItem(ALERTS_KEY);}; return <div className="animate-enter"><SectionHeading eyebrow="Admin studio" title="Content aur demo control." description="Changes isi browser mein securely save hote hain aur refresh ke baad bhi available rahenge." action={<div className="flex gap-2"><Button variant="ghost" onClick={reset}><RotateCcw className="size-4"/>Reset demo</Button><Button variant="primary" onClick={onSave}>{saved?<Check className="size-4"/>:<ShieldCheck className="size-4"/>}{saved?'Saved':'Save changes'}</Button></div>}/><div className="grid gap-5 xl:grid-cols-[1fr_.7fr]"><div className="glass-panel p-5 sm:p-6"><h2 className="font-display text-lg font-bold">Project content</h2><div className="mt-5 grid gap-4"><Field label="Project name" value={content.projectName} onChange={e=>setContent(c=>({...c,projectName:e.target.value}))}/><Field label="Main tagline" value={content.projectTagline} onChange={e=>setContent(c=>({...c,projectTagline:e.target.value}))}/><label className="grid gap-2 text-xs font-medium text-muted-foreground">Project information<textarea rows={3} className="rounded-md border border-border bg-input p-3 text-sm text-foreground outline-none focus:border-primary" value={content.projectInfo} onChange={e=>setContent(c=>({...c,projectInfo:e.target.value}))}/></label><label className="grid gap-2 text-xs font-medium text-muted-foreground">About AWS introduction<textarea rows={5} className="rounded-md border border-border bg-input p-3 text-sm text-foreground outline-none focus:border-primary" value={content.awsIntro} onChange={e=>setContent(c=>({...c,awsIntro:e.target.value}))}/></label></div></div><div className="glass-panel p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Demo status</h2><Radio className="size-5 text-emergency-soft"/></div><div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="Total alerts" value={String(alerts.length)}/><MiniStat label="Active" value={String(alerts.filter(a=>a.status==='Active').length)}/><MiniStat label="Resolved" value={String(alerts.filter(a=>a.status==='Resolved').length)}/><MiniStat label="Persistence" value="Local"/></div><p className="mt-5 rounded-md border border-info/20 bg-info-muted p-3 text-xs leading-5 text-info">No external API active. Data sirf current browser storage mein save hota hai.</p></div></div><div className="glass-panel mt-5 p-5 sm:p-6"><div className="mb-5"><h2 className="font-display text-lg font-bold">Team members</h2><p className="mt-1 text-xs text-muted-foreground">Names aur roles directly update karein.</p></div><div className="grid gap-4 md:grid-cols-2">{content.team.map((member,index)=><div key={index} className="grid gap-3 rounded-md border border-border bg-accent/40 p-4 sm:grid-cols-[auto_1fr]"><span className="grid size-10 place-items-center rounded-md bg-primary/10 text-sm font-bold text-primary">0{index+1}</span><div className="grid gap-3"><Field label="Name" value={member.name} onChange={e=>updateMember(index,'name',e.target.value)}/><Field label="Role" value={member.role} onChange={e=>updateMember(index,'role',e.target.value)}/></div></div>)}</div></div></div>; }
function MiniStat({label,value}:{label:string;value:string}) { return <div className="rounded-md border border-border bg-accent/50 p-3"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-bold">{value}</p></div>; }

function CreateAlertModal({ onClose, onCreate, sequence }: { onClose:()=>void; onCreate:(a:AlertRecord)=>void; sequence:number }) { const [form,setForm]=useState({title:'',message:'',location:'College · Main Block',severity:'High' as Severity,audience:120}); const submit=(e:React.FormEvent)=>{e.preventDefault(); if(!form.title.trim()||!form.message.trim())return; onCreate(createSimulatedAlert(form,sequence));}; return <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form onSubmit={submit} className="glass-modal w-full max-w-lg animate-enter p-5 sm:p-6"><div className="mb-6 flex items-start justify-between"><div><span className="mb-2 inline-flex items-center gap-1.5 rounded-sm bg-emergency-muted px-2 py-1 text-[10px] font-bold uppercase text-emergency-soft"><Radio className="size-3"/>Simulation only</span><h2 className="font-display text-xl font-bold">Create emergency alert</h2><p className="mt-1 text-xs text-muted-foreground">Yeh alert sirf SafeSphere demo mein dikhega.</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="size-5"/></Button></div><div className="grid gap-4"><Field label="Alert title" placeholder="e.g. Evacuation drill" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><label className="grid gap-2 text-xs font-medium text-muted-foreground">Message<textarea required rows={3} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Clear safety instruction likhein" className="rounded-md border border-border bg-input p-3 text-sm text-foreground outline-none focus:border-primary"/></label><div className="grid gap-4 sm:grid-cols-2"><Field label="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/><Field label="Audience size" type="number" min={1} value={form.audience} onChange={e=>setForm({...form,audience:Number(e.target.value)})}/></div><label className="grid gap-2 text-xs font-medium text-muted-foreground">Severity<select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as Severity})} className="h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none">{['Critical','High','Medium','Low'].map(s=><option key={s}>{s}</option>)}</select></label></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" variant="danger"><Send className="size-4"/>Launch simulation</Button></div></form></div>; }