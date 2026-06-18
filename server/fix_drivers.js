const mysql = require('mysql2/promise');

async function fix() {
  try {
    const conn = await mysql.createConnection({host:'localhost',user:'root',password:'admin',database:'vehicle_requisition_portal'});
    await conn.execute('UPDATE vehicle_requests vr JOIN drivers d ON vr.assigned_driver = d.full_name SET vr.assigned_driver_id = d.id WHERE vr.assigned_driver_id IS NULL AND vr.assigned_driver IS NOT NULL');
    await conn.execute("UPDATE drivers SET is_available = 0 WHERE id IN (SELECT assigned_driver_id FROM vehicle_requests WHERE status IN ('Vehicle_Assigned', 'In_Transit') AND assigned_driver_id IS NOT NULL)");
    console.log('Done fixing');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
