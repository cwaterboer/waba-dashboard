import { NextApiRequest, NextApiResponse } from "next";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { whatsappMessages } from "../../db/schema";

const db = drizzle(sql);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Webhook verification
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  }
  
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
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Function to handle different types of messages and store them in DB using Drizzle
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

    // Insert message into the database using Drizzle ORM
    await db.insert(whatsappMessages).values({
      id: message.id,
      fromNumber: message.from,
      messageType: messageType,
      messageBody: messageBody,
      timestamp: new Date(),
    }).onConflictDoNothing();
    
    console.log(`Saved ${messageType} message to database`);
  } catch (error) {
    console.error("Database error:", error);
  }
}
