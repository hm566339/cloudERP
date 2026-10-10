package com.erp.auth_service.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@AllArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(String to, String url) {

        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Verify Your Email Address");

            String content = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Email Verification</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
                
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
                        <tr>
                            <td align="center">

                                <table width="600" cellpadding="0" cellspacing="0"
                                       style="background:#ffffff;border-radius:12px;overflow:hidden;
                                       box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                                    <tr>
                                        <td align="center"
                                            style="background:#2563eb;padding:24px;color:#ffffff;
                                            font-size:24px;font-weight:bold;">
                                            SSO Verification
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:32px;color:#333333;font-size:16px;line-height:1.6;">

                                            <p style="margin:0 0 16px;">Dear User,</p>

                                            <p style="margin:0 0 16px;">
                                                We received a request to verify your email address.
                                            </p>

                                            <p style="margin:0 0 24px;">
                                                Please click the button below to complete verification.
                                            </p>

                                            <table cellpadding="0" cellspacing="0" align="center">
                                                <tr>
                                                    <td align="center"
                                                        style="background:#2563eb;border-radius:8px;">
                                                        <a href="%s"
                                                           style="display:inline-block;
                                                           padding:14px 28px;
                                                           color:#ffffff;
                                                           text-decoration:none;
                                                           font-weight:bold;
                                                           font-size:16px;">
                                                            Verify Email
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin:28px 0 16px;color:#666666;font-size:14px;">
                                                If you did not request this verification,
                                                you can safely ignore this email.
                                            </p>

                                            <p style="margin:0;color:#666666;font-size:14px;">
                                                For security reasons, do not share this email.
                                            </p>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center"
                                            style="background:#f8fafc;padding:18px;
                                            color:#94a3b8;font-size:12px;">
                                            © 2026 SSO Team. All rights reserved.
                                        </td>
                                    </tr>

                                </table>

                            </td>
                        </tr>
                    </table>

                </body>
                </html>
                """.formatted(url);

            helper.setText(content, true);

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendOtpEmail(String to, String url) {

        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Reset Your Password");

            String content = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Password Reset</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">

                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
                        <tr>
                            <td align="center">

                                <table width="600" cellpadding="0" cellspacing="0"
                                       style="background:#ffffff;border-radius:12px;
                                       overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                                    <tr>
                                        <td align="center"
                                            style="background:#dc2626;padding:24px;
                                            color:#ffffff;font-size:24px;font-weight:bold;">
                                            Password Reset
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:32px;color:#333333;
                                                   font-size:16px;line-height:1.6;">

                                            <p style="margin:0 0 16px;">Dear User,</p>

                                            <p style="margin:0 0 16px;">
                                                We received a request to reset your password.
                                            </p>

                                            <p style="margin:0 0 24px;">
                                                Click the button below to create a new password.
                                            </p>

                                            <table cellpadding="0" cellspacing="0" align="center">
                                                <tr>
                                                    <td align="center"
                                                        style="background:#dc2626;
                                                               border-radius:8px;">
                                                        <a href="%s"
                                                           style="display:inline-block;
                                                                  padding:14px 28px;
                                                                  color:#ffffff;
                                                                  text-decoration:none;
                                                                  font-weight:bold;
                                                                  font-size:16px;">
                                                            Reset Password
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin:28px 0 16px;
                                                      color:#666666;font-size:14px;">
                                                If you did not request a password reset,
                                                you can safely ignore this email.
                                            </p>

                                            <p style="margin:0;color:#666666;font-size:14px;">
                                                For security reasons, do not share this email.
                                            </p>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center"
                                            style="background:#f8fafc;padding:18px;
                                            color:#94a3b8;font-size:12px;">
                                            © 2026 SSO Team. All rights reserved.
                                        </td>
                                    </tr>

                                </table>

                            </td>
                        </tr>
                    </table>

                </body>
                </html>
                """.formatted(url);

            helper.setText(content, true);

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send reset password email", e);
        }
    }

    // ==================== ACCOUNT CREATION CONFIRMATION EMAIL ====================

    /**
     * Sends the "Your Account is Ready!" confirmation email after a successful
     * 30-day free-trial signup.
     *
     * <p>This method is intentionally {@code @Async} so that a mail-server failure
     * never rolls back or blocks the account-creation transaction.
     * Errors are logged but not rethrown.
     *
     * @param to                  the owner's email address (from signup form)
     * @param organizationName    display name of the new organization
     * @param organizationCode    unique slug / code of the organization
     * @param primaryCompanyName  name of the primary company created during signup
     * @param companyCode         unique code of the primary company
     * @param trialEndsAt         trial expiration timestamp
     * @param loginPortalUrl      full URL to the organisation's login portal
     */
    @Async("emailTaskExecutor")
    public void sendAccountCreationEmail(
            String to,
            String organizationName,
            String organizationCode,
            String primaryCompanyName,
            String companyCode,
            LocalDateTime trialEndsAt,
            String loginPortalUrl) {

        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Your Account is Ready!");

            // Format trial expiry date as "Oct 31, 2026"
            String formattedExpiry = trialEndsAt != null
                    ? trialEndsAt.format(DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH))
                    : "N/A";

            String content = buildAccountReadyEmailHtml(
                    organizationName, organizationCode,
                    primaryCompanyName, companyCode,
                    formattedExpiry, loginPortalUrl);

            helper.setText(content, true);
            mailSender.send(message);

            log.info("Account-creation confirmation email sent to {} for organization [{}]",
                    to, organizationCode);

        } catch (Exception e) {
            // Email failure must NEVER fail the account-creation flow
            log.error("Failed to send account-creation email to {} for organization [{}]: {}",
                    to, organizationCode, e.getMessage(), e);
        }
    }

    // ==================== EMAIL TEMPLATE ====================

    private String buildAccountReadyEmailHtml(
            String organizationName,
            String organizationCode,
            String primaryCompanyName,
            String companyCode,
            String trialExpirationDate,
            String loginPortalUrl) {

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Account is Ready!</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

                <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                    <tr>
                        <td align="center">

                            <!-- CARD -->
                            <table width="600" cellpadding="0" cellspacing="0"
                                   style="background:#ffffff;border-radius:16px;overflow:hidden;
                                          box-shadow:0 8px 30px rgba(0,0,0,0.10);max-width:600px;width:100%%">

                                <!-- HEADER -->
                                <tr>
                                    <td align="center"
                                        style="background:linear-gradient(135deg,#1e40af 0%%,#3b82f6 100%%);
                                               padding:36px 32px 28px;">
                                        <!-- Success icon -->
                                        <div style="display:inline-block;background:rgba(255,255,255,0.20);
                                                    border-radius:50%%;width:64px;height:64px;
                                                    line-height:64px;text-align:center;
                                                    font-size:32px;margin-bottom:14px;">&#10003;</div>
                                        <h1 style="margin:0;color:#ffffff;font-size:26px;
                                                   font-weight:700;letter-spacing:-0.5px;">
                                            Your Account is Ready!
                                        </h1>
                                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);
                                                  font-size:15px;">
                                            Your 30-day free trial has been activated
                                        </p>
                                    </td>
                                </tr>

                                <!-- TRIAL BADGE -->
                                <tr>
                                    <td align="center" style="padding:24px 32px 0;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background:#eff6ff;border:1.5px solid #bfdbfe;
                                                           border-radius:100px;padding:8px 20px;
                                                           font-size:13px;font-weight:600;
                                                           color:#1d4ed8;letter-spacing:0.5px;
                                                           text-transform:uppercase;">
                                                    &#9679;&nbsp; Trial Plan &mdash; TRIALING
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- GREETING -->
                                <tr>
                                    <td style="padding:28px 36px 0;color:#374151;font-size:15px;line-height:1.7;">
                                        <p style="margin:0;">Welcome! Your organization account has been successfully created.
                                        Here are your account details &mdash; please save them for future reference.</p>
                                    </td>
                                </tr>

                                <!-- DETAILS TABLE -->
                                <tr>
                                    <td style="padding:24px 36px;">
                                        <table width="100%%" cellpadding="0" cellspacing="0"
                                               style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">

                                            <!-- Row helper macro -->
                                            <tr style="background:#f9fafb;">
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;width:40%%">Trial Plan Status</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#111827;font-weight:500;
                                                           border-bottom:1px solid #e5e7eb;">
                                                    <span style="background:#d1fae5;color:#065f46;
                                                                 padding:3px 10px;border-radius:100px;
                                                                 font-size:12px;font-weight:700;
                                                                 text-transform:uppercase;">TRIALING</span>
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;">Trial Duration</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#111827;font-weight:500;
                                                           border-bottom:1px solid #e5e7eb;">30-day free trial</td>
                                            </tr>

                                            <tr style="background:#f9fafb;">
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;">Organization Name</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#111827;font-weight:500;
                                                           border-bottom:1px solid #e5e7eb;">%s</td>
                                            </tr>

                                            <tr>
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;">Organization Code</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#111827;font-weight:500;font-family:monospace;
                                                           border-bottom:1px solid #e5e7eb;">%s</td>
                                            </tr>

                                            <tr style="background:#f9fafb;">
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;">Primary Company</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#111827;font-weight:500;
                                                           border-bottom:1px solid #e5e7eb;">%s</td>
                                            </tr>

                                            <tr>
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;">Company Code</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#111827;font-weight:500;font-family:monospace;
                                                           border-bottom:1px solid #e5e7eb;">%s</td>
                                            </tr>

                                            <tr style="background:#fff7ed;">
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;
                                                           border-bottom:1px solid #e5e7eb;">Trial Expiration Date</td>
                                                <td style="padding:13px 18px;font-size:14px;
                                                           color:#92400e;font-weight:600;
                                                           border-bottom:1px solid #e5e7eb;">%s</td>
                                            </tr>

                                            <tr>
                                                <td style="padding:13px 18px;font-size:13px;
                                                           color:#6b7280;font-weight:600;
                                                           text-transform:uppercase;letter-spacing:0.4px;">Organization Login Portal</td>
                                                <td style="padding:13px 18px;font-size:14px;">
                                                    <a href="%s" style="color:#2563eb;text-decoration:none;font-weight:500;
                                                                        word-break:break-all;">%s</a>
                                                </td>
                                            </tr>

                                        </table>
                                    </td>
                                </tr>

                                <!-- CTA BUTTON -->
                                <tr>
                                    <td align="center" style="padding:4px 36px 32px;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center"
                                                    style="background:linear-gradient(135deg,#1e40af 0%%,#3b82f6 100%%);
                                                           border-radius:10px;">
                                                    <a href="%s"
                                                       style="display:inline-block;padding:14px 36px;
                                                              color:#ffffff;text-decoration:none;
                                                              font-weight:700;font-size:15px;
                                                              letter-spacing:0.3px;">
                                                        Continue to Sign In &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- NOTE -->
                                <tr>
                                    <td style="padding:0 36px 28px;">
                                        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;
                                                  background:#f9fafb;border-left:3px solid #3b82f6;
                                                  border-radius:4px;padding:12px 14px;">
                                            <strong>Note:</strong> Your 30-day free trial gives you full access to all features.
                                            After the trial period, you can upgrade your plan to continue using the platform.
                                        </p>
                                    </td>
                                </tr>

                                <!-- FOOTER -->
                                <tr>
                                    <td align="center"
                                        style="background:#f8fafc;padding:20px;border-top:1px solid #e5e7eb;
                                               color:#9ca3af;font-size:12px;">
                                        &copy; 2026 SSO Team. All rights reserved.<br>
                                        <span style="font-size:11px;">If you did not create this account, please contact support immediately.</span>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
            """.formatted(
                organizationName, organizationCode,
                primaryCompanyName, companyCode,
                trialExpirationDate,
                loginPortalUrl, loginPortalUrl,  // href + display text
                loginPortalUrl                   // CTA button href
        );
    }

    // ==================== EMPLOYEE / USER PROVISIONING EMAIL ====================

    /**
     * Sends the employee provisioning email containing the secure Set Password link
     * and the company-specific login URL.
     */
    public void sendProvisioningEmail(
            String to,
            String fullName,
            String companyName,
            String username,
            String passwordSetupLink,
            String companyLoginUrl,
            int validityHours) {

        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Your Mark2 ERP Account Is Ready — Set Your Password");

            String content = buildProvisioningEmailHtml(
                    escapeHtml(fullName),
                    escapeHtml(companyName),
                    escapeHtml(username),
                    escapeHtml(to),
                    passwordSetupLink,
                    companyLoginUrl,
                    validityHours);

            helper.setText(content, true);
            mailSender.send(message);

            log.info("Employee provisioning email sent successfully to {} for company [{}]", to, companyName);
        } catch (Exception e) {
            log.error("Failed to send employee provisioning email to {} for company [{}]: {}",
                    to, companyName, e.getMessage(), e);
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    private String buildProvisioningEmailHtml(
            String fullName,
            String companyName,
            String username,
            String email,
            String passwordSetupLink,
            String companyLoginUrl,
            int validityHours) {

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Mark2 ERP Account Is Ready — Set Your Password</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1e293b;">

                <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background-color:#f4f6f9;">
                    <tr>
                        <td align="center">

                            <!-- MAIN CARD CONTAINER -->
                            <table width="600" cellpadding="0" cellspacing="0"
                                   style="background:#ffffff;border-radius:16px;overflow:hidden;
                                          box-shadow:0 10px 30px rgba(0,0,0,0.08);max-width:600px;width:100%%;border:1px solid #e2e8f0;">

                                <!-- BRAND HEADER -->
                                <tr>
                                    <td align="center"
                                        style="background:linear-gradient(135deg,#0f172a 0%%,#1e293b 100%%);
                                               padding:36px 32px 30px;color:#ffffff;">
                                        <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;margin-bottom:8px;">
                                            Mark2 Cloud ERP
                                        </div>
                                        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                                            Your Account Is Ready
                                        </h1>
                                        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">
                                            Set your password to get started with %s
                                        </p>
                                    </td>
                                </tr>

                                <!-- BODY CONTENT -->
                                <tr>
                                    <td style="padding:36px 32px;font-size:15px;line-height:1.6;color:#334155;">

                                        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0f172a;">
                                            Hello %s,
                                        </p>

                                        <p style="margin:0 0 20px;">
                                            Your user account has been created for <strong>%s</strong> in Mark2 ERP.
                                        </p>

                                        <!-- ACCOUNT DETAILS SUMMARY -->
                                        <table width="100%%" cellpadding="0" cellspacing="0"
                                               style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:0 0 28px;">
                                            <tr>
                                                <td style="padding:16px 20px;">
                                                    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:10px;">
                                                        Account Details
                                                    </div>
                                                    <table width="100%%" cellpadding="4" cellspacing="0" style="font-size:14px;">
                                                        <tr>
                                                            <td width="110" style="color:#64748b;font-weight:600;">Name:</td>
                                                            <td style="color:#0f172a;font-weight:600;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#64748b;font-weight:600;">Username:</td>
                                                            <td style="color:#0f172a;font-family:monospace;font-weight:700;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#64748b;font-weight:600;">Email:</td>
                                                            <td style="color:#0f172a;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#64748b;font-weight:600;">Company:</td>
                                                            <td style="color:#0f172a;font-weight:600;">%s</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- STEP 1: SET PASSWORD -->
                                        <div style="margin:0 0 24px;">
                                            <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a;">
                                                Step 1: Set your password
                                            </h3>
                                            <p style="margin:0 0 16px;color:#475569;font-size:14px;">
                                                Click the button below to create your password securely. This link expires in %d hours and can only be used once.
                                            </p>

                                            <!-- CTA BUTTON -->
                                            <table cellpadding="0" cellspacing="0" align="center" style="margin:20px auto;">
                                                <tr>
                                                    <td align="center" style="background:#0284c7;border-radius:10px;box-shadow:0 4px 12px rgba(2,132,199,0.25);">
                                                        <a href="%s"
                                                           style="display:inline-block;padding:14px 32px;color:#ffffff;
                                                                  text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;">
                                                            Set Your Password
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin:16px 0 0;font-size:12px;color:#64748b;word-break:break-all;">
                                                If the button above does not work, copy and paste this secure link into your browser:<br>
                                                <a href="%s" style="color:#0284c7;text-decoration:underline;">%s</a>
                                            </p>
                                        </div>

                                        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">

                                        <!-- STEP 2: COMPANY LOGIN -->
                                        <div style="margin:0 0 28px;">
                                            <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a;">
                                                Step 2: Log in to your company
                                            </h3>
                                            <p style="margin:0 0 10px;color:#475569;font-size:14px;">
                                                After setting your password, open your company's dedicated login page:
                                            </p>
                                            <div style="background:#f1f5f9;border-left:4px solid #0284c7;padding:12px 16px;border-radius:4px;margin:0 0 12px;">
                                                <a href="%s" style="color:#0284c7;font-weight:700;text-decoration:none;font-size:14px;word-break:break-all;">
                                                    %s
                                                </a>
                                            </div>
                                            <p style="margin:0;color:#475569;font-size:14px;">
                                                Use your assigned username or email address and the password you created.
                                            </p>
                                        </div>

                                        <!-- IMPORTANT NOTES -->
                                        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin:0 0 28px;">
                                            <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:8px;">
                                                Important Notes:
                                            </div>
                                            <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:1.6;">
                                                <li>Set your password before your first login.</li>
                                                <li>Always log in using your assigned company's login URL.</li>
                                                <li>Do not use another company's login page.</li>
                                                <li>Keep your password private and never share it.</li>
                                                <li>The password setup link expires in %d hours and can only be used once.</li>
                                                <li>If the link expires, contact your organization administrator to request a new one.</li>
                                            </ul>
                                        </div>

                                        <p style="margin:0;color:#475569;font-size:14px;">
                                            Regards,<br>
                                            <strong style="color:#0f172a;">Mark2 ERP Team</strong>
                                        </p>

                                    </td>
                                </tr>

                                <!-- FOOTER -->
                                <tr>
                                    <td align="center"
                                        style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
                                        &copy; 2026 Mark2 Cloud ERP. All rights reserved.<br>
                                        <span style="font-size:11px;">This is an automated notification. Please do not reply directly to this email.</span>
                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>
                </table>

            </body>
            </html>
            """.formatted(
                companyName,
                fullName,
                companyName,
                fullName,
                username,
                email,
                companyName,
                validityHours,
                passwordSetupLink,
                passwordSetupLink,
                passwordSetupLink,
                companyLoginUrl,
                companyLoginUrl,
                validityHours
        );
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;");
    }

}

