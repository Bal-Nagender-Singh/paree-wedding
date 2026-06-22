import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import https from 'https';
import { db } from '../models/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'paree-luxury-secret-key-2026';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await db.users.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      phone,
      password_hash,
      role: 'user',
      created_at: new Date().toISOString()
    };

    await db.users.create(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check .env admin credentials first
    const envAdminUser = process.env.ADMIN_USER || 'admin@paree.com';
    const envAdminPass = process.env.ADMIN_PASS || 'admin123';

    if (email.toLowerCase() === envAdminUser.toLowerCase() && password === envAdminPass) {
      const token = jwt.sign(
        { id: 'admin-user', email: envAdminUser, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        token,
        user: {
          id: 'admin-user',
          name: 'Paree Admin',
          email: envAdminUser,
          role: 'admin'
        }
      });
    }

    const user = await db.users.getByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Special check for mock seed admin or bcrypt verify
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db.users.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, email, phone } = req.body;
    const existingEmailUser = await db.users.getByEmail(email);
    if (existingEmailUser && existingEmailUser.id !== req.user.id) {
      return res.status(400).json({ message: 'Email already in use by another account' });
    }

    const updatedUser = await db.users.update(req.user.id, { name, email, phone });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    const user = await db.users.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.users.update(req.user.id, { password_hash: newPasswordHash });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// --- OTP LOGIC ---
const otpStorage = new Map<string, { otp: string; sessionId?: string; expires: number; phone: string; verified?: boolean }>();

const sendSms2Factor = (phone: string, apiKey: string, templateName?: string): Promise<string | null> => {
  return new Promise((resolve) => {
    let sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length === 11 && sanitizedPhone.startsWith('0')) {
      sanitizedPhone = sanitizedPhone.slice(1);
    }
    if (sanitizedPhone.length === 10) {
      sanitizedPhone = '91' + sanitizedPhone;
    }
    let url = `https://2factor.in/API/V1/${apiKey}/SMS/${sanitizedPhone}/AUTOGEN`;
    if (templateName) {
      url += `/${encodeURIComponent(templateName)}`;
    }

    console.log(`[2Factor OTP Send] Triggering API request: ${url}`);

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          console.log('[2Factor API Send Response]', parsed);
          if (parsed.Status === 'Success') {
            resolve(parsed.Details); // Returns the session_id
          } else {
            console.error('[2Factor API Error Response]', parsed);
            resolve(null);
          }
        } catch (e) {
          console.error('[2Factor API Response Parse JSON Error]', e);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('[2Factor API Connection Error]', err);
      resolve(null);
    });
  });
};

const verifySms2Factor = (sessionId: string, otp: string, apiKey: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
    console.log(`[2Factor OTP Verify] Triggering API verification check: ${url}`);

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          console.log('[2Factor API Verify Response]', parsed);
          resolve(parsed.Status === 'Success');
        } catch (e) {
          console.error('[2Factor API Verify Parse JSON Error]', e);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('[2Factor API Verify Connection Error]', err);
      resolve(false);
    });
  });
};

const sendSmsTextbelt = (phone: string, otp: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      number: phone,
      message: `Your Paree Luxury verification code is: ${otp}`,
      key: 'textfree'
    });

    const options = {
      hostname: 'textbelt.com',
      port: 443,
      path: '/text',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(!!parsed.success);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.write(data);
    req.end();
  });
};

const sendSmsFast2SMS = (phone: string, otp: string, apiKey: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const message = encodeURIComponent(`Your Paree Luxury verification code is: ${otp}`);
    const rawPhone = phone.replace(/\D/g, '').slice(-10); // get last 10 digits
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${message}&numbers=${rawPhone}`;

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.return === true);
        } catch {
          resolve(false);
        }
      });
    }).on('error', () => {
      resolve(false);
    });
  });
};



export const sendOtp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const twoFactorApiKey = process.env.TWOFACTOR_API_KEY;
    const twoFactorTemplateName = process.env.TWOFACTOR_TEMPLATE_NAME;

    let realSmsSent = false;
    let otp = '';

    if (twoFactorApiKey) {
      const sessionId = await sendSms2Factor(phone, twoFactorApiKey, twoFactorTemplateName);
      if (sessionId) {
        realSmsSent = true;
        otpStorage.set(phone, { otp: '2factor_managed', sessionId, expires: Date.now() + 10 * 60 * 1000, phone });
      }
    }

    // Fallback: generate local OTP
    if (!realSmsSent) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000;
      otpStorage.set(phone, { otp, expires, phone });

      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.length === 10) formattedPhone = '+91' + formattedPhone;
        else formattedPhone = '+' + formattedPhone;
      }
      if (process.env.FAST2SMS_API_KEY) {
        realSmsSent = await sendSmsFast2SMS(phone, otp, process.env.FAST2SMS_API_KEY);
      }
      if (!realSmsSent) {
        realSmsSent = await sendSmsTextbelt(formattedPhone, otp);
      }
    }

    console.log(`[OTP Gateway] OTP for ${phone} is: ${otp || '(Managed by 2Factor)'}. Real SMS Sent: ${realSmsSent}`);


    return res.status(200).json({
      success: true,
      realSmsSent,
      simulatedOtp: otp,
      message: realSmsSent ? 'OTP sent to your mobile number.' : 'Simulated OTP generated.'
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

export const verifyOtp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const record = otpStorage.get(phone);

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired verification session' });
    }

    if (Date.now() > record.expires) {
      otpStorage.delete(phone);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const twoFactorApiKey = process.env.TWOFACTOR_API_KEY;
    let verified = false;

    if (twoFactorApiKey && record.otp === '2factor_managed' && record.sessionId) {
      verified = await verifySms2Factor(record.sessionId, otp, twoFactorApiKey);
    } else {
      verified = (record.otp === otp);
    }

    if (!verified) {
      return res.status(400).json({ message: 'Incorrect OTP code entered' });
    }

    // OTP is valid - mark as verified but keep for registration completion
    otpStorage.set(phone, { ...record, verified: true, expires: Date.now() + 15 * 60 * 1000 });

    // Check if user already exists with this phone number
    const existingUser = await db.users.getByPhone(phone);

    if (existingUser) {
      // User found - log them in
      otpStorage.delete(phone);

      const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email, role: existingUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        newUser: false,
        token,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role
        }
      });
    }

    // New user - ask frontend to collect name (and optionally email)
    return res.status(200).json({
      success: true,
      newUser: true,
      phone,
      message: 'Phone verified. Please provide your name to complete registration.'
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

export const completeRegistration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone, name, email } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ message: 'Phone and name are required' });
    }

    // Ensure OTP was verified for this phone
    const record = otpStorage.get(phone);
    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Phone number has not been verified. Please complete OTP verification first.' });
    }

    // Create the new user
    const password_hash = await bcrypt.hash('otp_verified_user_' + Date.now(), 10);
    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      name,
      email: email || (phone.replace(/\D/g, '').slice(-10) + '@paree.user'),
      phone,
      password_hash,
      role: 'user',
      created_at: new Date().toISOString()
    };

    await db.users.create(newUser);
    otpStorage.delete(phone);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error completing registration', error: error.message });
  }
};
