import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, QrCode } from 'lucide-react';
import api from '../api';

interface PracticeSession {
    id: string;
    course_id: string;
    date: string;
    location: string;
    capacity: number;
    status: string;
    bookings_count?: number;
}

const PracticeScheduler: React.FC = () => {
    const [sessions, setSessions] = useState<PracticeSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkInBookingId, setCheckInBookingId] = useState('');
    const role = localStorage.getItem('role');

    useEffect(() => {
        fetchSessions();
        // In a real app, we'd also fetch the user's bookings to know what they've booked
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/practices/');
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (sessionId: string) => {
        try {
            await api.post(`/practices/${sessionId}/book`);
            alert('Reserva exitosa');
            fetchSessions(); // Refresh
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error al reservar');
        }
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkInBookingId) return;

        try {
            await api.post('/practices/checkin', { booking_id: checkInBookingId });
            alert('Check-in exitoso. Asistencia registrada.');
            setCheckInBookingId('');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error al realizar check-in');
        }
    };



    if (loading) return <div className="p-8 text-center">Cargando sesiones...</div>;

    return (
        <div className="p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-accent" />
                        Agendamiento de Prácticas
                    </h2>
                    <p className="text-slate-500 mt-1">Reserva tu cupo para las sesiones prácticas obligatorias.</p>
                </div>
                {(role === 'ADMIN' || role === 'TRAINER') && (
                    <div className="flex gap-3">
                        <form onSubmit={handleCheckIn} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ID Reserva / Escanear QR"
                                value={checkInBookingId}
                                onChange={(e) => setCheckInBookingId(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64"
                            />
                            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2">
                                <QrCode className="w-5 h-5" />
                                Check-in
                            </button>
                        </form>
                        <button className="bg-accent text-white px-4 py-2 rounded-lg font-bold shadow-glow hover:bg-accent-hover transition-colors flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Nueva Sesión
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {new Date(session.date).toLocaleDateString()} - {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${session.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                {session.status === 'SCHEDULED' ? 'PROGRAMADA' : session.status}
                            </span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Ubicación</p>
                                    <p className="text-sm text-slate-500">{session.location}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Cupos</p>
                                    <p className="text-sm text-slate-500">{session.capacity} Personas Max.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBook(session.id)}
                                className="w-full py-2 rounded-lg font-bold text-sm transition-colors bg-industrial text-white hover:bg-industrial-light shadow-md"
                            >
                                Reservar Cupo
                            </button>
                        </div>
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No hay sesiones prácticas programadas próximamente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeScheduler;
