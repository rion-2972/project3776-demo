import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ClassMtFujiProgress
 * クラス全体の富士山進捗コンポーネント。
 * 各生徒を富士山の斜面上にアイコンとして配置し、
 * 誰が進んでいるか一目でわかるクラス俯瞰ビューを実現します。
 */

const TARGET_HOURS = 3776;

const formatMonth = (date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

/**
 * 黄金角ハッシュを用いたアバター座標計算。
 * index を黄金角比率 (0.618...) で乗算することで、
 * 何人いても x 位置が均等かつランダムに散らばります。
 */
const getStudentPosition = (totalHours, index) => {
    const percentage = Math.min(totalHours / TARGET_HOURS, 1);
    // Y: 山頂(y=40) から 山麓(y=150) まで、進捗に応じて上昇
    const y = 150 - (110 * percentage);
    // 各 y 座標での山の左端・右端を計算
    const t = (150 - y) / 110; // 0=麓, 1=頂点
    const left = 20 + 55 * t;
    const right = 180 - 55 * t;
    // 黄金角比率でインデックスを分散させる（全員がかぶりにくい）
    const xRatio = (index * 0.6180339887) % 1;
    const x = left + (right - left) * xRatio;
    return { x, y };
};

const AVATAR_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#14b8a6',
];

const ClassMtFujiProgress = ({
    students = [],
    studentHoursMap = {},
    currentMonth,
    onPrevMonth,
    onNextMonth,
    canGoPrev,
    canGoNext,
}) => {
    const [hoveredStudentId, setHoveredStudentId] = useState(null);
    const clipId = 'classMountainClip';

    return (
        <div
            className="relative p-6 rounded-2xl mb-4 overflow-visible"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(238,242,255,0.9) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(99,102,241,0.15)',
                boxShadow: '0 8px 32px rgba(99,102,241,0.1), 0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            {/* ヘッダー */}
            <div className="flex items-center justify-center gap-4 mb-4">
                {onPrevMonth && (
                    <button
                        onClick={onPrevMonth}
                        disabled={!canGoPrev}
                        className={`p-1 rounded-full hover:bg-indigo-100 transition ${!canGoPrev ? 'opacity-30 cursor-not-allowed' : 'text-indigo-600'}`}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <h2 className="text-lg font-bold" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {formatMonth(currentMonth)} クラス進捗
                </h2>
                {onNextMonth && (
                    <button
                        onClick={onNextMonth}
                        disabled={!canGoNext}
                        className={`p-1 rounded-full hover:bg-indigo-100 transition ${!canGoNext ? 'opacity-30 cursor-not-allowed' : 'text-indigo-600'}`}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* 富士山ビジュアライゼーション */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <svg width="280" height="180" viewBox="0 0 200 160" className="overflow-visible">
                        <defs>
                            <clipPath id={clipId}>
                                <path d="M 20 150 L 75 40 L 125 40 L 180 150 Z" />
                            </clipPath>
                            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#e0e7ff" />
                                <stop offset="100%" stopColor="#c7d2fe" />
                            </linearGradient>
                        </defs>

                        {/* 山の影 */}
                        <path
                            d="M 24 154 L 79 44 L 129 44 L 184 154 Z"
                            fill="rgba(99,102,241,0.08)"
                        />

                        {/* 背景の山 */}
                        <path
                            d="M 20 150 L 75 40 L 125 40 L 180 150 Z"
                            fill="url(#mountainGrad)"
                            stroke="rgba(99,102,241,0.3)"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />

                        {/* 雪冠 */}
                        <path
                            d="M 58 72 L 142 72 L 125 40 L 75 40 Z"
                            fill="white"
                            fillOpacity="0.85"
                        />

                        {/* 頂上フラッグ */}
                        <line x1="100" y1="40" x2="100" y2="28" stroke="#6366f1" strokeWidth="1.5" />
                        <polygon points="100,28 112,33 100,38" fill="#6366f1" />

                        {/* 生徒アバター */}
                        {students.map((student, i) => {
                            const hours = studentHoursMap[student.id] || 0;
                            const { x, y } = getStudentPosition(hours, i);
                            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            const isHovered = hoveredStudentId === student.id;
                            const initials = (student.displayName || '?').slice(0, 1);

                            return (
                                <g
                                    key={student.id}
                                    onMouseEnter={() => setHoveredStudentId(student.id)}
                                    onMouseLeave={() => setHoveredStudentId(null)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isHovered ? 10 : 8}
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="2"
                                        style={{
                                            transition: 'r 0.15s ease, filter 0.15s ease',
                                            filter: isHovered ? `drop-shadow(0 2px 6px ${color}88)` : 'none',
                                        }}
                                    />
                                    <text
                                        x={x}
                                        y={y + 4}
                                        textAnchor="middle"
                                        fontSize="8"
                                        fontWeight="bold"
                                        fill="white"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {initials}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {/* ホバー時のツールチップ */}
                    <AnimatePresence>
                        {hoveredStudentId && (() => {
                            const s = students.find(st => st.id === hoveredStudentId);
                            const hours = studentHoursMap[hoveredStudentId] || 0;
                            const pct = ((hours / TARGET_HOURS) * 100).toFixed(1);
                            if (!s) return null;
                            return (
                                <motion.div
                                    key={hoveredStudentId}
                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg pointer-events-none whitespace-nowrap"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                                >
                                    {s.displayName || '名前なし'} — {hours.toFixed(1)}h ({pct}%)
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>

                {/* 目標表示 */}
                <div className="mt-2 text-xs text-gray-400 font-medium">
                    目標: {TARGET_HOURS.toLocaleString()}時間 (富士山の高さ 3,776m)
                </div>
            </div>
        </div>
    );
};

export default ClassMtFujiProgress;
