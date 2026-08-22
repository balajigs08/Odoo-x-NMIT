import tls from "tls";
import net from "net";
import crypto from "crypto";

// Try requiring nodemailer if installed
let nodemailer: any = null;
try {
  nodemailer = require("nodemailer");
} catch (_) {
  // Nodemailer not installed in node_modules, falling back to built-in STARTTLS SMTP client
}

export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  const fromName = process.env.FROM_NAME || "Dayflow";

  if (!user || !pass) {
    const err = new Error("SMTP credentials (SMTP_EMAIL and SMTP_PASSWORD) are not set in environment");
    console.error(`EMAIL SEND ERROR: ${err.message}`);
    throw err;
  }

  // Gmail SMTP requires the authenticated email in the From address header
  const fromHeader = `"${fromName}" <${user}>`;

  if (nodemailer) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: false, // Port 587 uses STARTTLS (secure: false)
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: fromHeader,
        to,
        subject,
        text: body,
      });

      const messageId = info.messageId || `<${Date.now()}@${host}>`;
      console.log(`EMAIL SENT: ${messageId}`);
      return messageId;
    } catch (err: any) {
      console.error(`EMAIL SEND ERROR: ${err.message}`);
      throw err;
    }
  }

  // Built-in zero-dependency STARTTLS SMTP Client for Gmail (port 587, secure: false)
  return new Promise((resolve, reject) => {
    const messageId = `<${crypto.randomBytes(16).toString("hex")}@${host}>`;
    const rawSocket = net.createConnection(port, host);
    let currentSocket: net.Socket | tls.TLSSocket = rawSocket;
    let step = 0;
    let timeoutTimer: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timeoutTimer);
      try {
        currentSocket.destroy();
      } catch (_) {}
    };

    timeoutTimer = setTimeout(() => {
      cleanup();
      const err = new Error("SMTP connection timed out after 15 seconds");
      console.error(`EMAIL SEND ERROR: ${err.message}`);
      reject(err);
    }, 15000);

    function writeCmd(cmd: string, sock = currentSocket) {
      sock.write(cmd + "\r\n");
    }

    function handleResponse(data: Buffer, sock = currentSocket) {
      const response = data.toString();
      const code = parseInt(response.slice(0, 3), 10);

      try {
        if (step === 0 && code === 220) {
          step = 1;
          writeCmd("EHLO localhost", sock);
        } else if (step === 1 && code === 250) {
          step = 2;
          writeCmd("STARTTLS", sock);
        } else if (step === 2 && code === 220) {
          step = 3;
          const tlsSocket = tls.connect(
            {
              socket: rawSocket,
              servername: host,
              rejectUnauthorized: false,
            },
            () => {
              writeCmd("EHLO localhost", tlsSocket);
            }
          );

          tlsSocket.on("data", (d) => handleResponse(d, tlsSocket));
          tlsSocket.on("error", (err) => {
            cleanup();
            console.error(`EMAIL SEND ERROR: ${err.message}`);
            reject(err);
          });

          currentSocket = tlsSocket;
        } else if (step === 3 && code === 250) {
          step = 4;
          writeCmd("AUTH LOGIN", currentSocket);
        } else if (step === 4 && code === 334) {
          step = 5;
          writeCmd(Buffer.from(user!).toString("base64"), currentSocket);
        } else if (step === 5 && code === 334) {
          step = 6;
          writeCmd(Buffer.from(pass!).toString("base64"), currentSocket);
        } else if (step === 6) {
          if (code === 235) {
            step = 7;
            writeCmd(`MAIL FROM:<${user}>`, currentSocket);
          } else {
            throw new Error(`SMTP Auth Failed: ${response.trim()}`);
          }
        } else if (step === 7 && code === 250) {
          step = 8;
          writeCmd(`RCPT TO:<${to}>`, currentSocket);
        } else if (step === 8 && code === 250) {
          step = 9;
          writeCmd("DATA", currentSocket);
        } else if (step === 9 && code === 354) {
          step = 10;
          const bodyData = [
            `From: ${fromHeader}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `Message-ID: ${messageId}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/plain; charset=utf-8`,
            ``,
            body,
            `.`,
          ].join("\r\n");

          writeCmd(bodyData, currentSocket);
        } else if (step === 10 && code === 250) {
          step = 11;
          writeCmd("QUIT", currentSocket);
          cleanup();
          console.log(`EMAIL SENT: ${messageId}`);
          resolve(messageId);
        } else if (code >= 400) {
          throw new Error(`SMTP Error ${code}: ${response.trim()}`);
        }
      } catch (err: any) {
        cleanup();
        console.error(`EMAIL SEND ERROR: ${err.message}`);
        reject(err);
      }
    }

    rawSocket.on("data", (d) => handleResponse(d, rawSocket));
    rawSocket.on("error", (err) => {
      cleanup();
      console.error(`EMAIL SEND ERROR: ${err.message}`);
      reject(err);
    });
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;
  await sendEmail(to, "Verify your Dayflow account", `Click to verify your email: ${link}`);
}

export async function sendOtpEmail(to: string, otp: string, purpose: string): Promise<void> {
  const subject = purpose === "FORGOT_PASSWORD" ? "Reset your Dayflow password - OTP" : "Your Dayflow verification OTP";
  const body = `Your 6-digit OTP code for Dayflow is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it with anyone.`;
  await sendEmail(to, subject, body);
}

export async function sendInvitationEmail(to: string, employeeId: string, token: string): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const link = `${clientUrl}/activate-account?token=${token}`;
  const subject = "Welcome to Dayflow HRMS - Activate Your Account";
  const body = `Welcome to Dayflow HRMS\n\nYour Dayflow employee account has been created by HR/Admin.\n\nEmployee ID: ${employeeId}\n\nPlease click the link below to set your password and activate your account:\n\n${link}\n\nNote: This activation link will expire in 24 hours and can be used only once.`;
  await sendEmail(to, subject, body);
}

export async function sendLeaveReviewEmail(
  hrEmail: string,
  employeeName: string,
  employeeId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  remarks: string,
  reviewToken: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const reviewLink = `${clientUrl}/review-leave?token=${reviewToken}`;
  const subject = `Leave Request Submitted - ${employeeName} (${employeeId})`;
  const body = `New Leave Request Pending Review\n\nEmployee: ${employeeName} (${employeeId})\nLeave Type: ${leaveType}\nDuration: ${startDate} to ${endDate}\nReason: ${remarks || "No remarks provided"}\n\nPlease click the link below to review and Approve or Reject this request:\n\n${reviewLink}\n\nNote: You will be prompted to sign in as HR/Admin if you are not already logged in.`;
  
  try {
    await sendEmail(hrEmail, subject, body);
  } catch (err: any) {
    console.error("Failed to send HR leave review notification email:", err.message);
  }
}

export async function sendLeaveStatusEmail(
  employeeEmail: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  status: "APPROVED" | "REJECTED",
  reviewerComment?: string
): Promise<void> {
  const subject = `Dayflow Leave Request ${status}: ${leaveType} Leave`;
  const body = `Your leave request status has been updated.\n\nLeave Type: ${leaveType}\nDuration: ${startDate} to ${endDate}\nStatus: ${status}\n${
    reviewerComment ? `HR Note: ${reviewerComment}\n` : ""
  }\nThank you,\nDayflow HR Team`;

  try {
    await sendEmail(employeeEmail, subject, body);
  } catch (err: any) {
    console.error("Failed to send employee leave status notification email:", err.message);
  }
}
