import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, uploadRateLimiter } from "@/lib/security/rate-limit";

// Serverless platforms (Vercel) cap request bodies at ~4.5MB.
const MAX_TICKET_PDF_BYTES = 4 * 1024 * 1024;

/*
|--------------------------------------------------------------------------
| POST /api/upload
|--------------------------------------------------------------------------
| Stores the original ticket PDF privately in the database and returns a
| documentId to attach to a new listing. Files are never written to /public.
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
        { success: false, message: "Please login first to upload documents." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No document file provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_TICKET_PDF_BYTES) {
      return NextResponse.json(
        { success: false, message: "File exceeds the maximum size of 4MB." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, message: "Only PDF ticket documents are accepted for verification." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json(
        { success: false, message: "The uploaded file is not a valid PDF document." },
        { status: 400 }
      );
    }

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    // Re-uploading the same file before submitting reuses the existing record.
    const existingDraft = await prisma.ticketDocument.findFirst({
      where: { ownerId: session.userId, sha256, ticketId: null },
      select: { id: true },
    });

    const document =
      existingDraft ??
      (await prisma.ticketDocument.create({
        data: {
          ownerId: session.userId,
          fileName: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120),
          sizeBytes: buffer.length,
          sha256,
          data: buffer,
        },
        select: { id: true },
      }));

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully.",
      documentId: document.id,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to upload document file." },
      { status: 500 }
    );
  }
}
