import React, { useState } from 'react';
import {
    Home, BarChart3, Clock, Settings,
    ChevronDown, ChevronRight, Lightbulb, ArrowLeft,
    Users, TrendingUp, Filter, Mountain, Play,
} from 'lucide-react';
import { useTeacherTour } from '../../contexts/TeacherTourContext';

// 教員向けタブの定義
const TABS = [
    {
        id: 'home',
        icon: Home,
        label: 'ホーム',
        color: 'from-indigo-500 to-blue-500',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200',
        description: '昨日のクラス学習状況・日付別の集計・生徒一覧が確認できます。',
        features: [
            {
                icon: TrendingUp,
                title: '昨日の総学習時間',
                desc: '前日のクラス全体の合計学習時間を確認できます。カレンダーで複数の日付を選択すると、選択した日の合計を表示します。',
            },
            {
                icon: Users,
                title: '生徒一覧',
                desc: '生徒ごとの学習状況を一覧表示します。最終記録日時や当日の状況を把握するのに役立ちます。',
            },
        ],
    },
    {
        id: 'analytics',
        icon: BarChart3,
        label: '分析',
        color: 'from-violet-500 to-purple-500',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-700',
        borderColor: 'border-violet-200',
        description: '月ごとのクラス学習進捗を多角的なグラフとビジュアルで分析できます。',
        features: [
            {
                icon: Mountain,
                title: '富士山ビュー（クラス進捗）',
                desc: 'クラス全員の月間学習時間を、富士山の頂上（=目標3,776時間）に向かう光るドットで可視化します。ドットをタップ/クリックすると、生徒名と達成率が確認できます。',
            },
            {
                icon: BarChart3,
                title: '生徒別学習時間ランキング',
                desc: '各生徒の月間学習時間を棒グラフで比較できます。誰が頑張っているかが一目でわかります。',
            },
            {
                icon: Filter,
                title: 'フィルター機能',
                desc: '文理（文系/理系）や選択科目でクラスを絞り込んで分析できます。特定のグループの傾向をつかむのに便利です。',
            },
            {
                icon: TrendingUp,
                title: '目標達成状況ダッシュボード',
                desc: '各生徒が設定した学習目標時間とその達成状況（達成率·連続達成日数）を一安で確認できます。達成率が低い順に並び替えることで、フォローが必要な生徒をすぐ発見できます。',
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
        description: '生徒の学習記録がリアルタイムで時系列に流れてきます。',
        features: [
            {
                icon: Clock,
                title: 'リアルタイム記録',
                desc: '生徒が学習を記録するたび、タイムラインに新しいカードが追加されます。科目・時間・理解度などが確認できます。',
            },
            {
                icon: Users,
                title: '生徒の学習状況の把握',
                desc: '誰が今日勉強していて、誰がまだ記録していないかをタイムラインから把握できます。個別フォローのきっかけにもなります。',
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
        description: 'アカウント情報の確認やオンボーディングツアーの再起動ができます。',
        features: [
            {
                icon: Play,
                title: 'ツアーの再起動',
                desc: '設定画面の「使い方ツアーを見る」ボタンから、教員向けコーチマークツアーをいつでも再度起動できます。',
            },
        ],
    },
];

// 教員向けTips
const TIPS = [
    {
        emoji: '✨',
        title: '富士山のドットをタップ/クリックで詳細表示',
        body: '分析タブの富士山ビューで、光る小さなドットをタップまたはクリックすると、その生徒の名前と学習達成率がふわっと表示されます。もう一度タップすると閉じます。',
    },
    {
        emoji: '📅',
        title: 'ホームのカレンダーで複数日を選択',
        body: 'ホーム画面のカレンダーで複数の日付をタップすると、選択した日の合計学習時間が表示されます。週末を除いた平日だけを選んで学習量を把握するなど、柔軟な集計が可能です。',
    },
    {
        emoji: '🔍',
        title: '文理・科目フィルターでグループ分析',
        body: '分析タブのフィルター機能を使うと、文系・理系や選択科目（物理/生物/日本史/世界史）でクラスを絞り込んで分析できます。グループ特有の傾向をつかめます。',
    },
    {
        emoji: '📅',
        title: '月ごとの進捗を振り返る',
        body: '分析タブの「＜ ＞」ボタンで表示する月を切り替えると、過去の月の学習状況も確認できます。学習量の波やイベント前後の変化を振り返れます。',
    },
    {
        emoji: '👑',
        title: '目標達成バッジの進化を確認する',
        body: '生徒が設定した学習目標時間を連続でクリアし続けると、タイムラインのアイコンが進化します。3日連続で🥉、7日で🥈、14日で🥇、21日以上連続達成で👑（王冠）が付与されます。バッジの種類を見ることで、誰が目標に向き合えているかが一目でわかります。',
    },
];

// 展開可能なタブカード
const TabCard = ({ tab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const Icon = tab.icon;

    return (
        <div className={`rounded-2xl border ${tab.borderColor} overflow-hidden shadow-sm`}>
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
const TeacherUserGuideView = ({ onBack }) => {
    const { startTour } = useTeacherTour();

    const handleStartTour = () => {
        onBack();
        setTimeout(() => {
            startTour();
        }, 350);
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
                    <h1 className="text-base font-bold text-gray-900">使い方ガイド（教員）</h1>
                    <p className="text-xs text-gray-500">各機能の説明と便利なTips</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6 pb-12">
                {/* ヒーローバナー */}
                <div
                    className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #065f46 100%)' }}
                >
                    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
                    <div className="relative">
                        <div className="text-2xl mb-1">📖</div>
                        <h2 className="text-lg font-bold mb-1">Project 3776 教員画面の使い方</h2>
                        <p className="text-sm text-emerald-100 leading-relaxed mb-3">
                            各タブの機能をわかりやすく解説します。<br />
                            コーチマークツアーで実際の画面を確認することもできます！
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
                                    <div className="text-xs text-gray-500 leading-relaxed">{tip.body}</div>
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

export default TeacherUserGuideView;
