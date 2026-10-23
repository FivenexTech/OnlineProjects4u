
import { env } from '../config/env.js'
import { AppError } from '../middleware/errors.js'
import { Resend } from 'resend'

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  )
}

export async function sendVerificationOtp(
  email: string,
  code: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new AppError(
      503,
      'Email verification is not configured',
      'EMAIL_DELIVERY_NOT_CONFIGURED',
    )
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: `OnlineProjects4U <${env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'Your OnlineProjects4U verification code',

      html: `
        <div style="background:#f5f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#172033">
          <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e9f2;border-radius:12px;padding:32px">
            <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#667085">
              OnlineProjects4U
            </p>
            <h1 style="font-size:26px;margin:20px 0 12px">
              Verify your email
            </h1>
            <p style="font-size:16px;line-height:1.6">
              Use the verification code below to continue securely.
            </p>
            <p style="font-size:32px;letter-spacing:.22em;font-weight:700;margin:28px 0;color:#3155d4">
              ${escapeHtml(code)}
            </p>
            <p style="font-size:13px;line-height:1.6;color:#667085">
              This code expires in 10 minutes and can only be used once.
              If you did not request it, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,

      text: `Verify your OnlineProjects4U email

Your verification code is ${code}.

This code expires in 10 minutes and can only be used once.
If you did not request it, you can safely ignore this email.`,
    })

    if (error) {
      // Log only the provider's error message, never the API key or OTP.
      console.error('[Email OTP] Resend rejected the email:', {
        message: error.message,
      })

      throw new Error(error.message)
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    console.error('[Email OTP] Resend delivery failed:', {
      message:
        error instanceof Error
          ? error.message
          : 'Unknown email delivery error',
      name: error instanceof Error ? error.name : 'UnknownError',
    })

    throw new AppError(
      502,
      'Email verification could not be sent',
      'EMAIL_DELIVERY_FAILED',
    )
  }
}
