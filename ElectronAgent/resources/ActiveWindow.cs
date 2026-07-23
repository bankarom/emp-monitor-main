using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

class ActiveWindow {
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    static void Main() {
        try {
            IntPtr handle = GetForegroundWindow();
            if (handle == IntPtr.Zero) {
                Console.WriteLine("|||");
                return;
            }

            StringBuilder title = new StringBuilder(512);
            GetWindowText(handle, title, 512);

            uint procId;
            GetWindowThreadProcessId(handle, out procId);

            Process p = Process.GetProcessById((int)procId);
            Console.WriteLine(p.ProcessName + "|||" + title.ToString());
        } catch (Exception) {
            Console.WriteLine("|||");
        }
    }
}
