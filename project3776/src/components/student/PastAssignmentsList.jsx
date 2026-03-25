import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';

const PastAssignmentsList = ({ onBack }) => {
    const { user, profile } = useAuth();
    const [pastAssignments, setPastAssignments] = useState([]);
    const [myStatus, setMyStatus] = useState({});

    useEffect(() => {
        // Fetch all assignments
        const q = query(collection(db, 'assignments'), orderBy('dueDate', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const assignments = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(a => {
                    // Filter for user's subjects
                    if (!profile?.subjects?.includes(a.subject)) return false;

                    // Filter for assignments older than 1 week
                    if (a.dueDate) {
                        const dueDate = new Date(a.dueDate);
                        return dueDate < oneWeekAgo;
                    }
                    return false;
                });

            setPastAssignments(assignments);
        });

        return () => unsubscribe();
    }, [profile]);

    useEffect(() => {
        // Fetch user's assignment status
        const q = query(collection(db, `users/${user.uid}/assignmentStatus`));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const statusMap = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                statusMap[data.assignmentId] = {
                    completed: data.completed,
                    updatedAt: data.updatedAt
                };
            });
            setMyStatus(statusMap);
        });

        return () => unsubscribe();
    }, [user.uid]);

    const isCompletedWithinDeadline = (assignment, statusData) => {
        if (!statusData || !statusData.completed) return false;
        if (!assignment.dueDate || !statusData.updatedAt) return false;

        const deadline = new Date(assignment.dueDate);
        deadline.setHours(23, 59, 59, 999);

        const completedAt = statusData.updatedAt.toDate();
        return completedAt <= deadline;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
    };

    // Group by subject
    const assignmentsBySubject = pastAssignments.reduce((acc, assignment) => {
        if (!acc[assignment.subject]) {
            acc[assignment.subject] = [];
        }
        acc[assignment.subject].push(assignment);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">過去の課題一覧</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                {pastAssignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">過去の課題はありません</p>
                        <p className="text-xs mt-2">1週間以上前の課題がここに表示されます</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(assignmentsBySubject).map(([subject, assignments]) => (
                            <div key={subject} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Subject Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-2 border-b border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900">{subject}</h3>
                                </div>

                                {/* Assignments List */}
                                <div className="divide-y divide-gray-100">
                                    {assignments.map(assignment => {
                                        const statusData = myStatus[assignment.id];
                                        const completedWithinDeadline = isCompletedWithinDeadline(assignment, statusData);

                                        return (
                                            <div
                                                key={assignment.id}
                                                className="p-4 flex items-start gap-3 bg-gray-50/50"
                                            >
                                                {/* Completion Status Icon */}
                                                <div className="pt-0.5">
                                                    {completedWithinDeadline ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>

                                                {/* Assignment Details */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <div className={`text-sm font-medium ${completedWithinDeadline ? 'text-gray-400 line-through' : 'text-gray-700'
                                                            }`}>
                                                            {assignment.content}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <span>締切: {formatDate(assignment.dueDate)}</span>
                                                        {completedWithinDeadline && (
                                                            <span className="text-green-600 font-medium">✓ 期限内完了</span>
                                                        )}
                                                        {statusData?.completed && !completedWithinDeadline && (
                                                            <span className="text-orange-600 font-medium">期限後完了</span>
                                                        )}
                                                        {!statusData?.completed && (
                                                            <span className="text-red-600 font-medium">未完了</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                        <strong>注意:</strong> この一覧は読み取り専用です。課題の完了状態は変更できません。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PastAssignmentsList;
