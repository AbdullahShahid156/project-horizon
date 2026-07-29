import asyncio
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    reply_to: str | None = None,
) -> dict:
    """Send an email via Gmail SMTP (non-blocking).

    Returns a status dict.
    """
    if not settings.EMAIL_ENABLED:
        logger.info("Email disabled — skipping send to %s", to)
        return {"status": "skipped", "detail": "Email sending is disabled"}

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured — cannot send email to %s", to)
        return {"status": "error", "detail": "SMTP credentials not configured"}

    recipients = [to] if isinstance(to, str) else to

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USERNAME
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.attach(MIMEText(html, "html"))

    def _send_sync():
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USERNAME, recipients, msg.as_string())

    try:
        await asyncio.get_event_loop().run_in_executor(None, _send_sync)
        logger.info("Email sent to %s — subject: %s", recipients, subject)
        return {"status": "sent"}
    except Exception as e:
        logger.error("Failed to send email to %s: %s", recipients, e)
        return {"status": "error", "detail": str(e)}


def build_invitation_email(
    org_name: str,
    invitee_email: str,
    sender_name: str = "BuilderWeb Team",
    accept_url: str = "#",
) -> tuple[str, str]:
    """Build the subject and HTML for an org invitation email."""
    subject = f"You've been invited to join {org_name} on BuilderWeb"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 32px; text-align: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">You're Invited!</h1>
      </div>
      <div style="padding: 32px 0;">
        <p style="font-size: 16px; color: #333;">Hi {invitee_email},</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <strong>{sender_name}</strong> has invited you to join <strong>{org_name}</strong> on BuilderWeb —
          an AI-powered platform for building and optimizing business websites.
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          Click the button below to accept the invitation and get started:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{accept_url}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-weight: 600; font-size: 15px;
                    display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 13px; color: #999; margin-top: 24px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
      <div style="border-top: 1px solid #eee; padding-top: 16px; text-align: center;">
        <p style="font-size: 12px; color: #aaa;">BuilderWeb — AI Business Website Builder</p>
      </div>
    </div>
    """
    return subject, html


def build_acceptance_notification_email(
    org_name: str,
    invitee_email: str,
    inviter_name: str = "BuilderWeb Team",
) -> tuple[str, str]:
    """Build notification email sent to inviter when someone accepts."""
    subject = f"{invitee_email} accepted your invitation to {org_name}"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 12px; padding: 32px; text-align: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">Member Joined!</h1>
      </div>
      <div style="padding: 32px 0;">
        <p style="font-size: 16px; color: #333;">Hi {inviter_name},</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <strong>{invitee_email}</strong> has accepted your invitation and joined <strong>{org_name}</strong>.
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          They now have access to the organization and can start collaborating with your team.
        </p>
      </div>
      <div style="border-top: 1px solid #eee; padding-top: 16px; text-align: center;">
        <p style="font-size: 12px; color: #aaa;">BuilderWeb — AI Business Website Builder</p>
      </div>
    </div>
    """
    return subject, html
