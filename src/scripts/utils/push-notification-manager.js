import CONFIG from '../config';

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = null;
    this.isSupported = this._checkSupport();
  }

  async initialize() {
    if (!this.isSupported) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      await navigator.serviceWorker.ready;
      await this._getVapidKey();
      await this._restoreSubscription();

      return true;
    } catch (error) {
      return false;
    }
  }

  async isSubscribed() {
    if (!this.registration) return false;
    const subscription = await this.registration.pushManager.getSubscription();
    return !!subscription;
  }

  getPermissionStatus() {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }  async subscribe() {
    if (!this.registration || !this.vapidPublicKey) {
      throw new Error('Service worker or VAPID key not available');
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permission not granted');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.vapidPublicKey
      });

      this.subscription = subscription;
      await this._saveSubscription(subscription);
      return subscription;
    } catch (error) {
      throw new Error('Failed to subscribe to push notifications: ' + error.message);
    }
  }async unsubscribe() {
    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await this._removeSubscription();
      this.subscription = null;
    }  }

  async sendNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const defaultOptions = {
      icon: '/images/logo.png',
      badge: '/favicon.png',
      tag: 'dicoding-story-' + Date.now(),
      data: {
        timestamp: Date.now(),
        url: '#/'
      },
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false
    };

    const notificationOptions = { ...defaultOptions, ...options };

    const notification = new Notification(title, {
      body,
      ...notificationOptions
    });

    notification.onclick = () => {
      window.focus();
      if (notificationOptions.data?.url) {
        window.location.hash = notificationOptions.data.url;
      }
      notification.close();
    };

    const autoCloseTime = options.autoClose !== false ? (options.autoCloseTime || 6000) : null;
    if (autoCloseTime) {
      setTimeout(() => {
        notification.close();
      }, autoCloseTime);
    }

    return notification;
  }

  _checkSupport() {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    return hasServiceWorker && hasPushManager && hasNotification;
  }  async _getVapidKey() {
    
    this.vapidPublicKey = this._urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
  }

  async _restoreSubscription() {
    if (!this.registration) return;
    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      this.subscription = subscription;
    }
  }  async _saveSubscription(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const subscriptionData = subscription.toJSON();
      const requestBody = {
        endpoint: subscriptionData.endpoint,
        keys: {
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth
        }
      };

      await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
    } catch (error) {
    }
  }  async _removeSubscription() {
    if (!this.subscription) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const subscriptionData = this.subscription.toJSON();
      const requestBody = {
        endpoint: subscriptionData.endpoint
      };

      await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
    } catch (error) {
    }
  }

  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default PushNotificationManager;
