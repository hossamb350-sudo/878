const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

exports.sendPushNotification = functions.firestore
  .document("notifications_queue/{docId}")
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    const docId = context.params.docId;

    try {
      // Fetch all FCM tokens
      const snapshot = await db.collection("fcm_tokens").get();
      const tokens = snapshot.docs.map((doc) => doc.id);

      if (tokens.length === 0) {
        console.log("No FCM tokens found");
        await snap.ref.update({ status: "failed", error: "No FCM tokens found" });
        return null;
      }

      const chunkSize = 500;
      let successCount = 0;
      let failureCount = 0;
      const failedTokens = [];

      for (let i = 0; i < tokens.length; i += chunkSize) {
        const tokenChunk = tokens.slice(i, i + chunkSize);
        
        const message = {
          notification: {
            title: notificationData.title,
            body: notificationData.body,
          },
          data: notificationData.data || {},
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "fcm_high_priority_channel",
              visibility: "PUBLIC",
              notificationPriority: "PRIORITY_MAX",
              defaultSound: true,
              defaultVibrateTimings: true,
              defaultLightSettings: true,
            },
          },
          tokens: tokenChunk,
        };

        if (notificationData.image) {
          message.notification.imageUrl = notificationData.image;
        }

        const response = await messaging.sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;

        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokenChunk[idx]);
            }
          });
        }
      }

      // Cleanup failed/invalid tokens
      if (failedTokens.length > 0) {
        const batch = db.batch();
        failedTokens.forEach((token) => {
          batch.delete(db.collection("fcm_tokens").doc(token));
        });
        await batch.commit();
      }

      // Save to history
      await db.collection("notifications_history").add({
        title: notificationData.title,
        body: notificationData.body,
        contentType: notificationData.contentType || "general",
        contentId: notificationData.contentId || "",
        contentTitle: notificationData.contentTitle || "",
        sentBy: notificationData.senderId || "system",
        successCount,
        failureCount,
        createdAt: Date.now(),
      });

      // Mark the queue item as complete
      await snap.ref.update({
        status: "sent",
        successCount,
        failureCount,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Notification sent: ${successCount} successful, ${failureCount} failed.`);
      return null;
    } catch (error) {
      console.error("Error sending notification:", error);
      await snap.ref.update({
        status: "error",
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });
