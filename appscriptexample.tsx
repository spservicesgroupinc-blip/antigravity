// @ts-nocheck
export {};

/**
 * RFE FOAM APP - BETA SIGN UP BACKEND
 * Handles new user registration, PDF generation, and automated delivery.
 */

const CONFIG = {
  SHEET_NAME: "RFE_Beta_Signups_DB",
  TAB_NAME: "Signups",
  EMAIL_SUBJECT: "Welcome to FoamApp Pro v3 - User Guide & Next Steps",
  SENDER_NAME: "RFE Foam App Team"
};

/**
 * Main Entry Point for Web App (POST requests)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 30 seconds as PDF generation takes time
  if (!lock.tryLock(30000)) {
    return sendResponse('error', 'Server is busy. Please try again.');
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Invalid request: No data received.");
    }

    const request = JSON.parse(e.postData.contents);
    const { action, payload } = request;

    if (action === 'SUBMIT_BETA_SIGNUP') {
      const result = handleSignup(payload);
      return sendResponse('success', result);
    } else {
      throw new Error("Invalid Action: This endpoint handles signups only.");
    }

  } catch (error) {
    Logger.log("Error: " + error.toString());
    return sendResponse('error', error.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Orchestrates logging and email delivery
 */
function handleSignup(data) {
  const { name, email, phone } = data;

  if (!name || !email) {
    throw new Error("Name and Email are required.");
  }

  // 1. Log to Database
  logToSheet(name, email, phone);

  // 2. Generate PDF Guide
  const pdfBlob = generateGuidePDF(name);

  // 3. Send Email with Attachment
  sendEmailWithPDF(name, email, pdfBlob);

  return { message: "Signup successful, guide sent." };
}

/**
 * Database Logging Logic
 */
function logToSheet(name, email, phone) {
  const ss = getOrCreateSpreadsheet();
  const sheet = getOrCreateTab(ss);
  const timestamp = new Date();
  sheet.appendRow([
    timestamp.toLocaleString(),
    name,
    email,
    phone || "N/A",
    "PENDING_SETUP"
  ]);
}

/**
 * Generates a temporary Google Doc, fills it with Guide content,
 * converts to PDF, and deletes the temp file.
 */
