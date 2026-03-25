import React, { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    collectionGroup,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Calendar, BookOpen, TrendingUp, Award, X, ChevronRight, AlertTriangle } from 'lucide-react';

// --- Sub-component: Daily Aggregated Study Hours ---
// Props: allStudyRecords = all recent study records (for last-seen calculation)
const DailyAggregatedStudyHours = () => {
    const [yesterdayTotalMinutes, setYesterdayTotalMinutes] = useState(0);
    const [yesterdayActiveCount, setYesterdayActiveCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [currentViewMonth, setCurrentViewMonth] = useState(new Date());
    const [monthlyData, setMonthlyData] = useState({});
    const [selectedCalendarDates, setSelectedCalendarDates] = useState(new Set());

    // Fetch yesterday's aggregated study hours
    useEffect(() => {
        const now = new Date();
        const startOfYesterday = new Date(now);
        startOfYesterday.setDate(now.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(now);
        endOfYesterday.setDate(now.getDate() - 1);
        endOfYesterday.setHours(23, 59, 59, 999);

        const q = query(
            collectionGroup(db, 'studyRecords'),
            where('createdAt', '>=', startOfYesterday),
            where('createdAt', '<=', endOfYesterday)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const totalMinutes = snapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().duration || 0);
            }, 0);

            const uniqueUsers = new Set();
            snapshot.docs.forEach(doc => {
                const userId = doc.ref.parent.parent.id;
                uniqueUsers.add(userId);
            });

            setYesterdayTotalMinutes(totalMinutes);
            setYesterdayActiveCount(uniqueUsers.size);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching yesterday\'s aggregated study hours:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch monthly data when calendar modal is shown
    useEffect(() => {
        if (!showCalendarModal) return;

        const start = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth(), 1);
        const end = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, 0, 23, 59, 59);

        const q = query(
            collectionGroup(db, 'studyRecords'),
            where('createdAt', '>=', start),
            where('createdAt', '<=', end)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const dailyData = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt.toDate();
                const dateKey = date.getDate();
                dailyData[dateKey] = (dailyData[dateKey] || 0) + (data.duration || 0);
            });
            setMonthlyData(dailyData);
        });

        return () => unsubscribe();
    }, [showCalendarModal, currentViewMonth]);

    // Toggle date selection
    const toggleDateSelection = (day) => {
        if (!monthlyData[day]) return;
        setSelectedCalendarDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(day)) { newSet.delete(day); } else { newSet.add(day); }
            return newSet;
        });
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}分`;
        return `${(minutes / 60).toFixed(1)}時間`;
    };

    const totalMinutesSelected = Array.from(selectedCalendarDates).reduce((sum, day) => {
        return sum + (monthlyData[day] || 0);
    }, 0);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(day);
        return days;
    };

    const goToPrevMonth = () => setCurrentViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    return (
        <>
            {/* Clickable Card */}
            <button
                onClick={() => setShowCalendarModal(true)}
                className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200 text-left"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                            昨日の総学習時間
                        </h3>
                        <div className="text-3xl font-bold text-indigo-600">
                            {loading ? '...' : formatTime(yesterdayTotalMinutes)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {yesterdayActiveCount}人が記録
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-300">
                        <Calendar className="w-6 h-6 text-indigo-400" />
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </button>

            {/* Calendar Modal */}
            {showCalendarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-gray-900">日別学習時間カレンダー</h3>
                            <button
                                onClick={() => setShowCalendarModal(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="font-bold text-gray-900">
                                    {currentViewMonth.getFullYear()}年{currentViewMonth.getMonth() + 1}月
                                </h3>
                                <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                                    <div key={day} className="text-center text-xs font-bold text-gray-500 p-2">{day}</div>
                                ))}
                                {getDaysInMonth(currentViewMonth).map((day, index) => (
                                    <div
                                        key={index}
                                        className={`text-center p-2 rounded-lg transition ${selectedCalendarDates.has(day)
                                            ? 'bg-indigo-200 ring-2 ring-indigo-500'
                                            : day && monthlyData[day]
                                                ? 'hover:bg-indigo-50 cursor-pointer'
                                                : day ? 'hover:bg-gray-50' : ''
                                            }`}
                                        onClick={() => day && monthlyData[day] && toggleDateSelection(day)}
                                    >
                                        {day && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{day}</div>
                                                {monthlyData[day] ? (
                                                    <div className="text-[10px] font-bold text-indigo-600">
                                                        {monthlyData[day] < 60
                                                            ? `${monthlyData[day]}分`
                                                            : `${(monthlyData[day] / 60).toFixed(1)}h`}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-300">-</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {selectedCalendarDates.size > 0 && (
                                <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-center">
                                    <span className="text-gray-700 font-bold">
                                        選択した日の合計学習時間：{Math.round(totalMinutesSelected / 60)}時間
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const TeacherHomeView = () => {
    const [dailyActiveCount, setDailyActiveCount] = useState(0);
    const [dailyActiveStudents, setDailyActiveStudents] = useState([]);
    const [showActiveStudentsModal, setShowActiveStudentsModal] = useState(false);
    const [activeTab, setActiveTab] = useState('recorded'); // 'recorded' | 'unrecorded'
    const [lastRecordedAtMap, setLastRecordedAtMap] = useState({}); // { userId: Date }
    const [weeklyStats, setWeeklyStats] = useState({
        totalHours: 0,
        topStudents: [],
        topSubjects: [],
        avgHoursPerStudent: 0
    });
    const [assignments, setAssignments] = useState([]);
    const [assignmentProgress, setAssignmentProgress] = useState({});
    const [expandedAssignments, setExpandedAssignments] = useState(new Set());
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPastAssignmentsView, setShowPastAssignmentsView] = useState(false);
    const [pastAssignments, setPastAssignments] = useState([]);
    const [pastAssignmentProgress, setPastAssignmentProgress] = useState({});
    const [expandedPastAssignments, setExpandedPastAssignments] = useState(new Set());
    const [allStatusMap, setAllStatusMap] = useState({}); // { assignmentId: { studentId: statusData } }



    // ==== fetch students ====
    const fetchStudents = useCallback(async () => {
        try {
            if (students.length === 0) {
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const snapshot = await getDocs(q);
                const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(studentsData);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [students.length]);

    // ==== fetch daily active + track last-recorded date for unrecorded students ====
    const fetchDailyActive = useCallback(async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch today's records
            const q = query(collectionGroup(db, 'studyRecords'), where('createdAt', '>=', today));
            const snapshot = await getDocs(q);

            const userDataMap = {};
            snapshot.docs.forEach(doc => {
                const userId = doc.ref.parent.parent.id;
                const data = doc.data();
                if (!userDataMap[userId]) {
                    userDataMap[userId] = {
                        userId,
                        userName: data.userName || '不明',
                        totalMinutes: 0
                    };
                }
                userDataMap[userId].totalMinutes += (data.duration || 0);
            });

            const studentsList = Object.values(userDataMap).sort((a, b) => b.totalMinutes - a.totalMinutes);
            setDailyActiveCount(studentsList.length);
            setDailyActiveStudents(studentsList);

            // Also fetch last 30 days to determine most recent study date per student
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const q2 = query(collectionGroup(db, 'studyRecords'), where('createdAt', '>=', thirtyDaysAgo), orderBy('createdAt', 'desc'));
            const snap2 = await getDocs(q2);
            const lastMap = {};
            snap2.docs.forEach(doc => {
                const userId = doc.ref.parent.parent.id;
                const createdAt = doc.data().createdAt?.toDate();
                if (createdAt && !lastMap[userId]) {
                    lastMap[userId] = createdAt;
                }
            });
            setLastRecordedAtMap(lastMap);
        } catch (error) {
            console.error('Error fetching daily active:', error);
        }
    }, []);

    // ==== fetch weekly stats ====
    const fetchWeeklyStats = useCallback(async () => {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const q = query(collectionGroup(db, 'studyRecords'), where('createdAt', '>=', weekAgo));
            const snapshot = await getDocs(q);
            const records = snapshot.docs.map(doc => ({
                userId: doc.ref.parent.parent.id,
                ...doc.data()
            }));

            const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalHours = totalMinutes / 60;

            const studentHours = {};
            records.forEach(r => {
                studentHours[r.userId] = (studentHours[r.userId] || 0) + (r.duration || 0);
            });
            const topStudents = Object.entries(studentHours)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([userId, minutes]) => ({
                    userId,
                    userName: records.find(r => r.userId === userId)?.userName || '不明',
                    hours: (minutes / 60).toFixed(1)
                }));

            const subjectHours = {};
            records.forEach(r => {
                const rawSubject = r.subject || 'その他';
                const subject = rawSubject.replace(/（.*?）/, ''); // Normalize by removing level suffix
                subjectHours[subject] = (subjectHours[subject] || 0) + (r.duration || 0);
            });
            const topSubjects = Object.entries(subjectHours)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([subject, minutes]) => ({
                    subject,
                    hours: (minutes / 60).toFixed(1)
                }));


            // Fixed denominator of 22 for average calculation
            const FIXED_DENOMINATOR = 22;
            const avgHours = totalHours / FIXED_DENOMINATOR;

            setWeeklyStats({
                totalHours: totalHours.toFixed(1),
                topStudents,
                topSubjects,
                avgHoursPerStudent: avgHours.toFixed(1)
            });
        } catch (error) {
            console.error('Error fetching weekly stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Helper function to check if assignment was completed within deadline
    const isCompletedWithinDeadline = useCallback((assignment, statusData) => {
        if (!statusData || !statusData.completed) return false;
        if (!assignment.dueDate || !statusData.updatedAt) return false;

        const deadline = new Date(assignment.dueDate);
        deadline.setHours(23, 59, 59, 999); // End of deadline day

        const completedAt = statusData.updatedAt.toDate();
        return completedAt <= deadline;
    }, []);

    // ==== collectionGroup で全生徒の課題進捗を一括リアルタイム監視 ====
    useEffect(() => {
        const q = query(collectionGroup(db, 'assignmentStatus'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMap = {};
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const studentId = docSnap.ref.parent.parent.id;
                const assignmentId = data.assignmentId;
                if (!assignmentId) return;
                if (!newMap[assignmentId]) {
                    newMap[assignmentId] = {};
                }
                newMap[assignmentId][studentId] = data;
            });
            setAllStatusMap(newMap);
        }, (error) => {
            console.error('Error fetching assignment statuses:', error);
        });
        return () => unsubscribe();
    }, []);

    // ==== 現在の課題進捗をメモリ上で計算 ====
    useEffect(() => {
        if (students.length === 0 || assignments.length === 0) return;
        const progress = {};
        assignments.forEach(assignment => {
            const eligibleStudents = students.filter(s =>
                s.subjects && (s.subjects.includes(assignment.subject) || assignment.subject === '英論')
            );
            const assignmentStatuses = allStatusMap[assignment.id] || {};
            const completedStudentsList = [];
            const notCompletedStudentsList = [];
            eligibleStudents.forEach(student => {
                const status = assignmentStatuses[student.id];
                if (status?.completed === true) {
                    completedStudentsList.push(student);
                } else {
                    notCompletedStudentsList.push(student);
                }
            });
            progress[assignment.id] = {
                completed: completedStudentsList.length,
                total: eligibleStudents.length,
                completedStudents: completedStudentsList,
                notCompletedStudents: notCompletedStudentsList
            };
        });
        setAssignmentProgress(progress);
    }, [assignments, students, allStatusMap]);

    // ==== 過去の課題進捗をメモリ上で計算（期限チェック付き） ====
    useEffect(() => {
        if (students.length === 0 || pastAssignments.length === 0) return;
        const progress = {};
        pastAssignments.forEach(assignment => {
            const eligibleStudents = students.filter(s =>
                s.subjects && (s.subjects.includes(assignment.subject) || assignment.subject === '英論')
            );
            const assignmentStatuses = allStatusMap[assignment.id] || {};
            const completedStudentsList = [];
            const notCompletedStudentsList = [];
            eligibleStudents.forEach(student => {
                const status = assignmentStatuses[student.id];
                if (status && isCompletedWithinDeadline(assignment, status)) {
                    completedStudentsList.push(student);
                } else {
                    notCompletedStudentsList.push(student);
                }
            });
            progress[assignment.id] = {
                completed: completedStudentsList.length,
                total: eligibleStudents.length,
                completedStudents: completedStudentsList,
                notCompletedStudents: notCompletedStudentsList
            };
        });
        setPastAssignmentProgress(progress);
    }, [pastAssignments, students, allStatusMap, isCompletedWithinDeadline]);

    // ==== fetch assignments ====
    const fetchAssignments = useCallback(() => {
        const q = query(collection(db, 'assignments'), orderBy('dueDate', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(a => {
                    if (!a.dueDate) return true;
                    const dueDate = new Date(a.dueDate);
                    return dueDate >= now;
                });
            setAssignments(data);
        });
        return unsubscribe;
    }, []);

    // ==== fetch past assignments ====
    const fetchPastAssignments = useCallback(() => {
        const q = query(collection(db, 'assignments'), orderBy('dueDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(a => {
                    if (!a.dueDate) return false;
                    const dueDate = new Date(a.dueDate);
                    return dueDate < now; // All past assignments
                });
            setPastAssignments(data);
        });
        return unsubscribe;
    }, []);

    // ==== useEffect ====

    useEffect(() => {
        fetchStudents();
        fetchDailyActive();
        fetchWeeklyStats();
        const unsubscribeAssignments = fetchAssignments();
        const unsubscribePastAssignments = fetchPastAssignments();
        return () => {
            unsubscribeAssignments && unsubscribeAssignments();
            unsubscribePastAssignments && unsubscribePastAssignments();
        };
    }, [fetchStudents, fetchDailyActive, fetchWeeklyStats, fetchAssignments, fetchPastAssignments]);

    const formatTime = (minutes) => {
        if (minutes < 60) {
            return `${minutes}分`;
        } else {
            return `${(minutes / 60).toFixed(1)}時間`;
        }
    };

    const toggleAssignmentExpand = (assignmentId) => {
        setExpandedAssignments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(assignmentId)) {
                newSet.delete(assignmentId);
            } else {
                newSet.add(assignmentId);
            }
            return newSet;
        });
    };

    const togglePastAssignmentExpand = (assignmentId) => {
        setExpandedPastAssignments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(assignmentId)) {
                newSet.delete(assignmentId);
            } else {
                newSet.add(assignmentId);
            }
            return newSet;
        });
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-sm text-gray-400 font-medium">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="pb-20 space-y-6">
            {/* Daily Active Count Card — clickable, opens tab-modal */}
            <button
                className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200 text-left"
                onClick={() => { setActiveTab('recorded'); setShowActiveStudentsModal(true); }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                            今日の記録者数
                        </h3>
                        <div className="text-4xl font-bold text-indigo-600">
                            {dailyActiveCount} <span className="text-lg text-gray-400 font-normal">人</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            全体 {students.length}人中
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-300">
                        <Users className="w-6 h-6 text-indigo-400" />
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
                {/* progress bar */}
                {students.length > 0 && (
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min((dailyActiveCount / students.length) * 100, 100)}%` }}
                        />
                    </div>
                )}
            </button>

            {/* Daily Active Students Modal — tab-based */}
            {showActiveStudentsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-gray-900">今日の記録状況</h3>
                            <button
                                onClick={() => setShowActiveStudentsModal(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 shrink-0">
                            <button
                                onClick={() => setActiveTab('recorded')}
                                className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'recorded'
                                    ? 'text-indigo-600 border-b-2 border-indigo-500'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                記録済み ({dailyActiveStudents.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('unrecorded')}
                                className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'unrecorded'
                                    ? 'text-red-500 border-b-2 border-red-400'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                未記録 ({Math.max(students.length - dailyActiveStudents.length, 0)})
                            </button>
                        </div>
                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {activeTab === 'recorded' ? (
                                dailyActiveStudents.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">記録者がいません</p>
                                ) : (
                                    <div className="space-y-2">
                                        {dailyActiveStudents.map((student, index) => (
                                            <div key={student.userId} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-300">#{index + 1}</span>
                                                    <span className="text-sm font-medium text-gray-900">{student.userName}</span>
                                                </div>
                                                <span className="text-sm font-bold text-indigo-600">{formatTime(student.totalMinutes)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                (() => {
                                    const activeIds = new Set(dailyActiveStudents.map(s => s.userId));
                                    const today = new Date();
                                    const unrecorded = students
                                        .filter(s => !activeIds.has(s.id))
                                        .map(s => {
                                            const last = lastRecordedAtMap[s.id];
                                            const daysSince = last
                                                ? Math.floor((today - last) / (1000 * 60 * 60 * 24))
                                                : null;
                                            return { ...s, daysSince };
                                        })
                                        .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
                                    return unrecorded.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">全当が記録済みです 🎉</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {unrecorded.map(student => (
                                                <div key={student.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {student.displayName || student.userName || '名前なし'}
                                                    </span>
                                                    {student.daysSince !== null && student.daysSince >= 3 ? (
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {student.daysSince}日未記録
                                                        </span>
                                                    ) : student.daysSince !== null ? (
                                                        <span className="text-[11px] text-gray-400">{student.daysSince}日前に記録</span>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-300">記録なし</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Aggregated Study Hours with Calendar */}
            <div id="teacher-tour-daily-hours">
                <DailyAggregatedStudyHours />
            </div>

            {/* Weekly Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-gray-900">先週のサマリー</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Total Hours */}
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-600">総学習時間</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-700">
                            {weeklyStats.totalHours}h
                        </div>
                    </div>

                    {/* Average per student */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-bold text-green-600">平均/人</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                            {weeklyStats.avgHoursPerStudent}h
                        </div>
                    </div>
                </div>

                {/* Top Students */}
                <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-500 mb-2">最も活発な生徒</h4>
                    <div className="space-y-2">
                        {weeklyStats.topStudents.map((student, index) => (
                            <div key={student.userId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{student.userName}</span>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">{student.hours}h</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Subjects */}
                <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-500 mb-2">人気の科目</h4>
                    <div className="flex flex-wrap gap-2">
                        {weeklyStats.topSubjects.map((item, index) => (
                            <div key={item.subject} className="bg-purple-50 px-3 py-2 rounded-lg">
                                <span className="text-xs text-purple-600 font-bold">#{index + 1}</span>
                                <span className="text-sm font-medium text-purple-900 ml-2">{item.subject}</span>
                                <span className="text-xs text-purple-600 ml-2">({item.hours}h)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Assignments Progress */}
            {!showPastAssignmentsView ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100" id="teacher-tour-assignments">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-gray-500" />
                            <h3 className="font-bold text-gray-900">課題進捗</h3>
                        </div>
                        <button
                            id="teacher-tour-add-assignment"
                            onClick={() => setShowPastAssignmentsView(true)}
                            className="text-sm text-indigo-600 font-bold px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                            過去の課題達成状況を確認する
                        </button>
                    </div>

                    <div className="space-y-3">
                        {assignments.length === 0 ? (
                            <p className="text-sm text-gray-400">課題はありません</p>
                        ) : (
                            assignments.map(assignment => {
                                const progress = assignmentProgress[assignment.id] || { completed: 0, total: 0, completedStudents: [], notCompletedStudents: [] };
                                const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
                                const isExpanded = expandedAssignments.has(assignment.id);

                                return (
                                    <div
                                        key={assignment.id}
                                        className={`border border-gray-200 rounded-lg p-3 transition-all ${isExpanded ? 'bg-gray-50 ring-2 ring-indigo-100' : 'bg-white'}`}
                                    >
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => toggleAssignmentExpand(assignment.id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {assignment.subject}
                                                    </span>
                                                    {assignment.dueDate && (
                                                        <span className="text-xs text-gray-400 ml-2">
                                                            〆 {assignment.dueDate}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {progress.completed} / {progress.total}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {percentage.toFixed(0)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-800 font-medium mb-2">
                                                {assignment.content}
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-xs font-bold text-gray-600">達成者 ({progress.completedStudents?.length || 0})</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {progress.completedStudents?.length > 0 ? (
                                                            progress.completedStudents.map(s => (
                                                                <div key={s.id} className="text-xs text-gray-700 bg-white p-1.5 rounded border border-gray-100">
                                                                    {s.displayName || s.userName || '名前なし'}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-gray-400 italic">なし</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                        <span className="text-xs font-bold text-gray-600">未達成者 ({progress.notCompletedStudents?.length || 0})</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {progress.notCompletedStudents?.length > 0 ? (
                                                            progress.notCompletedStudents.map(s => (
                                                                <div key={s.id} className="text-xs text-gray-700 bg-white p-1.5 rounded border border-gray-100">
                                                                    {s.displayName || s.userName || '名前なし'}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-gray-400 italic">なし</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-75">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-gray-500" />
                            <h3 className="font-bold text-gray-900">過去の課題達成状況</h3>
                        </div>
                        <button
                            onClick={() => setShowPastAssignmentsView(false)}
                            className="text-sm text-gray-700 font-bold px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition"
                        >
                            課題進捗に戻る
                        </button>
                    </div>

                    <div className="space-y-3">
                        {pastAssignments.length === 0 ? (
                            <p className="text-sm text-gray-400">過去の課題はありません</p>
                        ) : (
                            pastAssignments.map(assignment => {
                                const progress = pastAssignmentProgress[assignment.id] || { completed: 0, total: 0, completedStudents: [], notCompletedStudents: [] };
                                const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
                                const isExpanded = expandedPastAssignments.has(assignment.id);

                                return (
                                    <div
                                        key={assignment.id}
                                        className={`border border-gray-200 rounded-lg p-3 transition-all bg-gray-50 ${isExpanded ? 'ring-2 ring-gray-200' : ''}`}
                                    >
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => togglePastAssignmentExpand(assignment.id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded opacity-75">
                                                        {assignment.subject}
                                                    </span>
                                                    {assignment.dueDate && (
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            〆 {formatDate(assignment.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-700">
                                                        {progress.completed} / {progress.total}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {percentage.toFixed(0)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-700 font-medium mb-2">
                                                {assignment.content}
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-500 h-2 rounded-full transition-all opacity-60"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 opacity-75"></div>
                                                        <span className="text-xs font-bold text-gray-600">達成者 ({progress.completedStudents?.length || 0})</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {progress.completedStudents?.length > 0 ? (
                                                            progress.completedStudents.map(s => (
                                                                <div key={s.id} className="text-xs text-gray-700 bg-white p-1.5 rounded border border-gray-200 opacity-75">
                                                                    {s.displayName || s.userName || '名前なし'}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-gray-400 italic">なし</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-400 opacity-75"></div>
                                                        <span className="text-xs font-bold text-gray-600">未達成者 ({progress.notCompletedStudents?.length || 0})</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {progress.notCompletedStudents?.length > 0 ? (
                                                            progress.notCompletedStudents.map(s => (
                                                                <div key={s.id} className="text-xs text-gray-700 bg-white p-1.5 rounded border border-gray-200 opacity-75">
                                                                    {s.displayName || s.userName || '名前なし'}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-gray-400 italic">なし</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHomeView;
