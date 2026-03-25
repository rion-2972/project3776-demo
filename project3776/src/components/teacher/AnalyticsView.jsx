import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { collection, query, getDocs, collectionGroup, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Filter, TrendingUp, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import MtFujiVariantA from '../shared/MtFujiVariantA';
import { getSubjectColor } from '../../utils/constants';

// 日付ユーティリティ関数
const addMonths = (date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const isSameMonth = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();



/** Glassmorphism カードラッパー */
const GlassCard = ({ children, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`rounded-2xl p-4 mb-4 ${className}`}
        style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(238,242,255,0.85))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.12)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        }}
    >
        {children}
    </motion.div>
);

const StatPill = ({ icon: Icon, label, value, color }) => (
    <div className="flex flex-col items-center gap-1">
        <div className={`p-2 rounded-xl ${color}`}>
            <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="text-lg font-bold text-gray-800">{value}</div>
        <div className="text-[10px] text-gray-500 font-medium">{label}</div>
    </div>
);

/**
 * 生徒一覧テーブルの1行コンポーネント（React.memoで不要な再レンダリングを防止）
 */
const StudentRow = memo(({ student, stats, electiveSubject, getSubjectColor: getColor }) => (
    <tr className="border-b border-gray-50 hover:bg-indigo-50/40 transition">
        <td className="px-2 py-2.5 font-semibold text-gray-800">
            {student.displayName || '名前なし'}
        </td>
        <td className="px-2 py-2.5">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${student.type === 'bunken' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {student.type === 'bunken' ? '文系' : '理系'}
            </span>
        </td>
        <td className="px-2 py-2.5 text-xs text-gray-600">
            {electiveSubject || <span className="text-gray-300">-</span>}
        </td>
        <td className="px-2 py-2.5 text-right font-bold" style={{ color: '#6366f1' }}>
            {stats.totalHours}h
        </td>
        <td className="px-2 py-2.5">
            <div className="flex flex-wrap gap-1">
                {Object.entries(stats.subjectPercentages)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([subject, percentage]) => (
                        <span
                            key={subject}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                            style={{ background: getColor(subject) }}
                        >
                            {subject} {percentage}%
                        </span>
                    ))}
            </div>
        </td>
    </tr>
));
StudentRow.displayName = 'StudentRow';

