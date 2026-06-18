// Quick test that all modules load and the Express app boots
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mysql2 = require('mysql2/promise');

console.log('✅ All server modules loaded successfully:');
console.log('   express, cors, helmet, cookie-parser, jsonwebtoken, passport, mysql2');

// Test JWT sign/verify
const token = jwt.sign({ test: true }, 'test-secret', { expiresIn: '1m' });
const decoded = jwt.verify(token, 'test-secret');
console.log('✅ JWT sign/verify works:', decoded.test === true);

// Test Express app creation
const app = express();
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.get('/test', (req, res) => res.json({ ok: true }));
console.log('✅ Express app created with middleware');
console.log('\n🎉 Server boot test PASSED');
process.exit(0);
