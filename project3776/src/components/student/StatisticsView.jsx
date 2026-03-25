import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const StatisticsView = ({ onBack }) => {
    const { user } = useAuth();
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [weeklyData, setWeeklyData] = useState([]);
    const [colorMap, setColorMap] = useState({});

    // Get Monday of current week
    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    // Generate week dates (Monday - Sunday)
    const getWeekDates = (mondayDate) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(mondayDate);
            date.setDate(mondayDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const weekDates = getWeekDates(currentWeekStart);

    // Fetch study records for the week
    useEffect(() => {
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const q = query(
            collection(db, `users/${user.uid}/studyRecords`),
            where('createdAt', '>=', weekStart),
            where('createdAt', '<', weekEnd)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Group by day and subject/book
            const grouped = {};
            const subjects = new Set();
            const books = new Set();

            records.forEach(record => {
                if (!record.createdAt) return;

                const dayIndex = record.createdAt.getDay();
                const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1; // Monday = 0, Sunday = 6

                if (!grouped[adjustedDay]) {
                    grouped[adjustedDay] = [];
                }

                const key = record.referenceBook || record.subject;
                subjects.add(record.subject);
                if (record.referenceBook) books.add(record.referenceBook);

                const existing = grouped[adjustedDay].find(item => item.key === key);
                if (existing) {
                    existing.duration += record.duration || 0;
                } else {
                    grouped[adjustedDay].push({
                        key,
                        subject: record.subject,
                        referenceBook: record.referenceBook,
                        duration: record.duration || 0
                    });
                }
            });

            setWeeklyData(grouped);

            // Generate color map
            const allKeys = [...subjects, ...books];
            const colors = generateColors(allKeys.length);
            const newColorMap = {};
            allKeys.forEach((key, index) => {
                newColorMap[key] = colors[index];
            });
            setColorMap(newColorMap);
        });

        return () => unsubscribe();
    }, [user.uid, currentWeekStart]);

    // Generate distinct colors
    const generateColors = (count) => {
        const hues = [];
        for (let i = 0; i < count; i++) {
            hues.push((i * 360 / count) % 360);
        }
        return hues.map(h => `hsl(${h}, 65%, 55%)`);
    };

    const goToPrevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const formatDate = (date) => {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const getDayLabel = (index) => {
        return ['月', '火', '水', '木', '金', '土', '日'][index];
    };

    // Calculate max hours for scaling
    const maxMinutes = Math.max(
        ...Object.values(weeklyData).map(dayData =>
            dayData.reduce((sum, item) => sum + item.duration, 0)
        ),
        60 // Minimum scale of 1 hour
    );

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}分`;
        return `${(minutes / 60).toFixed(1)}h`;
    };

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
                    <h1 className="text-lg font-bold text-gray-900">学習記録の統計</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                {/* Week Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={goToPrevWeek}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="text-center">
                            <div className="text-sm font-bold text-gray-900">
                                {currentWeekStart.getFullYear()}年{currentWeekStart.getMonth() + 1}月
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                            </div>
                        </div>
                        <button
                            onClick={goToNextWeek}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-end justify-around gap-2 h-64 border-b border-l border-gray-200 pb-2 pl-2">
                        {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                            const dayData = weeklyData[dayIndex] || [];
                            const totalMinutes = dayData.reduce((sum, item) => sum + item.duration, 0);
                            const heightPercent = maxMinutes > 0 ? (totalMinutes / maxMinutes) * 100 : 0;

                            return (
                                <div key={dayIndex} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                    {/* Stacked Bar */}
                                    <div
                                        className="w-full relative flex flex-col-reverse rounded-t-lg overflow-hidden shadow-sm"
                                        style={{ height: `${heightPercent}%`, minHeight: totalMinutes > 0 ? '20px' : '0' }}
                                    >
                                        {dayData.map((item, idx) => {
                                            const segmentPercent = totalMinutes > 0 ? (item.duration / totalMinutes) * 100 : 0;
                                            const color = colorMap[item.key] || '#ccc';

                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        height: `${segmentPercent}%`,
                                                        backgroundColor: color
                                                    }}
                                                    title={`${item.key}: ${formatTime(item.duration)}`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Total Time */}
                                    {totalMinutes > 0 && (
                                        <div className="text-[10px] font-bold text-indigo-600">
                                            {formatTime(totalMinutes)}
                                        </div>
                                    )}

                                    {/* Day Label */}
                                    <div className="text-xs font-medium text-gray-600">
                                        {getDayLabel(dayIndex)}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        {formatDate(weekDates[dayIndex])}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                {Object.keys(colorMap).length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">凡例</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(colorMap).map(([key, color]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-xs text-gray-700">{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {Object.keys(weeklyData).length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">この週の学習記録はありません</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatisticsView;
