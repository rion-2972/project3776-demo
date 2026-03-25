import React from 'react';
import { ArrowLeft, Check, Zap } from 'lucide-react';

const EffectSettings = ({ onBack }) => {
    // タスク完了エフェクトは Slash に統一されたため、設定項目なし
    // 将来的に複数エフェクト対応する際の拡張ポイントとしてコンポーネントを保持

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">エフェクト設定</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                {/* 現在のエフェクト表示 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    <div className="flex items-center gap-3 p-4 bg-indigo-50">
                        <div className="p-2 rounded-lg bg-indigo-100">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-gray-900 block">Slash（推奨）</span>
                            <span className="text-xs text-gray-500">タスク完了時に鋭い斬撃アニメーション・サウンド・振動が発生します</span>
                        </div>
                        <Check className="w-5 h-5 text-indigo-600" />
                    </div>
                </div>

                {/* 説明テキスト */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-bold text-gray-700 mb-2">エフェクトの詳細</h2>
                    <ul className="space-y-2 text-xs text-gray-500">
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold mt-0.5">▸</span>
                            <span><span className="font-semibold text-gray-700">Slash アニメーション：</span>チェックした瞬間、打消し線が素早く引かれてカードがキレよく消えます</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold mt-0.5">▸</span>
                            <span><span className="font-semibold text-gray-700">サウンド：</span>Web Audio API による軽量な「カチッ」音で、アプリの読み込みを遅くしません</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold mt-0.5">▸</span>
                            <span><span className="font-semibold text-gray-700">バイブレーション：</span>スマートフォンでのみ動作する短い触覚フィードバックです</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EffectSettings;
