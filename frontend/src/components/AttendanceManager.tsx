import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import { User, Save, CheckCircle, XCircle, Eraser, PenTool, Eye } from 'lucide-react';
import api from '../api';

const AttendanceManager: React.FC = () => {
    // State
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Signature Loading State
    const [signingLoading, setSigningLoading] = useState(false);

    // Signature Modal
    const [signingStudent, setSigningStudent] = useState<any>(null);
    const [viewingSignature, setViewingSignature] = useState<string | null>(null);
    const sigCanvas = useRef<SignatureCanvas>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse && selectedDate) {
            fetchAttendance();
        }
    }, [selectedCourse, selectedDate]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Helper to handle relative URLs
    const getFullUrl = (url: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url}`;
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance/${selectedCourse}?date=${selectedDate}`);
            // Transform URLs
            const mappedData = res.data.map((item: any) => ({
                ...item,
                signature_url: item.signature_url ? getFullUrl(item.signature_url) : null
            }));
            setAttendanceData(mappedData);
        } catch (error) {
            console.error(error);
            alert('Error al cargar la asistencia.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (enrollmentId: string, newStatus: string) => {
        setAttendanceData(prev => prev.map(item =>
            item.enrollment_id === enrollmentId ? { ...item, status: newStatus } : item
        ));
    };

    const openSignatureModal = (student: any) => {
        setSigningStudent(student);
    };

    const closeSignatureModal = () => {
        setSigningStudent(null);
        setSigningLoading(false);
    };

    const openViewSignature = (url: string) => {
        setViewingSignature(url);
    };

    const closeViewSignature = () => {
        setViewingSignature(null);
    };

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const saveSignature = async () => {
        if (sigCanvas.current && signingStudent) {
            if (sigCanvas.current.isEmpty()) {
                alert("Por favor firme antes de guardar.");
                return;
            }

            setSigningLoading(true);
            try {
                // Use getCanvas() instead of getTrimmedCanvas() to avoid dependency issues
                const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');

                // Call API immediately
                console.log("Sending signature...", { enrollment_id: signingStudent.enrollment_id, date: selectedDate });
                const res = await api.post('/attendance/sign', {
                    enrollment_id: signingStudent.enrollment_id,
                    date: selectedDate,
                    signature_base64: signatureBase64
                });

                const savedUrl = res.data.url;
                console.log("Signature saved, URL:", savedUrl);

                // Update local state with the saved URL from server
                setAttendanceData(prev => prev.map(item => {
                    if (item.enrollment_id === signingStudent.enrollment_id) {
                        const full = getFullUrl(savedUrl);
                        console.log("Updating item:", item.student_name, "New URL:", full);
                        return { ...item, signature_url: full, status: 'PRESENT' };
                    }
                    return item;
                }));

                closeSignatureModal();
                alert("Firma guardada correctamente.");
            } catch (error) {
                console.error("Error saving signature:", error);
                alert("Error al guardar la firma. Revise la consola.");
            } finally {
                setSigningLoading(false);
            }
        }
    };

    const saveAllAttendance = async () => {
        // ... (existing saveAllAttendance)
        try {
            const payload = {
                course_id: selectedCourse,
                date: selectedDate,
                records: attendanceData.map(item => ({
                    enrollment_id: item.enrollment_id,
                    status: item.status,
                    signature_url: item.signature_url // This might be the full URL now
                }))
            };

            await api.post('/attendance', payload);
            alert('Asistencia guardada correctamente.');
            fetchAttendance(); // Refresh
        } catch (error) {
            console.error(error);
            alert('Error al guardar asistencia.');
        }
    };

    return (
        <div className="p-8 fade-in pb-24">
            {/* ... (Header and Filters) */}
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                <CheckCircle className="w-6 h-6 text-accent" />
                Control de Asistencia
            </h2>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar Curso</label>
                    <select
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-medium text-slate-700"
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                    >
                        <option value="">-- Seleccione --</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Day Tabs Logic */}
                {selectedCourse && (() => {
                    const currentCourse = courses.find(c => c.id === selectedCourse);
                    if (!currentCourse || !currentCourse.start_date || !currentCourse.duration_days) return null;

                    const startDate = new Date(currentCourse.start_date);
                    const days = [];
                    for (let i = 0; i < currentCourse.duration_days; i++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + i);
                        days.push({
                            index: i + 1,
                            dateStr: date.toISOString().split('T')[0],
                            label: `Día ${i + 1}`
                        });
                    }

                    return (
                        <div className="flex-1 overflow-x-auto">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Días del Curso</label>
                            <div className="flex gap-2">
                                {days.map(d => (
                                    <button
                                        key={d.index}
                                        onClick={() => setSelectedDate(d.dateStr)}
                                        className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors whitespace-nowrap ${selectedDate === d.dateStr
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {d.label}
                                        <span className="block text-[10px] font-normal opacity-80">{d.dateStr}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha (Manual)</label>
                    <input
                        type="date"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-medium text-slate-700"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {selectedCourse ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[40%]">Aprendiz</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[20%]">Estado</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[30%]">Firma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400">Cargando aprendices...</td>
                                </tr>
                            ) : attendanceData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400">No hay aprendices inscritos en este curso.</td>
                                </tr>
                            ) : (
                                attendanceData.map((student) => (
                                    <tr key={student.enrollment_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{student.student_name}</div>
                                                    <div className="text-xs text-slate-500">{student.student_document}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className={`p-2 rounded-lg text-sm font-bold border ${student.status === 'PRESENT' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    student.status === 'ABSENT' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}
                                                value={student.status}
                                                onChange={e => handleStatusChange(student.enrollment_id, e.target.value)}
                                            >
                                                <option value="PRESENT">Presente</option>
                                                <option value="ABSENT">Ausente</option>
                                                <option value="EXCUSED">Excusado</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            {student.signature_url ? (
                                                <div className="group relative w-32 h-16 border border-slate-200 rounded bg-white">
                                                    <img src={student.signature_url} alt="Firma" className="w-full h-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded">
                                                        <button
                                                            onClick={() => openViewSignature(student.signature_url)}
                                                            className="p-1.5 bg-white text-slate-700 rounded-full hover:text-accent hover:bg-slate-50 transition-colors"
                                                            title="Ver Firma"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openSignatureModal(student)}
                                                            className="p-1.5 bg-white text-slate-700 rounded-full hover:text-accent hover:bg-slate-50 transition-colors"
                                                            title="Editar Firma"
                                                        >
                                                            <PenTool className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openSignatureModal(student)}
                                                    className="px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors flex items-center gap-2 text-sm font-medium w-full justify-center"
                                                >
                                                    <PenTool className="w-4 h-4" />
                                                    Firmar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <h3 className="text-slate-500 font-medium">Selecciona un curso para comenzar</h3>
                </div>
            )}

            {/* Floating Save Button */}
            {attendanceData.length > 0 && (
                <div className="fixed bottom-8 right-8 z-40">
                    <button
                        onClick={saveAllAttendance}
                        className="bg-accent hover:bg-accent-hover text-white px-6 py-4 rounded-full shadow-xl flex items-center gap-3 font-bold transition-all transform hover:scale-105"
                    >
                        <Save className="w-6 h-6" />
                        Guardar Asistencia
                    </button>
                </div>
            )}

            {/* View Signature Modal */}
            {viewingSignature && createPortal(
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in" onClick={closeViewSignature}>
                    <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-lg shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={closeViewSignature}
                            className="absolute -top-4 -right-4 bg-white text-slate-800 rounded-full p-1 hover:bg-slate-100 shadow-lg border border-slate-200"
                        >
                            <XCircle className="w-8 h-8" />
                        </button>
                        <img src={viewingSignature} alt="Firma Completa" className="max-w-full max-h-[85vh] object-contain rounded bg-white" />
                    </div>
                </div>,
                document.body
            )}

            {/* Signature Modal */}
            {signingStudent && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Firmar Asistencia</h3>
                                <p className="text-sm text-slate-500">{signingStudent.student_name}</p>
                            </div>
                            <button onClick={closeSignatureModal}><XCircle className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-6 bg-slate-100 flex justify-center">
                            <div className="bg-white border-2 border-slate-300 rounded-lg shadow-inner">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    canvasProps={{ width: 400, height: 200, className: 'cursor-crosshair' }}
                                    backgroundColor="white"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex justify-between">
                            <button
                                onClick={clearSignature}
                                className="text-slate-500 hover:text-red-500 flex items-center gap-2 px-4 py-2"
                                disabled={signingLoading}
                            >
                                <Eraser className="w-4 h-4" /> Borrar
                            </button>
                            <div className="flex gap-3">
                                <button onClick={closeSignatureModal} className="px-4 py-2 text-slate-600 font-medium" disabled={signingLoading}>Cancelar</button>
                                <button
                                    onClick={saveSignature}
                                    className={`px-6 py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors flex items-center gap-2 ${signingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={signingLoading}
                                >
                                    {signingLoading ? (
                                        <>Guardando...</>
                                    ) : (
                                        <><CheckCircle className="w-4 h-4" /> Confirmar Firma</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AttendanceManager;
