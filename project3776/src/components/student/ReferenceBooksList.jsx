import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const ReferenceBooksList = ({ onBack }) => {
    const { user, profile } = useAuth();
    const [books, setBooks] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newBook, setNewBook] = useState({ subject: '', name: '', notes: '' });
    const [editForm, setEditForm] = useState({ subject: '', name: '', notes: '' });

    useEffect(() => {
        const q = query(
            collection(db, `users/${user.uid}/referenceBooks`),
            orderBy('subject', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const booksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBooks(booksData);
        });

        return () => unsubscribe();
    }, [user.uid]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newBook.subject || !newBook.name) return;

        try {
            await addDoc(collection(db, `users/${user.uid}/referenceBooks`), {
                ...newBook,
                createdAt: serverTimestamp()
            });
            setNewBook({ subject: '', name: '', notes: '' });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding book:', error);
            alert('参考書の追加に失敗しました');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('この参考書を削除しますか？')) {
            try {
                await deleteDoc(doc(db, `users/${user.uid}/referenceBooks`, id));
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('削除に失敗しました');
            }
        }
    };

    const handleEditStart = (book) => {
        setEditingId(book.id);
        setEditForm({
            subject: book.subject,
            name: book.name,
            notes: book.notes || ''
        });
    };

    const handleEditSave = async (id) => {
        try {
            await updateDoc(doc(db, `users/${user.uid}/referenceBooks`, id), {
                ...editForm,
                updatedAt: serverTimestamp()
            });
            setEditingId(null);
        } catch (error) {
            console.error('Error updating book:', error);
            alert('更新に失敗しました');
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditForm({ subject: '', name: '', notes: '' });
    };

    // Group books by subject
    const booksBySubject = books.reduce((acc, book) => {
        if (!acc[book.subject]) {
            acc[book.subject] = [];
        }
        acc[book.subject].push(book);
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
                    <h1 className="text-lg font-bold text-gray-900 flex-1">参考書一覧</h1>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                {/* Add Form */}
                {isAdding && (
                    <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">新しい参考書を追加</h3>
                        <div className="space-y-3">
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                value={newBook.subject}
                                onChange={e => setNewBook({ ...newBook, subject: e.target.value })}
                                required
                            >
                                <option value="">科目を選択</option>
                                {profile?.subjects?.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <input
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="参考書名"
                                value={newBook.name}
                                onChange={e => setNewBook({ ...newBook, name: e.target.value })}
                                required
                            />
                            <input
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="メモ（任意）"
                                value={newBook.notes}
                                onChange={e => setNewBook({ ...newBook, notes: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
                                >
                                    追加
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Books grouped by subject */}
                {Object.keys(booksBySubject).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">参考書が登録されていません</p>
                        <p className="text-xs mt-2">右上の + ボタンから追加してください</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(booksBySubject).map(([subject, subjectBooks]) => (
                            <div key={subject} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Subject Header */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 border-b border-gray-100">
                                    <h3 className="text-sm font-bold text-indigo-900">{subject}</h3>
                                </div>

                                {/* Books List */}
                                <div className="divide-y divide-gray-100">
                                    {subjectBooks.map(book => (
                                        <div key={book.id} className="p-4">
                                            {editingId === book.id ? (
                                                // Edit Mode
                                                <div className="space-y-3">
                                                    <select
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={editForm.subject}
                                                        onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                                                    >
                                                        <option value="">科目を選択</option>
                                                        {profile?.subjects?.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="参考書名"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    />
                                                    <input
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="メモ（任意）"
                                                        value={editForm.notes}
                                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditSave(book.id)}
                                                            className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            保存
                                                        </button>
                                                        <button
                                                            onClick={handleEditCancel}
                                                            className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            キャンセル
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Display Mode
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-gray-900">{book.name}</div>
                                                        {book.notes && (
                                                            <div className="text-xs text-gray-500 mt-1">{book.notes}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditStart(book)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 transition"
                                                            title="編集"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(book.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition"
                                                            title="削除"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferenceBooksList;
