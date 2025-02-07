import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const data = req.body;
      console.log("Received WhatsApp webhook:", JSON.stringify(data, null, 2));
      
      if (data.object !== "whatsapp_business_account") {
        return res.status(400).json({ message: "Invalid object type" });
      }

      // Process incoming messages
      const messages = data.entry?.[0]?.changes?.[0]?.value?.messages;
      if (!messages) {
        return res.status(200).json({ message: "No new messages" });
      }

      for (const message of messages) {
        await saveMessageToDatabase(message);
      }

      res.status(200).json({ message: "Messages processed successfully" });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Function to handle different types of messages and store them in DB
async function saveMessageToDatabase(message: any) {
  try {
    let messageBody = "";
    let messageType = message.type;  // Extract type

    // Handle different message formats
    if (messageType === "text") {
      messageBody = message.text.body;
    } else if (["image", "video", "audio", "document"].includes(messageType)) {
      messageBody = message[messageType].url;  // Store media URL
    } else if (messageType === "order") {
      messageBody = JSON.stringify(message.order.items); // Store order details
    } else if (messageType === "interactive") {
      messageBody = JSON.stringify(message.interactive);
    } else {
      messageBody = "Unsupported message type";
    }

    // Insert message into the database
    const query = `
      INSERT INTO whatsapp_messages (id, from_number, message_type, message_body, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await pool.query(query, [
      message.id,
      message.from,
      messageType,  // Store message type
      messageBody,
      new Date(),
    ]);
    
    console.log(`Saved ${messageType} message to database`);
  } catch (error) {
    console.error("Database error:", error);
  }
}
