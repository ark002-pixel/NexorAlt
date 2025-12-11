import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Plus, CheckCircle } from 'lucide-react';
import api from '../api';

const QualityPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'PQRSF' | 'SURVEYS'>('PQRSF');
    const [pqrsfList, setPqrsfList] = useState<any[]>([]);
    const [showNewTicket, setShowNewTicket] = useState(false);

    // New Ticket Form
    const [newTicket, setNewTicket] = useState({
        type: 'PETITION',
        subject: '',
        description: ''
    });

    // Survey Form
    const [survey, setSurvey] = useState({
        rating: 5,
        comments: ''
    });

    useEffect(() => {
        if (activeTab === 'PQRSF') {
            fetchPQRSF();
        }
    }, [activeTab]);

    const fetchPQRSF = async () => {
        try {
            const response = await api.get('/quality/pqrsf');
            setPqrsfList(response.data);
        } catch (error) {
            console.error("Error fetching PQRSF", error);
        }
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/quality/pqrsf', newTicket);
            setShowNewTicket(false);
            setNewTicket({ type: 'PETITION', subject: '', description: '' });
            fetchPQRSF();
            alert("Ticket creado exitosamente.");
        } catch (error) {
            console.error("Error creating ticket", error);
            alert("Error al crear el ticket.");
        }
    };

    const handleSubmitSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/quality/survey', {
                rating: survey.rating,
                comments: survey.comments,
                course_id: null // General survey for now
            });
            setSurvey({ rating: 5, comments: '' });
            alert("Encuesta enviada. ¡Gracias por tu opinión!");
        } catch (error) {
            console.error("Error submitting survey", error);
            alert("Error al enviar la encuesta.");
        }
    };

    return (
        <div className="p-8 fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                <CheckCircle className="w-6 h-6 text-accent" />
                Gestión de Calidad (SGC)
            </h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('PQRSF')}
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'PQRSF' ? 'text-accent' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    PQRSF
                    {activeTab === 'PQRSF' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('SURVEYS')}
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'SURVEYS' ? 'text-accent' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Encuestas de Satisfacción
                    {activeTab === 'SURVEYS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'PQRSF' ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-700">Mis Tickets</h3>
                        <button
                            onClick={() => setShowNewTicket(!showNewTicket)}
                            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Nuevo Ticket
                        </button>
                    </div>

                    {showNewTicket && (
                        <div className="bg-white p-6 rounded-xl shadow-premium border border-slate-200 mb-8 animate-slide-down">
                            <h4 className="font-bold text-slate-800 mb-4">Crear Nuevo Ticket</h4>
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                                        <select
                                            value={newTicket.type}
                                            onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                        >
                                            <option value="PETITION">Petición</option>
                                            <option value="COMPLAINT">Queja</option>
                                            <option value="CLAIM">Reclamo</option>
                                            <option value="SUGGESTION">Sugerencia</option>
                                            <option value="FELICITATION">Felicitación</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Asunto</label>
                                        <input
                                            type="text"
                                            value={newTicket.subject}
                                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                                    <textarea
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none h-24"
                                        required
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTicket(false)}
                                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-accent-hover"
                                    >
                                        Enviar Ticket
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-4">
                        {pqrsfList.map((ticket) => (
                            <div key={ticket.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${ticket.type === 'FELICITATION' ? 'bg-green-100 text-green-700' :
                                                ticket.type === 'COMPLAINT' || ticket.type === 'CLAIM' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {ticket.type}
                                        </span>
                                        <h4 className="font-bold text-slate-800 mt-2">{ticket.subject}</h4>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ticket.status === 'OPEN' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{ticket.description}</p>
                                <div className="text-xs text-slate-400">
                                    Creado el: {new Date(ticket.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                        {pqrsfList.length === 0 && (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No tienes tickets creados.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-premium border border-slate-200 text-center">
                        <Star className="w-12 h-12 text-amber-400 mx-auto mb-4 fill-current" />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Tu opinión nos importa</h3>
                        <p className="text-slate-500 mb-8">Ayúdanos a mejorar nuestros servicios calificando tu experiencia general.</p>

                        <form onSubmit={handleSubmitSurvey} className="space-y-6 text-left">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-center">Calificación General</label>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setSurvey({ ...survey, rating: star })}
                                            className={`p-2 transition-transform hover:scale-110 ${survey.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                                        >
                                            <Star className="w-8 h-8 fill-current" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Comentarios Adicionales</label>
                                <textarea
                                    value={survey.comments}
                                    onChange={(e) => setSurvey({ ...survey, comments: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none h-32 resize-none"
                                    placeholder="Cuéntanos qué podemos mejorar..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                            >
                                <Send size={18} />
                                Enviar Encuesta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QualityPanel;
