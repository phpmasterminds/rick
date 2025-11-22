import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, brand, role, markets } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Prepare data for storage
    const timestamp = new Date().toISOString();
    const data = {
      timestamp,
      name: name.trim(),
      email: email.trim(),
      brand: brand?.trim() || "",
      role: role?.trim() || "",
      markets: markets?.trim() || "",
    };

    // Store in database or file (example uses file storage)
    // For production, you should use a database like MongoDB, PostgreSQL, etc.
    await storeAccessRequest(data);

    // Optional: Send email notification
    // await sendNotificationEmail(data);

    return NextResponse.json(
      { success: true, message: "Access request submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request access error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function storeAccessRequest(data: any) {
  try {
    // Example: Store in a JSON file in public folder
    // For production, use a database instead
    const filePath = path.join(process.cwd(), "public", "mailing_list.json");
    
    let existingData: any[] = [];
    
    // Read existing data if file exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingData = JSON.parse(fileContent || "[]");
    }
    
    // Add new entry
    existingData.push(data);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  } catch (error) {
    console.error("Error storing access request:", error);
    
    // Fallback: Store in memory or alternative storage
    // In production, ensure data is persisted to a database
    throw error;
  }
}

// Optional: If you want to send email notifications
/*
async function sendNotificationEmail(data: any) {
  try {
    // Example using your email service (SendGrid, Mailgun, etc.)
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [
    //       {
    //         to: [{ email: data.email }],
    //         subject: "Welcome to Nature's High Early Access",
    //       },
    //     ],
    //     from: { email: 'noreply@natureshigh.com' },
    //     content: [
    //       {
    //         type: 'text/html',
    //         value: `<p>Thank you for requesting early access to Nature's High!</p>`,
    //       },
    //     ],
    //   }),
    // });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
*/