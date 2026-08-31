import { collection, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import * as jose from "jose";

export async function sendFCMNotification(
  title: string,
  body: string,
  contentType: string,
  slugOrId: string,
  imageUrl?: string
) {
  try {
    const payload = {
      title,
      body,
      image: imageUrl,
      data: {
        contentType,
        slug: slugOrId,
        contentId: slugOrId
      }
    };

    // 1. Try to send via Client-Side logic first if Service Account is configured
    const savedKey = localStorage.getItem("fcm_server_key");
    if (savedKey) {
      try {
        const credentials = JSON.parse(savedKey);
        if (credentials.private_key && credentials.client_email && credentials.project_id) {
          console.log("Found Service Account JSON in localStorage, sending from client...");
          
          const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
          const tokens = tokensSnapshot.docs.map(doc => doc.id);
          
          if (tokens.length === 0) {
            console.log("No FCM tokens found.");
            return;
          }

          // Generate OAuth2 token using jose
          const iat = Math.floor(Date.now() / 1000);
          const exp = iat + 3600;
          const privateKey = await jose.importPKCS8(credentials.private_key, "RS256");
          const jwt = await new jose.SignJWT({
            iss: credentials.client_email,
            sub: credentials.client_email,
            aud: "https://oauth2.googleapis.com/token",
            scope: "https://www.googleapis.com/auth/firebase.messaging",
          })
            .setProtectedHeader({ alg: "RS256", typ: "JWT" })
            .setIssuedAt(iat)
            .setExpirationTime(exp)
            .sign(privateKey);

          const oauthRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
          });

          const oauthData = await oauthRes.json();
          if (!oauthRes.ok) throw new Error("Failed to get Google OAuth token");
          const accessToken = oauthData.access_token;
          const projectId = credentials.project_id;
          
          let successCount = 0;
          let failureCount = 0;

          let targetUrl = `/${contentType}/${slugOrId}`;
          if (contentType === "events") targetUrl = `/events/activity/${slugOrId}`;
          if (contentType === "quran") targetUrl = `/quran`;

          // Send to each token
          for (let i = 0; i < tokens.length; i++) {
            const v1Payload = {
              message: {
                token: tokens[i],
                notification: {
                  title: title,
                  body: body,
                  image: imageUrl || undefined
                },
                data: {
                  contentType: contentType,
                  contentId: slugOrId,
                  url: targetUrl
                },
                android: { priority: "high" }
              }
            };

            const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
              },
              body: JSON.stringify(v1Payload)
            });

            if (fcmRes.ok) successCount++;
            else failureCount++;
          }

          try {
            await addDoc(collection(db, "notifications_history"), {
              title: title,
              body: body,
              imageUrl: imageUrl || "",
              contentType,
              contentId: slugOrId,
              contentTitle: title,
              successCount,
              failureCount,
              tokensCount: tokens.length,
              createdAt: Date.now(),
              sentBy: auth.currentUser?.email || "Auto Broadcast",
              method: "client_side_v1"
            });
          } catch (e) {
            console.warn("Failed to record history", e);
          }

          console.log(`FCM broadcast triggered from client: ${successCount} success, ${failureCount} failed.`);
          return;
        }
      } catch (e) {
        console.warn("Client-side FCM failed, falling back to server...", e);
      }
    }

    // 2. Fallback to server if no key or error
    const response = await fetch("/api/push/fcm-broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error("Failed to trigger FCM broadcast", await response.text());
    } else {
      console.log("FCM broadcast triggered successfully via server");
    }
  } catch (e) {
    console.error("Error triggering FCM broadcast:", e);
  }
}
