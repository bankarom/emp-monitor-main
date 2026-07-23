const jwt = require('jsonwebtoken');
const axios = require('axios');

console.log("Starting script");

async function run() {
  const token = jwt.sign({
    employee_id: 1, 
    organization_id: 1, 
    role_id: 1 
  }, 'EmpMonitorJWTLocalSecret2026!');
  
  try {
    const res = await axios.get('http://localhost:3000/api/v3/dashboard/employees?date=2026-07-20', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Status:", res.status);
    console.log("Online Emps:", res.data.data.onlineEmps.map(x => x.id));
    console.log("Offline Emps:", res.data.data.offlineEmp.map(x => x.id));
  } catch(err) {
    if (err.response) {
       console.log("Error status:", err.response.status);
       console.log("Error data:", err.response.data);
    } else {
       console.log("Error message:", err.message);
    }
  }
}

run();
