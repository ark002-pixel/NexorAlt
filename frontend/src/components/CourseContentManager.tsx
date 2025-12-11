import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Edit2, Save, X, BookOpen, AlertCircle } from 'lucide-react';

interface Module {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    order_index: number;
}

interface CourseContentManagerProps {
    courseId: string;
    courseName: string;
    onClose: () => void;
}

const CourseContentManager: React.FC<CourseContentManagerProps> = ({ courseId, courseName, onClose }) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    useEffect(() => {
        fetchModules();
    }, [courseId]);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/modules/course/${courseId}`);
            setModules(res.data);
        } catch (error) {
            console.error("Error fetching modules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddParam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;

        try {
            const newModule = {
                title: newItemTitle,
                description: newItemDesc,
                course_id: courseId,
                order_index: modules.length + 1
            };
            await api.post('/modules', newModule);
            setNewItemTitle('');
            setNewItemDesc('');
            fetchModules();
        } catch (error) {
            console.error("Error creating module", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este tema del curso?')) return;
        try {
            await api.delete(`/modules/${id}`);
            fetchModules();
        } catch (error) {
            console.error("Error deleting module", error);
        }
    };

    const startEdit = (mod: Module) => {
        setEditingId(mod.id);
        setEditTitle(mod.title);
        setEditDesc(mod.description || '');
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await api.put(`/modules/${editingId}`, {
                title: editTitle,
                description: editDesc
            });
            setEditingId(null);
            fetchModules();
        } catch (error) {
            console.error("Error updating module", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-accent" />
                            Temario y Normativa
                        </h3>
                        <p className="text-sm text-slate-500">Gestión de contenido para: <span className="font-medium text-slate-700">{courseName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex-1">

                    {/* List */}
                    <div className="space-y-4 mb-8">
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Cargando temario...</div>
                        ) : modules.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 font-medium">No hay temas registrados</p>
                                <p className="text-xs text-slate-400">Agrega el primer módulo abajo.</p>
                            </div>
                        ) : (
                            modules.map((mod, index) => (
                                <div key={mod.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                    <div className="absolute -left-3 top-4 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-50 shadow-sm">
                                        {index + 1}
                                    </div>

                                    {editingId === mod.id ? (
                                        <div className="space-y-3 pl-4">
                                            <input
                                                className="w-full p-2 border border-slate-300 rounded focus:border-accent outline-none font-medium"
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                placeholder="Título del Tema"
                                                autoFocus
                                            />
                                            <textarea
                                                className="w-full p-2 border border-slate-300 rounded focus:border-accent outline-none text-sm min-h-[80px]"
                                                value={editDesc}
                                                onChange={e => setEditDesc(e.target.value)}
                                                placeholder="Descripción normativa, artículos aplicables..."
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                                                <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded hover:bg-accent-hover flex items-center gap-1">
                                                    <Save className="w-3 h-3" /> Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pl-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800">{mod.title}</h4>
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(mod)} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded mb-1">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(mod.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded mb-1">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {mod.description && (
                                                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    {mod.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Form */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky bottom-0">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-accent" /> Agregar Nuevo Tema
                        </h4>
                        <form onSubmit={handleAddParam} className="space-y-3">
                            <input
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-accent outline-none transition-all placeholder:text-slate-400"
                                placeholder="Título (Ej. Marco Normativo Res. 4272)"
                                value={newItemTitle}
                                onChange={e => setNewItemTitle(e.target.value)}
                            />
                            <textarea
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-accent outline-none transition-all min-h-[80px] text-sm placeholder:text-slate-400"
                                placeholder="Descripción detallada, artículos, requisitos..."
                                value={newItemDesc}
                                onChange={e => setNewItemDesc(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!newItemTitle.trim()}
                                    className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Agregar Tema
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CourseContentManager;
