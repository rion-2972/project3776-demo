import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { versionHistory } from '../../data/versionHistory';

const VersionHistoryView = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">バージョン履歴</h1>
                </div>
            </div>

            {/* コンテンツ */}
            <div className="max-w-md mx-auto px-4 pt-4 pb-8">
                <div className="space-y-4">
                    {versionHistory.map((version, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                        >
                            {/* バージョン情報 */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">
                                        v{version.version}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">{version.date}</span>
                            </div>

                            {/* 更新内容 */}
                            <ul className="space-y-2">
                                {version.content.map((item, itemIndex) => (
                                    <li
                                        key={itemIndex}
                                        className="flex items-start gap-2 text-sm text-gray-700"
                                    >
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* 履歴が空の場合 */}
                {versionHistory.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">バージョン履歴はまだありません</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VersionHistoryView;
