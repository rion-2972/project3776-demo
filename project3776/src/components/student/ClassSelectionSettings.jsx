import React, { useState } from 'react';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LEVEL_SUBJECTS } from '../../utils/constants';

const ClassSelectionSettings = ({ onBack }) => {
    const { profile, updateProfile } = useAuth();
    const [saving, setSaving] = useState(false);

    // Get current levels from profile
    const currentMath = profile?.subjects?.find(s => s.startsWith('数学')) || '数学（標準）';
    const currentEnglish = profile?.subjects?.find(s => s.startsWith('英語')) || '英語（標準）';

    const [mathLevel, setMathLevel] = useState(currentMath);
    const [englishLevel, setEnglishLevel] = useState(currentEnglish);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Remove existing math and english subjects
            const baseSubjects = profile.subjects.filter(s =>
                !s.startsWith('数学') && !s.startsWith('英語')
            );

            // Add new selections
            const newSubjects = [...baseSubjects, mathLevel, englishLevel];

            const success = await updateProfile({ subjects: newSubjects });

            if (success) {
                alert('クラス設定を保存しました。');
                onBack();
            } else {
                alert('保存に失敗しました。もう一度お試しください。');
            }
        } catch (error) {
            console.error('Error saving class selection:', error);
            alert('保存に失敗しました。もう一度お試しください。');
        } finally {
            setSaving(false);
        }
    };

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
                    <h1 className="text-lg font-bold text-gray-900">クラス選択</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-bold text-gray-900">数学・英語のレベル設定</h2>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                        あなたの数学と英語のクラスレベルを選択してください。
                    </p>

                    {/* Math Level */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">数学</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {LEVEL_SUBJECTS.math.map(level => (
                                <button
                                    key={level}
                                    onClick={() => setMathLevel(level)}
                                    className={`py-3 px-4 rounded-lg text-sm font-medium transition ${mathLevel === level
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* English Level */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">英語</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {LEVEL_SUBJECTS.english.map(level => (
                                <button
                                    key={level}
                                    onClick={() => setEnglishLevel(level)}
                                    className={`py-3 px-4 rounded-lg text-sm font-medium transition ${englishLevel === level
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        {saving ? '保存中...' : '設定を保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassSelectionSettings;
