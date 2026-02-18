// Email Service using Resend
import { Resend } from "resend";

// Lazy-init so that the build doesn't crash when RESEND_API_KEY is absent
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendOtpEmail(to: string, otp: string) {
  try {
    await getResend().emails.send({
      from: "IndiaNext <onboarding@resend.dev>", // Use your verified domain
      to,
      subject: "Your Verification Code - IndiaNext",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IndiaNext</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Hackathon Registration</p>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Your Verification Code</h2>
                <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                  Use the following code to verify your email address and complete your registration:
                </p>
                
                <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                  <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                    ${otp}
                  </div>
                </div>
                
                <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
                  This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                </p>
                
                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; margin: 0; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} IndiaNext. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendStatusUpdateEmail(
  to: string,
  teamName: string,
  status: string,
  notes?: string
) {
  const statusColors: Record<string, string> = {
    APPROVED: "#10b981",
    REJECTED: "#ef4444",
    WAITLISTED: "#f59e0b",
    UNDER_REVIEW: "#3b82f6",
  };

  const statusMessages: Record<string, string> = {
    APPROVED: "Congratulations! Your team has been approved.",
    REJECTED: "Unfortunately, your team was not selected this time.",
    WAITLISTED: "Your team has been placed on the waitlist.",
    UNDER_REVIEW: "Your team is currently under review.",
  };

  try {
    await getResend().emails.send({
      from: "IndiaNext <onboarding@resend.dev>",
      to,
      subject: `Team Status Update - ${teamName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 28px;">Status Update</h1>
                
                <div style="background: ${statusColors[status] || "#6b7280"}; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin: 0; font-size: 20px;">${teamName}</h2>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">${statusMessages[status]}</p>
                </div>
                
                ${notes ? `
                  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">Review Notes:</h3>
                    <p style="margin: 0; color: #6b7280; line-height: 1.6;">${notes}</p>
                  </div>
                ` : ""}
                
                <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px;">
                  If you have any questions, please contact us at support@indianext.in
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send status update email:", error);
    throw new Error("Failed to send email");
  }
}
