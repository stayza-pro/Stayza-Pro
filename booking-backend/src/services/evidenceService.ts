import { prisma } from "@/config/database";
import { config } from "@/config";
import { uploadDisputeEvidence } from "@/utils/upload";
import {
  EvidenceCaptureType,
  EvidenceRole,
  EvidenceVerificationType,
} from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const formatTimestampForWatermark = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const resolveBookingRole = async (bookingId: string, userId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: {
        select: {
          realtor: {
            select: {
              userId: true,
            },
          },
        },
      },
      guest: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const isGuest = booking.guestId === userId;
  const isRealtor = booking.property.realtor.userId === userId;

  if (!isGuest && !isRealtor) {
    throw new Error("You are not authorized to record evidence for this booking");
  }

  return {
    booking,
    role: isGuest ? EvidenceRole.GUEST : EvidenceRole.REALTOR,
  };
};

const validateCaptureMime = (
  captureType: EvidenceCaptureType,
  mimeType: string,
): void => {
  if (captureType === EvidenceCaptureType.PHOTO && !mimeType.startsWith("image/")) {
    throw new Error("PHOTO capture must be an image file");
  }

  if (captureType === EvidenceCaptureType.VIDEO && !mimeType.startsWith("video/")) {
    throw new Error("VIDEO capture must be a video file");
  }
};

const generateEvidenceCertificate = (input: {
  evidenceId: string;
  bookingId: string;
  userId: string;
  role: EvidenceRole;
  sha256: string;
  uploadedAt: string;
}) => {
  return jwt.sign(
    {
      iss: "stayza-pro",
      type: "evidence-certificate",
      evidenceId: input.evidenceId,
      bookingId: input.bookingId,
      userId: input.userId,
      role: input.role,
      sha256: input.sha256,
      uploadedAt: input.uploadedAt,
    },
    config.JWT_SECRET,
    {
      expiresIn: "180d",
    },
  );
};

export const getCaptureContext = async (bookingId: string, userId: string) => {
  const { booking, role } = await resolveBookingRole(bookingId, userId);
  const serverNow = new Date();
  const bookingReference = booking.id;

  return {
    bookingId: booking.id,
    bookingReference,
    role,
    serverNow: serverNow.toISOString(),
    watermarkPreview: `Stayza Pro • ${formatTimestampForWatermark(serverNow)} • ${bookingReference}`,
  };
};

export const uploadTrustedEvidence = async (params: {
  bookingId: string;
  userId: string;
  captureType: EvidenceCaptureType;
  fileBuffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  disputeId?: string;
}) => {
  const { bookingId, userId, captureType, fileBuffer, mimeType, sizeBytes, disputeId } = params;

  validateCaptureMime(captureType, mimeType);

  const { booking, role } = await resolveBookingRole(bookingId, userId);
  const capturedAtServer = new Date();
  const watermarkText = `Stayza Pro • ${formatTimestampForWatermark(capturedAtServer)} • ${booking.id}`;

  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  const uploaded = await uploadDisputeEvidence(fileBuffer, mimeType, "evidence/trusted");

  const created = await prisma.evidence.create({
    data: {
      bookingId: booking.id,
      disputeId,
      userId,
      role,
      verificationType: EvidenceVerificationType.TRUSTED_CAMERA,
      captureType,
      capturedAtServer,
      watermarkText,
      sha256,
      fileUrl: uploaded.secure_url,
      mimeType,
      sizeBytes,
      isCanonical: true,
    },
  });

  const certificateJwt = generateEvidenceCertificate({
    evidenceId: created.id,
    bookingId: booking.id,
    userId,
    role,
    sha256,
    uploadedAt: created.uploadedAt.toISOString(),
  });

  const evidence = await prisma.evidence.update({
    where: { id: created.id },
    data: {
      certificateJwt,
      certificateIssuedAt: new Date(),
    },
  });

  return {
    evidenceId: evidence.id,
    bookingId: evidence.bookingId,
    role: evidence.role,
    captureType: evidence.captureType,
    verificationType: evidence.verificationType,
    capturedAtServer: evidence.capturedAtServer,
    uploadedAt: evidence.uploadedAt,
    watermarkText: evidence.watermarkText,
    sha256: evidence.sha256,
    fileUrl: evidence.fileUrl,
    certificateJwt: evidence.certificateJwt,
    certificateIssuedAt: evidence.certificateIssuedAt,
  };
};

export const uploadUnverifiedSupportingEvidence = async (params: {
  bookingId: string;
  userId: string;
  fileBuffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  disputeId?: string;
}) => {
  const { bookingId, userId, fileBuffer, mimeType, sizeBytes, disputeId } = params;
  const { booking, role } = await resolveBookingRole(bookingId, userId);

  const uploaded = await uploadDisputeEvidence(fileBuffer, mimeType, "evidence/unverified");
  const capturedAtServer = new Date();
  const watermarkText = `Unverified supporting attachment • ${booking.id}`;
  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  const evidence = await prisma.evidence.create({
    data: {
      bookingId: booking.id,
      disputeId,
      userId,
      role,
      verificationType: EvidenceVerificationType.UNVERIFIED_SUPPORTING,
      captureType: mimeType.startsWith("video/")
        ? EvidenceCaptureType.VIDEO
        : EvidenceCaptureType.PHOTO,
      capturedAtServer,
      watermarkText,
      sha256,
      fileUrl: uploaded.secure_url,
      mimeType,
      sizeBytes,
      isCanonical: false,
    },
  });

  return {
    evidenceId: evidence.id,
    bookingId: evidence.bookingId,
    role: evidence.role,
    captureType: evidence.captureType,
    verificationType: evidence.verificationType,
    capturedAtServer: evidence.capturedAtServer,
    uploadedAt: evidence.uploadedAt,
    watermarkText: evidence.watermarkText,
    sha256: evidence.sha256,
    fileUrl: evidence.fileUrl,
  };
};

export const listBookingEvidence = async (bookingId: string, userId: string) => {
  await resolveBookingRole(bookingId, userId);

  return prisma.evidence.findMany({
    where: { bookingId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      bookingId: true,
      disputeId: true,
      role: true,
      verificationType: true,
      captureType: true,
      capturedAtServer: true,
      uploadedAt: true,
      watermarkText: true,
      sha256: true,
      fileUrl: true,
      certificateJwt: true,
      certificateIssuedAt: true,
      mimeType: true,
      sizeBytes: true,
    },
  });
};
