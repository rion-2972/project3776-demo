import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * FCMトークンを管理するカスタムフック
 * - 通知権限をリクエスト
 * - FCMトークンを取得してFirestoreに保存
 * - フォアグラウンドメッセージを処理
 */
export const useFcmToken = () => {
    const [token, setToken] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [error, setError] = useState(null);

    useEffect(() => {
        const requestPermissionAndGetToken = async () => {
            try {
                // ユーザーがログインしているか確認
                const user = auth.currentUser;
                if (!user) {
                    console.log('[useFcmToken] ユーザーが未ログインのため、トークン取得をスキップします');
                    return;
                }

                // 通知権限を確認
                if (Notification.permission === 'granted') {
                    await getFcmToken(user.uid);
                } else if (Notification.permission === 'default') {
                    // 権限がまだリクエストされていない場合は、ここでは何もしない
                    // ユーザーが明示的に有効化するまで待つ
                    console.log('[useFcmToken] 通知権限がまだリクエストされていません');
                } else {
                    console.log('[useFcmToken] 通知権限が拒否されています');
                }
            } catch (err) {
                console.error('[useFcmToken] エラー:', err);
                setError(err.message);
            }
        };

        requestPermissionAndGetToken();
    }, []);

    /**
     * FCMトークンを取得してFirestoreに保存
     */
    const getFcmToken = async (userId) => {
        try {
            const messaging = getMessaging();

            // VAPIDキーは Firebase Console > Project Settings > Cloud Messaging で取得
            // 注: 実際のVAPIDキーに置き換えてください
            const vapidKey = 'YOUR_VAPID_KEY';

            const currentToken = await getToken(messaging, { vapidKey });

            if (currentToken) {
                console.log('[useFcmToken] FCMトークン取得成功:', currentToken);
                setToken(currentToken);

                // Firestoreに保存
                await saveFcmTokenToFirestore(userId, currentToken);

                // フォアグラウンドメッセージのリスナーを設定
                onMessage(messaging, (payload) => {
                    console.log('[useFcmToken] フォアグラウンドメッセージ受信:', payload);

                    // カスタム通知を表示（アプリがフォアグラウンドの場合）
                    if (Notification.permission === 'granted') {
                        new Notification(payload.notification?.title || 'Project3776', {
                            body: payload.notification?.body || '新しい通知があります',
                            icon: '/Project3776.png'
                        });
                    }
                });
            } else {
                console.log('[useFcmToken] トークンの取得に失敗しました。権限を確認してください。');
            }
        } catch (err) {
            console.error('[useFcmToken] トークン取得エラー:', err);
            setError(err.message);
        }
    };

    /**
     * FCMトークンをFirestoreに保存
     */
    const saveFcmTokenToFirestore = async (userId, fcmToken) => {
        try {
            const tokenRef = doc(db, 'users', userId, 'fcmTokens', fcmToken);
            await setDoc(tokenRef, {
                token: fcmToken,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            console.log('[useFcmToken] トークンをFirestoreに保存しました');
        } catch (err) {
            console.error('[useFcmToken] Firestore保存エラー:', err);
            throw err;
        }
    };

    /**
     * 通知権限をリクエストする関数（ユーザーアクションから呼び出す）
     */
    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                const user = auth.currentUser;
                if (user) {
                    await getFcmToken(user.uid);
                }
            }

            return permission;
        } catch (err) {
            console.error('[useFcmToken] 権限リクエストエラー:', err);
            setError(err.message);
            throw err;
        }
    };

    return {
        token,
        notificationPermission,
        error,
        requestPermission
    };
};
