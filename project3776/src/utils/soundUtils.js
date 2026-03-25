/**
 * Web Audio API を使ったサウンドユーティリティ
 * 外部音声ファイルが不要なため軽量かつ即時再生が可能
 */

/**
 * タスク完了時の「カチッ」という重厚感のある音
 * 低音のクリック音
 */
export const playTaskCompleteSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // 1音目：鋭い短い音（打撃感）
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        gain1.gain.setValueAtTime(0.5, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.1);

        // 2音目：わずかに遅れて鳴るアクセント音
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc2.start(ctx.currentTime + 0.05);
        osc2.stop(ctx.currentTime + 0.2);

        // 使い終わったら閉じる
        setTimeout(() => ctx.close(), 500);
    } catch (e) {
        // AudioContext が使えない環境ではサイレントに無視
        console.warn('サウンド再生に失敗しました:', e);
    }
};

/**
 * ハプティックフィードバック（振動）
 * モバイル端末で触覚フィードバックを提供
 */
export const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
        navigator.vibrate([15]); // 15ms の短く鋭い振動
    }
};
