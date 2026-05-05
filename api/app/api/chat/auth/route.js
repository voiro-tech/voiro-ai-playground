import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "voiro-ai-secret-change-this-in-production"
);

// ─────────────────────────────────────────────────────────────
// APPROVED USERS
// Add users here — email: { password, name, role }
// This is plain text for prototype — fine for internal use
// ─────────────────────────────────────────────────────────────
const USERS = {
  "admin@voiro.com":  { password: "voiroai2024", name: "Voiro Admin", role: "admin" },
  "kavita@voiro.com": { password: "voiroai2024", name: "Kavita",      role: "user"  },
  // Add more users here:
  // "name@voiro.com": { password: "theirpassword", name: "Their Name", role: "user" },
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, password, token } = body;

    // ── Login ──
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        );
      }

      const user = USERS[email.toLowerCase()];
      if (!user || user.password !== password) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const jwt = await new SignJWT({
        email: email.toLowerCase(),
        name:  user.name,
        role:  user.role
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .setIssuedAt()
        .sign(JWT_SECRET);

      return NextResponse.json({
        token: jwt,
        user: {
          email: email.toLowerCase(),
          name:  user.name,
          role:  user.role
        }
      });
    }

    // ── Verify token ──
    if (action === "verify") {
      if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
      }
      try {
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