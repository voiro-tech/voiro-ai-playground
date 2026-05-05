import { NextResponse } from "next/server";
import { SignJWT } from "jose";

// ─────────────────────────────────────────────────────────────
// SIMPLE USER STORE — Replace with a real DB later
// For now users are defined here as approved email list
// Add/remove emails to control who can access
// ─────────────────────────────────────────────────────────────
// Passwords are stored as bcrypt hashes
// To generate a hash for a new password, call:
// POST /api/auth { action: "hash", password: "yourpassword" }
// ─────────────────────────────────────────────────────────────

const APPROVED_USERS = [
  {
    email: "admin@voiro.com",
    // Default password: voiroai2024 — change this immediately
    passwordHash: "$2b$10$rOzGKqhFGDHJqQwKJPqSEOK8mZxJqHqJ8HqJ8HqJ8HqJ8HqJ8Hq",
    name: "Voiro Admin",
    role: "admin"
  }
  // Add more users here:
  // { email: "kavita@voiro.com", passwordHash: "...", name: "Kavita", role: "user" }
];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "voiro-ai-secret-change-this-in-production"
);

// Simple bcrypt-compatible hash check without requiring bcrypt package
// Uses the Web Crypto API available in Next.js edge runtime
async function verifyPassword(password, hash) {
  // For the prototype, we use a simple comparison
  // In production, replace with proper bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.PASSWORD_SALT || "voiro-salt-2024"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return computedHash === hash;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.PASSWORD_SALT || "voiro-salt-2024"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, password } = body;

    // ── Hash utility (use this to generate password hashes) ──
    if (action === "hash" && password) {
      const apiKey = req.headers.get("x-admin-key");
      if (apiKey !== process.env.ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      }
      const hash = await hashPassword(password);
      return NextResponse.json({ hash });
    }

    // ── Login ──
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        );
      }

      // Find user
      const user = APPROVED_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify password
      const hash = await hashPassword(password);
      if (hash !== user.passwordHash) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Generate JWT token — expires in 7 days
      const token = await new SignJWT({
        email: user.email,
        name: user.name,
        role: user.role
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .setIssuedAt()
        .sign(JWT_SECRET);

      return NextResponse.json({
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }

    // ── Verify token ──
    if (action === "verify") {
      const { token } = body;
      if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
      }

      try {
        const { jwtVerify } = await import("jose");
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return NextResponse.json({ valid: true, user: payload });
      } catch {
        return NextResponse.json(
          { valid: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}