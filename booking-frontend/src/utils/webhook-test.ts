/**
 * Webhook Testing Utilities
 *
 * Use these functions to test webhook functionality locally
 * before configuring production webhooks.
 */

import crypto from "crypto";

interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    paid_at?: string;
    customer?: {
      email: string;
      customer_code: string;
    };
    metadata?: any;
  };
}

interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    tx_ref: string;
    amount: number;
    status: string;
    created_at?: string;
    customer?: {
      email: string;
    };
    meta?: any;
  };
}

/**
 * Generate Paystack webhook signature
 * Used to verify webhook authenticity
 */
export function generatePaystackSignature(
  payload: PaystackWebhookPayload,
  secretKey: string
): string {
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(JSON.stringify(payload))
    .digest("hex");

  return hash;
}

/**
 * Test Paystack webhook locally
 *
 * @example
 * ```typescript
 * const result = await testPaystackWebhook('PAY-1234567890-ABC123');
 * 
 * ```
 */
export async function testPaystackWebhook(
  paymentReference: string,
  apiUrl: string = "http://localhost:5050"
): Promise<{ success: boolean; message: string; data?: any }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return {
      success: false,
      message: "PAYSTACK_SECRET_KEY not found in environment",
    };
  }

  // Simulate Paystack webhook payload
  const payload: PaystackWebhookPayload = {
    event: "charge.success",
    data: {
      reference: paymentReference,
      amount: 100000, // 1000 NGN in kobo
      status: "success",
      paid_at: new Date().toISOString(),
      customer: {
        email: "test@example.com",
        customer_code: "CUS_test123",
      },
      metadata: {
        test: true,
        source: "local_webhook_test",
      },
    },
  };

  // Generate signature
  const signature = generatePaystackSignature(payload, secretKey);

  
  
  

  try {
    const response = await fetch(`${apiUrl}/webhooks/paystack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": signature,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (response.ok) {
      return {
        success: true,
        message: "Webhook processed successfully",
        data,
      };
    } else {
      return {
        success: false,
        message: `Webhook failed: ${response.status} ${response.statusText}`,
        data,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Network error: ${error.message}`,
    };
  }
}

/**
 * Test Flutterwave webhook locally
 */
export async function testFlutterwaveWebhook(
  paymentReference: string,
  apiUrl: string = "http://localhost:5050"
): Promise<{ success: boolean; message: string; data?: any }> {
  const verifHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

  if (!verifHash) {
    return {
      success: false,
      message: "FLUTTERWAVE_WEBHOOK_HASH not found in environment",
    };
  }

  // Simulate Flutterwave webhook payload
  const payload: FlutterwaveWebhookPayload = {
    event: "charge.completed",
    data: {
      tx_ref: paymentReference,
      amount: 10000,
      status: "successful",
      created_at: new Date().toISOString(),
      customer: {
        email: "test@example.com",
      },
      meta: {
        test: true,
        source: "local_webhook_test",
      },
    },
  };

  
  

  try {
    const response = await fetch(`${apiUrl}/webhooks/flutterwave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "verif-hash": verifHash,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (response.ok) {
      return {
        success: true,
        message: "Webhook processed successfully",
        data,
      };
    } else {
      return {
        success: false,
        message: `Webhook failed: ${response.status} ${response.statusText}`,
        data,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Network error: ${error.message}`,
    };
  }
}

/**
 * Check payment status in database
 */
export async function checkPaymentStatus(
  reference: string,
  apiUrl: string = "http://localhost:5050",
  authToken?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${apiUrl}/payments/verify-by-reference?reference=${reference}`,
      { headers }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: "Payment status retrieved",
        data,
      };
    } else {
      return {
        success: false,
        message: data.message || "Failed to retrieve payment status",
        data,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Network error: ${error.message}`,
    };
  }
}

/**
 * Complete webhook test workflow
 *
 * @example
 * ```typescript
 * // In a Next.js API route or script
 * const result = await testWebhookFlow('PAY-1234567890-ABC123', 'paystack');
 * ```
 */
export async function testWebhookFlow(
  paymentReference: string,
  provider: "paystack" | "flutterwave",
  apiUrl: string = "http://localhost:5050",
  authToken?: string
): Promise<void> {
  

  // Step 1: Check initial status
  
  const initialStatus = await checkPaymentStatus(
    paymentReference,
    apiUrl,
    authToken
  );

  if (!initialStatus.success) {
    
    return;
  }

  
  

  // Step 2: Send webhook
  
  const webhookResult =
    provider === "paystack"
      ? await testPaystackWebhook(paymentReference, apiUrl)
      : await testFlutterwaveWebhook(paymentReference, apiUrl);

  if (!webhookResult.success) {
    
    
    return;
  }

  
  

  // Step 3: Wait a bit for processing
  
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 4: Check updated status
  
  const updatedStatus = await checkPaymentStatus(
    paymentReference,
    apiUrl,
    authToken
  );

  if (!updatedStatus.success) {
    
    return;
  }

  const finalPaymentStatus = updatedStatus.data?.data?.status;
  const finalBookingStatus = updatedStatus.data?.data?.booking?.status;

  
  
  

  // Step 5: Summary
  if (finalPaymentStatus === "HELD" && finalBookingStatus === "CONFIRMED") {
    
  } else {
    
    
  }
}

// Example usage in a script or API route:
/*
import { testWebhookFlow } from '@/utils/webhook-test';

async function runTest() {
  // Replace with actual payment reference from your test
  await testWebhookFlow('PAY-1234567890-ABC123', 'paystack');
}

runTest();
*/
