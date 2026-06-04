import prisma from "../utils/prisma.js";
import { generateToken, hashPassword, comparePassword } from "../services/auth.js";
import { runForUser } from "../services/agentScheduler.js";

export async function signup(req, res, next) {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and fullName are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, fullName },
    });

    const token = generateToken(user.id);

    runForUser(user.id, user.email, user.fullName).catch((err) => {
      console.error(`[SIGNUP] Agent run for ${user.id} failed:`, err.message);
    });

    res.status(201).json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, fullName: true, avatarUrl: true, role: true, createdAt: true },
  });
  res.json(user);
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "No account with that email" });
    }
    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
}
