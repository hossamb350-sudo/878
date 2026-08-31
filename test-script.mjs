import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';
dotenv.config();

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const adminApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || config.projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore(adminApp, config.firestoreDatabaseId);
const messaging = getMessaging(adminApp);

async function test() {
  try {
    console.log("Testing Firestore access...");
    const snapshot = await db.collection("fcm_tokens").limit(1).get();
    console.log("Firestore accessible. Docs found:", snapshot.docs.length);
    
    console.log("Testing FCM dry run...");
    const message = {
        notification: { title: "Test", body: "Test" },
        token: "dummy_token"
    };
    try {
        await messaging.send(message, true); // dryRun
        console.log("FCM dry run successful!");
    } catch(e) {
        console.error("FCM Error:", e.message);
    }
  } catch (e) {
    console.error("Firestore Error:", e.message);
  }
}

test();
