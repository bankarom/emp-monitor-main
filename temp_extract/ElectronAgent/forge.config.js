module.exports = {
  packagerConfig: {
    icon: './resources/icon',
    name: 'EmpMonitorAgent',
    executableName: 'empmonitor-agent',
    appBundleId: 'com.empmonitor.agent',
    appCopyright: '© 2026 EmpMonitor',
    win32metadata: {
      CompanyName: 'EmpMonitor',
      FileDescription: 'EmpMonitor Employee Monitoring Agent',
      OriginalFilename: 'empmonitor-agent.exe',
      ProductName: 'EmpMonitor Agent'
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'empmonitor-agent',
        setupIcon: './resources/icon.ico',
        iconUrl: 'https://raw.githubusercontent.com/bankarom/emp-monitor-main/main/assets/icon.ico',
        loadingGif: './resources/loading.gif',
        setupExe: 'EmpMonitor-Setup.exe'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ]
};