function generateGuidePDF(recipientName) {
  // Create Temp Doc
  const doc = DocumentApp.create("RFE_User_Guide_" + recipientName.replace(/\s/g, '_'));
  const body = doc.getBody();
  
  // -- STYLES --
  const titleStyle = {};
  titleStyle[DocumentApp.Attribute.FONT_SIZE] = 24;
  titleStyle[DocumentApp.Attribute.BOLD] = true;
  titleStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = "#E30613"; // RFE Red

  const headerStyle = {};
  headerStyle[DocumentApp.Attribute.FONT_SIZE] = 14;
  headerStyle[DocumentApp.Attribute.BOLD] = true;
  headerStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = "#0f172a"; // Slate 900

  // -- CONTENT --
  
  // Title
  body.insertParagraph(0, "FoamApp Pro v3: Professional User Guide")
      .setAttributes(titleStyle)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  body.appendParagraph(`Prepared for: ${recipientName}\nDate: ${new Date().toLocaleDateString()}`)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  body.appendHorizontalRule();
  
  body.appendParagraph("Welcome to FoamApp Pro v3. This document serves as your quick-start manual for the beta platform.")
      .setItalic(true);

  // Section 1: Installation
  body.appendParagraph("\n1. Getting Started & Installation").setAttributes(headerStyle);
  body.appendParagraph("FoamApp Pro is a Progressive Web App (PWA). You can install it directly to your device:");
  
  const list1 = body.appendListItem("Mobile (iOS): Open in Safari, tap the 'Share' icon, and select 'Add to Home Screen'.");
  list1.setGlyphType(DocumentApp.GlyphType.BULLET);
  body.appendListItem("Mobile (Android): Open in Chrome, tap the three-dot menu, and select 'Install App'.");
  body.appendListItem("Desktop: Click the Install icon (computer monitor with down arrow) in the browser address bar.");

  // Section 2: Roles
  body.appendParagraph("\n2. User Roles").setAttributes(headerStyle);
  body.appendParagraph("Admin Dashboard: Full control over estimates, inventory, and financials. Login with your Username & Password.");
  body.appendParagraph("Crew Dashboard: Simplified interface for field execution. Login with Company ID + 4-digit PIN.");

  // Section 3: Admin Workflow
  body.appendParagraph("\n3. Admin Workflow").setAttributes(headerStyle);
  const list2 = body.appendListItem("Create Estimate: Select 'New Estimate', choose a customer, and input dimensions.");
  list2.setGlyphType(DocumentApp.GlyphType.NUMBER);
  body.appendListItem("Pricing Models: Toggle between 'Cost Plus' (Materials + Labor + Margin) or 'SqFt Pricing' (Market Rate).");
  body.appendListItem("Scheduling: Mark a job as 'Sold' to create a Work Order and assign a scheduled date.");
  body.appendListItem("Work Orders: Once generated, the Work Order is available to the Crew Dashboard.");

  // Section 4: Crew Execution
  body.appendParagraph("\n4. Crew Execution").setAttributes(headerStyle);
  body.appendParagraph("The crew can view job details, navigate to the site, and use the 'Time Clock' feature. Upon completion, they must log actual material usage (chemical sets) and upload photos.");

  // Section 5: Financials
  body.appendParagraph("\n5. Financials & Reconciliation").setAttributes(headerStyle);
  body.appendParagraph("Once a job is marked complete by the crew, review the actuals. You can then generate a final Invoice. Marking an invoice as 'Paid' locks the data and updates your Profit & Loss report.");

  // Footer
  body.appendHorizontalRule();
  body.appendParagraph("\n© 2024 RFE Foam Equipment. Confidential Beta Documentation.")
      .setFontSize(8)
      .setForegroundColor("#64748b")
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // Save and Close to flush changes
  doc.saveAndClose();

  // Convert to PDF
  const docFile = DriveApp.getFileById(doc.getId());
  const pdfBlob = docFile.getAs(MimeType.PDF);
  pdfBlob.setName("RFE_FoamApp_Pro_Guide.pdf");

  // Cleanup: Delete the temp doc
  docFile.setTrashed(true);

  return pdfBlob;
}

/**
 * Sends Email with the PDF attachment
 */
function sendEmailWithPDF(name, email, pdfBlob) {
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">Welcome, ${name}!</h2>
      </div>
      
      <p>Thank you for requesting access to the <strong>FoamApp Pro v3 Beta</strong>.</p>
      
      <p>We have attached your <strong>User Guide PDF</strong> to this email. Please review it to understand the installation process and workflows for both Admin and Crew roles.</p>
      
      <!-- HIGHLIGHTED CREDENTIALS NOTICE -->
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0284c7; padding: 20px; border-radius: 6px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #0369a1; font-size: 16px;">🔑 Important: Your Login Credentials</h3>
        <p style="margin-bottom: 0; font-size: 14px; color: #0c4a6e;">
          Your secure dedicated workspace is currently being provisioned.
          <br/><br/>
          <strong>You will receive a SEPARATE email containing:</strong>
          <ul style="margin: 10px 0;">
            <li>Your unique Company ID</li>
            <li>Admin Username & Password</li>
            <li>Crew Access PIN</li>
          </ul>
          Please allow up to <strong>24 hours</strong> for this second email to arrive.
        </p>
      </div>
      
      <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        &copy; ${new Date().getFullYear()} RFE Foam Equipment.<br/>
        This is an automated message. Please do not reply.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: CONFIG.EMAIL_SUBJECT,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME,
    attachments: [pdfBlob]
  });
}

// --- HELPERS ---

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(CONFIG.SHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    return SpreadsheetApp.create(CONFIG.SHEET_NAME);
  }
}

function getOrCreateTab(ss) {
  let sheet = ss.getSheetByName(CONFIG.TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TAB_NAME);
    const defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
    
    const headers = [["Timestamp", "Full Name", "Email Address", "Phone Number", "Account Status"]];
    const range = sheet.getRange(1, 1, 1, 5);
    range.setValues(headers);
    range.setFontWeight("bold");
    range.setBackground("#E30613");
    range.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendResponse(status, dataOrMessage) {
  const response = {
    status: status,
    [status === 'success' ? 'data' : 'message']: dataOrMessage
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
