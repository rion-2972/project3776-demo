// Firebase Cloud Messaging Service Worker
// このファイルはバックグラウンドでプッシュ通知を受信・表示するために必要です

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase設定
// 注: 本番環境では環境変数から読み込むことが推奨されますが、
// Service Workerでは process.env が使えないため、ここに直接記述します
// または、ビルド時に置換する仕組みを導入してください
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);

// Messaging インスタンス取得
const messaging = firebase.messaging();

// バックグラウンドメッセージハンドラ
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] バックグラウンドメッセージを受信:', payload);

    const notificationTitle = payload.notification?.title || 'Project3776';
    const notificationOptions = {
        body: payload.notification?.body || '新しい通知があります',
        icon: '/Project3776.png',
        badge: '/Project3776.png',
        data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] 通知がクリックされました:', event);
    event.notification.close();

    // アプリを開く
    event.waitUntil(
        clients.openWindow('/')
    );
});
