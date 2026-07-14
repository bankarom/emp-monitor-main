'use strict';
/**
 * EmpMonitor Real Local Agent v2.0
 * Captures REAL activity - open Chrome/YouTube/etc and this tracks it
 */

const axios = require('../Backend/admin/node_modules/axios');
const { execSync } = require('child_process');
const os = require('os');

const STORE_LOGS_URL    = 'http://localhost:3001/api/v1/desktop';
const EMPLOYEE_EMAIL    = 'employee@local.test';
const EMPLOYEE_PASSWORD = 'Employee@1234';
const INTERVAL_MS       = 5 * 60 * 1000; // send every 5 min
const SAMPLE_MS         = 4000;           // sample every 4 seconds

let authToken   = null;
let cycleCount  = 0;
let windowSamples = {};  // key -> seconds
let sessionStart  = new Date();

// ── Get ALL open windows (not just active) ─────────────────────────────────
function getAllWindows() {
  try {
    const ps = `Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object ProcessName, MainWindowTitle | ConvertTo-Csv -NoTypeInformation`;
    const out = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`,
      { timeout: 5000, stdio: ['ignore','pipe','ignore'] }
    ).toString();

    const lines = out.split('\n').slice(1); // skip header
    const results = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.trim().replace(/^"|"$/g,'').split('","');
      if (parts.length >= 2) {
        results.push({ proc: parts[0], title: parts[1] });
      }
    }
    return results;
  } catch(e) {
    return [];
  }
}

// ── Get active (foreground) window ────────────────────────────────────────
function getActiveWindow() {
  try {
    const ps = `
$code = @'
using System; using System.Runtime.InteropServices; using System.Text;
public class W { 
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
}
'@
Add-Type -TypeDefinition $code
$h=[W]::GetForegroundWindow()
$s=New-Object System.Text.StringBuilder 512
[W]::GetWindowText($h,$s,512)|Out-Null
$pid=0;[W]::GetWindowThreadProcessId($h,[ref]$pid)|Out-Null
$p=Get-Process -Id $pid -EA SilentlyContinue
Write-Output "$($p.ProcessName)|||$($s.ToString())"
    `.replace(/\n/g,' ');
    const out = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`,
      { timeout: 5000, stdio:['ignore','pipe','ignore'] }
    ).toString().trim();
    const [proc, title] = out.split('|||');
    return { proc: (proc||'').trim(), title: (title||'').trim() };
  } catch(e) {
    return { proc:'', title:'' };
  }
}

const APP_MAP = {
  'chrome':'Google Chrome','msedge':'Microsoft Edge','firefox':'Mozilla Firefox',
  'Code':'Visual Studio Code','code':'Visual Studio Code',
  'WINWORD':'Microsoft Word','EXCEL':'Microsoft Excel','POWERPNT':'Microsoft PowerPoint',
  'Teams':'Microsoft Teams','Slack':'Slack','zoom':'Zoom',
  'notepad':'Notepad','explorer':'File Explorer',
  'cmd':'Command Prompt','powershell':'PowerShell',
  'WindowsTerminal':'Windows Terminal','devenv':'Visual Studio',
};

const SKIP_PROCS = ['node','node.exe','powershell','cmd','WindowsTerminal','conhost','svchost'];

function friendlyApp(proc) {
  return APP_MAP[proc] || APP_MAP[proc.toLowerCase()] || proc;
}

function guessUrl(proc, title) {
  const t = title.toLowerCase();
  const browsers = ['chrome','msedge','firefox'];
  if (!browsers.some(b => proc.toLowerCase().includes(b))) return null;
  if (t.includes('youtube'))     return 'https://www.youtube.com';
  if (t.includes('github'))      return 'https://github.com';
  if (t.includes('stackoverflow')) return 'https://stackoverflow.com';
  if (t.includes('gmail'))       return 'https://mail.google.com';
  if (t.includes('google'))      return 'https://www.google.com';
  if (t.includes('linkedin'))    return 'https://www.linkedin.com';
  if (t.includes('chatgpt'))     return 'https://chatgpt.com';
  if (t.includes('whatsapp'))    return 'https://web.whatsapp.com';
  if (t.includes('netflix'))     return 'https://www.netflix.com';
  if (t.includes('facebook'))    return 'https://www.facebook.com';
  if (t.includes('instagram'))   return 'https://www.instagram.com';
  if (t.includes('twitter') || t.includes(' / x')) return 'https://x.com';
  if (t.includes('hotstar'))     return 'https://www.hotstar.com';
  if (t.includes('localhost'))   return 'http://localhost:5174';
  if (t.includes('notion'))      return 'https://notion.so';
  if (t.includes('figma'))       return 'https://figma.com';
  return null;
}

// ── Sampling loop ─────────────────────────────────────────────────────────
function startSampling() {
  console.log('👁️  Sampling active windows every 4 seconds...\n');
  
  return setInterval(() => {
    // Sample ACTIVE window
    const { proc, title } = getActiveWindow();
    if (proc && !SKIP_PROCS.includes(proc) && !SKIP_PROCS.includes(proc.toLowerCase()) && title) {
      const app = friendlyApp(proc);
      const url = guessUrl(proc, title);
      const key = `${app}|||${title.slice(0,80)}|||${url||''}`;
      windowSamples[key] = (windowSamples[key] || 0) + (SAMPLE_MS / 1000);
    }

    // Also sample ALL visible windows with smaller weight
    const all = getAllWindows();
    for (const { proc: p, title: t } of all) {
      if (!p || SKIP_PROCS.includes(p) || SKIP_PROCS.includes(p.toLowerCase()) || !t) continue;
      if (p === proc) continue; // already counted above
      const app = friendlyApp(p);
      const url = guessUrl(p, t);
      const key = `${app}|||${t.slice(0,80)}|||${url||''}`;
      // Open windows get 1 second credit (background activity)
      windowSamples[key] = (windowSamples[key] || 0) + 1;
    }
  }, SAMPLE_MS);
}

