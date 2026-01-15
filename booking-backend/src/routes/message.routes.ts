/**
 * Message Routes - Context-Locked Messaging System
 *
 * Rules:
 * 1. Messaging tied to property inquiry OR active booking
 * 2. No global "chat any realtor anytime"
 * 3. Before booking → limited Q&A style (property inquiry)
 * 4. After booking → full messaging
 * 5. After checkout → read-only or time-limited (48 hours)
 * 6. All messages filtered for prohibited content
 * 7. System messages for critical info
 * 8. Dispute-ready: timestamped, immutable, admin-visible
 */

import { Router, Response } from "express";
import "multer";
import { PrismaClient } from "@prisma/client";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "@/middleware/auth";
import { MessageFilterService } from "@/services/messageFilter";
import { SystemMessageService } from "@/services/systemMessage";
import { uploadMessageAttachments } from "@/services/photoUpload";

const router = Router();
const prisma = new PrismaClient();

// =====================================================
// PROPERTY INQUIRY MESSAGES (Pre-Booking)
// =====================================================

/**
 * Send message about a property (before booking)
 * Limited Q&A style - no personal contact info exchange
 * Supports file and voice note attachments
 */
router.post(
  "/property/:propertyId/inquiry",
  authenticate,
  requireRole("GUEST"),
  (req: AuthenticatedRequest, res: Response, next: any) => {
    uploadMessageAttachments(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err.message || "File upload failed",
        });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;
      const files = req.files as {
        files?: Express.Multer.File[];
        voiceNote?: Express.Multer.File[];
      };

      if (!content?.trim() && !files?.files && !files?.voiceNote) {
        res.status(400).json({
          success: false,
          error: "Message content or attachments are required",
        });
        return;
      }

      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { realtor: true },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          error: "Property not found",
        });
        return;
      }

      if (!property.isActive) {
        res.status(400).json({
          success: false,
          error: "This property is not available for inquiries",
        });
        return;
      }

      // Filter message content if provided
      let filteredContent = content || "";
      let filterResult: {
        violations: string[];
        isBlocked: boolean;
        filteredContent: string;
      } = {
        violations: [],
        isBlocked: false,
        filteredContent: "",
      };

      if (content?.trim()) {
        filterResult = MessageFilterService.filterMessage(content);
        if (filterResult.isBlocked) {
          res.status(400).json({
            success: false,
            error: `Message blocked: Contains prohibited content (${filterResult.violations.join(
              ", "
            )})`,
          });
          return;
        }
        filteredContent = filterResult.filteredContent;
      }

      // Create inquiry message
      const message = await prisma.message.create({
        data: {
          propertyId,
          senderId: userId,
          recipientId: property.realtor.userId,
          content: filteredContent,
          type: "INQUIRY",
          wasFiltered: filterResult.violations.length > 0,
          violations: filterResult.violations,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Create attachments if files were uploaded
      const attachments = [];

      if (files?.files) {
        for (const file of files.files) {
          const attachment = await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              url: file.path,
              type: file.mimetype.startsWith("image/") ? "IMAGE" : "DOCUMENT",
              filename: file.originalname,
              size: file.size,
            },
          });
          attachments.push(attachment);
        }
      }

      if (files?.voiceNote && files.voiceNote.length > 0) {
        const voiceFile = files.voiceNote[0];
        const attachment = await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            url: voiceFile.path,
            type: "VOICE",
            filename: voiceFile.originalname,
            size: voiceFile.size,
          },
        });
        attachments.push(attachment);
      }

      // Fetch message with attachments
      const messageWithAttachments = await prisma.message.findUnique({
        where: { id: message.id },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Inquiry sent successfully",
        data: messageWithAttachments,
      });
    } catch (error: any) {
      console.error("Error sending property inquiry:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send inquiry",
      });
    }
  }
);

/**
 * Get property inquiry thread
 * Guest or realtor can view their conversation about a property
 */
