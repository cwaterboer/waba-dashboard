import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    
    // WhatsApp Webhook Verification
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.status(403).send("Verification failed");
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      console.log("Webhook Received:", data);

      if (data.entry) {
        for (const entry of data.entry) {
          const changes = entry.changes || [];
          for (const change of changes) {
            if (change.value && change.value.messages) {
              for (const message of change.value.messages) {
                console.log("New Message:", message);
                await saveMessageToDatabase(message);
              }
            }
          }
        }
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}

async function saveMessageToDatabase(message: any) {
  try {
    const query = `
      INSERT INTO whatsapp_messages (id, from_number, message_body, timestamp)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING;
    `;
    await pool.query(query, [
      message.id,
      message.from,
      message.text.body,
      new Date(),
    ]);
    console.log("Message saved to database");
  } catch (error) {
    console.error("Database error:", error);
  }
}
