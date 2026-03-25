import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 提案A: 光るドット＋タップ展開
 * 通常時は小さなドット（パーティクル）のみを表示し、
 * ホバー/タップでフワッとアバターに拡大してツールチップを表示する。
 */

const TARGET_HOURS = 3776;
const formatMonth = (date) => `${date.getFullYear()}年${date.getMonth() + 1}月`;

const AVATAR_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#14b8a6',
];

const getStudentPosition = (totalHours, index, total) => {
    const percentage = Math.min(totalHours / TARGET_HOURS, 1);
    const y = 150 - (110 * percentage);
    const t = (150 - y) / 110;
    const left = 22 + 55 * t;
    const right = 178 - 55 * t;
    const xRatio = ((index * 0.6180339887) % 1);
    const x = left + (right - left) * xRatio;
    return { x, y };
};

const MtFujiVariantA = ({
    students = [],
    studentHoursMap = {},
    currentMonth,
    onPrevMonth,
    onNextMonth,
    canGoPrev,
    canGoNext,
}) => {
    const [activeStudentId, setActiveStudentId] = useState(null);
    const clipId = 'variantA-clip';

    const handleToggle = (id) => {
        setActiveStudentId(prev => prev === id ? null : id);
    };

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
                    <button onClick={onPrevMonth} disabled={!canGoPrev}
                        className={`p-1 rounded-full hover:bg-indigo-100 transition ${!canGoPrev ? 'opacity-30 cursor-not-allowed' : 'text-indigo-600'}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <h2 className="text-base font-bold" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {formatMonth(currentMonth)} クラス進捗
                </h2>
                {onNextMonth && (
                    <button onClick={onNextMonth} disabled={!canGoNext}
                        className={`p-1 rounded-full hover:bg-indigo-100 transition ${!canGoNext ? 'opacity-30 cursor-not-allowed' : 'text-indigo-600'}`}>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex flex-col items-center">
                <div className="relative">
                    <svg width="280" height="180" viewBox="0 0 200 160" className="overflow-visible">
                        <defs>
                            <linearGradient id={`${clipId}-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#e0e7ff" />
                                <stop offset="100%" stopColor="#c7d2fe" />
                            </linearGradient>
                        </defs>

                        {/* 山 */}
                        <path d="M 24 154 L 79 44 L 129 44 L 184 154 Z" fill="rgba(99,102,241,0.08)" />
                        <path d="M 20 150 L 75 40 L 125 40 L 180 150 Z" fill={`url(#${clipId}-grad)`}
                            stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M 58 72 L 142 72 L 125 40 L 75 40 Z" fill="white" fillOpacity="0.85" />
                        <line x1="100" y1="40" x2="100" y2="28" stroke="#6366f1" strokeWidth="1.5" />
                        <polygon points="100,28 112,33 100,38" fill="#6366f1" />

                        {/* 小ドット＋選択時アバター拡大 */}
                        {students.map((student, i) => {
                            const hours = studentHoursMap[student.id] || 0;
                            const { x, y } = getStudentPosition(hours, i, students.length);
                            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            const isActive = activeStudentId === student.id;

                            return (
                                <g key={student.id} onClick={() => handleToggle(student.id)} style={{ cursor: 'pointer' }}>
                                    {/* デフォルト: 小さな光るドット */}
                                    {!isActive && (
                                        <>
                                            <circle cx={x} cy={y} r="3" fill={color} opacity="0.9">
                                                <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" begin={`${(i * 0.3) % 2}s`} repeatCount="indefinite" />
                                            </circle>
                                            <circle cx={x} cy={y} r="5" fill={color} opacity="0.2">
                                                <animate attributeName="r" values="4;7;4" dur="2.5s" begin={`${(i * 0.3) % 2}s`} repeatCount="indefinite" />
                                                <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" begin={`${(i * 0.3) % 2}s`} repeatCount="indefinite" />
                                            </circle>
                                        </>
                                    )}
                                    {/* アクティブ: 拡大されたアバター */}
                                    {isActive && (
                                        <>
                                            <circle cx={x} cy={y} r="11" fill={color} stroke="white" strokeWidth="2.5"
                                                style={{ filter: `drop-shadow(0 2px 8px ${color}88)` }} />
                                            <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill="white"
                                                style={{ pointerEvents: 'none' }}>
                                                {(student.displayName || '?').slice(0, 1)}
                                            </text>
                                        </>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* ツールチップ */}
                    <AnimatePresence>
                        {activeStudentId && (() => {
                            const s = students.find(st => st.id === activeStudentId);
                            const hours = studentHoursMap[activeStudentId] || 0;
                            const pct = ((hours / TARGET_HOURS) * 100).toFixed(1);
                            if (!s) return null;
                            return (
                                <motion.div
                                    key={activeStudentId}
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

                <div className="mt-2 text-xs text-gray-400 font-medium">
                    目標: {TARGET_HOURS.toLocaleString()}時間 (富士山の高さ 3,776m)
                </div>
            </div>
        </div>
    );
};

export default MtFujiVariantA;