router.get(
  "/property/:propertyId/inquiry",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user!.id;

      // Verify user has access to this property inquiry
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { realtor: true },
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: "Property not found",
        });
      }

      // Check if user is the guest who inquired or the realtor who owns property
      const isRealtor = property.realtor.userId === userId;
      const isGuest = req.user!.role === "GUEST";

      if (!isRealtor && !isGuest) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Fetch messages
      const messages = await prisma.message.findMany({
        where: {
          propertyId,
          OR: [{ senderId: userId }, { recipientId: userId }],
          type: "INQUIRY",
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Mark as read if user is recipient
      await prisma.message.updateMany({
        where: {
          propertyId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.json({
        success: true,
        data: {
          propertyId,
          property: {
            title: property.title,
            city: property.city,
          },
          messages,
        },
      });
    } catch (error: any) {
      console.error("Error fetching property inquiry:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch inquiry messages",
      });
    }
  }
);

// =====================================================
// BOOKING MESSAGES (Post-Booking)
// =====================================================

/**
 * Send message within a booking context
 * Full messaging allowed between guest and realtor
 * Supports file and voice note attachments
 */
router.post(
  "/booking/:bookingId",
  authenticate,
  (req: AuthenticatedRequest, res: Response, next: any) => {
    uploadMessageAttachments(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err.message || "File upload failed",
        });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;
      const files = req.files as {
        files?: Express.Multer.File[];
        voiceNote?: Express.Multer.File[];
      };

      if (!content?.trim() && !files?.files && !files?.voiceNote) {
        res.status(400).json({
          success: false,
          error: "Message content or attachments are required",
        });
        return;
      }

      // Verify booking and user access
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            include: { realtor: true },
          },
          guest: true,
        },
      });

      if (!booking) {
        res.status(404).json({
          success: false,
          error: "Booking not found",
        });
        return;
      }

      // Verify user is part of this booking
      const isGuest = booking.guestId === userId;
      const isRealtor = booking.property.realtor.userId === userId;

      if (!isGuest && !isRealtor) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      // Check if messaging is still allowed (time-based)
      const canMessage = MessageFilterService.canSendMessage({
        hasBooking: true,
        bookingStatus: booking.status,
        checkoutDate: booking.checkOutDate,
      });

      if (!canMessage.allowed) {
        res.status(403).json({
          success: false,
          error: canMessage.reason,
        });
        return;
      }

      // Filter message content if provided
      let filteredContent = content || "";
      let filterResult: {
        violations: string[];
        isBlocked: boolean;
        filteredContent: string;
      } = {
        violations: [],
        isBlocked: false,
        filteredContent: "",
      };

      if (content?.trim()) {
        filterResult = MessageFilterService.filterMessage(content);
        if (filterResult.isBlocked) {
          res.status(400).json({
            success: false,
            error: `Message blocked: Contains prohibited content (${filterResult.violations.join(
              ", "
            )})`,
          });
          return;
        }
        filteredContent = filterResult.filteredContent;
      }

      // Determine recipient
      const recipientId = isGuest
        ? booking.property.realtor.userId
        : booking.guestId;

      // Create message
      const message = await prisma.message.create({
        data: {
          bookingId,
          senderId: userId,
          recipientId,
          content: filteredContent,
          type: "BOOKING_MESSAGE",
          wasFiltered: filterResult.violations.length > 0,
          violations: filterResult.violations,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Create attachments if files were uploaded
      const attachments = [];

      if (files?.files) {
        for (const file of files.files) {
          const attachment = await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              url: file.path,
              type: file.mimetype.startsWith("image/") ? "IMAGE" : "DOCUMENT",
              filename: file.originalname,
              size: file.size,
            },
          });
          attachments.push(attachment);
        }
      }

      if (files?.voiceNote && files.voiceNote.length > 0) {
        const voiceFile = files.voiceNote[0];
        const attachment = await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            url: voiceFile.path,
            type: "VOICE",
            filename: voiceFile.originalname,
            size: voiceFile.size,
          },
        });
        attachments.push(attachment);
      }

      // Fetch message with attachments
      const messageWithAttachments = await prisma.message.findUnique({
        where: { id: message.id },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: messageWithAttachments,
      });
    } catch (error: any) {
      console.error("Error sending booking message:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send message",
      });
    }
  }
);

