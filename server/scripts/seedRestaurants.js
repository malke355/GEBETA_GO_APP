import connectDB from '../config/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { DEMO_RESTAURANTS } from './demoRestaurants.js';

await connectDB();

for (const demo of DEMO_RESTAURANTS) {
  const { ownerEmail, ...restaurantData } = demo;
  const owner = await User.findOne({ email: ownerEmail });

  if (!owner) {
    console.log(`Skip ${demo.name}: owner ${ownerEmail} not found. Run npm run seed:users first.`);
    continue;
  }

  const existing = await Restaurant.findOne({ name: demo.name });
  if (existing) {
    console.log(`Already exists: ${demo.name}`);
    continue;
  }

  await Restaurant.create({
    ...restaurantData,
    ownerId: owner._id,
  });
  console.log(`Created: ${demo.name} (owner ${ownerEmail})`);
}

console.log('Demo restaurants are ready.');
process.exit(0);
