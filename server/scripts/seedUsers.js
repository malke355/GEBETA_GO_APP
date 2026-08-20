import connectDB from '../config/db.js';
import User from '../models/User.js';

const DEMO_PASSWORD = 'password123';

const DEMO_USERS = [
  {
    name: 'Solomon Alula',
    email: 'customer@test.com',
    password: DEMO_PASSWORD,
    role: 'customer',
    phone: '+251911111111',
    address: 'Addis Ababa, Bole Atlas',
  },
  {
    name: 'Amanuel Tesfaye',
    email: 'driver@test.com',
    password: DEMO_PASSWORD,
    role: 'driver',
    phone: '+251922222222',
  },
  {
    name: 'Lucy Manager',
    email: 'lucy@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
    phone: '+251933333333',
  },
  {
    name: 'Pizza Hut Manager',
    email: 'pizzahut@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    name: 'Burger House Manager',
    email: 'burgerhouse@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    name: 'Ayat Manager',
    email: 'ayat@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    name: 'Yod Manager',
    email: 'yod@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    name: 'Castelli Manager',
    email: 'castelli@test.com',
    password: DEMO_PASSWORD,
    role: 'restaurant',
  },
  {
    name: 'Platform Admin',
    email: 'admin@test.com',
    password: DEMO_PASSWORD,
    role: 'admin',
  },
];

await connectDB();

for (const demo of DEMO_USERS) {
  const existing = await User.findOne({ email: demo.email });
  if (existing) {
    console.log(`Already exists: ${demo.email} (${existing.role})`);
    continue;
  }

  await User.create(demo);
  console.log(`Created: ${demo.email} (${demo.role})`);
}

console.log('Demo users are ready. Password for all: password123');
process.exit(0);
