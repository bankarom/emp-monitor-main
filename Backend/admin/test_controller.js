global.dbFolder = __dirname + "/src/database";
const DashboardController = require('./src/routes/v3/dashboard/Dashboard.controller');
const DashboardModel = require('./src/routes/v3/dashboard/Dashboard.model');

async function run() {
  const req = {
    decoded: { organization_id: 1, employee_id: null, role_id: null },
    query: { date: '2026-07-20' },
    route: { path: '/employees' }
  };
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: () => res
  };
  const next = (err) => console.error("NEXT:", err);

  global.actionsTracker = () => {};

  await DashboardController.getEmployees(req, res, next);
}

run();
