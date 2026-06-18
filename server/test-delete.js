const mysql = require('mysql2/promise');

async function testDelete() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'vehicle_requisition_portal'
  });

  try {
    // 1. Get an employee user (emp001)
    const [users] = await connection.execute('SELECT * FROM employees WHERE employee_number = "emp001" LIMIT 1');
    if (users.length === 0) {
      console.log('User emp001 not found in employees table!');
      return;
    }
    const user = users[0];

    // 2. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: user.email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.user) {
      console.log('Login failed:', loginData);
      return;
    }
    
    // We need to parse cookies manually from the fetch response to get the token!
    // Ah wait, authController now uses cookies:
    // res.cookie('jwt', accessToken, ...)
    // So the token is not in the JSON body for login?
    // Wait, let's check authController login response:
    // res.json({ status: 'success', user });
    // Token is ONLY in cookies!!
    
    const cookies = loginRes.headers.get('set-cookie');
    const tokenMatch = cookies ? cookies.match(/jwt=([^;]+)/) : null;
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
        console.log('Token not found in cookies');
        return;
    }

    // 3. Try to grab a pending request or create one
    let requestId;
    const [existing] = await connection.execute('SELECT id FROM vehicle_requests WHERE employee_id = ? AND status = "Pending_HOD" LIMIT 1', [user.id]);
    if(existing.length > 0) {
        requestId = existing[0].id;
        console.log('Working with existing request', requestId);
    } else {
        const createRes = await fetch('http://localhost:5000/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: `jwt=${token}` },
          body: JSON.stringify({
            purpose: 'Test Delete',
            pickup_location: 'Office',
            destination: 'Station',
            travel_type: 'Within Anuppur/Shahdol',
            travel_date: '2026-06-20',
            travel_time: '10:00'
          })
        });
        const createData = await createRes.json();
        requestId = createData.data?.requestId || createData.requestId || createData.data?.id;
        console.log('Created new request', requestId);
    }

    if (!requestId) return;

    // 4. Try to delete it
    const deleteRes = await fetch(`http://localhost:5000/api/requests/${requestId}/delete`, {
      method: 'PATCH',
      headers: { Cookie: `jwt=${token}` }
    });
    const deleteData = await deleteRes.json();
    console.log('Delete response:', deleteData);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

testDelete();
