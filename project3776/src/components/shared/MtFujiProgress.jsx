import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 月の表示フォーマット
const formatMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}年${month}月`;
};

// 富士山 SVG 進捗コンポーネント
const MtFujiProgress = ({ currentHours, targetHours = 3776, currentMonth, onPrevMonth, onNextMonth, canGoPrev, canGoNext }) => {
    const percentage = Math.min((currentHours / targetHours) * 100, 100);

    // clipPath の ID を一意にするため、コンポーネントごとに異なる ID を使用
    const clipId = `mountainClip-${currentMonth?.getTime() || 'default'}`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
                {onPrevMonth && (
                    <button
                        onClick={onPrevMonth}
                        disabled={!canGoPrev}
                        className={`p-1 rounded-full hover:bg-gray-100 transition ${!canGoPrev ? 'opacity-30 cursor-not-allowed' : 'text-gray-600'}`}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <h2 className="text-xl font-bold text-gray-900">
                    {formatMonth(currentMonth)}の学習進捗
                </h2>
                {onNextMonth && (
                    <button
                        onClick={onNextMonth}
                        disabled={!canGoNext}
                        className={`p-1 rounded-full hover:bg-gray-100 transition ${!canGoNext ? 'opacity-30 cursor-not-allowed' : 'text-gray-600'}`}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* 富士山ビジュアライゼーション */}
            <div className="flex flex-col items-center">
                <svg width="200" height="150" viewBox="0 0 200 150" className="mb-4">
                    {/* 山のクリップパス */}
                    <defs>
                        <clipPath id={clipId}>
                            <path d="M 20 150 L 75 40 L 125 40 L 180 150 Z" />
                        </clipPath>

                        {/* 波のパターン定義 */}
                        <path
                            id={`wave-${clipId}`}
                            d="M 0 0 Q 25 -8, 50 0 T 100 0 T 150 0 T 200 0 T 250 0 T 300 0 T 350 0 T 400 0 V 150 H 0 Z"
                            fill="#4F46E5"
                            fillOpacity="0.9"
                        />
                    </defs>

                    {/* 背景の山（グレー） */}
                    <path
                        d="M 20 150 L 75 40 L 125 40 L 180 150 Z"
                        fill="#E5E7EB"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />

                    {/* 雪冠（白い山頂部分） */}
                    <path
                        d="M 60 70 L 140 70 L 125 40 L 75 40 Z"
                        fill="white"
                        fillOpacity="0.8"
                    />

                    {/* 進捗（水面アニメーション付き） */}
                    <g clipPath={`url(#${clipId})`}>
                        {/* 第1波 - ゆっくり左に移動 */}
                        <use
                            href={`#wave-${clipId}`}
                            x="0"
                            y={150 - (110 * percentage / 100)}
                            opacity="0.6"
                        >
                            <animateTransform
                                attributeName="transform"
                                type="translate"
                                from="0 0"
                                to="-100 0"
                                dur="8s"
                                repeatCount="indefinite"
                            />
                        </use>

                        {/* 第2波 - 少し速く右に移動（逆方向） */}
                        <use
                            href={`#wave-${clipId}`}
                            x="-100"
                            y={150 - (110 * percentage / 100)}
                            opacity="0.5"
                        >
                            <animateTransform
                                attributeName="transform"
                                type="translate"
                                from="0 0"
                                to="100 0"
                                dur="6s"
                                repeatCount="indefinite"
                            />
                        </use>
                    </g>
                </svg>

                <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-600">{currentHours.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">/ {targetHours.toLocaleString()} 時間</div>
                    <div className="mt-2 text-lg font-semibold text-gray-700">{percentage.toFixed(1)}% 達成</div>
                </div>
            </div>
        </div>
    );
};

export default MtFujiProgress;
