// backend/src/services/email.service.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailTemplates = {
  welcome: (name) => ({
    subject: '🎉 Welcome to ProFlow!',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:56px;height:56px;background:#6366f1;border-radius:12px;display:inline-flex;
                      align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:700;">
            P
          </div>
        </div>
        <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px;">Welcome, ${name}! 👋</h1>
        <p style="color:#64748b;line-height:1.6;">
          Your ProFlow account is ready. Start managing your projects like a pro!
        </p>
        <a href="${process.env.CLIENT_URL}/dashboard"
           style="display:inline-block;margin-top:24px;padding:12px 28px;
                  background:#6366f1;color:#fff;border-radius:10px;
                  text-decoration:none;font-weight:600;">
          Go to Dashboard →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
          © ${new Date().getFullYear()} ProFlow. All rights reserved.
        </p>
      </div>
    `,
  }),

  projectInvite: (inviterName, projectName, link) => ({
    subject: `📋 You've been invited to "${projectName}" on ProFlow`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h2 style="color:#1e293b;">Project Invitation</h2>
        <p style="color:#64748b;line-height:1.6;">
          <strong>${inviterName}</strong> has invited you to collaborate on 
          <strong>"${projectName}"</strong> on ProFlow.
        </p>
        <a href="${link}"
           style="display:inline-block;margin-top:16px;padding:12px 28px;
                  background:#6366f1;color:#fff;border-radius:10px;
                  text-decoration:none;font-weight:600;">
          View Project →
        </a>
      </div>
    `,
  }),

  passwordReset: (resetUrl) => ({
    subject: '🔐 Reset Your ProFlow Password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h2 style="color:#1e293b;">Password Reset Request</h2>
        <p style="color:#64748b;line-height:1.6;">
          Click the button below to reset your password. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;margin-top:16px;padding:12px 28px;
                  background:#ef4444;color:#fff;border-radius:10px;
                  text-decoration:none;font-weight:600;">
          Reset Password →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  }),
};

export const sendEmail = async ({ to, templateName, templateData = {} }) => {
  try {
    const template = emailTemplates[templateName]?.(...Object.values(templateData));
    if (!template) throw new Error(`Template "${templateName}" not found`);

    await transporter.sendMail({
      from:    `"ProFlow" <${process.env.EMAIL_FROM}>`,
      to,
      subject: template.subject,
      html:    template.html,
    });

    console.log(`📧 Email sent to ${to}: ${template.subject}`);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};