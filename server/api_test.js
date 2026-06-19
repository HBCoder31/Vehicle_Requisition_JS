/**
 * Comprehensive API Test Script
 * Tests all major workflows end-to-end via HTTP
 */
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5000/api';
let cookies = {};
let testRequestId = null;
let beyondRequestId = null;

function request(method, path, body, cookieJar) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}${path}`);
    const data = body ? JSON.stringify(body) : null;
    const cookieStr = Object.entries(cookieJar || {}).map(([k,v]) => `${k}=${v}`).join('; ');
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookieStr ? { 'Cookie': cookieStr } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        // Parse set-cookie headers
        const newCookies = {};
        const setCookie = res.headers['set-cookie'] || [];
        setCookie.forEach(c => {
          const [pair] = c.split(';');
          const [k, v] = pair.split('=');
          if (k && v) newCookies[k.trim()] = v.trim();
        });
        
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw), cookies: newCookies });
        } catch(e) {
          resolve({ status: res.statusCode, data: raw, cookies: newCookies });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', '/auth/login', { identifier: email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return { ...res.cookies };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch(err) {
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

async function run() {
  console.log('=== Vehicle Requisition Portal API Audit ===\n');

  // ─── Health Check ──────────────────────────────────────────
  console.log('📋 PHASE 0: Health Checks');
  await test('GET /health', async () => {
    const res = await request('GET', '/health', null, {});
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    if (res.data.status !== 'ok') throw new Error('Not OK');
  });

  // ─── Phase 1: Employee Submit Request ─────────────────────
  console.log('\n📋 PHASE 1: Employee Login & Submit Request');
  
  let empCookies = {};
  await test('Login as Employee', async () => {
    empCookies = await login('newharsh31@gmail.com', 'password123');
    console.log('Employee cookies:', empCookies);
    if (!empCookies.vrp_token && !empCookies.jwt) throw new Error('No auth cookie');
  });

  await test('GET /auth/me (verify employee session)', async () => {
    const res = await request('GET', '/auth/me', null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.user) throw new Error('No user in response');
    console.log(`     Role: ${res.data.user.role}, Dept: ${res.data.user.department_id}`);
  });

  await test('POST /requests - Submit Within request', async () => {
    const res = await request('POST', '/requests', {
      purpose: 'API Test - Within Travel',
      pickup_location: 'Main Office Gate',
      destination: 'Anuppur Station',
      travel_type: 'Within Anuppur/Shahdol',
      passengers: 2,
      travel_date: '2026-06-25',
      travel_time: '10:00',
    }, empCookies);
    if (res.status !== 201) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    testRequestId = res.data.requestId;
    console.log(`     Request ID: ${testRequestId}`);
  });

  await test('POST /requests - Submit Beyond request', async () => {
    const res = await request('POST', '/requests', {
      purpose: 'API Test - Beyond Travel',
      pickup_location: 'Main Office Gate',
      destination: 'Bhopal Office',
      travel_type: 'Beyond Anuppur/Shahdol',
      passengers: 1,
      travel_date: '2026-06-26',
      travel_time: '09:00',
    }, empCookies);
    if (res.status !== 201) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    beyondRequestId = res.data.requestId;
    console.log(`     Beyond Request ID: ${beyondRequestId}`);
  });

  await test('GET /requests/my - Employee sees their requests', async () => {
    const res = await request('GET', '/requests/my', null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    if (!Array.isArray(res.data.requests)) throw new Error('Not array');
    console.log(`     Found ${res.data.requests.length} requests`);
  });

  await test(`GET /requests/${testRequestId} - Employee sees own request`, async () => {
    const res = await request('GET', `/requests/${testRequestId}`, null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.request.status !== 'Pending_HOD') throw new Error(`Wrong status: ${res.data.request.status}`);
    console.log(`     Status: ${res.data.request.status} ✓`);
  });

  // ─── Phase 2: HOD Approval ─────────────────────────────────
  console.log('\n📋 PHASE 2: HOD Approval');

  let hodCookies = {};
  await test('Login as HOD', async () => {
    hodCookies = await login('sharad.bhilwara@gmail.com', 'password123');
  });

  await test('GET /approvals/hod - HOD sees pending requests', async () => {
    const res = await request('GET', '/approvals/hod', null, hodCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    const found = res.data.requests.some(r => r.id === testRequestId);
    if (!found) throw new Error(`Request ${testRequestId} not in HOD pending list`);
    console.log(`     Found ${res.data.requests.length} pending requests`);
  });

  await test('GET /approvals/hod/stats', async () => {
    const res = await request('GET', '/approvals/hod/stats', null, hodCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Stats: ${JSON.stringify(res.data.stats)}`);
  });

  await test(`PATCH /approvals/hod/${testRequestId} - HOD approves within request`, async () => {
    const res = await request('PATCH', `/approvals/hod/${testRequestId}`, {
      action: 'approve',
      remarks: 'Approved via API test'
    }, hodCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.newStatus !== 'Pending_GM_HR') throw new Error(`Wrong new status: ${res.data.newStatus}`);
    console.log(`     New status: ${res.data.newStatus} ✓`);
  });

  await test(`PATCH /approvals/hod/${beyondRequestId} - HOD approves beyond request`, async () => {
    const res = await request('PATCH', `/approvals/hod/${beyondRequestId}`, {
      action: 'approve',
      remarks: 'Approved, forward to GM-HR'
    }, hodCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.newStatus !== 'Pending_GM_HR') throw new Error(`Wrong new status: ${res.data.newStatus}`);
    console.log(`     New status: ${res.data.newStatus} ✓`);
  });

  // ─── Phase 2.5: GM-HR Approval ─────────────────────────────
  console.log('\n📋 PHASE 2.5: GM-HR Approval');

  let gmhrCookies = {};
  await test('Login as GM-HR', async () => {
    gmhrCookies = await login('gmhr@orientpaper.com', 'password123');
  });

  await test('GET /approvals/gmhr - GM-HR sees pending requests', async () => {
    const res = await request('GET', '/approvals/gmhr', null, gmhrCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    const foundWithin = res.data.requests.some(r => r.id === testRequestId);
    const foundBeyond = res.data.requests.some(r => r.id === beyondRequestId);
    if (!foundWithin) throw new Error(`Request ${testRequestId} not in GM-HR pending list`);
    if (!foundBeyond) throw new Error(`Request ${beyondRequestId} not in GM-HR pending list`);
    console.log(`     Found ${res.data.requests.length} pending GM-HR requests`);
  });

  await test(`PATCH /approvals/gmhr/${testRequestId} - GM-HR approves within request`, async () => {
    const res = await request('PATCH', `/approvals/gmhr/${testRequestId}`, {
      action: 'approve',
      remarks: 'Approved by GM-HR'
    }, gmhrCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.newStatus !== 'Approved_GM_HR') throw new Error(`Wrong new status: ${res.data.newStatus}`);
    console.log(`     New status: ${res.data.newStatus} ✓`);
  });

  await test(`PATCH /approvals/gmhr/${beyondRequestId} - GM-HR approves beyond request`, async () => {
    const res = await request('PATCH', `/approvals/gmhr/${beyondRequestId}`, {
      action: 'approve',
      remarks: 'Approved by GM-HR, forwarding to COO'
    }, gmhrCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.newStatus !== 'Pending_COO') throw new Error(`Wrong new status: ${res.data.newStatus}`);
    console.log(`     New status: ${res.data.newStatus} ✓`);
  });

  // ─── Phase 3: COO Approval ─────────────────────────────────
  console.log('\n📋 PHASE 3: COO Approval');

  let cooCookies = {};
  await test('Login as COO', async () => {
    cooCookies = await login('nisha.bhilwara@gmail.com', 'password123');
  });

  await test('GET /approvals/coo - COO sees pending requests', async () => {
    const res = await request('GET', '/approvals/coo', null, cooCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    const found = res.data.requests.some(r => r.id === beyondRequestId);
    if (!found) throw new Error(`Request ${beyondRequestId} not in COO pending list`);
    console.log(`     Found ${res.data.requests.length} COO pending requests`);
  });

  await test(`PATCH /approvals/coo/${beyondRequestId} - COO approves`, async () => {
    const res = await request('PATCH', `/approvals/coo/${beyondRequestId}`, {
      action: 'approve',
      remarks: 'COO approved'
    }, cooCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.newStatus !== 'Approved_COO') throw new Error(`Wrong new status: ${res.data.newStatus}`);
    console.log(`     New status: ${res.data.newStatus} ✓`);
  });

  // ─── Phase 4: Garage Assignment ────────────────────────────
  console.log('\n📋 PHASE 4: Garage Assignment Flow');

  let garageCookies = {};
  await test('Login as Garage', async () => {
    garageCookies = await login('bohrakartikeya@gmail.com', 'password123');
  });

  await test('GET /garage/pending - Garage sees approved requests', async () => {
    const res = await request('GET', '/garage/pending', null, garageCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    const found = res.data.requests.some(r => r.id === testRequestId);
    if (!found) throw new Error(`Request ${testRequestId} not in garage pending list`);
    console.log(`     Found ${res.data.requests.length} pending (incl. both approved requests)`);
  });

  let vehicleId, driverId;
  await test('GET /garage/vehicles - Get available vehicles', async () => {
    const res = await request('GET', '/garage/vehicles', null, garageCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    const avail = res.data.vehicles.filter(v => v.is_available);
    if (avail.length === 0) throw new Error('No available vehicles');
    vehicleId = avail[0].id;
    console.log(`     Available: ${avail.length} vehicles. Using ID: ${vehicleId}`);
  });

  await test('GET /garage/drivers - Get available drivers', async () => {
    const res = await request('GET', '/garage/drivers', null, garageCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    const avail = res.data.drivers.filter(d => d.is_available);
    if (avail.length === 0) throw new Error('No available drivers');
    driverId = avail[0].id;
    console.log(`     Available: ${avail.length} drivers. Using ID: ${driverId}`);
  });

  await test(`PATCH /garage/assign/${testRequestId} - Assign vehicle`, async () => {
    const res = await request('PATCH', `/garage/assign/${testRequestId}`, {
      vehicle_id: vehicleId,
      driver_id: driverId,
      remarks: 'Test assignment'
    }, garageCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     Message: ${res.data.message}`);
  });

  await test(`PATCH /garage/pickup/${testRequestId} - Record pickup`, async () => {
    const res = await request('PATCH', `/garage/pickup/${testRequestId}`, {}, garageCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     Message: ${res.data.message}`);
  });

  await test(`PATCH /garage/dropoff/${testRequestId} - Record dropoff`, async () => {
    const res = await request('PATCH', `/garage/dropoff/${testRequestId}`, {}, garageCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     Message: ${res.data.message}`);
  });

  // Verify request is now Completed
  await test(`GET /requests/${testRequestId} - Verify Completed status`, async () => {
    const res = await request('GET', `/requests/${testRequestId}`, null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    if (res.data.request.status !== 'Completed') throw new Error(`Wrong status: ${res.data.request.status}`);
    console.log(`     Final status: ${res.data.request.status} ✓`);
  });

  // ─── Phase 5: Admin ────────────────────────────────────────
  console.log('\n📋 PHASE 5: Admin Operations');

  let adminCookies = {};
  await test('Login as Admin', async () => {
    adminCookies = await login('harshbohra41@gmail.com', 'password123');
  });

  await test('GET /admin/employees', async () => {
    const res = await request('GET', '/admin/employees', null, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Found ${res.data.employees.length} employees`);
  });

  await test('GET /admin/departments', async () => {
    const res = await request('GET', '/admin/departments', null, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Found ${res.data.departments.length} departments`);
  });

  let newEmpId;
  await test('POST /admin/employees - Create test employee', async () => {
    const rand = Math.floor(Math.random() * 10000);
    const res = await request('POST', '/admin/employees', {
      employee_number: `TEST${rand}`,
      email: `test.qa${rand}@example.com`,
      password: 'password123',
      full_name: 'Test QA Employee',
      role: 'Employee',
      department_id: 1
    }, adminCookies);
    if (res.status !== 201) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    newEmpId = res.data.employeeId;
    console.log(`     Created employee ID: ${newEmpId}`);
  });

  await test(`PUT /admin/employees/${newEmpId} - Update employee`, async () => {
    const res = await request('PUT', `/admin/employees/${newEmpId}`, {
      full_name: 'Test QA Updated',
      phone: '9876543210'
    }, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     Updated employee`);
  });

  await test(`DELETE /admin/employees/${newEmpId} - Deactivate employee`, async () => {
    const res = await request('DELETE', `/admin/employees/${newEmpId}`, null, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     Deactivated employee`);
  });

  await test('GET /admin/audit-logs', async () => {
    const res = await request('GET', '/admin/audit-logs', null, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Found ${res.data.logs.length} audit logs (total: ${res.data.pagination.total})`);
  });

  await test('GET /admin/dashboard', async () => {
    const res = await request('GET', '/admin/dashboard', null, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Dashboard loaded OK`);
  });

  // ─── Phase 6: Vehicle Management ───────────────────────────
  console.log('\n📋 PHASE 6: Vehicle & Destination Management');

  let newVehicleId;
  await test('POST /garage/vehicles - Create vehicle', async () => {
    const randReg = 'MP24QA' + Math.floor(Math.random() * 9000 + 1000);
    const res = await request('POST', '/garage/vehicles', {
      registration_no: randReg,
      make: 'Maruti',
      model: 'Swift',
      vehicle_type: 'Sedan',
      capacity: 4,
      fuel_type: 'Petrol',
      current_odometer: 0
    }, adminCookies);
    if (res.status !== 201) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    newVehicleId = res.data.vehicleId;
    console.log(`     Created vehicle ID: ${newVehicleId}`);
  });

  await test(`PUT /garage/vehicles/${newVehicleId} - Update vehicle`, async () => {
    const res = await request('PUT', `/garage/vehicles/${newVehicleId}`, {
      current_odometer: 100
    }, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await test(`DELETE /garage/vehicles/${newVehicleId} - Delete test vehicle`, async () => {
    const res = await request('DELETE', `/garage/vehicles/${newVehicleId}`, null, adminCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await test('GET /destinations', async () => {
    const res = await request('GET', '/destinations', null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Found ${res.data.destinations?.length || 0} destinations`);
  });

  // ─── Phase 7: GM-HR Flow ───────────────────────────────────
  console.log('\n📋 PHASE 7: GM-HR Approval Flow');

  let gmhrCookies2 = {};
  await test('Login as GM-HR', async () => {
    gmhrCookies2 = await login('gmhr@orientpaper.com', 'password123');
  });

  await test('GET /approvals/gmhr', async () => {
    const res = await request('GET', '/approvals/gmhr', null, gmhrCookies2);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     GM-HR pending: ${res.data.requests.length} (Pending_GM_HR requests)`);
  });

  await test('GET /approvals/gmhr/stats', async () => {
    const res = await request('GET', '/approvals/gmhr/stats', null, gmhrCookies2);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     GM-HR stats: ${JSON.stringify(res.data.stats)}`);
  });

  // ─── Phase 8: Notifications & History ──────────────────────
  console.log('\n📋 PHASE 8: Notifications & History');

  await test('GET /notifications', async () => {
    const res = await request('GET', '/notifications', null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     Employee has ${res.data.notifications?.length || 0} notifications`);
  });

  await test(`GET /requests/${testRequestId}/history`, async () => {
    const res = await request('GET', `/requests/${testRequestId}/history`, null, empCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}`);
    console.log(`     History has ${res.data.data?.length || 0} events`);
  });

  await test('GET /requests/history (Request history page)', async () => {
    const res = await request('GET', '/requests/history', null, empCookies);
    // This should 404 since /requests/history is a frontend route, not API
    // Actually it IS an API route? Let's check
    console.log(`     Status: ${res.status} (expected 200 or 404)`);
  });

  await test('GET /delegations', async () => {
    const res = await request('GET', '/delegations', null, hodCookies);
    if (res.status !== 200) throw new Error(`Got ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`     Delegations loaded`);
  });

  console.log('\n=== ✅ AUDIT COMPLETE ===\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