const AnalyticsView = () => {
    const [students, setStudents] = useState([]);
    const [studyRecords, setStudyRecords] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [earliestRecordDate, setEarliestRecordDate] = useState(null);
    const [latestRecordDate, setLatestRecordDate] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');
    const [showGroupCharts, setShowGroupCharts] = useState(false);
    const [goalSortAsc, setGoalSortAsc] = useState(true); // 达成率の昇順ソート

    const fetchBounds = useCallback(async () => {
        try {
            // キャッシュ確認（bounds は当日中有効）
            const cacheKey = `analyticsCache_bounds_${new Date().toISOString().slice(0, 10)}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { earliest, latest } = JSON.parse(cached);
                if (earliest) setEarliestRecordDate(new Date(earliest));
                if (latest) setLatestRecordDate(new Date(latest));
                return;
            }

            const earliestQuery = query(collectionGroup(db, 'studyRecords'), orderBy('createdAt', 'asc'), limit(1));
            const earliestSnapshot = await getDocs(earliestQuery);
            let earliest = null;
            if (!earliestSnapshot.empty) {
                earliest = earliestSnapshot.docs[0].data().createdAt.toDate().toISOString();
                setEarliestRecordDate(new Date(earliest));
            }
            const latestQuery = query(collectionGroup(db, 'studyRecords'), orderBy('createdAt', 'desc'), limit(1));
            const latestSnapshot = await getDocs(latestQuery);
            let latest = null;
            if (!latestSnapshot.empty) {
                latest = latestSnapshot.docs[0].data().createdAt.toDate().toISOString();
                setLatestRecordDate(new Date(latest));
            }
            sessionStorage.setItem(cacheKey, JSON.stringify({ earliest, latest }));
        } catch (error) {
            console.error('Error fetching bounds:', error);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 生徒一覧（セッション中1回のみ取得）
            if (students.length === 0) {
                const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
                const studentsSnapshot = await getDocs(studentsQuery);
                setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }

            // 月間学習記録：sessionStorage キャッシュを確認
            const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
            const cacheKey = `analyticsCache_records_${monthKey}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                setStudyRecords(JSON.parse(cached));
                setLoading(false);
                return;
            }

            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            const recordsQuery = query(
                collectionGroup(db, 'studyRecords'),
                where('createdAt', '>=', start),
                where('createdAt', '<=', end)
            );
            const recordsSnapshot = await getDocs(recordsQuery);
            const records = recordsSnapshot.docs.map(doc => ({
                id: doc.id,
                userId: doc.ref.parent.parent.id,
                ...doc.data(),
                // Timestamp は JSON 化できないため秒数に変換
                createdAt: doc.data().createdAt?.toDate().toISOString() ?? null,
            }));

            // 過去の月のみキャッシュ保存（今月は随時更新されるためキャッシュしない）
            const now = new Date();
            const isCurrentMonth = isSameMonth(currentMonth, now);
            if (!isCurrentMonth) {
                try { sessionStorage.setItem(cacheKey, JSON.stringify(records)); } catch (_) { /* 容量超過時は無視 */ }
            }

            setStudyRecords(records);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [students.length, currentMonth]);

    useEffect(() => { fetchBounds(); }, [fetchBounds]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const canGoPrev = earliestRecordDate ? !isSameMonth(currentMonth, earliestRecordDate) && currentMonth > earliestRecordDate : false;
    const canGoNext = latestRecordDate ? !isSameMonth(currentMonth, latestRecordDate) && currentMonth < latestRecordDate : false;

    const getElectiveSubject = useCallback((student) => {
        if (!student.subjects) return null;
        const historySubjects = ['日本史', '世界史'];
        const scienceSubjects = ['物理', '生物'];
        return student.subjects.find(s => historySubjects.includes(s)) ||
            student.subjects.find(s => scienceSubjects.includes(s)) || null;
    }, []);

    // 科目名を大分類にまとめる（例: 「数学（標準）」→「数学」、「化学基礎」→「化学」）
    const formatSubjectName = useCallback((subject) => {
        if (!subject) return 'その他';
        if (subject.includes('英語') || subject.includes('英論')) return '英語';
        if (subject.includes('数学')) return '数学';
        if (subject.includes('国語') || subject.includes('現代文') || subject.includes('古典')) return '国語';
        if (subject.includes('物理')) return '物理';
        if (subject.includes('化学')) return '化学';
        if (subject.includes('生物')) return '生物';
        if (subject.includes('日本史')) return '日本史';
        if (subject.includes('世界史')) return '世界史';
        if (subject.includes('地理')) return '地理';
        if (subject.includes('政経') || subject.includes('政治経済')) return '政治経済';
        if (subject.includes('情報')) return '情報';
        return subject;
    }, []);

    // フィルタリングされた生徒リスト
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (filterType !== 'all' && student.type !== filterType) return false;
            if (filterSubject !== 'all') {
                if (!student.subjects || !student.subjects.includes(filterSubject)) return false;
            }
            return true;
        });
    }, [students, filterType, filterSubject]);

    // 生徒別の学習統計をO(1)で引けるように事前計算
    const studentStatsMap = useMemo(() => {
        const map = {};
        students.forEach(s => {
            map[s.id] = { totalMinutes: 0, subjectBreakdown: {}, subjectPercentages: {}, totalHours: "0.0" };
        });

        studyRecords.forEach(record => {
            if (!map[record.userId]) {
                map[record.userId] = { totalMinutes: 0, subjectBreakdown: {}, subjectPercentages: {}, totalHours: "0.0" };
            }
            const sMap = map[record.userId];
            sMap.totalMinutes += (record.duration || 0);
            const subject = formatSubjectName(record.subject);
            sMap.subjectBreakdown[subject] = (sMap.subjectBreakdown[subject] || 0) + (record.duration || 0);
        });

        Object.values(map).forEach(sMap => {
            sMap.totalHours = (sMap.totalMinutes / 60).toFixed(1);
            if (sMap.totalMinutes > 0) {
                Object.entries(sMap.subjectBreakdown).forEach(([subject, minutes]) => {
                    sMap.subjectPercentages[subject] = ((minutes / sMap.totalMinutes) * 100).toFixed(0);
                });
            }
        });

        return map;
    }, [students, studyRecords, formatSubjectName]);

    // 富士山ビュー共通の生徒ごとの時間マップ
    const studentHoursMap = useMemo(() => {
        const map = {};
        filteredStudents.forEach(student => {
            map[student.id] = parseFloat(studentStatsMap[student.id]?.totalHours || 0);
        });
        return map;
    }, [filteredStudents, studentStatsMap]);

    // 棒グラフ用データ: 生徒別の総学習時間
    const barData = useMemo(() => {
        return filteredStudents
            .map(student => ({
                name: (student.displayName || '?').slice(0, 3),
                時間: parseFloat(studentStatsMap[student.id]?.totalHours || 0),
            }))
            .sort((a, b) => b.時間 - a.時間);
    }, [filteredStudents, studentStatsMap]);

    // ドーナツグラフ用データ: クラス全体の科目別合計
    const pieData = useMemo(() => {
        const subjectTotalMap = {};
        studyRecords.forEach(record => {
            const subject = formatSubjectName(record.subject);
            subjectTotalMap[subject] = (subjectTotalMap[subject] || 0) + (record.duration || 0);
        });
        return Object.entries(subjectTotalMap)
            .map(([name, minutes]) => ({ name, value: parseFloat((minutes / 60).toFixed(1)) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [studyRecords, formatSubjectName]);

    // グループ別データ: 文理×選択科目で4グループを生成
    const GROUPS = useMemo(() => [
        { key: 'bunken-nihon', label: '文系（日本史）', type: 'bunken', subject: '日本史', color: '#f97316' },
        { key: 'bunken-sekai', label: '文系（世界史）', type: 'bunken', subject: '世界史', color: '#ef4444' },
        { key: 'riken-physics', label: '理系（物理）', type: 'riken', subject: '物理', color: '#8b5cf6' },
        { key: 'riken-biology', label: '理系（生物）', type: 'riken', subject: '生物', color: '#14b8a6' },
    ], []);

    const groupPieDataMap = useMemo(() => {
        const map = {};
        GROUPS.forEach(group => {
            const groupIds = new Set(
                students
                    .filter(s => s.type === group.type && Array.isArray(s.subjects) && s.subjects.includes(group.subject))
                    .map(s => s.id)
            );
            if (groupIds.size === 0) {
                map[group.key] = [];
                return;
            }
            const gMap = {};
            studyRecords
                .filter(r => groupIds.has(r.userId))
                .forEach(record => {
                    const subject = formatSubjectName(record.subject);
                    gMap[subject] = (gMap[subject] || 0) + (record.duration || 0);
                });
            map[group.key] = Object.entries(gMap)
                .map(([name, minutes]) => ({ name, value: parseFloat((minutes / 60).toFixed(1)) }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6);
        });
        return map;
    }, [students, studyRecords, formatSubjectName, GROUPS]);

    const { totalClassHours, avgHours } = useMemo(() => {
        const totalClassMinutes = studyRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
        const totalHours = (totalClassMinutes / 60).toFixed(1);
        const avg = filteredStudents.length > 0
            ? (filteredStudents.reduce((sum, s) => sum + parseFloat(studentStatsMap[s.id]?.totalHours || 0), 0) / filteredStudents.length).toFixed(1)
            : 0;
        return { totalClassHours: totalHours, avgHours: avg };
    }, [studyRecords, filteredStudents, studentStatsMap]);

    // 目標達成状況ダッシュボード用データ
    const goalDashboardData = useMemo(() => {
        const today = new Date();
        const todayDow = today.getDay(); // 0=日, 6=土
        const isWeekend = todayDow === 0 || todayDow === 6;
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // 今日の学習分数（生徒別）を近似計算
        const todayMinutesMap = {};
        studyRecords.forEach(r => {
            if (!r.createdAt) return;
            const d = new Date(r.createdAt);
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (dStr === todayStr) {
                todayMinutesMap[r.userId] = (todayMinutesMap[r.userId] || 0) + (r.duration || 0);
            }
        });

        return filteredStudents.map(student => {
            const goals = student.studyGoals;
            let targetMinutes = 0;
            if (goals) {
                if (goals.mode === 'advanced' && goals.weekly) {
                    targetMinutes = goals.weekly[todayDow] ?? 0;
                } else {
                    targetMinutes = isWeekend ? (goals.weekend ?? 0) : (goals.weekday ?? 0);
                }
            }
            const studiedMinutes = todayMinutesMap[student.id] || 0;
            const rate = targetMinutes > 0 ? Math.min(100, Math.round((studiedMinutes / targetMinutes) * 100)) : null;
            return {
                id: student.id,
                name: student.displayName || '名前なし',
                targetMinutes,
                studiedMinutes,
                rate,
            };
        });
    }, [filteredStudents, studyRecords]);

    // 達成率ソート済みダッシュボードデータ
    const sortedGoalData = useMemo(() => {
        return [...goalDashboardData].sort((a, b) => {
            const ra = a.rate ?? 101; // 未設定は最後尾に
            const rb = b.rate ?? 101;
            return goalSortAsc ? ra - rb : rb - ra;
        });
    }, [goalDashboardData, goalSortAsc]);

    const fmtMins = (m) => {
        if (!m) return '—';
        const h = Math.floor(m / 60);
        const rem = m % 60;
        if (h === 0) return `${rem}分`;
        if (rem === 0) return `${h}h`;
        return `${h}h${rem}m`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-sm text-gray-400 font-medium">データを読み込み中...</div>
            </div>
        );
    }

    // 共通props
    const fujiProps = {
        students: filteredStudents,
        studentHoursMap,
        currentMonth,
        onPrevMonth: () => setCurrentMonth(prev => addMonths(prev, -1)),
        onNextMonth: () => setCurrentMonth(prev => addMonths(prev, 1)),
        canGoPrev,
        canGoNext,
    };

    return (
        <div className="pb-20" id="teacher-tour-analytics">
            {/* クラス全体の富士山ビュー */}
            <div id="teacher-tour-fuji">
                <MtFujiVariantA {...fujiProps} />
            </div>

            {/* クイック統計 */}
            <GlassCard>
                <div className="flex justify-around">
                    <StatPill icon={Users} label="対象生徒" value={`${filteredStudents.length}人`} color="bg-indigo-500" />
                    <StatPill icon={Clock} label="クラス合計" value={`${totalClassHours}h`} color="bg-purple-500" />
                    <StatPill icon={TrendingUp} label="平均時間" value={`${avgHours}h`} color="bg-teal-500" />
                </div>
            </GlassCard>

            {/* フィルター */}
            <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-gray-700">フィルター</span>
                </div>
                <div className="grid grid-cols-2 gap-3" id="teacher-tour-filter">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">文理選択</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white/80"
                        >
                            <option value="all">すべて</option>
                            <option value="bunken">文系</option>
                            <option value="riken">理系</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">選択科目</label>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white/80"
                        >
                            <option value="all">すべて</option>
                            <option value="日本史">日本史</option>
                            <option value="世界史">世界史</option>
                            <option value="物理">物理</option>
                            <option value="生物">生物</option>
                        </select>
                    </div>
                </div>
            </GlassCard>

            {/* 生徒別学習時間 棒グラフ */}
            {barData.length > 0 && (
                <GlassCard>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">生徒別学習時間ランキング</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                            <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#818cf8" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="h" />
                            <Tooltip
                                formatter={(v) => [`${v}時間`, '学習時間']}
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 12 }}
                            />
                            <Bar dataKey="時間" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {pieData.length > 0 && (
                <GlassCard>
                    <h3 className="text-sm font-bold text-gray-700 mb-1">クラス全体の科目内訳</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {pieData.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={getSubjectColor(entry.name)}
                                        stroke="white"
                                        strokeWidth={1.5}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(v) => [`${v}時間`, '学習時間']}
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 12 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* 動的凡例（学習時間の多い順に並び、実在する科目のみ表示） */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
                        {pieData.map(entry => (
                            <div key={entry.name} className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getSubjectColor(entry.name) }} />
                                <span className="text-[11px] text-gray-600">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* グループ別科目内訳グラフ */}
            <GlassCard>
                {/* トグルヘッダー */}
                <button
                    onClick={() => setShowGroupCharts(prev => !prev)}
                    className="w-full flex items-center justify-between"
                >
                    <h3 className="text-sm font-bold text-gray-700">グループ別の科目内訳</h3>
                    <span className={`text-gray-400 transition-transform duration-200 ${showGroupCharts ? 'rotate-180' : ''}`}>
                        ▾
                    </span>
                </button>
                {!showGroupCharts && (
                    <p className="text-xs text-gray-400 mt-1">タップしてグループ別の内訳を確認</p>
                )}

                {showGroupCharts && (
                    <div className="mt-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            {GROUPS.map(group => {
                                const gData = groupPieDataMap[group.key] || [];
                                const hasData = gData.length > 0;
                                return (
                                    <div key={group.key}>
                                        {/* ラベル：グラフの直上に小さく配置 */}
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ background: group.color }}
                                            />
                                            <span className="text-xs font-bold text-gray-700">{group.label}</span>
                                        </div>
                                        {hasData ? (
                                            <>
                                                <ResponsiveContainer width="100%" height={120}>
                                                    <PieChart>
                                                        <Pie
                                                            data={gData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={28}
                                                            outerRadius={50}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                            startAngle={90}
                                                            endAngle={-270}
                                                        >
                                                            {gData.map((entry) => (
                                                                <Cell
                                                                    key={entry.name}
                                                                    fill={getSubjectColor(entry.name)}
                                                                    stroke="white"
                                                                    strokeWidth={1.5}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(v, name) => [`${v}h`, name]}
                                                            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 11 }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {/* グラフごとの動的凡例（学習時間順） */}
                                                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 justify-center">
                                                    {gData.map(entry => (
                                                        <div key={entry.name} className="flex items-center gap-0.5">
                                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getSubjectColor(entry.name) }} />
                                                            <span className="text-[10px] text-gray-500">{entry.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-[120px] text-xs text-gray-400">
                                                データなし
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* 生徒一覧テーブル */}
            <GlassCard>
                <h3 className="text-sm font-bold text-gray-700 mb-3">生徒一覧 ({filteredStudents.length}人)</h3>
                <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-indigo-100">
                                <th className="px-2 py-2 text-left text-xs text-gray-400 font-bold">生徒名</th>
                                <th className="px-2 py-2 text-left text-xs text-gray-400 font-bold">文理</th>
                                <th className="px-2 py-2 text-left text-xs text-gray-400 font-bold">選択</th>
                                <th className="px-2 py-2 text-right text-xs text-gray-400 font-bold">月間</th>
                                <th className="px-2 py-2 text-left text-xs text-gray-400 font-bold">科目内訳</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <StudentRow
                                    key={student.id}
                                    student={student}
                                    stats={studentStatsMap[student.id] || { totalHours: "0.0", subjectPercentages: {} }}
                                    electiveSubject={getElectiveSubject(student)}
                                    getSubjectColor={getSubjectColor}
                                />
                            ))}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            該当する生徒がいません
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* 目標達成状況ダッシュボード */}
            <div id="teacher-tour-goals">
                <GlassCard>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">🎯 目標達成状況（今日）</h3>
                        <button
                            type="button"
                            onClick={() => setGoalSortAsc(prev => !prev)}
                            className="text-xs text-indigo-600 font-bold border border-indigo-200 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition"
                        >
                            {goalSortAsc ? '達成率 ↑ 未達成順' : '達成率 ↓ 達成順'}
                        </button>
                    </div>
                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-indigo-100">
                                    <th className="px-2 py-2 text-left text-xs text-gray-400 font-bold">生徒名</th>
                                    <th className="px-2 py-2 text-right text-xs text-gray-400 font-bold">目標</th>
                                    <th className="px-2 py-2 text-right text-xs text-gray-400 font-bold">学習済</th>
                                    <th className="px-2 py-2 text-left text-xs text-gray-400 font-bold w-28">達成率</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGoalData.map(row => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-indigo-50/40 transition">
                                        <td className="px-2 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{row.name}</td>
                                        <td className="px-2 py-2.5 text-right text-xs text-gray-500">{fmtMins(row.targetMinutes)}</td>
                                        <td className="px-2 py-2.5 text-right text-xs font-bold" style={{ color: row.studiedMinutes > 0 ? '#6366f1' : '#d1d5db' }}>
                                            {fmtMins(row.studiedMinutes)}
                                        </td>
                                        <td className="px-2 py-2.5">
                                            {row.rate === null ? (
                                                <span className="text-xs text-gray-300">未設定</span>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[48px]">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${row.rate}%`,
                                                                background: row.rate >= 100
                                                                    ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                                                                    : row.rate >= 50
                                                                        ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                                                                        : 'linear-gradient(90deg,#ef4444,#dc2626)'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold w-8 text-right ${row.rate >= 100 ? 'text-green-600' : row.rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {row.rate}%
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sortedGoalData.length === 0 && (
                            <div className="py-8 text-center text-gray-400 text-sm">該当する生徒がいません</div>
                        )}
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400">※ 山が設定した目標時間に対する、今日の学習達成率を表示しています。未設定の場合は「未設定」と表示されます。</p>
                </GlassCard>
            </div>
        </div>
    );
};

export default AnalyticsView;
