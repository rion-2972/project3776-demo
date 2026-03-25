import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTeacherTour } from '../../contexts/TeacherTourContext';
import { TEACHER_TOUR_STEPS } from '../../data/teacherTourSteps';

/**
 * 教員向けコーチマークのオーバーレイコンポーネント。
 *
 * バルーンは対象要素に追随させず、常に「画面の安全な領域」に固定配置する。
 * - モバイル: 画面下部に横幅いっぱいの Bottom Sheet 形式
 * - PC (md以上): メインコンテンツ領域の中央下部に固定表示
 *
 * これにより、ターゲット要素がどこにあっても見切れが発生しない。
 */

const PADDING = 10;

const CoachMarkTeacher = () => {
    const { isTourActive, currentStep, totalSteps, nextStep, prevStep, skipTour } = useTeacherTour();
    const [rect, setRect] = useState(null);
    const [visible, setVisible] = useState(false);
    const rafRef = useRef(null);

    const step = TEACHER_TOUR_STEPS[currentStep];

    const updateRect = useCallback(() => {
        if (!step) return;
        const el = document.getElementById(step.targetId);
        if (!el) return;
        const r = el.getBoundingClientRect();
        setRect({
            top: r.top - PADDING,
            left: r.left - PADDING,
            width: r.width + PADDING * 2,
            height: r.height + PADDING * 2,
            bottom: r.bottom + PADDING,
            right: r.right + PADDING,
        });
        setVisible(true);
    }, [step]);

    useEffect(() => {
        if (!isTourActive) {
            setVisible(false);
            setRect(null);
            return;
        }

        setVisible(false);
        const timer = setTimeout(() => {
            updateRect();
        }, 400);

        const handleUpdate = () => {
            rafRef.current = requestAnimationFrame(updateRect);
        };
        window.addEventListener('resize', handleUpdate);
        window.addEventListener('scroll', handleUpdate, true);

        return () => {
            clearTimeout(timer);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', handleUpdate);
            window.removeEventListener('scroll', handleUpdate, true);
        };
    }, [isTourActive, currentStep, updateRect]);

    useEffect(() => {
        if (!isTourActive || !step) return;
        const timer = setTimeout(() => {
            const el = document.getElementById(step.targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [isTourActive, currentStep, step]);

    if (!isTourActive || !rect || !visible || !step) return null;

    const winH = window.innerHeight;

    // ターゲットが画面の上半分にあるか下半分にあるかで、バルーンを上/下に配置
    const targetCenter = rect.top + rect.height / 2;
    const isTargetInUpperHalf = targetCenter < winH / 2;

    const overlayStyle = { position: 'fixed', zIndex: 9000, background: 'rgba(0,0,0,0.65)', pointerEvents: 'none' };

    return (
        <>
            {/* 4枚のパネルでスポットライト効果 */}
            <div style={{ ...overlayStyle, top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
            <div style={{ ...overlayStyle, top: rect.bottom, left: 0, right: 0, bottom: 0 }} />
            <div style={{ ...overlayStyle, top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
            <div style={{ ...overlayStyle, top: rect.top, left: rect.right, right: 0, height: rect.height }} />

            {/* スポットライト枠線 */}
            <div
                style={{
                    position: 'fixed',
                    zIndex: 9010,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    borderRadius: 12,
                    boxShadow: '0 0 0 3px rgba(99,102,241,0.8)',
                    pointerEvents: 'none',
                    animation: 'coachmark-pulse 1.5s ease-in-out infinite',
                }}
            />

            {/* スキップオーバーレイ（背景クリック） */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9050, cursor: 'pointer' }}
                onClick={skipTour}
                aria-label="ツアーをスキップ"
            />

            {/* 説明バルーン — 画面の安全なエリアに固定配置 */}
            <div
                className="coach-balloon"
                style={{
                    position: 'fixed',
                    zIndex: 9100,
                    // モバイル: 左右16pxの余白、PCも同じ余白で中央揃え
                    left: 16,
                    right: 16,
                    maxWidth: 420,
                    // PCではメインエリア中央に寄せる
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    // ターゲットが上半分なら下部に、下半分なら上部に配置
                    ...(isTargetInUpperHalf
                        ? { bottom: 24 }
                        : { top: 24 }
                    ),
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400">{currentStep + 1} / {totalSteps}</span>
                    <button
                        onClick={skipTour}
                        className="text-xs text-gray-400 hover:text-gray-600 transition underline"
                    >
                        スキップ
                    </button>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.body}</p>

                <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                        <button
                            onClick={prevStep}
                            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
                        >
                            ← 前へ
                        </button>
                    )}
                    <button
                        onClick={nextStep}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
                    >
                        {currentStep === totalSteps - 1 ? '完了 🎉' : '次へ →'}
                    </button>
                </div>

                <div className="flex justify-center gap-1.5 mt-3">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: i === currentStep ? 16 : 6,
                                height: 6,
                                background: i === currentStep ? '#6366f1' : '#e5e7eb',
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                .coach-balloon {
                    background: white;
                    border-radius: 16px;
                    padding: 16px 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 4px 16px rgba(99,102,241,0.2);
                    animation: coachmark-fade-in 0.25s ease-out;
                }
                @keyframes coachmark-fade-in {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes coachmark-pulse {
                    0%, 100% { box-shadow: 0 0 0 3px rgba(99,102,241,0.8); }
                    50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0.3); }
                }
            `}</style>
        </>
    );
};

export default CoachMarkTeacher;
