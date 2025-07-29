import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ---------- إعداد متغيرات ----------
const [,, username, password, email] = process.argv;

if (!username || !password) {
  console.error('Usage: node scripts/createAdmin.js <username> <password> [email]');
  process.exit(1);
}

// ---------- مخطط المستخدم المبسط ----------
const userSchema = new mongoose.Schema({
  playerId: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  isAdmin: { type: Boolean, default: false },
  goldCoins: { type: Number, default: 10000 },
  pearls: { type: Number, default: 1 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  status: { type: String, default: 'offline' },
  activeSessionToken: String,
  inviteCode: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ---------- دالة توليد playerId فريد ----------
async function generateUniquePlayerId() {
  let unique = false;
  let playerId;
  while (!unique) {
    playerId = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await User.findOne({ playerId });
    unique = !existing;
  }
  return playerId;
}

// ---------- دالة توليد inviteCode فريد ----------
async function generateUniqueInviteCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let unique = false;
  while (!unique) {
    code = Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    const existing = await User.findOne({ inviteCode: code });
    unique = !existing;
  }
  return code;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // تحقق من عدم وجود المستخدم
    const exists = await User.findOne({ username });
    if (exists) {
      console.error('❌ User already exists');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const playerId = await generateUniquePlayerId();
    const inviteCode = await generateUniqueInviteCode();

    const user = await User.create({
      playerId,
      username,
      password: hashedPassword,
      email: email || null,
      isAdmin: true,
      status: 'online',
      inviteCode,
    });

    console.log('✅ Admin user created successfully');
    console.log({ id: user._id, username: user.username, playerId: user.playerId });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})(); 