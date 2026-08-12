export class PushNotificationService {
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    return null;
  }

  static async isSubscribed(): Promise<boolean> {
    return false;
  }

  static async subscribeUser(): Promise<boolean> {
    return false;
  }

  static async unsubscribeUser(): Promise<boolean> {
    return true;
  }

  static async triggerPushNotification(title: string, body: string, url: string = "/"): Promise<boolean> {
    return true;
  }
}
