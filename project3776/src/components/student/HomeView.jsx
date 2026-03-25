import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, where, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle, Circle, Plus, Trash2, Edit, AlertTriangle, History, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { SUBJECT_ORDER } from '../../utils/constants';
import { playTaskCompleteSound, triggerHapticFeedback } from '../../utils/soundUtils';

// 直近7日間のミニ棒グラフ（Sparkline）
const WeeklySparkline = ({ weekData }) => {
    const maxVal = Math.max(...weekData.map(d => d.minutes), 1);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return (
        <div className="flex items-end gap-[3px] h-7">
            {weekData.map((d, i) => {
                const h = Math.max(2, (d.minutes / maxVal) * 24);
                const dayOfWeek = days[new Date(d.date).getDay()] || '';
                return (
                    <div key={i} className="flex flex-col items-center gap-0.5" title={`${d.label}: ${d.minutes}分`}>
                        <div
                            className="w-[5px] rounded-full transition-all duration-300"
                            style={{
                                height: `${h}px`,
                                backgroundColor: d.isToday ? '#6366f1' : (d.minutes > 0 ? '#a5b4fc' : '#e5e7eb'),
                            }}
                        />
                        <span className="text-[7px] text-gray-400 leading-none">{dayOfWeek}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- Sub-component: Daily Study Hours ---
const DailyStudyHours = ({ uid }) => {
    const { t } = useLanguage();
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentViewMonth, setCurrentViewMonth] = useState(new Date());
    const [monthlyData, setMonthlyData] = useState({});
    const [weekData, setWeekData] = useState([]);

    const DAILY_GOAL = 180; // 目標: 3時間

    // 直近7日間のデータ取得
    useEffect(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, `users/${uid}/studyRecords`),
            where('createdAt', '>=', sevenDaysAgo)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const dailyMap = {};
            snapshot.docs.forEach(d => {
                const data = d.data();
                if (!data.createdAt) return;
                const date = data.createdAt.toDate();
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                dailyMap[key] = (dailyMap[key] || 0) + (data.duration || 0);
            });

            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const result = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                result.push({
                    date: key,
                    label: `${d.getMonth() + 1}/${d.getDate()}`,
                    minutes: dailyMap[key] || 0,
                    isToday: key === todayStr,
                });
            }
            setWeekData(result);

            // 今日の合計を更新
            setTodayMinutes(dailyMap[todayStr] || 0);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    // Fetch monthly data when calendar is shown
    useEffect(() => {
        if (!showCalendar) return;

        const start = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth(), 1);
        const end = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, 0, 23, 59, 59);

        const q = query(
            collection(db, `users/${uid}/studyRecords`),
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
    }, [uid, showCalendar, currentViewMonth]);

    const formatTimeShort = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        return days;
    };

    const goToPrevMonth = () => {
        setCurrentViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // プログレスリング用の計算
    const progress = Math.min(todayMinutes / DAILY_GOAL, 1);
    const ringRadius = 40;
    const ringStroke = 5;
    const normalizedR = ringRadius - ringStroke / 2;
    const circumference = 2 * Math.PI * normalizedR;
    const dashOffset = circumference * (1 - progress);
    const isGoalReached = todayMinutes >= DAILY_GOAL;

    return (
        <>
            {/* ヘッダーカード：プログレスリング + Sparkline */}
            <div id="tour-daily-hours" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                    {/* 左：SVG プログレスリング */}
                    <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}>
                        <svg height={ringRadius * 2} width={ringRadius * 2} className="-rotate-90">
                            <circle stroke="#e5e7eb" fill="transparent" strokeWidth={ringStroke} r={normalizedR} cx={ringRadius} cy={ringRadius} />
                            <circle
                                stroke={isGoalReached ? '#10b981' : '#6366f1'}
                                fill="transparent"
                                strokeWidth={ringStroke}
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                                r={normalizedR}
                                cx={ringRadius}
                                cy={ringRadius}
                                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black tracking-tight" style={{ color: isGoalReached ? '#10b981' : '#6366f1' }}>
                                {loading ? '...' : formatTimeShort(todayMinutes)}
                            </span>
                            <span className="text-[8px] text-gray-400 font-bold tracking-wider">{t('todayStudyTime')}</span>
                        </div>
                    </div>

                    {/* 右：Sparkline + 目標表示 */}
                    <div className="flex-1 flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-wide">LAST 7 DAYS</span>
                        <WeeklySparkline weekData={weekData} />
                        <span className="text-[9px] text-gray-400 mt-0.5">
                            目標 {DAILY_GOAL / 60}h / 日 — {Math.round(progress * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet カレンダー */}
            {showCalendar && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                        onClick={() => setShowCalendar(false)}
                    />
                    {/* Sheet */}
                    <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 bottom-sheet-enter" style={{ maxHeight: '70vh' }}>
                        {/* ハンドルバー */}
                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-1 rounded-full bg-gray-300" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <h3 className="font-bold text-gray-900 tracking-wide">
                                {currentViewMonth.getFullYear()}年{currentViewMonth.getMonth() + 1}月
                            </h3>
                            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                                <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-1">
                                    {day}
                                </div>
                            ))}
                            {getDaysInMonth(currentViewMonth).map((day, index) => (
                                <div
                                    key={index}
                                    className={`text-center py-1.5 rounded-lg ${day ? 'hover:bg-indigo-50' : ''}`}
                                >
                                    {day && (
                                        <div>
                                            <div className="text-xs font-medium text-gray-900">{day}</div>
                                            {monthlyData[day] ? (
                                                <div className="text-[9px] font-bold text-indigo-600">
                                                    {monthlyData[day] < 60
                                                        ? `${monthlyData[day]}m`
                                                        : `${(monthlyData[day] / 60).toFixed(1)}h`}
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-gray-300">-</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 閉じるボタン */}
                        <button
                            onClick={() => setShowCalendar(false)}
                            className="mt-4 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition"
                        >
                            閉じる
                        </button>
                    </div>
                </>
            )}
        </>
    );
};


// --- Sub-component: Shared Assignments ---
const AssignmentsSection = ({ user, profile, onAssignmentClick }) => {
    const { t } = useLanguage();
    const [assignments, setAssignments] = useState([]);
    const [pastAssignments, setPastAssignments] = useState([]);
    const [myStatus, setMyStatus] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [newAssign, setNewAssign] = useState({ subject: '', content: '', dueDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ subject: '', content: '', dueDate: '' });

    // Helper: Get tomorrow's date in YYYY-MM-DD format (local time)
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    };

    const minDate = getMinDate();

    // Helper: Check if a date string (YYYY-MM-DD) is tomorrow
    const isDueTomorrow = (dueDateString) => {
        if (!dueDateString) return false;
        return dueDateString === minDate;
    };

    const [showPastAssignments, setShowPastAssignments] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    // slashingId: アニメーション中のタスクID
    const [slashingId, setSlashingId] = useState(null);
    // checkPopId: チェックボタンのポップアニメーション用
    const [checkPopId, setCheckPopId] = useState(null);
    const isAnimating = useRef(false); // 連打防止ロック


    // Fetch Assignments (Global) - Optimized to reduce reads
    useEffect(() => {
        if (!profile) return;

        const userSubjects = profile.subjects || [];
        const validSubjects = Array.from(new Set([...userSubjects, '英論']));
        let q;

        if (validSubjects.length > 0 && validSubjects.length <= 10) {
            // where('in') limits to 10 array items, saving countless reads.
            q = query(
                collection(db, 'assignments'),
                where('subject', 'in', validSubjects)
            );
        } else {
            q = query(collection(db, 'assignments'), orderBy('dueDate', 'asc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by dueDate locally instead of querying for it to skip expensive index requirements
            data.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            });

            const current = [];
            const past = [];

            data.forEach(a => {
                // Filter by subject - '英論' is visible to all students
                if (!userSubjects.includes(a.subject) && a.subject !== '英論') return;

                if (a.dueDate) {
                    const dueDate = new Date(a.dueDate);
                    // Past assignments: oneWeekAgo <= dueDate < now
                    if (dueDate >= oneWeekAgo && dueDate < now) {
                        past.push(a);
                    }
                    // Current assignments: dueDate >= now
                    else if (dueDate >= now) {
                        current.push(a);
                    }
                } else {
                    // No due date, treat as current
                    current.push(a);
                }
            });

            setAssignments(current);
            setPastAssignments(past);
        });
        return () => unsubscribe();
    }, [profile]);

    // Fetch My Status (including updatedAt for deadline completion check)
    useEffect(() => {
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
    }, [user]);

    // Helper function to check if assignment was completed within deadline
    const isCompletedWithinDeadline = (assignment, statusData) => {
        if (!statusData || !statusData.completed) return false;
        if (!assignment.dueDate || !statusData.updatedAt) return false;

        const deadline = new Date(assignment.dueDate);
        deadline.setHours(23, 59, 59, 999); // End of deadline day

        const completedAt = statusData.updatedAt.toDate();
        return completedAt <= deadline;
    };

    const toggleComplete = async (assignmentId, currentStatus) => {
        const statusRef = doc(db, `users/${user.uid}/assignmentStatus`, assignmentId);
        await setDoc(statusRef, {
            assignmentId,
            completed: !currentStatus,
            updatedAt: serverTimestamp()
        });
    };

    // タスク完了時の Slash エフェクト＋サウンド＋ハプティック
    const handleToggleComplete = async (assignmentId, currentStatus) => {
        // 連打防止
        if (isAnimating.current) return;

        if (!currentStatus) {
            // --- 完了にする場合 ---
            isAnimating.current = true;

            // ① サウンド再生（Web Audio API）
            playTaskCompleteSound();

            // ② ハプティックフィードバック（モバイル）
            triggerHapticFeedback();

            // ③ チェックボタンのポップアニメーション
            setCheckPopId(assignmentId);
            setTimeout(() => setCheckPopId(null), 350);

            // ④ カード全体の slash アニメーション（少し遅れて開始）
            setTimeout(() => setSlashingId(assignmentId), 150);

            // ⑤ アニメーション後に Firestore 更新＋アンロック
            setTimeout(async () => {
                await toggleComplete(assignmentId, currentStatus);
                setSlashingId(null);
                isAnimating.current = false;
            }, 700);
        } else {
            // --- 未完了に戻す場合 ---即時切り替え
            await toggleComplete(assignmentId, currentStatus);
        }
    };



    // Format date for display (YYYY-MM-DD format)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAssign.subject || !newAssign.content || !newAssign.dueDate) {
            alert('この項目を入力してください。');
            return;
        }
        await addDoc(collection(db, 'assignments'), {
            ...newAssign,
            createdBy: user.uid,
            createdAt: serverTimestamp()
        });
        setIsAdding(false);
        setNewAssign({ subject: '', content: '', dueDate: '' });
    };

    const handleEditStart = (assignment) => {
        setEditingId(assignment.id);
        setEditForm({
            subject: assignment.subject,
            content: assignment.content,
            dueDate: assignment.dueDate || ''
        });
    };

    const handleEditSave = async (assignmentId) => {
        if (window.confirm('この課題を編集しますか？')) {
            const assignRef = doc(db, 'assignments', assignmentId);
            await updateDoc(assignRef, {
                ...editForm,
                updatedAt: serverTimestamp()
            });
            setEditingId(null);
        }
    };

    const handleDelete = async (assignmentId) => {
        if (window.confirm('この課題を削除しますか？\nこの操作は取り消せません。')) {
            await deleteDoc(doc(db, 'assignments', assignmentId));
        }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">{t('classAssignments')}</h2>
                <button onClick={() => setIsAdding(!isAdding)} className="text-indigo-600 text-sm font-bold flex items-center gap-1">
                    <Plus className="w-4 h-4" /> {t('add')}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4">
                    <select
                        className="block w-full mb-2 p-2 rounded border-gray-300 text-sm"
                        value={newAssign.subject}
                        onChange={e => setNewAssign({ ...newAssign, subject: e.target.value })}
                        required
                    >
                        <option value="">{t('selectSubject')}</option>
                        {(() => {
                            // Helper function to get sort index
                            const getSubjectOrderIndex = (subject) => {
                                const normalized = subject.replace(/（.*?）/, '');
                                const index = SUBJECT_ORDER.indexOf(normalized);
                                return index !== -1 ? index : 999;
                            };

                            // Combine user subjects with 英論 and sort
                            const allSubjects = [...(profile?.subjects || []), '英論'];
                            const sortedSubjects = allSubjects.sort((a, b) =>
                                getSubjectOrderIndex(a) - getSubjectOrderIndex(b)
                            );

                            return sortedSubjects.map(s => <option key={s} value={s}>{s}</option>);
                        })()}
                    </select>
                    <input
                        className="block w-full mb-2 p-2 rounded border-gray-300 text-sm"
                        placeholder={t('assignmentContent')}
                        value={newAssign.content}
                        onChange={e => setNewAssign({ ...newAssign, content: e.target.value })}
                        required
                    />
                    <input
                        type="date"
                        className="block w-full mb-2 p-2 rounded border-gray-300 text-sm"
                        value={newAssign.dueDate}
                        min={minDate}
                        onChange={e => setNewAssign({ ...newAssign, dueDate: e.target.value })}
                        required
                    />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-bold">{t('addAssignment')}</button>
                </form>
            )}

            <div className="space-y-2">
                {assignments.length === 0 ? <p className="text-sm text-gray-400">{t('noAssignments')}</p> :
                    assignments.filter(a => !(myStatus[a.id]?.completed)).map(a => (
                        <div
                            key={a.id}
                            data-assignment-id={a.id}
                            className={`zen-item relative flex items-center gap-3 bg-white p-3 rounded-xl border-l-4 border-l-rose-400 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ${slashingId === a.id ? 'slashing-task' : ''}`}
                        >
                            {slashingId === a.id && <div className="slash-line" />}

                            {/* チェックボタン */}
                            <button
                                onClick={() => handleToggleComplete(a.id, myStatus[a.id]?.completed)}
                                className={`flex-shrink-0 ${checkPopId === a.id ? 'check-popping' : ''}`}
                            >
                                {myStatus[a.id]?.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : isDueTomorrow(a.dueDate) ? (
                                    <div className="relative group">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                            明日締切
                                        </span>
                                    </div>
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-300" />
                                )}
                            </button>

                            {/* コンテンツエリア（編集中 or 表示中） */}
                            <div className="flex-1 min-w-0">
                                {editingId === a.id ? (
                                    <div className="space-y-2">
                                        <select
                                            className="block w-full p-2 rounded border-gray-300 text-sm"
                                            value={editForm.subject}
                                            onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                                        >
                                            <option value="">{t('selectSubject')}</option>
                                            {(() => {
                                                const getSubjectOrderIndex = (subject) => {
                                                    const normalized = subject.replace(/（.*?）/, '');
                                                    const index = SUBJECT_ORDER.indexOf(normalized);
                                                    return index !== -1 ? index : 999;
                                                };
                                                const allSubjects = [...(profile?.subjects || []), '英論'];
                                                const sortedSubjects = allSubjects.sort((a, b) =>
                                                    getSubjectOrderIndex(a) - getSubjectOrderIndex(b)
                                                );
                                                return sortedSubjects.map(s => <option key={s} value={s}>{s}</option>);
                                            })()}
                                        </select>
                                        <input
                                            className="block w-full p-2 rounded border-gray-300 text-sm"
                                            placeholder={t('assignmentContent')}
                                            value={editForm.content}
                                            onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="block w-full p-2 rounded border-gray-300 text-sm"
                                            value={editForm.dueDate}
                                            min={minDate}
                                            onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditSave(a.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-bold">{t('save')}</button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm font-bold">{t('cancel')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* 表示モード：エリア全体を「記録開始」ボタンとして機能させる */
                                    <button
                                        className="w-full text-left group/content rounded-lg px-2 py-1.5 hover:bg-indigo-50/60 transition-colors duration-150 cursor-pointer"
                                        onClick={() => onAssignmentClick && onAssignmentClick(a)}
                                        title="タップして学習記録を開始"
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{a.subject}</span>
                                            {a.dueDate && <span className="text-xs text-gray-400">〆 {formatDate(a.dueDate)}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Play className="w-3.5 h-3.5 text-gray-300 group-hover/content:text-indigo-500 transition-colors flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-800 truncate">{a.content}</span>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* 編集・削除ボタン（作成者のみ、Zenスタイル） */}
                            {a.createdBy === user.uid && editingId !== a.id && (
                                <div className="zen-actions flex gap-1 flex-shrink-0">
                                    <button onClick={() => handleEditStart(a)} className="p-1.5 text-gray-300 hover:text-indigo-500 transition" title="編集">
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition" title="削除">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                }
            </div>

            {/* 完了済みの現在の課題アーカイブ */}
            {assignments.filter(a => myStatus[a.id]?.completed).length > 0 && (
                <div className="mt-3">
                    <button
                        onClick={() => setShowCompleted(v => !v)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition w-full py-1"
                    >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        完了済 {assignments.filter(a => myStatus[a.id]?.completed).length}件
                        <span className="ml-auto text-[10px]">{showCompleted ? '▲' : '▼'}</span>
                    </button>
                    {showCompleted && (
                        <div className="space-y-1 mt-1">
                            {assignments.filter(a => myStatus[a.id]?.completed).map(a => (
                                <div key={a.id} className="zen-item flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:shadow-sm hover:-translate-y-[1px] transition-all duration-200">
                                    <button onClick={() => handleToggleComplete(a.id, true)}>
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{a.subject}</span>
                                            <span className="text-sm text-gray-400 line-through truncate">{a.content}</span>
                                        </div>
                                    </div>
                                    {a.createdBy === user.uid && (
                                        <div className="zen-actions flex gap-1">
                                            <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition" title="削除">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 過去の課題アーカイブ */}
            {pastAssignments.length > 0 && (
                <div className="mt-3">
                    <button
                        onClick={() => setShowPastAssignments(!showPastAssignments)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition w-full py-1"
                    >
                        <History className="w-4 h-4 text-gray-400" />
                        過去の課題 {pastAssignments.length}件
                        <span className="ml-auto text-[10px]">{showPastAssignments ? '▲' : '▼'}</span>
                    </button>

                    {showPastAssignments && (
                        <div className="space-y-1 mt-1">
                            {[...pastAssignments].sort((a, b) => {
                                const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
                                const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
                                return bDate - aDate;
                            }).map(a => {
                                const statusData = myStatus[a.id];
                                const completedWithinDeadline = isCompletedWithinDeadline(a, statusData);

                                return (
                                    <div key={a.id} className="zen-item flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <div>
                                            {completedWithinDeadline ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{a.subject}</span>
                                                {a.dueDate && <span className="text-[10px] text-gray-400">〆 {formatDate(a.dueDate)}</span>}
                                            </div>
                                            <div className={`text-sm font-medium ${completedWithinDeadline ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                                {a.content}
                                            </div>
                                        </div>
                                        {a.createdBy === user.uid && (
                                            <div className="zen-actions flex gap-1">
                                                <button
                                                    onClick={() => handleDelete(a.id)}
                                                    className="p-1 text-gray-300 hover:text-red-500 transition"
                                                    title="削除"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 小さなドーナツ型プログレスリング（SVG）
const ProgressRing = ({ total, done, color = '#6366f1' }) => {
    const radius = 14;
    const stroke = 3;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const progress = total === 0 ? 0 : done / total;
    const strokeDashoffset = circumference * (1 - progress);
    return (
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke={color}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
        </svg>
    );
};

// --- Sub-component: Daily Routines ---
const DailyRoutinesSection = ({ user, onStartTimer }) => {
    const { t } = useLanguage();
    const [routines, setRoutines] = useState([]);
    const [newRoutine, setNewRoutine] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [slashingIds, setSlashingIds] = useState(new Set());
    const [checkPopId, setCheckPopId] = useState(null);
    const animatingRef = useRef(new Set());

    const getTodayString = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        const q = query(collection(db, `users/${user.uid}/dailyRoutines`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRoutines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newRoutine.trim()) return;
        await addDoc(collection(db, `users/${user.uid}/dailyRoutines`), {
            content: newRoutine,
            completedDates: [],
            createdAt: serverTimestamp()
        });
        setNewRoutine('');
        setIsAdding(false);
    };

    const isCompletedToday = (routine) => {
        return (routine.completedDates || []).includes(getTodayString());
    };

    const handleToggle = async (routine) => {
        if (animatingRef.current.has(routine.id)) return;
        const completedToday = isCompletedToday(routine);
        const today = getTodayString();

        if (!completedToday) {
            // 完了方向：エフェクト後に Firestore 更新
            animatingRef.current.add(routine.id);
            playTaskCompleteSound();
            triggerHapticFeedback();
            setCheckPopId(routine.id);
            setTimeout(() => setCheckPopId(null), 350);

            // Slashアニメーション
            setTimeout(() => {
                setSlashingIds(prev => new Set(prev).add(routine.id));
            }, 150);

            setTimeout(async () => {
                const completedDates = routine.completedDates || [];
                await setDoc(doc(db, `users/${user.uid}/dailyRoutines`, routine.id), {
                    ...routine,
                    completedDates: [...completedDates, today]
                });
                setSlashingIds(prev => { const n = new Set(prev); n.delete(routine.id); return n; });
                animatingRef.current.delete(routine.id);
            }, 700);
        } else {
            // 未完了に戻す：即時
            const newDates = (routine.completedDates || []).filter(d => d !== today);
            await setDoc(doc(db, `users/${user.uid}/dailyRoutines`, routine.id), {
                ...routine,
                completedDates: newDates
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('deleteDailyRoutineConfirm'))) {
            await deleteDoc(doc(db, `users/${user.uid}/dailyRoutines`, id));
        }
    };

    const formatHistoryDates = (dates) => {
        if (!dates || dates.length === 0) return [];
        return [...dates].sort((a, b) => b.localeCompare(a));
    };

    const pending = routines.filter(r => !isCompletedToday(r));
    const completed = routines.filter(r => isCompletedToday(r));
    const total = routines.length;
    const doneCount = completed.length;

    return (
        <div>
            {/* セクションヘッダー */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{t('dailyRoutines')}</h2>
                    {total > 0 && (
                        <div className="flex items-center gap-1" title={`${doneCount}/${total}完了`}>
                            <ProgressRing total={total} done={doneCount} />
                            <span className="text-xs font-bold text-gray-500">{doneCount}/{total}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsAdding(v => !v)}
                    className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-800 transition"
                >
                    <Plus className="w-4 h-4" />追加
                </button>
            </div>

            {/* インライン入力フォーム（アコーディオン） */}
            {isAdding && (
                <form onSubmit={handleAdd} className="form-expanding bg-indigo-50 border border-indigo-100 p-3 rounded-lg mb-3 text-sm">
                    <input
                        autoFocus
                        className="w-full p-2 border border-indigo-200 rounded mb-2 bg-white text-sm"
                        placeholder="毎日やることを入力..."
                        value={newRoutine}
                        onChange={e => setNewRoutine(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-xs font-bold">追加</button>
                        <button type="button" onClick={() => { setIsAdding(false); setNewRoutine(''); }} className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded text-xs font-bold">キャンセル</button>
                    </div>
                </form>
            )}

            {/* 未完了リスト */}
            <div className="space-y-2">
                {pending.length === 0 && total === 0 && (
                    <p className="text-sm text-gray-400">{t('noDailyRoutines')}</p>
                )}
                {pending.map(routine => (
                    <div
                        key={routine.id}
                        className={`zen-item relative flex items-center gap-3 bg-white p-3 rounded-xl border-l-4 border-l-green-400 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ${slashingIds.has(routine.id) ? 'slashing-task' : ''
                            }`}
                    >
                        {slashingIds.has(routine.id) && <div className="slash-line" />}
                        <button
                            onClick={() => handleToggle(routine)}
                            className={checkPopId === routine.id ? 'check-popping' : ''}
                        >
                            <Circle className="w-5 h-5 text-gray-300" />
                        </button>
                        <span className="flex-1 text-sm font-medium text-gray-800">{routine.content}</span>
                        {/* Zenアクション（ホバー時のみ表示） */}
                        <div className="zen-actions flex gap-1">
                            {onStartTimer && (
                                <button
                                    onClick={() => onStartTimer({ content: routine.content })}
                                    className="p-1.5 text-gray-300 hover:text-indigo-500 transition"
                                    title="タイマーで記録開始"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(routine.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 transition"
                                title="削除"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 完了済アーカイブアコーディオン */}
            {completed.length > 0 && (
                <div className="mt-3">
                    <button
                        onClick={() => setShowCompleted(v => !v)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition w-full py-1"
                    >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        完了済 {completed.length}件
                        <span className="ml-auto text-[10px]">{showCompleted ? '▲' : '▼'}</span>
                    </button>
                    {showCompleted && (
                        <div className="space-y-1 mt-1">
                            {completed.map(routine => {
                                const historyDates = formatHistoryDates(routine.completedDates);
                                return (
                                    <div key={routine.id} className="zen-item flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <button onClick={() => handleToggle(routine)}>
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        </button>
                                        <span className="flex-1 text-sm text-gray-400 line-through">{routine.content}</span>
                                        <div className="zen-actions flex items-center gap-1">
                                            <span className="text-[10px] text-gray-400">{historyDates[0] ? `最近: ${historyDates[0]}` : ''}</span>
                                            <button
                                                onClick={() => handleDelete(routine.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Sub-component: My Plans ---
const MyPlansSection = ({ user, profile, onStartTimer }) => {
    const { t } = useLanguage();
    const [plans, setPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({ date: '', subject: '', content: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [slashingIds, setSlashingIds] = useState(new Set());
    const [checkPopId, setCheckPopId] = useState(null);
    const animatingRef = useRef(new Set());

    useEffect(() => {
        const q = query(collection(db, `users/${user.uid}/myPlans`), orderBy('date', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newPlan.date || !newPlan.subject || !newPlan.content) return;
        await addDoc(collection(db, `users/${user.uid}/myPlans`), {
            ...newPlan,
            completed: false,
            createdAt: serverTimestamp()
        });
        setNewPlan({ date: '', subject: '', content: '' });
        setIsAdding(false);
    };

    const handleToggle = async (plan) => {
        if (animatingRef.current.has(plan.id)) return;
        if (!plan.completed) {
            animatingRef.current.add(plan.id);
            playTaskCompleteSound();
            triggerHapticFeedback();
            setCheckPopId(plan.id);
            setTimeout(() => setCheckPopId(null), 350);
            setTimeout(() => {
                setSlashingIds(prev => new Set(prev).add(plan.id));
            }, 150);
            setTimeout(async () => {
                await setDoc(doc(db, `users/${user.uid}/myPlans`, plan.id), {
                    ...plan, completed: true
                });
                setSlashingIds(prev => { const n = new Set(prev); n.delete(plan.id); return n; });
                animatingRef.current.delete(plan.id);
            }, 700);
        } else {
            await setDoc(doc(db, `users/${user.uid}/myPlans`, plan.id), {
                ...plan, completed: false
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('削除しますか？')) {
            await deleteDoc(doc(db, `users/${user.uid}/myPlans`, id));
        }
    };

    // 科目ごとのテーマカラー（寒色系）
    const getSubjectColor = (subject) => {
        if (!subject) return 'bg-gray-100 text-gray-600';
        const s = subject.replace(/（.*?）/, '');
        const map = {
            '数学': 'bg-blue-100 text-blue-700',
            '英語': 'bg-cyan-100 text-cyan-700',
            '物理': 'bg-violet-100 text-violet-700',
            '化学': 'bg-teal-100 text-teal-700',
            '生物': 'bg-green-100 text-green-700',
            '現代文': 'bg-orange-100 text-orange-700',
            '古典': 'bg-amber-100 text-amber-700',
            '地理': 'bg-lime-100 text-lime-700',
            '情報': 'bg-sky-100 text-sky-700',
            '歴史': 'bg-red-100 text-red-700',
            '英論': 'bg-indigo-100 text-indigo-700',
        };
        return Object.entries(map).find(([k]) => s.includes(k))?.[1] || 'bg-slate-100 text-slate-600';
    };

    // 今日・明日の日付文字列
    const getTodayString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const getTomorrowString = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const today = getTodayString();
    const tomorrow = getTomorrowString();

    const pending = plans.filter(p => !p.completed);
    const completedPlans = plans.filter(p => p.completed);
    const total = plans.length;
    const doneCount = completedPlans.length;

    // 日付グループ
    const todayPlans = pending.filter(p => p.date === today);
    const tomorrowPlans = pending.filter(p => p.date === tomorrow);
    const futurePlans = pending.filter(p => p.date && p.date > tomorrow);
    const noDayPlans = pending.filter(p => !p.date || (p.date < today));

    const renderPlanCard = (plan) => (
        <div
            key={plan.id}
            className={`zen-item relative flex items-center gap-3 bg-white p-3 rounded-xl border-l-4 border-l-indigo-400 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ${slashingIds.has(plan.id) ? 'slashing-task' : ''
                }`}
        >
            {slashingIds.has(plan.id) && <div className="slash-line" />}
            <button
                onClick={() => handleToggle(plan)}
                className={checkPopId === plan.id ? 'check-popping' : ''}
            >
                <Circle className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${getSubjectColor(plan.subject)}`}>
                        {plan.subject?.replace(/（.*?）/, '') || ''}
                    </span>
                    {plan.date && (
                        <span className={`text-[10px] font-medium ${plan.date === today ? 'text-red-500 font-bold' :
                            plan.date === tomorrow ? 'text-amber-500' : 'text-gray-400'
                            }`}>
                            {plan.date === today ? '🔴 今日' : plan.date === tomorrow ? '🟡 明日' : plan.date}
                        </span>
                    )}
                </div>
                <div className="text-sm font-medium text-gray-800 truncate">{plan.content}</div>
            </div>
            <div className="zen-actions flex gap-1">
                {onStartTimer && (
                    <button
                        onClick={() => onStartTimer({ subject: plan.subject, content: plan.content })}
                        className="p-1.5 text-gray-300 hover:text-indigo-500 transition"
                        title="タイマーで記録開始"
                    >
                        <Play className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition"
                    title="削除"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );

    return (
        <div>
            {/* セクションヘッダー */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{t('myPlans')}</h2>
                    {total > 0 && (
                        <div className="flex items-center gap-1" title={`${doneCount}/${total}完了`}>
                            <ProgressRing total={total} done={doneCount} color="#818cf8" />
                            <span className="text-xs font-bold text-gray-500">{doneCount}/{total}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsAdding(v => !v)}
                    className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-800 transition"
                >
                    <Plus className="w-4 h-4" />追加
                </button>
            </div>

            {/* 折りたたみフォーム */}
            {isAdding && (
                <form onSubmit={handleAdd} className="form-expanding bg-indigo-50 border border-indigo-100 p-3 rounded-lg mb-3 text-sm">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                            type="date"
                            className="p-2 border border-indigo-200 rounded bg-white text-sm"
                            value={newPlan.date}
                            onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                            required
                        />
                        <select
                            className="p-2 border border-indigo-200 rounded bg-white text-sm"
                            value={newPlan.subject}
                            onChange={e => setNewPlan({ ...newPlan, subject: e.target.value })}
                            required
                        >
                            <option value="">{t('planSubject')}</option>
                            {profile?.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <input
                        autoFocus
                        className="w-full p-2 border border-indigo-200 rounded mb-2 bg-white text-sm"
                        placeholder={t('planContent')}
                        value={newPlan.content}
                        onChange={e => setNewPlan({ ...newPlan, content: e.target.value })}
                        required
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-xs font-bold">追加</button>
                        <button type="button" onClick={() => { setIsAdding(false); setNewPlan({ date: '', subject: '', content: '' }); }} className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded text-xs font-bold">キャンセル</button>
                    </div>
                </form>
            )}

            {/* 未完了リスト（日付グループ化） */}
            <div className="space-y-3">
                {pending.length === 0 && (
                    <p className="text-sm text-gray-400">プランがありません</p>
                )}

                {todayPlans.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">今日</p>
                        <div className="space-y-2">{todayPlans.map(renderPlanCard)}</div>
                    </div>
                )}
                {tomorrowPlans.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">明日</p>
                        <div className="space-y-2">{tomorrowPlans.map(renderPlanCard)}</div>
                    </div>
                )}
                {futurePlans.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">それ以降</p>
                        <div className="space-y-2">{futurePlans.map(renderPlanCard)}</div>
                    </div>
                )}
                {noDayPlans.length > 0 && (
                    <div className="space-y-2">{noDayPlans.map(renderPlanCard)}</div>
                )}
            </div>

            {/* 完了済アーカイブ */}
            {completedPlans.length > 0 && (
                <div className="mt-3">
                    <button
                        onClick={() => setShowCompleted(v => !v)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition w-full py-1"
                    >
                        <CheckCircle className="w-4 h-4 text-indigo-300" />
                        完了済 {completedPlans.length}件
                        <span className="ml-auto text-[10px]">{showCompleted ? '▲' : '▼'}</span>
                    </button>
                    {showCompleted && (
                        <div className="space-y-1 mt-1">
                            {completedPlans.map(plan => (
                                <div key={plan.id} className="zen-item flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <button onClick={() => handleToggle(plan)}>
                                        <CheckCircle className="w-5 h-5 text-indigo-300" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded mr-1 ${getSubjectColor(plan.subject)}`}>
                                            {plan.subject?.replace(/（.*?）/, '') || ''}
                                        </span>
                                        <span className="text-xs text-gray-400 line-through">{plan.content}</span>
                                    </div>
                                    <div className="zen-actions">
                                        <button
                                            onClick={() => handleDelete(plan.id)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const HomeView = ({ onAssignmentClick, onStartTimer }) => {
    const { user, profile } = useAuth();

    return (
        <div className="pb-20 md:pb-0">
            <DailyStudyHours uid={user.uid} />

            {/* Mobile: 課題 → 日課 → マイプラン (縦並び) */}
            {/* PC: 左列(課題、マイプラン) / 右列(日課) */}
            <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                {/* 課題: Mobile(1番目), PC(左上) */}
                <div id="tour-assignments" className="order-1 md:order-1">
                    <AssignmentsSection user={user} profile={profile} onAssignmentClick={onAssignmentClick} />
                </div>

                {/* 日課: Mobile(2番目), PC(右上 - row-span-2で2行分) */}
                <div id="tour-routines" className="order-2 md:order-2 md:row-span-2">
                    <DailyRoutinesSection user={user} onStartTimer={onStartTimer} />
                </div>

                {/* マイプラン: Mobile(3番目), PC(左下) */}
                <div id="tour-myplans" className="order-3 md:order-3">
                    <MyPlansSection user={user} profile={profile} onStartTimer={onStartTimer} />
                </div>
            </div>
        </div>
    );
};

export default HomeView;
