import swaggerJsdoc from "swagger-jsdoc";
import { SwaggerUiOptions } from "swagger-ui-express";
import { config } from "@/config";

const definition: swaggerJsdoc.OAS3Definition = {
  openapi: "3.0.0",
  info: {
    title: "Booking System API",
    version: "1.0.0",
    description:
      "A comprehensive booking system API with authentication, property management, bookings, payments, and reviews",
    contact: {
      name: "API Support",
      email: "support@bookingsystem.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url:
        config.NODE_ENV === "production"
          ? "https://api.yoursite.com"
          : `http://localhost:${config.PORT}`,
      description:
        config.NODE_ENV === "production"
          ? "Production server"
          : "Development server",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "User authentication and authorization endpoints",
    },
    {
      name: "Properties",
      description: "Property management endpoints",
    },
    {
      name: "Bookings",
      description: "Booking management and availability endpoints",
    },
    {
      name: "Payments",
      description: "Payment processing with Stripe and Paystack",
    },
    {
      name: "Reviews",
      description: "Review and rating system endpoints",
    },
    {
      name: "Realtors",
      description: "Realtor onboarding and branding endpoints",
    },
    {
      name: "Admin",
      description: "Platform administration endpoints",
    },
    {
      name: "Webhooks",
      description: "Incoming webhook handlers",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            description: "Error message",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                  description: "Field that caused the error",
                },
                message: {
                  type: "string",
                  description: "Specific error message for the field",
                },
              },
            },
            description: "Detailed validation errors (if applicable)",
          },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            description: "Success message",
          },
          data: {
            type: "object",
            description: "Response data",
          },
        },
      },
    },
  },
};

const swaggerOptions: swaggerJsdoc.Options = {
  definition,
  apis: [
    "./src/routes/**/*.ts",
    "./src/controllers/**/*.ts",
    "./dist/routes/**/*.js",
    "./dist/controllers/**/*.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerUiOptions: SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
  customSiteTitle: "Booking System API Documentation",
  customCss: `
    .swagger-ui .topbar {
      background-color: #1f2937;
    }
    .swagger-ui .topbar .download-url-wrapper .download-url-button {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
  `,
};
