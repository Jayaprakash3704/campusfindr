import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import itemRoutes from './routes/itemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import User from './models/User.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
  ],
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',  authRoutes);
app.use('/api/v1/items', itemRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', sihId: 'SIH1516', timestamp: new Date() })
);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Seed SuperAdmin ───────────────────────────────────────────────────────────
async function seedSuperAdmin() {
  const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME } = process.env;
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.warn('⚠️  SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping seed.');
    return;
  }
  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
  if (!existing) {
    await User.create({
      name: SUPER_ADMIN_NAME || 'Super Admin',
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      role: 'superadmin',
      rollOrEmployeeId: 'SUPER-01',
    });
    console.log(`✅ SuperAdmin seeded: ${SUPER_ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  SuperAdmin already exists: ${SUPER_ADMIN_EMAIL}`);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    await seedSuperAdmin();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 CampusFindr server → http://localhost:${PORT}`);
  });
}

bootstrap();
