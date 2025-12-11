import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Check } from 'lucide-react';
import api from '../api';

const WorkPermitGenerator: React.FC = () => {
    const [permits, setPermits] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newPermit, setNewPermit] = useState({
        location: '',
        task_description: '',
        hazards: '',
        precautions: ''
    });

    useEffect(() => {
        fetchPermits();
    }, []);

    const fetchPermits = async () => {
        try {
            const response = await api.get('/simulator/permits');
            setPermits(response.data);
        } catch (error) {
            console.error("Error fetching permits", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/simulator/permit', newPermit);
            setShowForm(false);
            setNewPermit({ location: '', task_description: '', hazards: '', precautions: '' });
            fetchPermits();
            alert("Permiso generado exitosamente.");
        } catch (error) {
            console.error("Error creating permit", error);
            alert("Error al generar el permiso.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-premium border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-accent" />
                    Permisos de Trabajo Digitales
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nuevo Permiso
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-slide-down">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Ubicación</label>
                                <input
                                    type="text"
                                    value={newPermit.location}
                                    onChange={(e) => setNewPermit({ ...newPermit, location: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Descripción de la Tarea</label>
                                <input
                                    type="text"
                                    value={newPermit.task_description}
                                    onChange={(e) => setNewPermit({ ...newPermit, task_description: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Peligros (separados por coma)</label>
                            <textarea
                                value={newPermit.hazards}
                                onChange={(e) => setNewPermit({ ...newPermit, hazards: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none h-20"
                                placeholder="Ej. Altura, Eléctrico, Caída de objetos"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Precauciones (separadas por coma)</label>
                            <textarea
                                value={newPermit.precautions}
                                onChange={(e) => setNewPermit({ ...newPermit, precautions: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none h-20"
                                placeholder="Ej. Arnés, Casco, Línea de vida, Señalización"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-accent-hover"
                            >
                                Generar Permiso
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {permits.map((permit) => (
                    <div key={permit.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white hover:shadow-md transition-all">
                        <div>
                            <h4 className="font-bold text-slate-800">{permit.task_description}</h4>
                            <p className="text-xs text-slate-500">{permit.location} • {new Date(permit.created_at).toLocaleDateString()}</p>
                        </div>
                        {permit.pdf_url ? (
                            <a
                                href={`http://localhost:8000/${permit.pdf_url}`} // Assuming static file serving or similar
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-accent hover:text-accent-hover font-bold text-sm"
                            >
                                <Download size={16} />
                                PDF
                            </a>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Generando...</span>
                        )}
                    </div>
                ))}
                {permits.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No hay permisos generados.</p>
                )}
            </div>
        </div>
    );
};

export default WorkPermitGenerator;
