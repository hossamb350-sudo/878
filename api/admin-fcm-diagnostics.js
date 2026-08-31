import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0926657815";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    
    // 1. Verify caller identity using Google Firebase Identity Toolkit
    const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyB7DaHodf_FEWg76Vy0soAPRAXN-9styRw";
    const authVerifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    
    const userRes = await fetch(authVerifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // 2. Diagnostics
    const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
    const hasLegacyServerKey = !!fcmServerKey;
    const hasAdminSdkCredentials = !!(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
    const isAdminSdkReady = admin.apps.length > 0;

    const projectId = "gen-lang-client-0926657815";
    const databaseId = "ai-studio-3ecd4bf3-759a-4f54-93a0-c6d66639984e";
    
    // Fetch tokens count
    const fcmTokensUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/fcm_tokens?pageSize=500`;
    let tokensCount = 0;
    
    try {
      const tokensRes = await fetch(fcmTokensUrl);
      if (tokensRes.ok) {
        const tokensJson = await tokensRes.json();
        tokensCount = tokensJson.documents ? tokensJson.documents.length : 0;
      }
    } catch (e) {
      console.error("Error fetching tokens count:", e);
    }

    // Attempt a dry run if a token exists and server key is present
    let dryRunStatus = "Not attempted";
    if (isAdminSdkReady && tokensCount > 0) {
       try {
          const response = await admin.messaging().send({
            token: "dummy_token_check_native_android",
            notification: { title: "Test", body: "Test" },
          }, true); // dryRun = true
          dryRunStatus = "Success (Firebase Admin SDK v1 is active)";
       } catch (err) {
          dryRunStatus = `Admin SDK Dry Run Error: ${err.message}`;
       }
    } else if (hasLegacyServerKey && tokensCount > 0) {
      const dryRunPayload = {
        registration_ids: ["dummy_token_check"],
        dry_run: true,
        notification: { title: "Test", body: "Test" }
      };

      try {
        const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${fcmServerKey}`
          },
          body: JSON.stringify(dryRunPayload)
        });
        
        if (fcmRes.ok) {
          dryRunStatus = "Success (Legacy Server Key is valid)";
        } else {
          const errText = await fcmRes.text();
          dryRunStatus = `Failed (${fcmRes.status}): ${errText}`;
        }
      } catch (err) {
        dryRunStatus = `Error: ${err.message}`;
      }
    } else if (!hasAdminSdkCredentials && !hasLegacyServerKey) {
      dryRunStatus = "Skipped (No FIREBASE_CLIENT_EMAIL or FCM_SERVER_KEY configured in environment)";
    }

    return res.status(200).json({
      success: true,
      diagnostics: {
        hasLegacyServerKey,
        serverKeyPrefix: hasLegacyServerKey ? fcmServerKey.substring(0, 10) + "..." : null,
        hasAdminSdkCredentials,
        isAdminSdkReady,
        activeEngine: isAdminSdkReady ? "Firebase Admin SDK (FCM HTTP v1)" : (hasLegacyServerKey ? "Legacy FCM HTTP API" : "None"),
        tokensCount,
        dryRunStatus,
        vercelEnv: process.env.VERCEL_ENV || "development",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
