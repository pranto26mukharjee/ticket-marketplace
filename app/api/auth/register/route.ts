import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
try {
const body = await request.json();


const fullName = body.fullName?.trim();
const email = body.email?.trim().toLowerCase();
const phone = body.phone?.trim();
const password = body.password;

if (!fullName || !email || !password) {
  return NextResponse.json(
    {
      success: false,
      message: "Full name, email and password are required.",
    },
    { status: 400 }
  );
}

if (password.length < 6) {
  return NextResponse.json(
    {
      success: false,
      message: "Password must be at least 6 characters.",
    },
    { status: 400 }
  );
}

const existingUser = await prisma.user.findUnique({
  where: { email },
});

if (existingUser) {
  return NextResponse.json(
    {
      success: false,
      message: "An account with this email already exists.",
    },
    { status: 409 }
  );
}

if (phone) {
  const existingPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingPhone) {
    return NextResponse.json(
      {
        success: false,
        message: "An account with this phone number already exists.",
      },
      { status: 409 }
    );
  }
}

const passwordHash = await bcrypt.hash(password, 12);

const user = await prisma.user.create({
  data: {
    fullName,
    email,
    phone: phone || null,
    passwordHash,
    role: "BUYER",
  },
  select: {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true,
  },
});

return NextResponse.json(
  {
    success: true,
    message: "Registration successful.",
    user,
  },
  { status: 201 }
);


} catch (error) {
console.error("Registration error:", error);


return NextResponse.json(
  {
    success: false,
    message: "Something went wrong during registration.",
  },
  { status: 500 }
);


}
}
