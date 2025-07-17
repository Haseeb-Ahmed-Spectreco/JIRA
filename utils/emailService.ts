import nodemailer from "nodemailer";
import { prisma } from "@/server/db";
import { type Issue } from "@prisma/client";



export const sendIssueUpdate = async (
  issue: Issue, // Pass the full issue object
  oldStatus: string, 
  newStatus: string, 
  updatedByUserId: string
) => {
  try {
    // Get the reporter's email (the person who should be notified)
    const reporterData = await prisma.defaultUser.findUnique({
      where: { id: issue.reporterId }, // Use reporterId, not userId
      select: { 
        email: true,
        name: true
      }
    });

    if (!reporterData?.email) {
      console.warn(`No email found for reporter ${issue.reporterId}`);
      return;
    }

    // Get the name of the person who updated the issue
    const updatedByData = await prisma.defaultUser.findUnique({
      where: { id: updatedByUserId },
      select: { 
        name:true,
        email: true 
      }
    });

    const updatedByName = updatedByData?.name
      ? `${updatedByData?.name}` : 'User';

    console.log("Reporter email:", reporterData.email);
    console.log("SMTP Config:", {
      username: process.env.SMTP_USERNAME,
      hasPassword: !!process.env.SMTP_PASSWORD
    });

    // Create transporter with better configuration
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      // Additional configuration for better reliability
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
      debug: true, // Enable debug for troubleshooting
    });

    // Verify connection before sending
    await transporter.verify();
    console.log("✅ SMTP connection verified");

    // Create professional email content
    const mailOptions = {
      from: {
        name: "Spectreco Customer Support",
        address: "admin@spectreco.com"
      },
      to: reporterData.email, // Use the actual reporter's email
      subject: `[${issue.key}] Status updated to ${newStatus.replace('_', ' ')}`,
      text: generateTextEmail(issue, oldStatus, newStatus, updatedByName),
      html: generateHtmlEmail(issue, oldStatus, newStatus, updatedByName),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Sent to:", reporterData.email);

    // Close connection
    transporter.close();

  } catch (error) {
    console.error("❌ Error sending email:", error);
    
    // Provide helpful error messages
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      const errorMessage = (error as { message: string }).message;
      if (errorMessage.includes('Invalid login')) {
        console.error("Authentication failed. Check SMTP_USERNAME and SMTP_PASSWORD");
      } else if (errorMessage.includes('Connection timeout')) {
        console.error("Connection timeout. Check SMTP server settings");
      }
    }
    
    // Don't throw - we don't want email failures to break the API
    // throw error; // Uncomment if you want to handle errors in calling code
  }
};

