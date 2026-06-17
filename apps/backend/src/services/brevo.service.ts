import dotenv from 'dotenv'
import { prisma } from '../lib/prisma'
dotenv.config()

export class BrevoService {
  private static getApiKey(): string {
    if (process.env.NODE_ENV === 'test') {
      return ''
    }
    return process.env.BREVO_API_KEY || ''
  }

  private static getSender(): { email: string; name: string } {
    return {
      email: process.env.BREVO_SENDER || 'no-reply@toycabin.com',
      name: 'Toy Cabin'
    }
  }

  /**
   * Send transactional OTP code to user's email via Brevo REST API
   * @param to Recipient email
   * @param otp 6-digit OTP code
   */
  public static async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      console.warn('[BrevoService] Warning: BREVO_API_KEY is not defined. Logging OTP to console instead.')
      console.log(`[BrevoService] SIMULATED EMAIL to <${to}>: Your Toy Cabin verification OTP code is [${otp}]`)
      return true // Return true as simulation
    }

    const sender = this.getSender()
    const url = 'https://api.brevo.com/v3/smtp/email'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject: 'Your Toy Cabin OTP Verification Code',
          htmlContent: `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px;">🧸</span>
                <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
              </div>
              <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Verify Your Account</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #767685;">Please use the following 6-digit verification code to complete your request. This code is valid for 5 minutes.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #FF5C4D; padding: 12px 24px; border: 2px dashed #E7E4DC; border-radius: 8px; background-color: #F7F5F0;">${otp}</span>
                </div>
                <p style="font-size: 12px; line-height: 1.5; color: #767685;">If you did not make this request, you can safely ignore this email.</p>
              </div>
              <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
                <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
                <p>Handcrafted wooden toys made from sustainable, organic materials.</p>
              </div>
            </div>
          `
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[BrevoService] Failed to send email via Brevo. Status: ${response.status}. Error: ${errorText}`)
        return false
      }

      console.log(`[BrevoService] Success: OTP email sent to <${to}>`)
      return true
    } catch (error) {
      console.error('[BrevoService] Error calling Brevo API:', error)
      return false
    }
  }

  /**
   * Send an email notification when a support ticket gets a reply
   * @param to Recipient email
   * @param ticketSubject The subject of the support ticket
   * @param senderRole The role of the responder (e.g., 'Customer' or 'Support Agent')
   * @param messageContent The message content that was posted
   */
  public static async sendTicketNotification(
    to: string,
    ticketSubject: string,
    senderRole: string,
    messageContent: string
  ): Promise<boolean> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      console.warn('[BrevoService] Warning: BREVO_API_KEY is not defined. Logging ticket notification to console instead.')
      console.log(`[BrevoService] SIMULATED EMAIL to <${to}>: Support Ticket Update on "${ticketSubject}". ${senderRole} says: "${messageContent}"`)
      return true
    }

    const sender = this.getSender()
    const url = 'https://api.brevo.com/v3/smtp/email'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject: `Support Ticket Update: ${ticketSubject}`,
          htmlContent: `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px;">🧸</span>
                <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
              </div>
              <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">New Support Message</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #767685;">You have received a new reply regarding your support ticket <strong>"${ticketSubject}"</strong>.</p>
                <div style="background-color: #F7F5F0; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FF5C4D;">
                  <p style="font-size: 12px; margin: 0 0 8px 0; color: #767685; text-transform: uppercase; letter-spacing: 0.5px;"><strong>${senderRole}</strong> replied:</p>
                  <p style="font-size: 14px; margin: 0; color: #20212B; white-space: pre-wrap;">${messageContent}</p>
                </div>
                <p style="font-size: 12px; line-height: 1.5; color: #767685;">To view the entire ticket thread or send a reply, please visit the Support area in your account dashboard.</p>
              </div>
              <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
                <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
              </div>
            </div>
          `
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[BrevoService] Failed to send ticket notification via Brevo. Status: ${response.status}. Error: ${errorText}`)
        return false
      }

      console.log(`[BrevoService] Success: Ticket notification email sent to <${to}>`)
      return true
    } catch (error) {
      console.error('[BrevoService] Error calling Brevo API for ticket notification:', error)
      return false
    }
  }

  /**
   * Helper: Check if email notifications are enabled for the user
   */
  private static async isEmailEnabled(userId: string): Promise<boolean> {
    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'email'
          }
        }
      })
      return pref ? pref.isEnabled : true // Defaults to true if no preference is saved
    } catch (error) {
      console.error(`[BrevoService] Error checking email preference for user ${userId}:`, error)
      return true // Default to true on error to avoid blocking
    }
  }

  /**
   * Helper: General transactional email sender that verifies preferences first
   */
  private static async sendEmail(
    userId: string,
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<boolean> {
    // 1. Check preferences first
    const isEnabled = await this.isEmailEnabled(userId)
    if (!isEnabled) {
      console.log(`[BrevoService] Email notifications are disabled for user <${userId}>. Skipping email to <${to}> with subject: "${subject}"`)
      return true
    }

    const apiKey = this.getApiKey()
    if (!apiKey) {
      console.warn('[BrevoService] Warning: BREVO_API_KEY is not defined. Logging email payload to console instead.')
      console.log(`[BrevoService] SIMULATED EMAIL to <${to}>: "${subject}"`)
      return true
    }

    const sender = this.getSender()
    const url = 'https://api.brevo.com/v3/smtp/email'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[BrevoService] Failed to send email via Brevo. Status: ${response.status}. Error: ${errorText}`)
        return false
      }

      console.log(`[BrevoService] Success: Email sent to <${to}> with subject: "${subject}"`)
      return true
    } catch (error) {
      console.error('[BrevoService] Error calling Brevo API:', error)
      return false
    }
  }

  /**
   * SMS Stubs - Called when SMS notifications are requested
   */
  public static async sendSmsNotification(userId: string, toPhone: string, message: string): Promise<boolean> {
    console.log(`[BrevoService] [SMS TODO STUB] To user ${userId} (${toPhone}): "${message}"`)
    // NOTE: SMS notifications are stubs because the SMS gateway was not set up in the current phase env configurations.
    return true
  }

  /**
   * WhatsApp Stubs - Called when WhatsApp notifications are requested
   */
  public static async sendWhatsAppNotification(userId: string, toPhone: string, message: string): Promise<boolean> {
    console.log(`[BrevoService] [WhatsApp TODO STUB] To user ${userId} (${toPhone}): "${message}"`)
    // NOTE: WhatsApp notifications are stubs because the WhatsApp channel was not set up in the current phase env configurations.
    return true
  }

  // --- Order Lifecycle Templates ---

  public static async sendOrderPlacedEmail(userId: string, to: string, order: any): Promise<boolean> {
    const itemsHtml = (order.items || []).map((item: any) => {
      const title = item.titleSnapshot || item.productVariant?.product?.title || 'Wooden Toy'
      return `<li style="font-size: 14px; margin-bottom: 8px; color: #20212B;">${title} x ${item.quantity} - $${((item.priceSnapshot * item.quantity) / 100).toFixed(2)}</li>`
    }).join('')

    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Order Placed Successfully!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">Thank you for your purchase. Your order has been registered and is pending confirmation.</p>
          
          <div style="margin: 24px 0; border-top: 1px solid #E7E4DC; pt: 16px;">
            <p style="font-size: 12px; color: #767685; text-transform: uppercase;"><strong>Order Reference:</strong> #${order.id}</p>
            <ul style="padding-left: 20px; margin: 12px 0;">
              ${itemsHtml}
            </ul>
            <p style="font-size: 14px; margin: 8px 0 0 0; color: #FF5C4D;"><strong>Total: $${(order.total / 100).toFixed(2)}</strong></p>
          </div>
          
          <p style="font-size: 12px; line-height: 1.5; color: #767685;">We will send you another email as soon as the cabin team confirms your items.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Order Placed successfully: #${order.id}`, htmlContent)
  }

  public static async sendOrderConfirmedEmail(userId: string, to: string, order: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Your Order is Confirmed!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">Great news! The team has verified and confirmed your order <strong>#${order.id}</strong>. We are packing your organic wooden toys now.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Your Order #${order.id} is Confirmed!`, htmlContent)
  }

  public static async sendOrderShippedEmail(userId: string, to: string, order: any, shipment: any): Promise<boolean> {
    const courier = shipment?.courier || 'our partner courier'
    const awb = shipment?.awb || ''
    const trackingUrl = shipment?.trackingUrl || '#'

    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Your Order has Shipped!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">Your parcel for order <strong>#${order.id}</strong> is on its way!</p>
          
          <div style="background-color: #F7F5F0; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FF5C4D;">
            <p style="font-size: 12px; margin: 0 0 4px 0; color: #767685;"><strong>Courier Partner:</strong> ${courier}</p>
            ${awb ? `<p style="font-size: 12px; margin: 0 0 12px 0; color: #767685;"><strong>AWB Tracking Code:</strong> ${awb}</p>` : ''}
            <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #FF5C4D; color: #FFFFFF; font-family: 'Sora', sans-serif; font-size: 12px; font-weight: bold; padding: 10px 18px; border-radius: 6px; text-decoration: none; text-transform: uppercase;">Track Package</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    // Trigger SMS/WhatsApp stubs
    if (order.user?.phone || order.phone) {
      const phone = order.user?.phone || order.phone
      this.sendSmsNotification(userId, phone, `Your Toy Cabin order #${order.id} has been shipped via ${courier}. Track it here: ${trackingUrl}`).catch(() => {})
      this.sendWhatsAppNotification(userId, phone, `Your Toy Cabin order #${order.id} has been shipped via ${courier}. Track it here: ${trackingUrl}`).catch(() => {})
    }

    return this.sendEmail(userId, to, `Your Order #${order.id} has been Shipped!`, htmlContent)
  }

  public static async sendOrderDeliveredEmail(userId: string, to: string, order: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Order Delivered!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">Your wooden toys package for order <strong>#${order.id}</strong> has been successfully delivered. We hope your little ones enjoy playing with them!</p>
          <p style="font-size: 12px; line-height: 1.5; color: #767685; margin-top: 20px;">If you love our organic toys, please leave us a rating and review on the product shop page.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    // Trigger SMS/WhatsApp stubs
    if (order.user?.phone || order.phone) {
      const phone = order.user?.phone || order.phone
      this.sendSmsNotification(userId, phone, `Your Toy Cabin order #${order.id} has been delivered successfully!`).catch(() => {})
      this.sendWhatsAppNotification(userId, phone, `Your Toy Cabin order #${order.id} has been delivered successfully!`).catch(() => {})
    }

    return this.sendEmail(userId, to, `Your Order #${order.id} has been Delivered!`, htmlContent)
  }

  public static async sendOrderCancelledEmail(userId: string, to: string, order: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Order Cancelled</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">Your order <strong>#${order.id}</strong> has been cancelled. Any pre-payments will be refunded back to your source account within 5-7 business days.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Your Order #${order.id} has been Cancelled`, htmlContent)
  }

  // --- Return Lifecycle Templates ---

  public static async sendReturnRequestedEmail(userId: string, to: string, returnRequest: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Return Request Logged</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">We have received your return request for order <strong>#${returnRequest.orderId}</strong>. Our support cabin team is inspecting your request details.</p>
          <div style="margin-top: 20px; border-top: 1px solid #E7E4DC; padding-top: 12px; font-size: 13px;">
            <p><strong>Reason specified:</strong> "${returnRequest.reason}"</p>
            <p><strong>Estimated Refund:</strong> $${(returnRequest.refundAmount / 100).toFixed(2)}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Return Request Logged for Order #${returnRequest.orderId}`, htmlContent)
  }

  public static async sendReturnApprovedEmail(userId: string, to: string, returnRequest: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Return Request Approved!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">Good news! Your return request for order <strong>#${returnRequest.orderId}</strong> has been approved. We will schedule packaging pickup and issue your refund once restocked.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Return Request Approved for Order #${returnRequest.orderId}`, htmlContent)
  }

  public static async sendReturnRejectedEmail(userId: string, to: string, returnRequest: any, reason: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Return Request Update: Rejected</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">We regret to inform you that your return request for order <strong>#${returnRequest.orderId}</strong> has been rejected by the administrator panel.</p>
          <div style="background-color: #FF5C4D/5; border-left: 4px solid #FF5C4D; padding: 12px; margin-top: 20px; font-size: 13px;">
            <p style="margin: 0; color: #20212B;"><strong>Rejection Reason:</strong> ${reason}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Return Request Update: Rejected for Order #${returnRequest.orderId}`, htmlContent)
  }

  public static async sendReturnRefundedEmail(userId: string, to: string, returnRequest: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🧸</span>
          <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
        </div>
        <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC;">
          <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Refund Processed!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #767685;">We have successfully processed your refund of <strong>$${(returnRequest.refundAmount / 100).toFixed(2)}</strong> for order <strong>#${returnRequest.orderId}</strong>. It should reflect in your source account within 5-7 business days.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
          <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        </div>
      </div>
    `
    return this.sendEmail(userId, to, `Refund Processed for Order #${returnRequest.orderId}`, htmlContent)
  }

  /**
   * Send an invitation email to a sub-admin with a password setup link
   */
  public static async sendInviteEmail(to: string, inviteToken: string): Promise<boolean> {
    const apiKey = this.getApiKey()
    const adminUrl = process.env.ADMIN_APP_URL || 'http://localhost:5174'
    const inviteLink = `${adminUrl}/admin/set-password?token=${inviteToken}`

    if (!apiKey || apiKey === 'dummy-brevo-api-key') {
      console.warn('[BrevoService] Warning: BREVO_API_KEY is dummy or not defined. Logging invite link to console.')
      console.log(`[BrevoService] SIMULATED EMAIL to <${to}>: Invite to Toy Cabin Staff. Link: ${inviteLink}`)
      return true
    }

    const sender = this.getSender()
    const url = 'https://api.brevo.com/v3/smtp/email'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject: 'Welcome to Toy Cabin - Set Up Your Staff Account',
          htmlContent: `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E4DC; border-radius: 14px; background-color: #F7F5F0; color: #20212B;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px;">🧸</span>
                <h2 style="font-family: 'Sora', sans-serif; color: #FF5C4D; margin: 8px 0 0 0;">Toy Cabin</h2>
              </div>
              <div style="background-color: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E7E4DC; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <h3 style="font-family: 'Sora', sans-serif; margin-top: 0; color: #2F2F4A;">Staff Invitation</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #767685;">You have been invited to join the Toy Cabin administration team as a staff member.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteLink}" style="display: inline-block; background-color: #FF5C4D; color: #FFFFFF; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Set Up Your Password</a>
                </div>
                <p style="font-size: 12px; line-height: 1.5; color: #767685;">This link will expire in 24 hours. If you did not expect this invitation, you can ignore this email.</p>
              </div>
              <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #767685;">
                <p>&copy; ${new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
              </div>
            </div>
          `
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[BrevoService] Failed to send invite email. Status: ${response.status}. Error: ${errorText}`)
        return false
      }

      console.log(`[BrevoService] Success: Invite email sent to <${to}>`)
      return true
    } catch (error) {
      console.error('[BrevoService] Error calling Brevo API for invite:', error)
      return false
    }
  }
}
