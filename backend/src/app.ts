import './config/env';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/api';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.ALLOWED_ORIGIN, // your Vercel frontend URL e.g. https://paree.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now; restrict post-deploy by setting ALLOWED_ORIGIN
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main API Routes
app.use('/api', apiRouter);

// Admin Dashboard route with basic authentication
app.get('/admin', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
  const b64 = auth.split(' ')[1];
  const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    return res.status(200).json({ message: 'Welcome to admin dashboard' });
  }
  return res.status(403).send('Forbidden');
});

// Root Hello Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Paree Luxury Bridal Fashion E-Commerce API',
    version: '1.0.0',
    mode: 'postgresql'
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
