import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Attempt to initialize using standard FIREBASE_* environment variables
    // required for the Admin SDK
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
      console.log("Firebase Admin SDK initialized successfully");
    } else {
      console.log("Firebase Admin SDK credentials missing (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح (Missing or invalid Authorization header)" });
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
      return res.status(401).json({ error: "جلسة تسجيل الدخول منتهية أو غير صالحة" });
    }

    const userData = await userRes.json();
    const callerUser = userData?.users?.[0];
    const callerEmail = callerUser?.email?.toLowerCase();
    const callerUid = callerUser?.localId;

    if (!callerUid) {
      return res.status(401).json({ error: "لم يتم التعرف على المستخدم" });
    }

    // 2. Check if caller is Admin or Manager in Firestore
    const projectIdStr = "gen-lang-client-0926657815";
    const databaseId = "ai-studio-3ecd4bf3-759a-4f54-93a0-c6d66639984e";
    const isSuperAdmin = callerEmail === "hossamb350@gmail.com";
    let hasPermission = isSuperAdmin;

    if (!hasPermission) {
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectIdStr}/databases/${databaseId}/documents/users/${callerUid}`;
      const userDocRes = await fetch(userDocUrl);
      if (userDocRes.ok) {
        const userDocData = await userDocRes.json();
        const role = userDocData?.fields?.role?.stringValue;
        if (role === "admin" || role === "manager") {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: "ليس لديك صلاحية إرسال الإشعارات (Admins & Managers Only)" });
    }

    const { title, body, image, contentType, contentId, contentTitle, data: customData } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ error: "عنوان ونص الإشعار مطلوبان" });
    }

    // 3. Fetch device FCM tokens from Firestore fcm_tokens collection
    const fcmTokensUrl = `https://firestore.googleapis.com/v1/projects/${projectIdStr}/databases/${databaseId}/documents/fcm_tokens?pageSize=500`;
    const tokensRes = await fetch(fcmTokensUrl);
    let tokens = [];
    if (tokensRes.ok) {
      const tokensJson = await tokensRes.json();
      if (tokensJson.documents && Array.isArray(tokensJson.documents)) {
        tokens = tokensJson.documents
          .map(d => d.fields?.token?.stringValue || d.name.split("/").pop())
          .filter(Boolean);
      }
    }

    let successCount = 0;
    let failureCount = 0;

    // Send using Firebase Admin SDK (FCM HTTP v1 API)
    if (admin.apps.length > 0 && tokens.length > 0) {
      // Chunk tokens (Multicast limit is 500)
      const chunks = [];
      for (let i = 0; i < tokens.length; i += 500) {
        chunks.push(tokens.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const message = {
          tokens: chunk,
          notification: {
            title: title,
            body: body,
            ...(image && { imageUrl: image })
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'fcm_high_priority_channel',
              sound: 'default',
              clickAction: 'FCM_PLUGIN_ACTIVITY',
            }
          },
          data: {
            title: title || "",
            body: body || "",
            image: image || "",
            contentType: contentType || "",
            contentId: contentId || "",
            url: customData?.url || "",
            ...(customData || {})
          }
        };

        try {
          const response = await admin.messaging().sendEachForMulticast(message);
          successCount += response.successCount;
          failureCount += response.failureCount;
          
          if (response.failureCount > 0) {
             console.warn("Some tokens failed:", response.responses.filter(r => !r.success).map(r => r.error));
          }
        } catch (err) {
          console.error("Firebase Admin messaging error:", err);
          failureCount += chunk.length;
        }
      }
    } else if (tokens.length > 0) {
      // Fallback to legacy key if admin SDK fails to load credentials but legacy key exists in Vercel
      const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
      if (fcmServerKey) {
        const chunks = [];
        for (let i = 0; i < tokens.length; i += 500) {
          chunks.push(tokens.slice(i, i + 500));
        }

        for (const chunk of chunks) {
          const fcmPayload = {
            registration_ids: chunk,
            notification: {
              title: title,
              body: body,
              image: image || undefined,
              sound: "default",
              click_action: "FCM_PLUGIN_ACTIVITY",
              android_channel_id: "fcm_high_priority_channel"
            },
            data: {
              title: title,
              body: body,
              image: image || "",
              contentType: contentType || "",
              contentId: contentId || "",
              url: customData?.url || "",
              ...(customData || {})
            },
            priority: "high"
          };

          const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `key=${fcmServerKey}`
            },
            body: JSON.stringify(fcmPayload)
          });
          if (fcmRes.ok) {
            const resData = await fcmRes.json();
            successCount += resData.success || 0;
            failureCount += resData.failure || 0;
          } else {
            failureCount += chunk.length;
          }
        }
      } else {
        // No admin SDK and no legacy key
        failureCount = tokens.length;
        console.warn("No Firebase credentials configured in Vercel. Notifications cannot be sent.");
      }
    }

    // 4. Record to notifications_history in Firestore via REST API
    const historyDocUrl = `https://firestore.googleapis.com/v1/projects/${projectIdStr}/databases/${databaseId}/documents/notifications_history`;
    const now = Date.now();
    const historyPayload = {
      fields: {
        title: { stringValue: title },
        body: { stringValue: body },
        imageUrl: { stringValue: image || "" },
        contentType: { stringValue: contentType || "" },        
        contentId: { stringValue: contentId || "" },
        contentTitle: { stringValue: contentTitle || title },
        successCount: { integerValue: String(successCount) },
        failureCount: { integerValue: String(failureCount) },
        tokensCount: { integerValue: String(tokens.length) },
        createdAt: { integerValue: String(now) },
        sentBy: { stringValue: callerEmail || callerUid }
      }
    };

    await fetch(historyDocUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(historyPayload)
    }).catch(e => console.warn("Failed to write to notification history:", e));

    return res.status(200).json({
      success: true,
      successCount,
      failureCount,
      totalTokens: tokens.length,
      message: tokens.length > 0 
        ? `تم تجهيز وإرسال الإشعار لـ ${tokens.length} جهاز بنجاح (عبر سيرفر آمن)`
        : "تم حفظ الإشعار في السجل بنجاح (لا توجد أجهزة نشطة مسجلة حالياً)"
    });
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return res.status(500).json({
      error: error.message || "حدث خطأ غير متوقع أثناء إرسال الإشعار"
    });
  }
}
