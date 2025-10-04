import nodemailer from "nodemailer";
import { config } from "@/config";

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

// Stayza Brand Colors
const brandColors = {
  primary: "#1E3A8A", // Deep blue
  secondary: "#047857", // Deep green
  accent: "#F97316", // Orange
  neutralLight: "#F3F4F6", // Light gray
  neutralDark: "#111827", // Dark gray
  white: "#FFFFFF",
  success: "#10B981", // Green
  warning: "#F59E0B", // Amber
  error: "#EF4444", // Red
} as const;

// Email template base with Stayza branding
const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); padding: 40px 20px; text-align: center;">
    <img src="https://stayza.com/images/stayza.png" alt="Stayza Pro" style="height: 60px; width: auto; margin-bottom: 20px;">
    <h1 style="color: ${brandColors.white}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Stayza Pro
    </h1>
    <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 8px 0 0 0; font-weight: 400;">
      Your booking site. Branded. Live in minutes.
    </p>
  </div>
`;

const getEmailFooter = () => `
  <div style="background-color: ${brandColors.neutralDark}; padding: 40px 20px; margin-top: 40px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://stayza.com/images/stayza.png" alt="Stayza Pro" style="height: 40px; width: auto; opacity: 0.8;">
    </div>
    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px;">
      <table style="width: 100%; max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="text-align: center; padding: 10px;">
            <h4 style="color: ${brandColors.white}; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Stay Connected</h4>
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 20px 0; font-size: 14px;">
              📧 support@stayza.com | 💬 Live Chat | 📖 Help Center
            </p>
            <div style="margin: 20px 0;">
              <a href="#" style="display: inline-block; margin: 0 10px; padding: 8px 16px; background-color: ${brandColors.primary}; color: ${brandColors.white}; text-decoration: none; border-radius: 6px; font-size: 14px;">Dashboard</a>
              <a href="#" style="display: inline-block; margin: 0 10px; padding: 8px 16px; background-color: transparent; color: ${brandColors.white}; text-decoration: none; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px;">Help Center</a>
            </div>
          </td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
        © 2025 Stayza Pro. All rights reserved.<br>
        You're receiving this email because you have an account with Stayza Pro.
      </p>
    </div>
  </div>
`;

const getEmailContainer = (content: string) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: ${
    brandColors.neutralDark
  }; margin: 0; padding: 0; background-color: ${brandColors.neutralLight};">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${
      brandColors.white
    }; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      ${getEmailHeader()}
      <div style="padding: 40px 30px;">
        ${content}
      </div>
      ${getEmailFooter()}
    </div>
  </div>
`;

