import React, { useState } from 'react';
import {
    Home, PenTool, Clock, BarChart3, Settings,
    ChevronDown, ChevronRight, Lightbulb, ArrowLeft,
    CheckSquare, Timer, Zap, Users, BookOpen, Sparkles, Target, Play
} from 'lucide-react';
import { useTour } from '../../contexts/TourContext';

// タブの定義
const TABS = [
    {
        id: 'home',
        icon: Home,
        label: 'ホーム',
        color: 'from-indigo-500 to-blue-500',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200',
        description: '学習の起点。タスクの確認や今日の状況が一目でわかる画面です。',
        features: [
            {
                icon: CheckSquare,
                title: 'クラスの課題',
                desc: '先生から出された課題の一覧を確認できます。完了したらチェックをつけましょう。チェックと同時に効果音・バイブレーションが鳴ります！',
            },
            {
                icon: Timer,
                title: '日課・マイプラン',
                desc: '自分でルーティンや学習プランを設定できます。毎日の積み重ねが大切です。▶ボタンで直接スタートウォッチが起動できます。',
            },
            {
                icon: BarChart3,
                title: '今日の学習時間',
                desc: '今日の合計学習時間と、直近7日間の学習グラフを確認できます。カレンダー上の日付をタップすると、その日の記録も見られます。',
            },
        ],
    },
    {
        id: 'record',
        icon: PenTool,
        label: '記録する',
        color: 'from-violet-500 to-purple-500',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-700',
        borderColor: 'border-violet-200',
        description: '勉強が終わったら、ここで学習内容を記録しましょう。',
        features: [
            {
                icon: BookOpen,
                title: '学習内容の入力',
                desc: '勉強した「科目」「参考書」「時間」「理解度」「ひとことメモ」を記録できます。記録が積み重なるほど成長がわかります。',
            },
            {
                icon: Timer,
                title: 'ストップウォッチ機能',
                desc: '学習時間はストップウォッチで計測できます。他のタブに切り替えてもストップウォッチは裏で動き続けるので、後から時間を確認することもできます。',
            },
            {
                icon: Zap,
                title: 'クイック入力',
                desc: '直近の記録から学習内容をワンタップで呼び出せます。毎日同じ教材を使うときに特に便利です！',
            },
        ],
    },
    {
        id: 'timeline',
        icon: Clock,
        label: 'タイムライン',
        color: 'from-teal-500 to-emerald-500',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-700',
        borderColor: 'border-teal-200',
        description: 'みんなの学習記録がリアルタイムで流れてきます。お互いに刺激し合いましょう。',
        features: [
            {
                icon: Users,
                title: 'みんなの記録を見る',
                desc: '同じアプリを使っている仲間の学習記録がタイムラインに表示されます。誰が何を頑張っているかがわかります。',
            },
            {
                icon: Sparkles,
                title: 'リアクション機能',
                desc: '友達の記録に「🔥がんばった！」「👍普通」「💦いまいち」などのスタンプを送れます。互いに励まし合いましょう！',
            },
            {
                icon: CheckSquare,
                title: 'ストリーク（連続記録）と目標達成バッジ',
                desc: '何日連続で学習を記録できているかが🔥の数で表示されます。さらに、設定した目標時間を連続で達成し続けると、一段上の特別なバッジが付与されます：3日達成で🥉、7日で🥈、14日で🥇、21日以上の連続達成で👑（王冠）が輝きます。',
            },
        ],
    },
    {
        id: 'statistics',
        icon: BarChart3,
        label: '統計',
        color: 'from-orange-500 to-amber-500',
        bgLight: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        description: 'サイドバーの「学習記録の統計」から開けます。自分の頑張りを振り返れます。',
        features: [
            {
                icon: BarChart3,
                title: '週別・科目別グラフ',
                desc: '週ごとの学習時間の変化や、どの科目を何時間勉強したかがグラフで一目でわかります。',
            },
            {
                icon: CheckSquare,
                title: '累積学習時間',
                desc: 'これまでの総学習時間を記録しています。長期間使うほど、自分の頑張りが数字に積み重なっていきます。',
            },
        ],
    },
    {
        id: 'settings',
        icon: Settings,
        label: '設定',
        color: 'from-gray-500 to-slate-500',
        bgLight: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        description: 'サイドバーの「設定」から開けます。アプリをカスタマイズできます。',
        features: [
            {
                icon: BookOpen,
                title: '参考書の管理',
                desc: '使っている参考書を登録しておくと、「記録する」画面でタップして素早く選べるようになります。',
            },
            {
                icon: Sparkles,
                title: '完了エフェクトの設定',
                desc: 'タスク完了時の演出（エフェクトや効果音）を自分好みにカスタマイズできます。',
            },
            {
                icon: Target,
                title: '学習目標の設定',
                desc: '平日・休日や曜日ごとに1日の目標時間を設定できます。目標を達成し続けるとタイムラインのアイコンが進化します！',
            },
            {
                icon: CheckSquare,
                title: 'その他の設定',
                desc: '通知、言語設定、プロフィールのクラス情報なども変更できます。',
            },
        ],
    },
];

