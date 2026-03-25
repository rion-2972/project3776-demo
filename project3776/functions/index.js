const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

// Firebase Admin初期化
admin.initializeApp();

/**
 * 平日（月〜金）18:00 JST に課題通知を送信
 * Cron: 0 18 * * 1-5 (UTC: 0 9 * * 1-5)
 */
exports.sendWeekdayAssignmentNotifications = onSchedule({
    schedule: '0 9 * * 1-5', // UTC 9:00 = JST 18:00
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1'
}, async (event) => {
    console.log('[Weekday Notification] 平日18時の通知を開始します');
    await sendAssignmentNotifications();
});

/**
 * 週末（土・日）14:00 JST に課題通知を送信
 * Cron: 0 14 * * 0,6 (UTC: 0 5 * * 0,6)
 */
exports.sendWeekendAssignmentNotifications = onSchedule({
    schedule: '0 5 * * 0,6', // UTC 5:00 = JST 14:00
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1'
}, async (event) => {
    console.log('[Weekend Notification] 週末14時の通知を開始します');
    await sendAssignmentNotifications();
});

/**
 * 課題通知を送信する共通ロジック
 */
async function sendAssignmentNotifications() {
    try {
        const db = admin.firestore();
        const messaging = admin.messaging();

        // 1. アクティブな課題を取得（期限が現在以降）
        const now = new Date();
        const assignmentsSnapshot = await db.collection('assignments')
            .where('dueDate', '>=', now.toISOString().split('T')[0])
            .get();

        if (assignmentsSnapshot.empty) {
            console.log('[Notification] アクティブな課題がありません');
            return;
        }

        const assignments = assignmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[Notification] ${assignments.length}件のアクティブな課題を検出`);

        // 2. 全ユーザーのFCMトークンを取得
        const usersSnapshot = await db.collection('users').get();
        const tokens = [];

        for (const userDoc of usersSnapshot.docs) {
            const tokensSnapshot = await db.collection('users')
                .doc(userDoc.id)
                .collection('fcmTokens')
                .get();

            tokensSnapshot.docs.forEach(tokenDoc => {
                tokens.push(tokenDoc.data().token);
            });
        }

        if (tokens.length === 0) {
            console.log('[Notification] 通知を受け取るユーザーがいません');
            return;
        }

        console.log(`[Notification] ${tokens.length}個のトークンに通知を送信します`);

        // 3. 通知メッセージを作成
        const assignmentCount = assignments.length;
        const title = 'Project3776 - 課題のお知らせ';
        const body = `現在、${assignmentCount}件の課題があります。学習を忘れずに！`;

        // 4. マルチキャスト送信
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                type: 'assignment_reminder',
                count: String(assignmentCount)
            },
            tokens: tokens
        };

        const response = await messaging.sendEachForMulticast(message);

        console.log(`[Notification] 送信完了: 成功 ${response.successCount}件, 失敗 ${response.failureCount}件`);

        // 5. 無効なトークンを削除
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.error(`[Notification] トークン送信失敗: ${resp.error}`);
                }
            });

            // 無効なトークンをFirestoreから削除
            for (const token of failedTokens) {
                const tokenQuery = await db.collectionGroup('fcmTokens')
                    .where('token', '==', token)
                    .get();

                for (const doc of tokenQuery.docs) {
                    await doc.ref.delete();
                    console.log(`[Notification] 無効なトークンを削除: ${token}`);
                }
            }
        }

        return {
            success: true,
            sentCount: response.successCount,
            failedCount: response.failureCount
        };

    } catch (error) {
        console.error('[Notification] エラーが発生しました:', error);
        throw error;
    }
}