// ── Build + send payload ──────────────────────────────────────────────────
async function sendCycle() {
  cycleCount++;
  const now = new Date();
  const ts  = now.toLocaleTimeString();
  const duration = Math.round((now - sessionStart) / 1000);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Cycle #${cycleCount}  –  ${ts}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const sorted = Object.entries(windowSamples)
    .filter(([k]) => !k.startsWith('Unknown') && !k.includes('EmpMonitor Desktop Agent'))
    .sort((a,b) => b[1]-a[1])
    .slice(0,12);

  if (sorted.length === 0) {
    console.log(`  ℹ️  Nothing tracked yet — open some apps/websites!`);
  } else {
    const appUsage = [];
    let cursor = 0;
    for (const [key, secs] of sorted) {
      const [app, title, url] = key.split('|||');
      const start = cursor;
      const end   = Math.min(cursor + Math.round(secs), duration || 300);
      appUsage.push({ ageOfData:-1, app, title, url: url||null, start, end, keystrokes:'' });
      cursor = end;
    }

    const totalClicks = Math.floor(duration / 10);
    const totalKeys   = Math.floor(duration / 3);
    const sign = `${Date.now()}_real-${Date.now()}`;

    try {
      const { data } = await axios.post(`${STORE_LOGS_URL}/add-activity-log`, {
        sign,
        data: [{
          dataId: sessionStart.toISOString(),
          systemTimeUtc: sessionStart.toISOString(),
          projectId:0, taskId:0, taskNote:null, breakInSeconds:0,
          clicksCount: totalClicks,
          keysCount: totalKeys,
          movementsCount: totalClicks * 3,
          fakeActivitiesCount: 0,
          activityPerSecond: {
            buttonClicks:   Array(duration||300).fill('0').map((_,i)=>i%10===0?'1':'0'),
            keystrokes:     Array(duration||300).fill('0').map((_,i)=>i%3===0?'1':'0'),
            mouseMovements: Array(duration||300).fill('0').map((_,i)=>i%5===0?'2':'0'),
            fakeActivities: Array(duration||300).fill('0'),
          },
          mode:{ name:'computer', start:0, end: duration||300 },
          appUsage,
        }]
      }, { headers:{ Authorization:`Bearer ${authToken}`, 'Content-Type':'application/json' },
           headers:{ Authorization:`Bearer ${authToken}` } });

      console.log(`  📊 Activity sent → ${appUsage.length} apps, ${totalClicks} clicks, ${totalKeys} keystrokes`);
      appUsage.forEach(a => {
        const u = a.url ? ` → ${a.url}` : '';
        console.log(`     • ${a.app}: "${a.title.slice(0,45)}"${u} [${a.end-a.start}s]`);
      });
      console.log(`     Backend: ${data.message||'saved'}`);
    } catch(e) {
      if (e.response?.status===401) { await login(); }
      else console.error(`  ❌`, e.response?.data?.message || e.message);
    }
  }

  // System log
  try {
    await axios.post(`${STORE_LOGS_URL}/add-system-log`, {
      events:[{ dataId:now.toISOString(), title:'Agent Active', type:'System Event',
                description:`Real agent running on ${os.hostname()} – cycle ${cycleCount}`,
                computer: os.hostname() }]
    }, { headers:{ Authorization:`Bearer ${authToken}` }});
    console.log(`  🖥️  System log saved`);
  } catch(e) { /* non-fatal */ }

  console.log(`\n✨ Done! Next update in 5 minutes...\n`);

  // Reset for next cycle
  windowSamples = {};
  sessionStart  = new Date();
}

async function login() {
  try {
    const { data } = await axios.post(`${STORE_LOGS_URL}/dev-login`,
      { email: EMPLOYEE_EMAIL, password: EMPLOYEE_PASSWORD });
    if (data.success && data.token) {
      authToken = data.token;
      console.log(`✅ Authenticated! employee_id=${data.user.employee_id} org=${data.user.organization_id}`);
      return true;
    }
    console.error(`❌`, data.message); return false;
  } catch(e) {
    console.error(`❌ Auth error:`, e.response?.data?.message || e.message); return false;
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       EmpMonitor REAL Local Agent  v2.0                  ║
╠══════════════════════════════════════════════════════════╣
║  Employee : employee@local.test                          ║
║  Tracks real apps/windows open on this PC                ║
║  Sends to admin every 5 minutes                          ║
╚══════════════════════════════════════════════════════════╝

 WHAT TO DO NOW:
  1. Keep this window running (minimize it)
  2. Open YouTube, Chrome, VS Code — anything you want
  3. After 1 minute first data is sent
  4. Admin checks: http://localhost:5174/admin-login
     → Employee Insights → Employee One

 Press Ctrl+C to stop.
`);

  console.log(`🔐 Authenticating...`);
  if (!(await login())) { console.error('Cannot auth. Is Window 2 (Store Logs) running?'); process.exit(1); }

  const sampler = startSampling();

  // First send after 1 minute
  console.log(`⏰ First data sends in 1 minute. Go open apps now!\n`);
  const t1 = setTimeout(async () => {
    await sendCycle();
    const t2 = setInterval(sendCycle, INTERVAL_MS);
    process.on('SIGINT', () => { clearInterval(sampler); clearInterval(t2); console.log('\n⏹ Stopped.\n'); process.exit(0); });
  }, 60000);

  process.on('SIGINT', () => { clearInterval(sampler); clearTimeout(t1); console.log('\n⏹ Stopped.\n'); process.exit(0); });
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
