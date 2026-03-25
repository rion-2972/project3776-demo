import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Target, Check, X, ChevronRight } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import TimeInput from './TimeInput';

// ==========================================
// 定数定義
// ==========================================
const DAY_NAMES = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
const DAY_SHORT = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKEND_DAYS = [0, 6]; // 日=0, 土=6

// デフォルトの目標時間（分）
const DEFAULT_WEEKDAY = 240; // 4時間
const DEFAULT_WEEKEND = 300;  // 5時間

// 設定可能な最低時間（分）
const MIN_WEEKDAY = 120; // 最低2時間
const MIN_WEEKEND = 180; // 最低3時間

// ==========================================
// 時間フォーマット用ユーティリティ
// ==========================================
const formatMinutes = (minutes) => {
    const m = Number(minutes) || 0;
    if (m === 0) return '未設定';
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h === 0) return `${rem}分`;
    if (rem === 0) return `${h}時間`;
    return `${h}時間${rem}分`;
};

// ==========================================
// 目標設定カード（1行）
// ==========================================
const GoalRow = ({ label, minutes, dayIndex, onEdit }) => (
    <button
        type="button"
        onClick={() => onEdit(dayIndex, label)}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-indigo-50 transition active:bg-indigo-100"
    >
        <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${minutes ? 'text-indigo-600' : 'text-gray-300'}`}>
                {formatMinutes(minutes)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
    </button>
);

// ==========================================
// メインコンポーネント
// ==========================================
const StudyGoalSettingsView = ({ onBack }) => {
    const { user } = useAuth();

    // モード: 'basic' (平日/休日) | 'advanced' (曜日ごと)
    const [mode, setMode] = useState('basic');

    // 目標時間ステート（分単位）
    const [weekdayGoal, setWeekdayGoal] = useState(DEFAULT_WEEKDAY);
    const [weekendGoal, setWeekendGoal] = useState(DEFAULT_WEEKEND);
    const [weeklyGoals, setWeeklyGoals] = useState({
        0: DEFAULT_WEEKEND,  // 日
        1: DEFAULT_WEEKDAY,  // 月
        2: DEFAULT_WEEKDAY,  // 火
        3: DEFAULT_WEEKDAY,  // 水
        4: DEFAULT_WEEKDAY,  // 木
        5: DEFAULT_WEEKDAY,  // 金
        6: DEFAULT_WEEKEND,  // 土
    });

    // TimeInput ボトムシートの表示制御
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null);  // { key: 'weekday'|'weekend'|<0-6>, label: string }
    const [pickerValue, setPickerValue] = useState(0);

    // 保存ステート
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ------------------------------------------
    // Firestore から既存の目標を読み込む
    // ------------------------------------------
    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (!snap.exists()) return;
                const goals = snap.data().studyGoals;
                if (!goals) return;

                if (goals.mode) setMode(goals.mode);
                if (goals.weekday != null) setWeekdayGoal(goals.weekday);
                if (goals.weekend != null) setWeekendGoal(goals.weekend);
                if (goals.weekly) setWeeklyGoals(prev => ({ ...prev, ...goals.weekly }));
            } catch (e) {
                console.error('学習目標の読み込みエラー:', e);
            }
        };
        load();
    }, [user]);

    // ------------------------------------------
    // ピッカーを開く
    // ------------------------------------------
    const openPicker = useCallback((key, label) => {
        let currentVal = 0;
        if (key === 'weekday') currentVal = weekdayGoal;
        else if (key === 'weekend') currentVal = weekendGoal;
        else currentVal = weeklyGoals[key] ?? 0;

        setPickerTarget({ key, label });
        setPickerValue(currentVal);
        setPickerVisible(true);
    }, [weekdayGoal, weekendGoal, weeklyGoals]);

    // ------------------------------------------
    // ピッカーで値が変わったとき（リアルタイム反映）
    // ------------------------------------------
    const handlePickerChange = useCallback((minutes) => {
        setPickerValue(minutes);
    }, []);

    // ------------------------------------------
    // ピッカーを確定して閉じる
    // ------------------------------------------
    const confirmPicker = useCallback(() => {
        if (!pickerTarget) return;
        const { key } = pickerTarget;

        // 最低時間の制限チェック
        const isWeekend =
            key === 'weekend' ||
            key === 0 ||
            key === 6;
        const minVal = isWeekend ? MIN_WEEKEND : MIN_WEEKDAY;
        const minLabel = isWeekend ? '3時間（180分）' : '2時間（120分）';
        let finalValue = pickerValue;

        if (finalValue < minVal) {
            alert(`この曜日区分の目標時間は最低${minLabel}から設定可能です。自動的に最低値に調整します。`);
            finalValue = minVal;
        }

        if (key === 'weekday') {
            setWeekdayGoal(finalValue);
        } else if (key === 'weekend') {
            setWeekendGoal(finalValue);
        } else {
            setWeeklyGoals(prev => ({ ...prev, [key]: finalValue }));
        }
        setPickerVisible(false);
        setPickerTarget(null);
    }, [pickerTarget, pickerValue]);

    // ------------------------------------------
    // Firestore へ保存
    // ------------------------------------------
    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                studyGoals: {
                    mode,
                    weekday: weekdayGoal,
                    weekend: weekendGoal,
                    weekly: weeklyGoals,
                }
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            console.error('学習目標の保存エラー:', e);
            alert('保存に失敗しました。もう一度お試しください。');
        } finally {
            setSaving(false);
        }
    };

    // ------------------------------------------
    // レンダリング
    // ------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                        <Target className="w-5 h-5 text-indigo-500" />
                        <h1 className="text-lg font-bold text-gray-900">学習目標の設定</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto w-full px-4 pt-5 pb-32 space-y-4">
                {/* 説明文 */}
                <p className="text-sm text-gray-500 leading-relaxed">
                    1日の学習時間の目標を設定しましょう。<br />
                    平日・休日でまとめて設定するか、曜日ごとに細かく設定するかを選べます。
                </p>

                {/* モード切り替え */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">設定モード</p>
                        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setMode('basic')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'basic'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                平日 / 休日
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('advanced')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'advanced'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                曜日ごと
                            </button>
                        </div>
                    </div>

                    {/* ── 基本設定: 平日 / 休日 ── */}
                    {mode === 'basic' && (
                        <div className="divide-y divide-gray-100">
                            <GoalRow
                                label="平日（月〜金）"
                                minutes={weekdayGoal}
                                dayIndex="weekday"
                                onEdit={openPicker}
                            />
                            <GoalRow
                                label="休日（土・日）"
                                minutes={weekendGoal}
                                dayIndex="weekend"
                                onEdit={openPicker}
                            />
                        </div>
                    )}

                    {/* ── 詳細設定: 曜日ごと ── */}
                    {mode === 'advanced' && (
                        <div className="divide-y divide-gray-100">
                            {DAY_NAMES.map((name, index) => (
                                <GoalRow
                                    key={index}
                                    label={
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${WEEKEND_DAYS.includes(index)
                                                    ? 'bg-orange-100 text-orange-600'
                                                    : 'bg-indigo-50 text-indigo-600'
                                                    }`}
                                            >
                                                {DAY_SHORT[index]}
                                            </span>
                                            {name}
                                        </span>
                                    }
                                    minutes={weeklyGoals[index]}
                                    dayIndex={index}
                                    onEdit={openPicker}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ヒント */}
                <div className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-indigo-700 leading-relaxed">
                    💡 各行をタップすると、学習記録と同じ方法で目標時間を入力できます。
                </div>
            </div>

            {/* 保存ボタン（固定フッター） */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
                <div className="max-w-md mx-auto">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all shadow-md ${saved
                            ? 'bg-green-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300'
                            }`}
                    >
                        {saved
                            ? <><Check className="w-5 h-5" /> 保存しました！</>
                            : saving
                                ? '保存中...'
                                : '目標を保存する'
                        }
                    </button>
                </div>
            </div>

            {/* ──────────── 時間入力ボトムシート ──────────── */}
            {pickerVisible && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end justify-center"
                    onClick={(e) => { if (e.target === e.currentTarget) setPickerVisible(false); }}
                >
                    <div className="bg-white rounded-t-2xl w-full max-w-md shadow-2xl pb-safe">
                        {/* シートヘッダー */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <button
                                type="button"
                                onClick={() => setPickerVisible(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                            <span className="font-bold text-gray-900 text-sm">
                                {pickerTarget?.label}の目標時間
                            </span>
                            <button
                                type="button"
                                onClick={confirmPicker}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
                            >
                                <Check className="w-4 h-4" />
                                決定
                            </button>
                        </div>

                        {/* TimeInput コンポーネント（ストップウォッチ除外のため initialMode='manual' 相当） */}
                        <div className="p-4">
                            <TimeInput
                                value={pickerValue}
                                onChange={handlePickerChange}
                                initialMode="manual"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyGoalSettingsView;