// Helper function to generate plain text email
function generateTextEmail(
  issue: Issue, 
  oldStatus: string, 
  newStatus: string, 
  updatedByName: string
): string {
  return `
Issue Status Update

Hello,

The status of your issue has been updated:

Issue: ${issue.key} - ${issue.name}
Type: ${issue.type}
Status Change: ${oldStatus} → ${newStatus}
Updated by: ${updatedByName}

You can view the full issue details at: ${process.env.NEXT_PUBLIC_APP_URL ?? " https://jira.com"}/issues/${issue.id}

Best regards,
Project Management Team
  `.trim();
}
// Helper function to generate HTML email
function generateHtmlEmail(issue: Issue, oldStatus: string, newStatus: string, updatedByName: string): string {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "#6c757d"
      case "IN_PROGRESS":
        return "#fd7e14"
      case "DONE":
        return "#198754"
      case "BLOCKED":
        return "#dc3545"
      case "REVIEW":
        return "#6f42c1"
      default:
        return "#6c757d"
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "#f8f9fa"
      case "IN_PROGRESS":
        return "#fff3cd"
      case "DONE":
        return "#d1e7dd"
      case "BLOCKED":
        return "#f8d7da"
      case "REVIEW":
        return "#e2d9f3"
      default:
        return "#f8f9fa"
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "TODO":
        return "📋"
      case "IN_PROGRESS":
        return "⚡"
      case "DONE":
        return "✅"
      case "BLOCKED":
        return "🚫"
      case "REVIEW":
        return "👀"
      default:
        return "📌"
    }
  }

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "BUG":
        return "🐛"
      case "STORY":
        return "📖"
      case "TASK":
        return "📝"
      case "EPIC":
        return "🎯"
      case "SUBTASK":
        return "📋"
      default:
        return "📌"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "BUG":
        return "#dc3545"
      case "STORY":
        return "#0d6efd"
      case "TASK":
        return "#198754"
      case "EPIC":
        return "#6f42c1"
      case "SUBTASK":
        return "#fd7e14"
      default:
        return "#6c757d"
    }
  }

  const formatStatusLabel = (status: string) => {
    return status
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Issue Status Update - ${issue.key}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa;">
      
      <!-- Email Container -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; padding: 20px 0;">
        <tr>
          <td align="center">
            
            <!-- Main Content Card -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                    🔄 Issue Status Updated
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    ${currentDate}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  
                  <!-- Issue Header -->
                  <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #e9ecef;">
                    <div style="margin-bottom: 15px;">
                      <span style="background: ${getTypeColor(issue.type)}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 10px;">
                        ${getTypeEmoji(issue.type)} ${issue.type}
                      </span>
                      <span style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; background: #e9ecef; color: #495057; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                        ${issue.key}
                      </span>
                    </div>
                    
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #2c3e50; line-height: 1.3;">
                      ${issue.name}
                    </h2>
                  </div>
                  
                  <!-- Status Transition - Enhanced Visual -->
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 1px solid #dee2e6;">
                    <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #495057;">
                      Status Transition
                    </h3>
                    
                    <!-- Mobile-friendly status transition -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; vertical-align: middle; width: 40%;">
                          <!-- Old Status -->
                          <div style="margin-bottom: 10px;">
                            <div style="background: ${getStatusBgColor(oldStatus)}; border: 2px solid ${getStatusColor(oldStatus)}; color: ${getStatusColor(oldStatus)}; padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px;">
                              ${getStatusEmoji(oldStatus)} ${formatStatusLabel(oldStatus)}
                            </div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
                              Previous Status
                            </p>
                          </div>
                        </td>
                        
                        <td style="text-align: center; vertical-align: middle; width: 20%;">
                          <!-- Arrow -->
                          <div style="color: #667eea; font-size: 28px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                            →
                          </div>
                        </td>
                        
                        <td style="text-align: center; vertical-align: middle; width: 40%;">
                          <!-- New Status -->
                          <div style="margin-bottom: 10px;">
                            <div style="background: ${getStatusColor(newStatus)}; color: white; padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; box-shadow: 0 3px 12px rgba(0,0,0,0.15); transform: scale(1.05);">
                              ${getStatusEmoji(newStatus)} ${formatStatusLabel(newStatus)}
                            </div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
                              Current Status
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Update Information -->
                  <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; font-size: 14px; color: #1565c0; font-weight: 500;">
                      <span style="font-weight: 600;">Updated by:</span> ${updatedByName}
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #1976d2;">
                      This change was made to keep the project moving forward
                    </p>
                  </div>
                  
                  <!-- Action Buttons -->
                  <div style="text-align: center; margin: 30px 0 20px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 10px 15px 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://jira.com"}/issues/${issue.id}"
                             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); text-align: center; min-width: 140px;">
                            📋 View Details
                          </a>
                        </td>
                        
                      </tr>
                    </table>
                  </div>
                  
                  
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #6c757d;">
                    🤖 This is an automated notification from Spectreco Customer Support
                  </p>

                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `
}
// Alternative version with simpler HTML if you prefer
export const sendIssueUpdateSimple = async (
  issue: Issue,
  oldStatus: string,
  newStatus: string,
  updatedByUserId: string
) => {
  try {
    // Get reporter's email
    const reporterData = await prisma.defaultUser.findUnique({
      where: { id: issue.reporterId },
      select: { email: true }
    });

    if (!reporterData?.email) {
      console.warn(`No email found for reporter ${issue.reporterId}`);
      return;
    }

    // Get updater's name
    const updatedByData = await prisma.defaultUser.findUnique({
      where: { id: updatedByUserId },
      select: { name: true, email: true }
    });

    const updatedByName = updatedByData?.name 
      ? `${updatedByData?.name }`
      : 'User';

    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "admin@spectreco.com",
      to: reporterData.email,
      subject: `Issue ${issue.key} Status Updated`,
      html: `
        <h2>Issue Status Update</h2>
        <p><strong>Issue:</strong> ${issue.key} - ${issue.name}</p>
        <p><strong>Status Changed:</strong> ${oldStatus} → ${newStatus}</p>
        <p><strong>Updated by:</strong> ${updatedByName}</p>
        <p><strong>Type:</strong> ${issue.type}</p>
        <hr>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://jira.com"}/issues/${issue.id}">View Issue Details</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", reporterData.email);

  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};