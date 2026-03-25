import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTour } from '../../contexts/TourContext';
import { TOUR_STEPS } from '../../data/tourSteps';

/**
 * コーチマークのオーバーレイコンポーネント。
 * 対象要素の周囲を4枚の暗いパネルで囲み、対象部分だけを明るく見せる「スポットライト効果」を実現。
 * iOS Safari を含む全ブラウザで動作する。
 */

const PADDING = 10; // 対象要素の周囲に加えるパディング(px)

const CoachMark = () => {
    const { isTourActive, currentStep, totalSteps, nextStep, prevStep, skipTour } = useTour();
    const [rect, setRect] = useState(null);
    const [visible, setVisible] = useState(false);
    const rafRef = useRef(null);

    const step = TOUR_STEPS[currentStep];

    // 対象要素の位置を取得してスポットライトをフィット
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
        // ステップが切り替わったらタブ遷移とレンダリングを待つ
        const timer = setTimeout(() => {
            updateRect();
        }, 400);

        // スクロールやリサイズ時も位置を更新
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

    // 対象要素にスクロール
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

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // バルーンの表示位置を決定
    // placement が 'top' の場合は対象の上、' bottom' の場合は下
    // 画面の下半分にある要素は強制的に上に表示
    const spaceBelow = winH - rect.bottom;
    const spaceAbove = rect.top;
    let showAbove = step.placement === 'top';
    if (step.placement !== 'top' && spaceBelow < 220 && spaceAbove > spaceBelow) {
        showAbove = true;
    }

    // バルーンの幅はmin(320px, winW-32px)
    const balloonWidth = Math.min(320, winW - 32);
    // バルーンのX位置: 対象の中央に合わせるが画面外にはみ出さない
    const centerX = rect.left + rect.width / 2;
    let balloonLeft = centerX - balloonWidth / 2;
    balloonLeft = Math.max(16, Math.min(balloonLeft, winW - balloonWidth - 16));

    const balloonTop = showAbove
        ? Math.max(8, rect.top - 8) // 上方向: バルーン下端を rect.top 近辺に
        : rect.bottom + 8; // 下方向: バルーン上端を rect.bottom 近辺に

    // バルーンスタイル
    const balloonStyle = showAbove
        ? {
            position: 'fixed',
            left: balloonLeft,
            bottom: winH - rect.top + 8,
            width: balloonWidth,
            zIndex: 9100,
        }
        : {
            position: 'fixed',
            left: balloonLeft,
            top: balloonTop,
            width: balloonWidth,
            zIndex: 9100,
        };

    const overlayStyle = { position: 'fixed', zIndex: 9000, background: 'rgba(0,0,0,0.65)', pointerEvents: 'none' };

    return (
        <>
            {/* 4枚のパネルでスポットライト効果を実現 */}
            {/* 上 */}
            <div style={{ ...overlayStyle, top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
            {/* 下 */}
            <div style={{ ...overlayStyle, top: rect.bottom, left: 0, right: 0, bottom: 0 }} />
            {/* 左 */}
            <div style={{ ...overlayStyle, top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
            {/* 右 */}
            <div style={{ ...overlayStyle, top: rect.top, left: rect.right, right: 0, height: rect.height }} />

            {/* スポットライトの枠線（アクセント） */}
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

            {/* スキップオーバーレイ（クリックでスキップ） */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9050, cursor: 'pointer' }}
                onClick={skipTour}
                aria-label="ツアーをスキップ"
            />

            {/* 説明バルーン */}
            <div
                style={balloonStyle}
                onClick={e => e.stopPropagation()}
                className="coach-balloon"
            >
                {/* カウンター */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400">{currentStep + 1} / {totalSteps}</span>
                    <button
                        onClick={skipTour}
                        className="text-xs text-gray-400 hover:text-gray-600 transition underline"
                    >
                        スキップ
                    </button>
                </div>

                {/* タイトル */}
                <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>

                {/* 説明文 */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.body}</p>

                {/* ナビゲーションボタン */}
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

                {/* プログレスドット */}
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
                    padding: 16px;
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

export default CoachMark;