/**
 * Get all messages for a booking
 * Includes system messages and user messages
 */
router.get(
  "/booking/:bookingId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === "ADMIN";

      // Verify booking and user access
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            include: { realtor: true },
          },
          guest: true,
        },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Verify access (guest, realtor, or admin)
      const isGuest = booking.guestId === userId;
      const isRealtor = booking.property.realtor.userId === userId;

      if (!isGuest && !isRealtor && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Fetch messages
      const messages = await prisma.message.findMany({
        where: {
          bookingId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Mark messages as read for the current user
      await prisma.message.updateMany({
        where: {
          bookingId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.json({
        success: true,
        data: {
          bookingId,
          booking: {
            status: booking.status,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            property: {
              title: booking.property.title,
              city: booking.property.city,
            },
          },
          messages: [], // Will be populated from database
          messagingStatus: MessageFilterService.canSendMessage({
            hasBooking: true,
            bookingStatus: booking.status,
            checkoutDate: booking.checkOutDate,
          }),
        },
      });
    } catch (error: any) {
      console.error("Error fetching booking messages:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch messages",
      });
    }
  }
);

// =====================================================
// MESSAGE MANAGEMENT
// =====================================================

/**
 * Get all conversations for authenticated user
 * Shows both property inquiries and booking messages
 */
router.get(
  "/conversations",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Fetch all messages for user
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { recipientId: userId }],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
          booking: {
            select: {
              id: true,
              status: true,
              checkInDate: true,
              checkOutDate: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by booking/property to create conversation threads
      const conversationMap = new Map();
      for (const msg of messages) {
        const key = msg.bookingId || msg.propertyId;
        if (!conversationMap.has(key)) {
          const otherUser =
            msg.senderId === userId ? msg.recipient : msg.sender;
          conversationMap.set(key, {
            id: key,
            type: msg.bookingId ? "booking" : "property",
            bookingId: msg.bookingId,
            propertyId: msg.propertyId,
            property: msg.property,
            booking: msg.booking,
            otherUser,
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        // Count unread messages
        if (msg.recipientId === userId && !msg.isRead) {
          const conv = conversationMap.get(key);
          conv.unreadCount++;
        }
      }

      return res.json({
        success: true,
        data: {
          conversations: Array.from(conversationMap.values()),
        },
      });
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch conversations",
      });
    }
  }
);

/**
 * Get unread message count
 */
router.get(
  "/unread-count",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Count unread messages
      const unreadCount = await prisma.message.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      });

      return res.json({
        success: true,
        data: {
          unreadCount,
        },
      });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch unread count",
      });
    }
  }
);

// =====================================================
// ADMIN ACCESS (Dispute Resolution)
// =====================================================

/**
 * Get all messages for a booking (Admin only)
 * Used during dispute resolution
 */
router.get(
  "/admin/booking/:bookingId/messages",
  authenticate,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            include: {
              realtor: {
                include: { user: true },
              },
            },
          },
          guest: true,
        },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Fetch all messages including metadata
      const messages = await prisma.message.findMany({
        where: {
          bookingId,
        },
        include: {
          sender: true,
          recipient: true,
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Calculate metadata
      const metadata = {
        totalMessages: messages.length,
        systemMessages: messages.filter((m) => m.type === "SYSTEM").length,
        userMessages: messages.filter((m) => m.type !== "SYSTEM").length,
        filteredMessages: messages.filter((m) => m.wasFiltered).length,
      };

      return res.json({
        success: true,
        data: {
          booking: {
            id: booking.id,
            status: booking.status,
            guest: {
              name: `${booking.guest.firstName} ${booking.guest.lastName}`,
              email: booking.guest.email,
            },
            realtor: {
              name: booking.property.realtor.businessName,
              email: booking.property.realtor.user.email,
            },
          },
          messages,
          metadata,
        },
      });
    } catch (error: any) {
      console.error("Error fetching admin messages:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch messages",
      });
    }
  }
);

export default router;
