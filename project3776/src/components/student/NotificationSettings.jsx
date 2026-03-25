import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useFcmToken } from '../../hooks/useFcmToken';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * 通知設定コンポーネント
 * ユーザーが通知を有効/無効にできるUI
 */
export const NotificationSettings = () => {
    const { token, notificationPermission, requestPermission } = useFcmToken();
    const { t } = useLanguage();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleEnableNotifications = async () => {
        setIsRequesting(true);
        try {
            await requestPermission();
        } catch (error) {
            console.error('通知権限のリクエストに失敗しました:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const getStatusText = () => {
        switch (notificationPermission) {
            case 'granted':
                return '通知が有効です';
            case 'denied':
                return '通知が拒否されています。ブラウザの設定から許可してください。';
            default:
                return '通知を有効にすると、課題のリマインダーを受け取れます。';
        }
    };

    const getStatusColor = () => {
        switch (notificationPermission) {
            case 'granted':
                return 'text-green-600';
            case 'denied':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        {notificationPermission === 'granted' ? (
                            <Bell className="w-5 h-5 text-green-600" />
                        ) : (
                            <BellOff className="w-5 h-5 text-gray-400" />
                        )}
                        <h3 className="text-lg font-semibold">プッシュ通知</h3>
                    </div>

                    <p className={`text-sm ${getStatusColor()} mb-4`}>
                        {getStatusText()}
                    </p>

                    {notificationPermission === 'granted' && token && (
                        <div className="text-xs text-gray-400 mb-2">
                            <p>配信スケジュール:</p>
                            <ul className="list-disc list-inside ml-2">
                                <li>平日（月〜金）: 18:00</li>
                                <li>週末（土・日）: 14:00</li>
                            </ul>
                        </div>
                    )}

                    {notificationPermission === 'default' && (
                        <button
                            onClick={handleEnableNotifications}
                            disabled={isRequesting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRequesting ? '処理中...' : '通知を有効にする'}
                        </button>
                    )}

                    {notificationPermission === 'denied' && (
                        <div className="text-xs text-gray-500 mt-2">
                            <p>ブラウザの設定から通知を許可してください:</p>
                            <ol className="list-decimal list-inside ml-2 mt-1">
                                <li>ブラウザのアドレスバー左側の鍵アイコンをクリック</li>
                                <li>「通知」の設定を「許可」に変更</li>
                                <li>ページを再読み込み</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
