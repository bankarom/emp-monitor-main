const ActivityTracker = require('./src/tracker/activity-tracker.js');
const tracker = new ActivityTracker();

// Mock active-win so it doesn't crash in node without electron
const activeWin = require('active-win');
jest.mock('active-win', () => {
  return jest.fn().mockResolvedValue({
    owner: { name: 'MockApp' },
    title: 'Mock Title'
  });
});

async function run() {
  tracker.startTracking();
  console.log("Started tracking");
  
  // Wait 5 seconds, sample activity
  await new Promise(r => setTimeout(r, 5000));
  const data1 = tracker.getActivityData();
  console.log("Data 1:", JSON.stringify(data1, null, 2));

  // Wait 10 seconds, sample activity
  await new Promise(r => setTimeout(r, 10000));
  const data2 = tracker.getActivityData();
  console.log("Data 2:", JSON.stringify(data2, null, 2));
}

run();
