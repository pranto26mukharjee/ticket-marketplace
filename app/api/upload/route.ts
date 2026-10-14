import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { enforceRateLimit, uploadRateLimiter } from "@/lib/security/rate-limit";

/*
|--------------------------------------------------------------------------
| POST /api/upload
|--------------------------------------------------------------------------
| Handles authenticated secure document upload (PDF, JPG, JPEG, PNG, WEBP).
*/
export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, uploadRateLimiter, "upload");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first to upload documents.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No document file provided.",
        },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "File exceeds maximum permitted size of 10MB.",
        },
        { status: 400 }
      );
    }

    // Validate extension & mime
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.name).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          message: `Disallowed file format (${ext}). Only PDF, JPG, PNG, and WEBP are accepted.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate safe random unique filename
    const uniqueId = crypto.randomBytes(12).toString("hex");
    const sanitizedFilename = `doc_${Date.now()}_${uniqueId}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "tickets");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, sanitizedFilename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/tickets/${sanitizedFilename}`;

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully.",
      documentUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload document file.",
      },
      { status: 500 }
    );
  }
}
