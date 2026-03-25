import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';

// ========================================
// デバイス判定フック
// ========================================
const useIsMobile = (breakpoint = 640) => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

// ========================================
// 共通: プリセット時間の定義
// ========================================
const PRESETS = [
    { label: '15分', value: 15 },
    { label: '30分', value: 30 },
    { label: '45分', value: 45 },
    { label: '1時間', value: 60 },
    { label: '1.5h', value: 90 },
    { label: '2時間', value: 120 },
    { label: '2.5h', value: 150 },
    { label: '3時間', value: 180 },
];

// ========================================
// 共通: 分→表示テキスト変換
// ========================================
const formatDisplayTime = (totalMinutes) => {
    const m = Math.max(0, Math.round(totalMinutes));
    if (m === 0) return '0分';
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h === 0) return `${rem}分`;
    if (rem === 0) return `${h}時間`;
    return `${h}時間${rem}分`;
};

// ========================================
// PC用: 案1 プリセットボタン ＋ アジャスター
// ========================================
const PresetInput = ({ value, onChange }) => {
    const current = Number(value) || 0;

    return (
        <div className="space-y-4">
            {/* プリセットボタン */}
            <div className="grid grid-cols-4 gap-2">
                {PRESETS.map(p => (
                    <button
                        key={p.value}
                        type="button"
                        onClick={() => onChange(p.value)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${current === p.value
                            ? 'bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-sm'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* 微調整アジャスター */}
            <div className="flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(0, current - 5))}
                    disabled={current <= 0}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <div className="text-center min-w-[120px]">
                    <div className="text-3xl font-black text-gray-900 tracking-tight">
                        {formatDisplayTime(current)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">合計 {current}分</div>
                </div>

                <button
                    type="button"
                    onClick={() => onChange(current + 5)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-600 flex items-center justify-center transition-all active:scale-90"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ========================================
// PC用: 案2 スライダーバー
// ========================================
const SliderInput = ({ value, onChange }) => {
    const current = Number(value) || 0;
    const max = 180;
    const percentage = (current / max) * 100;

    return (
        <div className="space-y-4 py-2">
            {/* 現在の値をリアルタイムで大きく表示 */}
            <div className="text-center">
                <div className="text-4xl font-black text-gray-900 tracking-tight">
                    {formatDisplayTime(current)}
                </div>
                <div className="text-xs text-gray-400 mt-1">合計 {current}分</div>
            </div>

            {/* スライダー */}
            <div className="px-2">
                <div className="relative">
                    {/* カスタムトラック背景 */}
                    <div className="absolute top-1/2 left-0 right-0 h-2 -mt-1 rounded-full bg-gray-200 pointer-events-none" />
                    {/* 塗りつぶし部分 */}
                    <div
                        className="absolute top-1/2 left-0 h-2 -mt-1 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 pointer-events-none transition-all duration-75"
                        style={{ width: `${percentage}%` }}
                    />
                    {/* input range */}
                    <input
                        type="range"
                        min={0}
                        max={max}
                        step={5}
                        value={current}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10 slider-thumb-custom"
                    />
                </div>
                {/* メモリラベル */}
                <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium px-0.5">
                    <span>0分</span>
                    <span>30分</span>
                    <span>1時間</span>
                    <span>1.5h</span>
                    <span>2時間</span>
                    <span>2.5h</span>
                    <span>3時間</span>
                </div>
            </div>
        </div>
    );
};

// ========================================
// PC用: 案3 デジタル直接入力
// ========================================
const DigitalInput = ({ value, onChange }) => {
    const totalMinutes = Number(value) || 0;
    const [h, setH] = useState(Math.floor(totalMinutes / 60));
    const [m, setM] = useState(totalMinutes % 60);
    const hoursRef = useRef(null);
    const minsRef = useRef(null);

    // 外部からの値変更を同期
    useEffect(() => {
        const val = Number(value) || 0;
        setH(Math.floor(val / 60));
        setM(val % 60);
    }, [value]);

    const commit = useCallback((newH, newM) => {
        const clamped = Math.max(0, newH) * 60 + Math.max(0, Math.min(59, newM));
        onChange(clamped);
    }, [onChange]);

    const handleHoursKey = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(5, h + 1);
            setH(next);
            commit(next, m);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.max(0, h - 1);
            setH(next);
            commit(next, m);
        } else if (e.key === 'Enter') {
            // Enter キーで「分」の入力欄へフォーカス移動
            e.preventDefault();
            minsRef.current?.focus();
        }
    };

    const handleMinutesKey = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(59, m + 5);
            setM(next);
            commit(h, next);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.max(0, m - 5);
            setM(next);
            commit(h, next);
        } else if (e.key === 'Enter') {
            // Enter キーで値を確定し、フォーム送信させずにブラー
            e.preventDefault();
            minsRef.current?.blur();
        }
    };

    const handleHoursChange = (e) => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        const parsed = Math.min(5, Math.max(0, Number(v) || 0));
        setH(parsed);
        commit(parsed, m);
    };

    const handleMinutesChange = (e) => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        const parsed = Math.min(59, Math.max(0, Number(v) || 0));
        setM(parsed);
        commit(h, parsed);
    };

    return (
        <div className="space-y-4 py-2">
            <div className="flex items-center justify-center gap-2">
                {/* 時間ボックス */}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => { const n = Math.min(5, h + 1); setH(n); commit(n, m); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                    <input
                        ref={hoursRef}
                        type="text"
                        inputMode="numeric"
                        value={h}
                        onChange={handleHoursChange}
                        onKeyDown={handleHoursKey}
                        className="w-16 h-16 text-center text-3xl font-black text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => { const n = Math.max(0, h - 1); setH(n); commit(n, m); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5">時間</span>
                </div>

                <span className="text-3xl font-black text-gray-300 pb-6">:</span>

                {/* 分ボックス */}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => { const n = Math.min(59, m + 5); setM(n); commit(h, n); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                    <input
                        ref={minsRef}
                        type="text"
                        inputMode="numeric"
                        value={String(m).padStart(2, '0')}
                        onChange={handleMinutesChange}
                        onKeyDown={handleMinutesKey}
                        className="w-16 h-16 text-center text-3xl font-black text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => { const n = Math.max(0, m - 5); setM(n); commit(h, n); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5">分</span>
                </div>
            </div>

            <div className="text-center text-sm text-gray-500">
                合計: <span className="font-bold text-gray-900">{formatDisplayTime(totalMinutes)}</span>
                <span className="text-xs text-gray-400 ml-2">（↑↓キーで増減可能）</span>
            </div>
        </div>
    );
};

// ========================================
// スマホ用: ホイール （既存のドラムロール、改良版）
// ========================================
const WheelInput = ({ value, onChange }) => {
    const [step, setStep] = useState(5);
    const [visualHours, setVisualHours] = useState(0);
    const [visualMinutes, setVisualMinutes] = useState(0);

    const hoursScrollRef = useRef(null);
    const minutesScrollRef = useRef(null);
    const hoursTimerRef = useRef(null);
    const minutesTimerRef = useRef(null);
    const isScrollingProgrammatically = useRef(false);

    const ITEM_HEIGHT = 40;
    const hourOptions = Array.from({ length: 6 }, (_, i) => i);
    const getMinuteOptions = () => {
        const options = [];
        const max = step === 5 ? 55 : 59;
        for (let i = 0; i <= max; i += step) options.push(i);
        return options;
    };
    const minuteOptions = getMinuteOptions();

    // 外部変更を同期
    useEffect(() => {
        const val = Number(value) || 0;
        const h = Math.floor(val / 60);
        const m = val % 60;
        setVisualHours(h);
        setVisualMinutes(m);
    }, [value]);

    // スクロール位置を同期
    useEffect(() => {
        if (!hoursScrollRef.current) return;
        const index = hourOptions.indexOf(visualHours);
        if (index !== -1) {
            const target = index * ITEM_HEIGHT;
            if (Math.abs(hoursScrollRef.current.scrollTop - target) > 5) {
                isScrollingProgrammatically.current = true;
                hoursScrollRef.current.scrollTop = target;
                setTimeout(() => { isScrollingProgrammatically.current = false; }, 100);
            }
        }
    }, [visualHours, hourOptions]);

    useEffect(() => {
        if (!minutesScrollRef.current) return;
        const index = minuteOptions.indexOf(visualMinutes);
        if (index !== -1) {
            const target = index * ITEM_HEIGHT;
            if (Math.abs(minutesScrollRef.current.scrollTop - target) > 5) {
                isScrollingProgrammatically.current = true;
                minutesScrollRef.current.scrollTop = target;
                setTimeout(() => { isScrollingProgrammatically.current = false; }, 100);
            }
        }
    }, [visualMinutes, step, minuteOptions]);

    const handleHoursScroll = () => {
        if (isScrollingProgrammatically.current) return;
        const container = hoursScrollRef.current;
        if (!container) return;
        const rawIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
        const index = Math.max(0, Math.min(rawIndex, hourOptions.length - 1));
        const selected = hourOptions[index];
        if (selected !== visualHours) setVisualHours(selected);

        if (hoursTimerRef.current) clearTimeout(hoursTimerRef.current);
        hoursTimerRef.current = setTimeout(() => {
            onChange(selected * 60 + visualMinutes);
        }, 150);
    };

    const handleMinutesScroll = () => {
        if (isScrollingProgrammatically.current) return;
        const container = minutesScrollRef.current;
        if (!container) return;
        const rawIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
        const index = Math.max(0, Math.min(rawIndex, minuteOptions.length - 1));
        const selected = minuteOptions[index];
        if (selected !== visualMinutes) setVisualMinutes(selected);

        if (minutesTimerRef.current) clearTimeout(minutesTimerRef.current);
        minutesTimerRef.current = setTimeout(() => {
            onChange(visualHours * 60 + selected);
        }, 150);
    };

    const handleStepChange = () => {
        const newStep = step === 5 ? 1 : 5;
        setStep(newStep);
        const newMax = newStep === 5 ? 55 : 59;
        let newMin = visualMinutes;
        if (newMin > newMax) newMin = newMax;
        newMin = Math.round(newMin / newStep) * newStep;
        setVisualMinutes(newMin);
        onChange(visualHours * 60 + newMin);
    };

    return (
        <div className="text-center">
            <div className="flex justify-end mb-2">
                <button
                    type="button"
                    onClick={handleStepChange}
                    className="text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-2 py-1 rounded"
                >
                    {step}分刻み
                </button>
            </div>

            <div className="flex gap-2 justify-center items-center">
                {/* 時間ピッカー */}
                <div className="relative h-40 w-24 overflow-hidden bg-gray-50 rounded-lg border border-gray-200">
                    <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 bg-indigo-100 bg-opacity-50 border-t border-b border-indigo-200 pointer-events-none z-10" />
                    <div
                        ref={hoursScrollRef}
                        onScroll={handleHoursScroll}
                        className="h-full overflow-y-auto snap-y py-[60px] scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {hourOptions.map(h => (
                            <div
                                key={h}
                                className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${visualHours === h ? 'font-bold text-indigo-700 text-xl' : 'text-gray-400 text-base'
                                    }`}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400 font-bold pointer-events-none">
                        時間
                    </div>
                </div>

                <div className="text-2xl font-bold text-gray-400 self-center pb-2">:</div>

                {/* 分ピッカー */}
                <div className="relative h-40 w-24 overflow-hidden bg-gray-50 rounded-lg border border-gray-200">
                    <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 bg-indigo-100 bg-opacity-50 border-t border-b border-indigo-200 pointer-events-none z-10" />
                    <div
                        ref={minutesScrollRef}
                        onScroll={handleMinutesScroll}
                        className="h-full overflow-y-auto snap-y py-[60px] scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {minuteOptions.map(m => (
                            <div
                                key={m}
                                className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${visualMinutes === m ? 'font-bold text-indigo-700 text-xl' : 'text-gray-400 text-base'
                                    }`}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400 font-bold pointer-events-none">
                        分
                    </div>
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
                選択中: <span className="font-bold text-gray-900 text-lg">{visualHours}時間 {visualMinutes}分</span>
                <span className="text-xs text-gray-400 ml-2">（合計 {visualHours * 60 + visualMinutes}分）</span>
            </div>
        </div>
    );
};

// ========================================
// 共通: ストップウォッチUI
// ========================================
const StopwatchInput = ({ value, onChange, resetTrigger }) => {
    const STORAGE_KEY = 'project3776_stopwatch_state';

    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
    const [displaySeconds, setDisplaySeconds] = useState(0);

    // LocalStorage 読み込み
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const { isRunning: r, startTime: s, accumulatedSeconds: a } = JSON.parse(saved);
                if (r && s) {
                    const elapsed = Math.floor((Date.now() - s) / 1000);
                    setAccumulatedSeconds(a + elapsed);
                    setStartTime(Date.now());
                    setIsRunning(true);
                } else if (a > 0) {
                    setAccumulatedSeconds(a);
                    setDisplaySeconds(a);
                }
            } catch (e) {
                console.error('ストップウォッチ復元エラー:', e);
            }
        }
    }, []);

    // LocalStorage 保存
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ isRunning, startTime, accumulatedSeconds }));
    }, [isRunning, startTime, accumulatedSeconds]);

    // 毎秒更新
    useEffect(() => {
        if (!isRunning || !startTime) {
            setDisplaySeconds(accumulatedSeconds);
            return;
        }
        const interval = setInterval(() => {
            setDisplaySeconds(accumulatedSeconds + Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning, startTime, accumulatedSeconds]);

    // リアルタイム親連携
    useEffect(() => {
        if (displaySeconds >= 60) {
            onChange(Math.floor(displaySeconds / 60));
        }
    }, [displaySeconds, onChange]);

    // リセットトリガー
    useEffect(() => {
        if (resetTrigger > 0) reset();
    }, [resetTrigger]);

    const formatSW = (s) => {
        const hh = Math.floor(s / 3600);
        const mm = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    const toggle = () => {
        if (isRunning) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setAccumulatedSeconds(accumulatedSeconds + elapsed);
            setIsRunning(false);
            setStartTime(null);
        } else {
            setStartTime(Date.now());
            setIsRunning(true);
        }
    };

    const apply = () => {
        const mins = Math.max(1, Math.floor(displaySeconds / 60));
        onChange(mins);
        reset();
        alert(`ストップウォッチの記録（${mins}分）をセットしました`);
    };

    const reset = () => {
        setIsRunning(false);
        setStartTime(null);
        setAccumulatedSeconds(0);
        setDisplaySeconds(0);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div className="text-center py-4">
            <div className="text-5xl font-mono font-bold text-gray-900 mb-6 tracking-wider">
                {formatSW(displaySeconds)}
            </div>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={toggle}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-lg ${isRunning
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                >
                    {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button
                    type="button"
                    onClick={reset}
                    disabled={displaySeconds === 0 && !isRunning}
                    className="w-16 h-16 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>

            <button
                type="button"
                onClick={apply}
                disabled={displaySeconds < 60}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-gray-300 transition"
            >
                <Check className="w-5 h-5" />
                この時間を入力 ({Math.floor(displaySeconds / 60)}分)
            </button>
            {displaySeconds > 0 && displaySeconds < 60 && <p className="text-xs text-red-500 mt-2">※1分以上から記録可能です</p>}
        </div>
    );
};

// ========================================
// モード定義（コンポーネント外の定数）
// ========================================
const MOBILE_MODES = [
    { id: 'wheel', label: 'ホイール' },
    { id: 'stopwatch', label: 'ストップウォッチ' },
];
const PC_MODES = [
    { id: 'preset', label: 'クイック' },
    { id: 'slider', label: 'スライダー' },
    { id: 'digital', label: 'テンキー' },
    { id: 'stopwatch', label: 'ストップウォッチ' },
];

// ========================================
// メインコンポーネント
// ========================================
const TimeInput = ({ value, onChange, initialMode = 'manual', resetTrigger = 0 }) => {
    const isMobile = useIsMobile();

    // モード定義
    const modes = isMobile ? MOBILE_MODES : PC_MODES;

    // 初期モード判定
    const getInitialMode = () => {
        if (initialMode === 'stopwatch') return 'stopwatch';
        return isMobile ? 'wheel' : 'preset';
    };
    const [mode, setMode] = useState(getInitialMode);

    // デバイス切り替え時にモードを修正
    useEffect(() => {
        if (isMobile && mode !== 'wheel' && mode !== 'stopwatch') {
            setMode('wheel');
        } else if (!isMobile && mode === 'wheel') {
            setMode('preset');
        }
    }, [isMobile, mode]);

    // initialMode が外部から変わった時
    useEffect(() => {
        if (initialMode === 'stopwatch') {
            setMode('stopwatch');
        }
    }, [initialMode]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* タブ切り替え */}
            <div className={`flex bg-gray-100 rounded-lg p-1 mb-4 ${modes.length > 3 ? 'gap-0.5' : 'gap-1'}`}>
                {modes.map(m => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${mode === m.id
                            ? 'bg-white text-indigo-600 shadow-sm font-bold'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* モード別UI */}
            {mode === 'wheel' && <WheelInput value={value} onChange={onChange} />}
            {mode === 'preset' && <PresetInput value={value} onChange={onChange} />}
            {mode === 'slider' && <SliderInput value={value} onChange={onChange} />}
            {mode === 'digital' && <DigitalInput value={value} onChange={onChange} />}
            {mode === 'stopwatch' && <StopwatchInput value={value} onChange={onChange} resetTrigger={resetTrigger} />}

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                /* スライダーのツマミ（Webkit） */
                .slider-thumb-custom::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #6366f1;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                    transition: transform 0.1s;
                }
                .slider-thumb-custom::-webkit-slider-thumb:hover {
                    transform: scale(1.15);
                }
                .slider-thumb-custom::-webkit-slider-thumb:active {
                    transform: scale(0.95);
                    border-color: #4f46e5;
                }
                /* Firefox */
                .slider-thumb-custom::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #6366f1;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                }
                .slider-thumb-custom::-moz-range-track {
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default TimeInput;