// お役立ちTips
const TIPS = [
    {
        emoji: '⏱️',
        title: 'タイマーは裏で動き続ける',
        body: '「記録する」タブのストップウォッチを起動したまま別のタブに移動してもOK。タイマーはバックグラウンドで動いているので、戻ってきたときに正確な時間が表示されます。',
    },
    {
        emoji: '▶️',
        title: 'ホームから直接タイマーを起動できる',
        body: '「ホーム」タブの課題・日課・マイプランの各項目にある ▶ ボタンをタップすると、その科目の内容が自動的にセットされた状態でストップウォッチが起動します。',
    },
    {
        emoji: '⚡',
        title: 'クイック入力で記録が10秒以内に',
        body: '「記録する」タブの下部にある「クイック入力」では、直近の学習履歴からワンタップで科目・参考書などを自動入力できます。毎日同じルーティンの人には特に便利！',
    },
    {
        emoji: '🔥',
        title: '連続記録はモチベーションの源',
        body: 'タイムライン画面のストリーク（連続学習日数）は、毎日記録するたびに伸びていきます。途切れると0に戻るので、継続する意欲に！',
    },
    {
        emoji: '👑',
        title: '目標を達成し続けるとバッジが進化する',
        body: '設定した学習目標時間を連続でクリアするたびに、タイムラインのアイコンが進化します。3日達成で🥉、7日で🥈、14日で🥇、そして21日以上連続で目標を完全達成すると名前の横に👑（王冠）が輝きます！',
    },
    {
        emoji: '📚',
        title: '参考書を先に登録しておくと便利',
        desc: '設定画面で参考書を登録しておくと、学習記録時に一覧からタップして選ぶだけになります。毎回手入力する手間がなくなります。',
    },
];

// 展開可能なタブカード
const TabCard = ({ tab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const Icon = tab.icon;

    return (
        <div className={`rounded-2xl border ${tab.borderColor} overflow-hidden shadow-sm`}>
            {/* ヘッダー */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={`w-full flex items-center gap-3 p-4 ${tab.bgLight} text-left transition-all`}
            >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${tab.color} shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`font-bold text-base ${tab.textColor}`}>{tab.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{tab.description}</div>
                </div>
                {isOpen
                    ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                }
            </button>

            {/* 展開時の内容 */}
            {isOpen && (
                <div className="divide-y divide-gray-100">
                    {tab.features.map((feature, idx) => {
                        const FIcon = feature.icon;
                        return (
                            <div key={idx} className="flex gap-3 p-4 bg-white">
                                <div className={`mt-0.5 p-1.5 rounded-lg ${tab.bgLight} shrink-0`}>
                                    <FIcon className={`w-4 h-4 ${tab.textColor}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-800 mb-0.5">{feature.title}</div>
                                    <div className="text-xs text-gray-500 leading-relaxed">{feature.desc}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// メインコンポーネント
const UserGuideView = ({ onBack }) => {
    const { startTour } = useTour();

    const handleStartTour = () => {
        onBack(); // まずガイド画面を閉じる
        // 少し遅延してからツアーを開始（画面遷移を待つ）
        setTimeout(() => {
            startTour();
        }, 300);
    };
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-base font-bold text-gray-900">使い方ガイド</h1>
                    <p className="text-xs text-gray-500">アプリの機能をまとめてチェック</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6 pb-12">
                {/* ヒーローバナー */}
                <div
                    className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)' }}
                >
                    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
                    <div className="relative">
                        <div className="text-2xl mb-1">📖</div>
                        <h2 className="text-lg font-bold mb-1">Project 3776 の使い方</h2>
                        <p className="text-sm text-indigo-100 leading-relaxed mb-3">
                            各タブをタップして機能の詳細を確認できます。<br />
                            知らなかった便利機能が見つかるかも！
                        </p>
                        {/* インタラクティブツアー起動ボタン */}
                        <button
                            onClick={handleStartTour}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border border-white/30"
                        >
                            <Play className="w-4 h-4" />
                            インタラクティブツアーを開始
                        </button>
                    </div>
                </div>

                {/* タブ説明セクション */}
                <section>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                        各タブの機能
                    </h2>
                    <div className="space-y-3">
                        {TABS.map(tab => (
                            <TabCard key={tab.id} tab={tab} />
                        ))}
                    </div>
                </section>

                {/* Tipsセクション */}
                <section>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        知っていると便利なTips
                    </h2>
                    <div className="space-y-3">
                        {TIPS.map((tip, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-4 border border-yellow-100 shadow-sm flex gap-3"
                            >
                                <div className="text-2xl shrink-0">{tip.emoji}</div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800 mb-1">{tip.title}</div>
                                    <div className="text-xs text-gray-500 leading-relaxed">{tip.body || tip.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* フッターメッセージ */}
                <div className="text-center text-xs text-gray-400 pt-2">
                    わからないことはいつでも磯﨑に聞いてください 😊
                </div>
            </div>
        </div>
    );
};

export default UserGuideView;
