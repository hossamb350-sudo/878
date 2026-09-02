import { collection, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import * as jose from "jose";
import { NotificationSyncService } from "../services/NotificationSyncService";

export async function getStoredFCMKey(): Promise<string | null> {
  const localKey = localStorage.getItem("fcm_server_key");
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }

  try {
    const snap = await getDoc(doc(db, "settings", "fcm"));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.serviceAccount && typeof data.serviceAccount === "string") {
        localStorage.setItem("fcm_server_key", data.serviceAccount);
        return data.serviceAccount;
      }
    }
  } catch (err) {
    console.warn("Could not fetch FCM settings from Firestore:", err);
  }

  return null;
}

export async function saveStoredFCMKey(keyJson: string): Promise<void> {
  const trimmed = keyJson.trim();
  if (trimmed) {
    localStorage.setItem("fcm_server_key", trimmed);
    await setDoc(doc(db, "settings", "fcm"), {
      serviceAccount: trimmed,
      updatedAt: Date.now(),
      updatedBy: auth.currentUser?.email || "admin",
    }, { merge: true });
  } else {
    localStorage.removeItem("fcm_server_key");
    await deleteDoc(doc(db, "settings", "fcm"));
  }
}

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
    const savedKey = await getStoredFCMKey();
    if (savedKey) {
      try {
        const credentials = JSON.parse(savedKey);
        if (credentials.private_key && credentials.client_email && credentials.project_id) {
          console.log("Found Service Account JSON, sending from client...");
          
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
          if (contentType === "urgent" || contentType === "urgentNews") targetUrl = `/news`;
          if (contentType === "events" || contentType === "activity" || contentType === "activities") targetUrl = `/events/activity/${slugOrId}`;
          if (contentType === "quran" || contentType === "lessons") targetUrl = `/quran`;
          if (contentType === "video" || contentType === "videos") targetUrl = `/watch/${slugOrId}`;
          if (contentType === "leader") targetUrl = `/leader/${slugOrId}`;
          if (contentType === "article" || contentType === "articles") targetUrl = `/articles/${slugOrId}`;
          if (contentType === "news") targetUrl = `/news/${slugOrId}`;

          // Send to each token
          for (let i = 0; i < tokens.length; i++) {
            const v1Payload = {
              message: {
                token: tokens[i],
                notification: {
                  title: title,
                  body: body || undefined,
                  image: imageUrl || undefined
                },
                data: {
                  title: title,
                  body: body || "",
                  contentType: contentType,
                  contentId: slugOrId,
                  url: targetUrl,
                  dir: "rtl",
                  lang: "ar"
                },
                android: {
                  priority: "high",
                  notification: {
                    title: title,
                    body: body || undefined,
                    ticker: title,
                    image: imageUrl || undefined,
                    icon: "ic_launcher",
                    color: "#1e3a8a",
                    sound: "default",
                    channelId: "fcm_high_priority_channel",
                    defaultSound: true,
                    defaultVibrateTimings: true
                  }
                },
                webpush: {
                  headers: {
                    Urgency: "high"
                  },
                  notification: {
                    title: title,
                    body: body || undefined,
                    icon: "/ic_launcher.png",
                    badge: "/ic_launcher.png",
                    image: imageUrl || undefined,
                    dir: "rtl",
                    lang: "ar"
                  },
                  fcm_options: {
                    link: targetUrl
                  }
                }
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
              sentBy: auth.currentUser?.displayName || auth.currentUser?.email || "Auto Broadcast",
              method: "client_side_v1"
            });

            // Queue pending notification for offline users (EXCLUDING prayer notifications)
            const isPrayer = NotificationSyncService.isPrayerNotification({ title, body, contentType });
            if (!isPrayer) {
              await NotificationSyncService.addPendingNotification({
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                title,
                body,
                category: "general",
                contentType,
                contentId: slugOrId,
                imageUrl: imageUrl || "",
                targetUrl,
                createdAt: Date.now(),
                status: "pending",
                isPrayerNotification: false
              });
            }
          } catch (e) {
            console.warn("Failed to record history / queue pending notification", e);
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
