const {execSync} = require('child_process');
const psScript = `
Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;using System.Text;public class W{[DllImport(""user32.dll"")]public static extern IntPtr GetForegroundWindow();[DllImport(""user32.dll"")]public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);[DllImport(""user32.dll"")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}"
$h=[W]::GetForegroundWindow()
$s=New-Object System.Text.StringBuilder 512
[W]::GetWindowText($h,$s,512)|Out-Null
$procId=0;[W]::GetWindowThreadProcessId($h,[ref]$procId)|Out-Null
$p=Get-Process -Id $procId -EA SilentlyContinue
Write-Output "$($p.ProcessName)|||$($s.ToString())"
`;
const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
try {
  console.log(execSync('powershell -NoProfile -NonInteractive -EncodedCommand ' + b64).toString().trim());
} catch(e) {
  console.log("ERROR:", e.message);
}
