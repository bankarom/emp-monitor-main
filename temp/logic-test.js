class ActivityTrackerTest {
  constructor() {
    this.sessionStartTime = new Date();
    this.appUsage = [];
    this.currentApp = 'Google Chrome';
    this.appStartTime = Date.now();
    this.appUsageStart = 0;
    this.currentTitle = 'Test';
    this.currentUrl = 'https://test.com';
    this.currentKeystrokes = '';
  }

  getActivityData() {
    const now = new Date();
    
    // Finalize current app usage
    if (this.currentApp && this.appStartTime) {
      const duration = (Date.now() - this.appStartTime) / 1000;
      if (duration > 0) {
        this.appUsage.push({
          app: this.currentApp,
          title: this.currentTitle,
          url: this.currentUrl,
          start: this.appUsageStart,
          end: this.appUsageStart + duration,
          keystrokes: this.currentKeystrokes
        });
        
        // Reset for next interval so it doesn't overlap
        this.appStartTime = Date.now();
        this.appUsageStart = 0;
        this.currentKeystrokes = '';
      }
    }
    
    const usage = this.appUsage;
    this.appUsage = [];
    return usage;
  }
}

async function run() {
  const tracker = new ActivityTrackerTest();
  console.log("Waiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));
  console.log("Call 1:", tracker.getActivityData());
  console.log("Waiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));
  console.log("Call 2:", tracker.getActivityData());
}

run();
