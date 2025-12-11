import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../api';

const PanicButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alertData, setAlertData] = useState({
        location: '',
        type: 'ACCIDENT',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/emergencies/alert', alertData);
            setIsOpen(false);
            setAlertData({ location: '', type: 'ACCIDENT', description: '' });
            alert("¡ALERTA ENVIADA! El equipo de respuesta ha sido notificado.");
        } catch (error) {
            console.error("Error sending alert", error);
            alert("Error al enviar la alerta.");
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-110 z-50 animate-pulse"
                title="Reportar Emergencia"
            >
                <AlertTriangle size={32} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border-t-8 border-red-600">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="w-8 h-8" />
                                    REPORTE DE EMERGENCIA
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ubicación Exacta</label>
                                    <input
                                        type="text"
                                        value={alertData.location}
                                        onChange={(e) => setAlertData({ ...alertData, location: e.target.value })}
                                        className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50"
                                        placeholder="Ej. Torre B, Piso 3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Emergencia</label>
                                    <select
                                        value={alertData.type}
                                        onChange={(e) => setAlertData({ ...alertData, type: e.target.value })}
                                        className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50"
                                    >
                                        <option value="ACCIDENT">Accidente (Lesión)</option>
                                        <option value="INCIDENT">Incidente (Casi accidente)</option>
                                        <option value="RESCUE">Solicitud de Rescate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                                    <textarea
                                        value={alertData.description}
                                        onChange={(e) => setAlertData({ ...alertData, description: e.target.value })}
                                        className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50 h-24"
                                        placeholder="Describa la situación..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-red-600 text-white font-bold py-4 rounded-lg hover:bg-red-700 transition-colors text-lg shadow-lg"
                                >
                                    ENVIAR ALERTA AHORA
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PanicButton;