const getButton = (
  url: string,
  text: string,
  type: "primary" | "secondary" | "success" | "warning" = "primary"
) => {
  const colors = {
    primary: { bg: brandColors.primary, text: brandColors.white },
    secondary: { bg: brandColors.secondary, text: brandColors.white },
    success: { bg: brandColors.success, text: brandColors.white },
    warning: { bg: brandColors.warning, text: brandColors.white },
  };

  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, ${
    colors[type].bg
  } 0%, ${
    type === "primary" ? brandColors.secondary : brandColors.primary
  } 100%); color: ${
    colors[type].text
  }; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;">
        ${text}
      </a>
    </div>
  `;
};

const getInfoBox = (
  title: string,
  content: string,
  type: "info" | "success" | "warning" | "error" = "info"
) => {
  const colors = {
    info: {
      bg: `${brandColors.primary}15`,
      border: brandColors.primary,
      icon: "ℹ️",
    },
    success: {
      bg: `${brandColors.success}15`,
      border: brandColors.success,
      icon: "✅",
    },
    warning: {
      bg: `${brandColors.warning}15`,
      border: brandColors.warning,
      icon: "⚠️",
    },
    error: {
      bg: `${brandColors.error}15`,
      border: brandColors.error,
      icon: "❌",
    },
  };

  return `
    <div style="background-color: ${colors[type].bg}; border-left: 4px solid ${colors[type].border}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
      <h3 style="color: ${colors[type].border}; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        ${colors[type].icon} ${title}
      </h3>
      <p style="margin: 0; color: ${brandColors.neutralDark}; font-size: 14px; line-height: 1.5;">
        ${content}
      </p>
    </div>
  `;
};

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "🎉 Welcome to Stayza Pro - Your Journey Begins!",
    html: getEmailContainer(`
      <h2 style="color: ${
        brandColors.primary
      }; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Welcome to Stayza Pro, ${name}! 🎉</h2>
      
      <p style="font-size: 16px; margin: 0 0 20px 0; color: ${
        brandColors.neutralDark
      };">Thank you for joining our platform. We're excited to have you on board and help you create amazing booking experiences!</p>
      
      ${getInfoBox(
        "What You Can Do Now",
        "Your account is ready! Start exploring all the features Stayza Pro has to offer."
      )}
      
      <div style="background: linear-gradient(135deg, ${
        brandColors.neutralLight
      } 0%, ${
      brandColors.white
    } 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
        <h3 style="color: ${
          brandColors.primary
        }; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">🚀 Get Started Today</h3>
        <ul style="margin: 0; padding-left: 20px; color: ${
          brandColors.neutralDark
        };">
          <li style="margin-bottom: 10px;"><strong>Browse Properties:</strong> Discover amazing places to stay</li>
          <li style="margin-bottom: 10px;"><strong>Manage Bookings:</strong> Track your reservations effortlessly</li>
          <li style="margin-bottom: 10px;"><strong>Save Favorites:</strong> Create your wishlist of dream destinations</li>
          <li style="margin-bottom: 0;"><strong>Leave Reviews:</strong> Share your experiences with the community</li>
        </ul>
      </div>
      
      ${getButton("#", "Explore Stayza Pro", "primary")}
      
      <p style="font-size: 14px; color: ${
        brandColors.neutralDark
      }; text-align: center; margin: 30px 0 0 0;">Questions? Our support team is here to help you succeed!</p>
    `),
  }),

  realtorWelcome: (
    name: string,
    businessName: string,
    dashboardUrl: string,
    verificationUrl?: string
  ) => ({
    subject: "🏡 Welcome to Stayza Pro - Your Realtor Journey Begins!",
    html: getEmailContainer(`
      <h2 style="color: ${
        brandColors.primary
      }; font-size: 26px; font-weight: 700; margin: 0 0 15px 0;">Welcome to Stayza Pro, ${name}! 🏡</h2>
      
      <p style="font-size: 18px; margin: 0 0 25px 0; color: ${
        brandColors.secondary
      }; font-weight: 600;">Congratulations on joining Stayza Pro as a realtor partner!</p>
      
      <p style="font-size: 16px; margin: 0 0 30px 0; color: ${
        brandColors.neutralDark
      };">We're thrilled to have <strong>${businessName}</strong> on our platform. You're about to transform how you manage and showcase your properties.</p>
        
        ${
          verificationUrl
            ? `
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #f59e0b; margin-top: 0;">📧 Please Verify Your Email</h3>
          <p>Before you can start listing properties, please verify your email address:</p>
          <div style="text-align: center; margin: 15px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #f59e0b; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
        </div>
        `
            : ""
        }
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">🏡 What's Next?</h3>
          <p>Your realtor account is currently <strong>pending approval</strong>. Our team will review your application within 24-48 hours.</p>
          <p>Once approved, you'll be able to:</p>
          <ul>
            <li>✅ List unlimited properties</li>
            <li>✅ Manage bookings and availability</li>
            <li>✅ Set your own pricing and policies</li>
            <li>✅ Access detailed analytics and reports</li>
            <li>✅ Customize your brand profile</li>
          </ul>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">📋 Prepare While You Wait</h4>
          <p>Get ready to hit the ground running:</p>
          <ul>
            <li>Prepare high-quality photos of your properties</li>
            <li>Write compelling property descriptions</li>
            <li>Gather property documents and permits</li>
            <li>Set up your business banking details for payouts</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #3b82f6; color: white; padding: 14px 35px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Access Your Dashboard
          </a>
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #059669; margin-top: 0;">💡 Pro Tips for Success</h4>
          <ul>
            <li><strong>Professional Photos:</strong> Properties with high-quality photos get 3x more bookings</li>
            <li><strong>Complete Profile:</strong> Fill out all business details to build trust with guests</li>
            <li><strong>Quick Response:</strong> Respond to booking inquiries within 1 hour for better rankings</li>
            <li><strong>Competitive Pricing:</strong> Research similar properties in your area for optimal pricing</li>
          </ul>
        </div>

        <p><strong>Need Help?</strong> Our support team is here for you:</p>
        <ul>
          <li>📧 Email: support@stayza.com</li>
          <li>💬 Live Chat: Available in your dashboard</li>
          <li>📖 Help Center: Complete guides and tutorials</li>
        </ul>

      <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, ${
        brandColors.primary
      } 0%, ${brandColors.secondary} 100%); border-radius: 12px; color: ${
      brandColors.white
    };">
        <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">Welcome to the Stayza Pro Family!</h3>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">We're here to help you succeed every step of the way. 🚀</p>
      </div>
    `),
  }),

  emailVerification: (name: string, verificationUrl: string) => ({
    subject: "🔐 Verify Your Stayza Pro Email Address",
    html: getEmailContainer(`
      <h2 style="color: ${
        brandColors.primary
      }; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Email Verification Required 🔐</h2>
      
      <p style="font-size: 16px; margin: 0 0 25px 0; color: ${
        brandColors.neutralDark
      };">Hello ${name},</p>
      
      <p style="font-size: 16px; margin: 0 0 30px 0; color: ${
        brandColors.neutralDark
      };">Welcome to Stayza Pro! To complete your account setup and unlock all features, please verify your email address.</p>
      
      ${getInfoBox(
        "Security First",
        "Email verification helps keep your account secure and ensures you receive important updates about your bookings and account.",
        "info"
      )}
      
      ${getButton(verificationUrl, "🔐 Verify Email Address", "primary")}
      
      <div style="background: ${
        brandColors.neutralLight
      }; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: ${
          brandColors.neutralDark
        };">Alternative Option:</p>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: ${
          brandColors.neutralDark
        };">Copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: ${
          brandColors.primary
        }; background: ${
      brandColors.white
    }; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 0;">${verificationUrl}</p>
      </div>
      
      ${getInfoBox(
        "⏰ Important",
        "This verification link will expire in 24 hours for security reasons. If it expires, you can request a new one from your account settings.",
        "warning"
      )}
      
      <p style="font-size: 14px; color: ${
        brandColors.neutralDark
      }; text-align: center; margin: 30px 0 0 0;">
        Didn't create an account? You can safely ignore this email.
      </p>
    `),
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: "🔑 Reset Your Stayza Pro Password",
    html: getEmailContainer(`
      <h2 style="color: ${
        brandColors.primary
      }; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Password Reset Request 🔑</h2>
      
      <p style="font-size: 16px; margin: 0 0 25px 0; color: ${
        brandColors.neutralDark
      };">Hello ${name},</p>
      
      <p style="font-size: 16px; margin: 0 0 30px 0; color: ${
        brandColors.neutralDark
      };">We received a request to reset your Stayza Pro account password. Click the button below to create a new secure password:</p>
      
      ${getButton(resetUrl, "🔑 Reset My Password", "primary")}
      
      <div style="background: ${
        brandColors.neutralLight
      }; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: ${
          brandColors.neutralDark
        };">Alternative Option:</p>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: ${
          brandColors.neutralDark
        };">Copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: ${
          brandColors.primary
        }; background: ${
      brandColors.white
    }; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 0;">${resetUrl}</p>
      </div>
      
      ${getInfoBox(
        "⏰ Time Sensitive",
        "This password reset link will expire in 1 hour for security reasons. If you need more time, you can request a new reset link.",
        "warning"
      )}
      
      ${getInfoBox(
        "🔒 Security Tip",
        "Choose a strong password with at least 8 characters, including uppercase letters, lowercase letters, numbers, and special characters.",
        "info"
      )}
      
      <p style="font-size: 14px; color: ${
        brandColors.neutralDark
      }; text-align: center; margin: 30px 0 0 0;">
        Didn't request this password reset? You can safely ignore this email - your password won't be changed.
      </p>
    `),
  }),

  realtorApproved: (businessName: string, dashboardUrl: string) => ({
    subject: "🎉 Congratulations! Your Stayza Pro Account is Approved!",
    html: getEmailContainer(`
      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, ${
        brandColors.success
      } 0%, ${
      brandColors.secondary
    } 100%); border-radius: 16px; margin: 0 0 30px 0; color: ${
      brandColors.white
    };">
        <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
        <h2 style="color: ${
          brandColors.white
        }; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Congratulations!</h2>
        <p style="font-size: 18px; margin: 0; opacity: 0.95;">Your Realtor Account is Now Approved</p>
      </div>
      
      <p style="font-size: 18px; margin: 0 0 25px 0; color: ${
        brandColors.neutralDark
      };">Hello <strong>${businessName}</strong>,</p>
      
      <p style="font-size: 16px; margin: 0 0 30px 0; color: ${
        brandColors.neutralDark
      };">Great news! Your realtor account has been approved and you're now ready to start listing your properties and earning with Stayza Pro!</p>
      
      ${getButton(dashboardUrl, "🚀 Access Your Dashboard", "success")}
      
      <div style="background: linear-gradient(135deg, ${
        brandColors.success
      }15 0%, ${brandColors.secondary}10 100%); border: 2px solid ${
      brandColors.success
    }30; padding: 25px; border-radius: 16px; margin: 30px 0;">
        <h3 style="color: ${
          brandColors.success
        }; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">🎯 You Can Now:</h3>
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            brandColors.white
          }; border-radius: 8px; border-left: 3px solid ${
      brandColors.success
    };">
            <span style="font-size: 20px;">🏠</span>
            <div><strong>List Unlimited Properties</strong><br><span style="color: ${
              brandColors.neutralDark
            }; font-size: 14px;">Upload photos, set descriptions, and showcase your entire portfolio</span></div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            brandColors.white
          }; border-radius: 8px; border-left: 3px solid ${
      brandColors.success
    };">
            <span style="font-size: 20px;">💰</span>
            <div><strong>Set Custom Pricing & Policies</strong><br><span style="color: ${
              brandColors.neutralDark
            }; font-size: 14px;">Dynamic pricing, cancellation policies, and special offers</span></div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            brandColors.white
          }; border-radius: 8px; border-left: 3px solid ${
      brandColors.success
    };">
            <span style="font-size: 20px;">📊</span>
            <div><strong>Track Bookings & Earnings</strong><br><span style="color: ${
              brandColors.neutralDark
            }; font-size: 14px;">Real-time analytics, revenue reports, and performance insights</span></div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            brandColors.white
          }; border-radius: 8px; border-left: 3px solid ${
      brandColors.success
    };">
            <span style="font-size: 20px;">🎨</span>
            <div><strong>Customize Your Brand Profile</strong><br><span style="color: ${
              brandColors.neutralDark
            }; font-size: 14px;">Logo, colors, and branding throughout the booking experience</span></div>
          </div>
        </div>
      </div>
      
      ${getInfoBox(
        "🚀 Ready to Launch?",
        "Start by adding your first property listing. High-quality photos and detailed descriptions get 3x more bookings!",
        "info"
      )}
      
      <div style="text-align: center; padding: 25px; background: ${
        brandColors.neutralLight
      }; border-radius: 12px; margin: 30px 0;">
        <h3 style="color: ${
          brandColors.primary
        }; margin: 0 0 15px 0;">Welcome to Stayza Pro! 🏡</h3>
        <p style="margin: 0; color: ${
          brandColors.neutralDark
        }; font-size: 16px;">You're now part of a community of successful property managers. Let's make your first booking happen!</p>
      </div>
    `),
  }),

  realtorRejected: (businessName: string, reason: string) => ({
    subject: "Realtor Application Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Application Status Update</h2>
        <p>Hello ${businessName},</p>
        <p>We have reviewed your realtor application. Unfortunately, we cannot approve your account at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can reapply by updating your information and submitting a new application.</p>
        <p>If you have questions, please contact our support team.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  bookingConfirmation: (booking: any, property: any, realtor: any) => ({
    subject: `Booking Confirmed - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Booking Confirmed!</h2>
        <p>Your booking has been confirmed. Here are the details:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${property.title}</h3>
          <p><strong>Check-in:</strong> ${new Date(
            booking.checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Guests:</strong> ${booking.totalGuests}</p>
          <p><strong>Total Amount:</strong> ${booking.currency} ${
      booking.totalPrice
    }</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Property Details</h4>
          <p><strong>Address:</strong> ${property.address}, ${property.city}, ${
      property.country
    }</p>
          <p><strong>Host:</strong> ${realtor.businessName}</p>
          ${
            realtor.businessEmail
              ? `<p><strong>Contact:</strong> ${realtor.businessEmail}</p>`
              : ""
          }
        </div>

        <p><strong>Important Information:</strong></p>
        <ul>
          <li>Please arrive during check-in hours</li>
          <li>Contact the host if you have any questions</li>
          <li>Review the cancellation policy if plans change</li>
        </ul>

        <p>We hope you have a wonderful stay!</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  bookingCancellation: (
    booking: any,
    property: any,
    refundAmount?: number
  ) => ({
    subject: `Booking Cancelled - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Booking Cancelled</h2>
        <p>Your booking has been cancelled as requested.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${property.title}</h3>
          <p><strong>Check-in:</strong> ${new Date(
            booking.checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Original Amount:</strong> ${booking.currency} ${
      booking.totalPrice
    }</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>

        ${
          refundAmount
            ? `
          <div style="background-color: #d1fae5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #10b981;">Refund Information</h4>
            <p><strong>Refund Amount:</strong> ${booking.currency} ${refundAmount}</p>
            <p>Your refund will be processed within 5-10 business days to your original payment method.</p>
          </div>
        `
            : `
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>No refund applicable</strong> based on the cancellation policy and timing.</p>
          </div>
        `
        }

        <p>If you have any questions about this cancellation, please contact our support team.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  paymentReceipt: (booking: any, payment: any, property: any) => ({
    subject: `Payment Receipt - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Payment Receipt</h2>
        <p>Thank you for your payment. Here's your receipt:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Receipt ID:</strong> ${payment.id}</p>
          <p><strong>Amount Paid:</strong> ${payment.currency} ${
      payment.amount
    }</p>
          <p><strong>Payment Method:</strong> ${payment.method}</p>
          <p><strong>Payment Date:</strong> ${payment.createdAt.toLocaleDateString()}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Booking Information</h4>
          <p><strong>Property:</strong> ${property.title}</p>
          <p><strong>Check-in:</strong> ${new Date(
            booking.checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>

        <p>This receipt serves as confirmation of your payment.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  realtorPayout: (
    realtor: any,
    amount: number,
    currency: string,
    bookingId: string
  ) => ({
    subject: "Payout Processed - Booking Payment Released",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payout Processed</h2>
        <p>Hello ${realtor.businessName},</p>
        <p>Good news! A payout has been processed for one of your bookings.</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payout Details</h3>
          <p><strong>Amount:</strong> ${currency} ${amount}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Status:</strong> Completed</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>The funds have been transferred to your connected payment account.</p>
        <p>You can view all your payouts and earnings in your dashboard.</p>
        
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  refundProcessed: (
    booking: any,
    refundAmount: number,
    totalRefunded: number,
    remaining: number,
    reason: string
  ) => ({
    subject: `Refund ${remaining === 0 ? "Completed" : "Processed"} - Booking ${
      booking.id
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Refund ${
          remaining === 0 ? "Completed" : "Processed"
        }</h2>
        <p>Your refund request has been processed.</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> ${booking.id}</p>
          <p><strong>Refund Amount This Action:</strong> ${
            booking.currency
          } ${refundAmount}</p>
          <p><strong>Total Refunded So Far:</strong> ${
            booking.currency
          } ${totalRefunded}</p>
          <p><strong>Remaining Refundable Balance:</strong> ${
            booking.currency
          } ${remaining}</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>${
          remaining === 0
            ? "This booking has now been fully refunded."
            : "You may still be eligible for additional partial refunds subject to policy."
        }</p>
        <p>Funds should appear on your original payment method within 5-10 business days depending on your bank.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (
  to: string | string[],
  template: { subject: string; html: string },
  attachments?: any[]
) => {
  try {
    const mailOptions = {
      from: `"Property Booking Platform" <${config.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: template.subject,
      html: template.html,
      attachments: attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send welcome email
export const sendWelcomeEmail = async (to: string, name: string) => {
  const template = emailTemplates.welcome(name);
  return sendEmail(to, template);
};

// Send realtor welcome email
export const sendRealtorWelcomeEmail = async (
  to: string,
  name: string,
  businessName: string,
  dashboardUrl: string,
  verificationUrl?: string
) => {
  const template = emailTemplates.realtorWelcome(
    name,
    businessName,
    dashboardUrl,
    verificationUrl
  );
  return sendEmail(to, template);
};

// Send email verification
export const sendEmailVerification = async (
  to: string,
  name: string,
  verificationUrl: string
) => {
  const template = emailTemplates.emailVerification(name, verificationUrl);
  return sendEmail(to, template);
};

// Send password reset
export const sendPasswordReset = async (
  to: string,
  name: string,
  resetUrl: string
) => {
  const template = emailTemplates.passwordReset(name, resetUrl);
  return sendEmail(to, template);
};

// Send realtor approval
export const sendRealtorApproval = async (
  to: string,
  businessName: string,
  dashboardUrl: string
) => {
  const template = emailTemplates.realtorApproved(businessName, dashboardUrl);
  return sendEmail(to, template);
};

// Send realtor rejection
export const sendRealtorRejection = async (
  to: string,
  businessName: string,
  reason: string
) => {
  const template = emailTemplates.realtorRejected(businessName, reason);
  return sendEmail(to, template);
};

// Send booking confirmation
export const sendBookingConfirmation = async (
  to: string,
  booking: any,
  property: any,
  realtor: any
) => {
  const template = emailTemplates.bookingConfirmation(
    booking,
    property,
    realtor
  );
  return sendEmail(to, template);
};

// Send booking cancellation
export const sendBookingCancellation = async (
  to: string,
  booking: any,
  property: any,
  refundAmount?: number
) => {
  const template = emailTemplates.bookingCancellation(
    booking,
    property,
    refundAmount
  );
  return sendEmail(to, template);
};

// Send payment receipt
export const sendPaymentReceipt = async (
  to: string,
  booking: any,
  payment: any,
  property: any,
  pdfAttachment?: any
) => {
  const template = emailTemplates.paymentReceipt(booking, payment, property);
  return sendEmail(to, template, pdfAttachment ? [pdfAttachment] : undefined);
};

// Send realtor payout notification
export const sendRealtorPayout = async (
  to: string,
  realtor: any,
  amount: number,
  currency: string,
  bookingId: string
) => {
  const template = emailTemplates.realtorPayout(
    realtor,
    amount,
    currency,
    bookingId
  );
  return sendEmail(to, template);
};

// Send refund processed email
export const sendRefundProcessed = async (
  to: string,
  booking: any,
  refundAmount: number,
  totalRefunded: number,
  remaining: number,
  reason: string
) => {
  const template = emailTemplates.refundProcessed(
    booking,
    refundAmount,
    totalRefunded,
    remaining,
    reason
  );
  return sendEmail(to, template);
};
