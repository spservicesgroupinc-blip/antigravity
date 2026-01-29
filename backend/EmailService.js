
/**
 * RFE FOAM APP - DEDICATED EMAIL SERVICE
 * Handles delivery of PDF Estimates, Invoices, Work Orders, and Welcome Emails.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Deploy this script as a Web App.
 * 2. Set "Execute as: Me".
 * 3. Set "Who has access: Anyone".
 * 4. Paste the resulting URL into 'constants.ts' as EMAIL_SCRIPT_URL.
 */

const CONFIG = {
  SENDER_NAME: "RFE Foam App"
};

/**
 * Main Entry Point for Web App (POST requests)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Emailing with attachments can take a moment, wait up to 30s for lock
  if (!lock.tryLock(30000)) {
    return sendResponse('error', 'Server is busy. Please try again.');
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Invalid request: No data received.");
    }

    const request = JSON.parse(e.postData.contents);
    const { action, payload } = request;

    if (action === 'SEND_DOCUMENT') {
      const result = handleSendDocument(payload);
      return sendResponse('success', result);
    } else if (action === 'SEND_WELCOME') {
      // General Lead Welcome (No credentials)
      const result = handleSendWelcome(payload);
      return sendResponse('success', result);
    } else if (action === 'SEND_ACCOUNT_CREATION') {
      // New Account Welcome (With credentials)
      const result = handleSendAccountCreation(payload);
      return sendResponse('success', result);
    } else {
      throw new Error("Invalid Action: " + action);
    }

  } catch (error) {
    Logger.log("Error: " + error.toString());
    return sendResponse('error', error.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles the logic for sending a document email
 */
function handleSendDocument(payload) {
  const { to, subject, body, attachmentBase64, filename } = payload;

  if (!to) throw new Error("Recipient email is required.");
  if (!attachmentBase64) throw new Error("Document attachment is missing.");

  const base64Data = attachmentBase64.includes(',') 
    ? attachmentBase64.split(',')[1] 
    : attachmentBase64;
    
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data), 
    MimeType.PDF, 
    filename || "Document.pdf"
  );

  const htmlBody = createEmailTemplate(body);

  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME,
    attachments: [blob]
  });

  return { sent: true, to: to };
}

/**
 * Handles the logic for sending a welcome email to new leads
 */
function handleSendWelcome(payload) {
  const { to, customerName } = payload;
  if (!to) throw new Error("Recipient email is required.");

  const subject = "Thank you for contacting us!";
  const htmlBody = createWelcomeTemplate(customerName);

  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME
  });

  return { sent: true, to: to };
}

/**
 * Handles sending account credentials to new Company Admins
 */
function handleSendAccountCreation(payload) {
  const { to, companyName, username, password, crewPin } = payload;
  if (!to) throw new Error("Recipient email is required.");

  const subject = "Welcome to RFE Foam Pro - Your Account Details";
  const htmlBody = createAccountCreationTemplate(companyName, username, password, crewPin);

  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME
  });

  return { sent: true, to: to };
}

/**
 * Wraps the message in a professional HTML template
 */
function createEmailTemplate(content) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 20px; text-align: center;">
        <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 1px;">RFE FOAM APP</span>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; line-height: 1.6; color: #0F172A;">
          ${content.replace(/\n/g, '<br/>')}
        </p>
        <div style="background-color: #F8FAFC; border-left: 4px solid #E30613; padding: 15px; margin: 25px 0; font-size: 14px; color: #64748b;">
          Please find the requested document attached to this email.
        </div>
      </div>
      <div style="background-color: #F1F5F9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        &copy; ${new Date().getFullYear()} RFE Foam Equipment.<br/>
        This is an automated message.
      </div>
    </div>
  `;
}

function createWelcomeTemplate(customerName) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center;">
        <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">WELCOME</span>
      </div>
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #0F172A; margin-top: 0;">Hello ${customerName},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">
          Thank you for contacting us regarding your spray foam insulation needs. We have successfully created your profile in our system.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; font-weight: bold;">
          We look forward to doing business with you soon!
        </p>
      </div>
      <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        &copy; ${new Date().getFullYear()} RFE Foam Equipment.<br/>
        Professional Insulation Services
      </div>
    </div>
  `;
}

function createAccountCreationTemplate(companyName, username, password, crewPin) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #E30613; padding: 30px; text-align: center;">
        <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">ACCOUNT CREATED</span>
      </div>
      
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #0F172A; margin-top: 0;">Welcome, ${companyName}!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">
          Your RFE Foam Pro account has been successfully provisioned. You can now access your professional estimation suite.
        </p>

        <!-- APP LINK BUTTON -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://rfe-foam-pro-mobile-v5-542640490938.us-west1.run.app/" target="_blank" style="background-color: #0F172A; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Access Dashboard
            </a>
        </div>
        
        <div style="background-color: #F1F5F9; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #0F172A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Admin Credentials</h3>
          <p style="margin: 5px 0; font-family: monospace; font-size: 16px;"><strong>Username:</strong> ${username}</p>
          <p style="margin: 5px 0; font-family: monospace; font-size: 16px;"><strong>Password:</strong> ${password}</p>
        </div>

        <div style="background-color: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #9A3412; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Crew Access</h3>
          <p style="font-size: 14px; margin-bottom: 10px;">Share these details with your field team to allow them to access the Crew Dashboard:</p>
          <p style="margin: 5px 0; font-family: monospace; font-size: 16px;"><strong>Company ID:</strong> ${username}</p>
          <p style="margin: 5px 0; font-family: monospace; font-size: 16px;"><strong>Crew PIN:</strong> ${crewPin}</p>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          *Please keep these credentials safe. You can change your Crew PIN inside the Admin Settings at any time.
        </p>
      </div>
      
      <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        &copy; ${new Date().getFullYear()} RFE Foam Equipment.<br/>
        Professional Estimation Suite
      </div>
    </div>
  `;
}

function sendResponse(status, dataOrMessage) {
  const response = {
    status: status,
    [status === 'success' ? 'data' : 'message']: dataOrMessage
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
