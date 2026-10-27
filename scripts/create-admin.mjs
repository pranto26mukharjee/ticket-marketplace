// Creates (or promotes) an administrator account.
// Usage: node --env-file=.env scripts/create-admin.mjs admin@example.com "Full Name" "StrongPassword"
import bcrypt from "bcryptjs";
import pg from "pg";

const [email, fullName, password] = process.argv.slice(2);

if (!email || !fullName || !password || password.length < 12) {
  console.error('Usage: node --env-file=.env scripts/create-admin.mjs <email> "<full name>" "<password, 12+ chars>"');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await client.query('SELECT id FROM "User" WHERE email = $1', [normalizedEmail]);

  if (existing.rowCount) {
    await client.query(
      `UPDATE "User" SET role = 'ADMIN', "accountStatus" = 'ACTIVE', "passwordHash" = $2, "updatedAt" = NOW() WHERE email = $1`,
      [normalizedEmail, passwordHash]
    );
    console.log(`Promoted existing user ${normalizedEmail} to ADMIN and reset the password.`);
  } else {
    const id = `adm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    await client.query(
      `INSERT INTO "User" (id, email, "fullName", "passwordHash", role, "accountStatus", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'ADMIN', 'ACTIVE', NOW(), NOW())`,
      [id, normalizedEmail, fullName, passwordHash]
    );
    await client.query(
      `INSERT INTO "UserProfile" (id, "userId", "fullName", "identityVerified") VALUES ($1, $2, $3, true)`,
      [`prf${id}`, id, fullName]
    );
    console.log(`Created admin ${normalizedEmail}.`);
  }
} finally {
  await client.end();
}
