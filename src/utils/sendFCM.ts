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
      console.log("FCM broadcast triggered successfully");
    }
  } catch (e) {
    console.error("Error triggering FCM broadcast:", e);
  }
}
