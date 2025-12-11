import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Search, Upload, Eye, Clock, BookOpen } from 'lucide-react';
import api from '../api';

interface Document {
    id: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    file_url: string;
    rejection_reason?: string;
    created_at: string;
}

interface StudentMatrixItem {
    user_id: string;
    enrollment_id?: string;
    enrollment_status?: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
    enrollment_date?: string;
    full_name: string;
    document_id: string;
    course_name?: string;
    required_types: string[];
    documents: Record<string, Document | null>;
}

const AdminDocumentPanel: React.FC = () => {
    const [students, setStudents] = useState<StudentMatrixItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'validation' | 'history'>('validation');

    // Modal states
    const [uploadModalUser, setUploadModalUser] = useState<StudentMatrixItem | null>(null);
    const [uploadType, setUploadType] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Reject/Review states
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Approve Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [docToApprove, setDocToApprove] = useState<Document | null>(null);

    // Upload Modal state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchMatrix();
    }, []);

    const fetchMatrix = async () => {
        try {
            const response = await api.get('/documents/matrix');
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching matrix:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadOnBehalf = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!uploadModalUser || !uploadType || !selectedFile) {
            alert("Por favor seleccione un archivo primero.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('user_id', uploadModalUser.user_id);
        if (uploadModalUser.enrollment_id) {
            formData.append('enrollment_id', uploadModalUser.enrollment_id);
        }
        formData.append('type', uploadType);
        formData.append('file', selectedFile);

        try {
            await api.post('/documents/upload-on-behalf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchMatrix();
            // Reset state
            setUploadModalUser(null);
            setUploadType('');
            setSelectedFile(null);

            alert("Documento subido correctamente.");
        } catch (error: any) {
            console.error('Error uploading:', error);
            const msg = error.response?.data?.detail || error.message;
            alert(`Error al subir documento: ${msg}`);
        } finally {
            setUploading(false);
        }
    };

    const confirmApprove = async () => {
        if (!docToApprove) return;

        try {
            await api.patch(`/documents/${docToApprove.id}/review`, {
                status: 'APPROVED'
            });
            await fetchMatrix();
            setShowApproveModal(false);
            setDocToApprove(null);
        } catch (error: any) {
            console.error('Error reviewing:', error);
            const msg = error.response?.data?.detail || error.message;
            alert(`Error al actualizar estado: ${msg}`);
        }
    };

    const handleReview = async (docId: string, status: 'REJECTED', reason?: string) => {
        try {
            await api.patch(`/documents/${docId}/review`, {
                status,
                rejection_reason: reason
            });
            await fetchMatrix();
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedDoc(null);
        } catch (error: any) {
            console.error('Error reviewing:', error);
            const msg = error.response?.data?.detail || error.message;
            alert(`Error al actualizar estado: ${msg}`);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    const getDocLabel = (type: string) => {
        const labels: Record<string, string> = {
            'ID_CARD': 'Cédula',
            'SOCIAL_SECURITY': 'Seg. Social',
            'MEDICAL_CONCEPT': 'Médico',
            'HEIGHTS_BASIC_CERT': 'Altura Básico',
            'HEIGHTS_ADVANCED_CERT': 'Altura Avanzado',
            'RESCUE_CERT': 'Rescate'
        };
        return labels[type] || type.replace(/_/g, ' ');
    };

    const filteredStudents = students.filter(s =>
        (s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.document_id.includes(searchTerm)) &&
        (activeTab === 'validation'
            ? s.enrollment_status !== 'COMPLETED'
            : s.enrollment_status === 'COMPLETED')
    );

    // Compute dynamic columns based on ALL required types in the current view
    const allRequiredTypes = Array.from(new Set(filteredStudents.flatMap(s => s.required_types)));
    // Ensure standard order if possible
    const sortedTypes = allRequiredTypes.sort();

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando matriz de documentación...</div>;

    return (
        <div className="p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-display">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        Validación de Documentos
                    </h2>
                    <p className="text-slate-500 mt-1">Gestión centralizada de requisitos por curso.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('validation')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'validation' ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        En Validación
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Historial Certificado
                    </button>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar estudiante..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/50 outline-none shadow-sm w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-x-auto min-h-[400px]">
                <table className="w-full min-w-max">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 w-64">Aprendiz</th>
                            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase w-32">Fecha</th>
                            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Curso / Grupo</th>
                            {sortedTypes.map(t => (
                                <th key={t} className="text-center p-4 text-xs font-bold text-slate-500 uppercase">{getDocLabel(t)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(student => (
                            <tr key={student.user_id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-100 shadow-sm">
                                    <div className="font-bold text-slate-800">{student.full_name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{student.document_id}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="text-sm font-medium text-slate-600">
                                        {student.enrollment_date
                                            ? new Date(student.enrollment_date).toLocaleDateString()
                                            : '-'
                                        }
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {student.enrollment_date
                                            ? new Date(student.enrollment_date).getFullYear()
                                            : ''
                                        }
                                    </div>
                                </td>
                                <td className="p-4">
                                    {student.course_name ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            <BookOpen className="w-3 h-3" />
                                            {student.course_name}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Sin Curso</span>
                                    )}
                                </td>
                                {sortedTypes.map(type => {
                                    const isRequired = student.required_types.includes(type);
                                    if (!isRequired) {
                                        return <td key={type} className="p-4 text-center text-slate-300">-</td>;
                                    }

                                    const doc = student.documents[type];
                                    return (
                                        <td key={type} className="p-4 text-center align-middle">
                                            <div className="flex flex-col items-center">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusColor(doc?.status)}`}>
                                                    {doc ? (
                                                        <>
                                                            {doc.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                                                            {doc.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                                            {doc.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                                                            <span>
                                                                {doc.status === 'APPROVED' ? 'APROBADO' :
                                                                    doc.status === 'PENDING' ? 'PENDIENTE' :
                                                                        doc.status === 'REJECTED' ? 'RECHAZADO' : doc.status}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span>FALTANTE</span>
                                                    )}
                                                </div>
                                                {/* Show Rejection Reason */}
                                                {doc?.status === 'REJECTED' && doc.rejection_reason && (
                                                    <div className="text-[10px] text-red-600 mt-1 max-w-[140px] leading-tight text-center bg-red-50 p-1 rounded border border-red-100" title={doc.rejection_reason}>
                                                        "{doc.rejection_reason}"
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-center gap-1">
                                                {/* Upload */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setUploadModalUser(student); setUploadType(type); }}
                                                    className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-100 rounded-md transition-colors"
                                                    title="Subir Archivo"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </button>

                                                {/* View */}
                                                {doc && (
                                                    <a
                                                        href={`http://localhost:8000/${doc.file_url.replace(/\\/g, '/')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-md transition-colors"
                                                        title="Ver Documento"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                )}

                                                {/* Review Buttons */}
                                                {doc && (
                                                    <div className="flex gap-1 border-l border-slate-200 pl-1 ml-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDocToApprove(doc);
                                                                setShowApproveModal(true);
                                                            }}
                                                            className={`p-1.5 rounded-md transition-all duration-200 ${doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 scale-100' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 hover:scale-110'}`}
                                                            title="Aprobar Documento"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDoc(doc);
                                                                setRejectReason(doc.rejection_reason || ''); // Pre-fill reason
                                                                setShowRejectModal(true);
                                                            }}
                                                            className={`p-1.5 rounded-md transition-all duration-200 ${doc.status === 'REJECTED' ? 'bg-red-100 text-red-600 scale-100' : 'text-slate-300 hover:text-red-500 hover:bg-red-50 hover:scale-110'}`}
                                                            title="Rechazar Documento"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStudents.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No se encontraron aprendices.
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {uploadModalUser && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl scale-100">
                        <h3 className="font-bold text-lg mb-2 text-slate-800">Subir Documento</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Cargando para: <span className="font-bold text-industrial">{uploadModalUser.full_name}</span>
                        </p>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Documento</label>
                            <div className="p-2 bg-slate-100 rounded text-sm text-slate-700 font-medium border border-slate-200">
                                {getDocLabel(uploadType)}
                            </div>
                        </div>

                        <div className="mb-6">
                            {!selectedFile ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-500"><span className="font-semibold">Click para seleccionar</span></p>
                                        <p className="text-xs text-slate-400">PDF, JPG o PNG</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.jpg,.png,.jpeg"
                                        onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                                    />
                                </label>
                            ) : (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between animate-in fade-in">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-blue-700 truncate">{selectedFile.name}</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                        title="Eliminar selección"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setUploadModalUser(null); setSelectedFile(null); }}
                                disabled={uploading}
                                className="flex-1 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleUploadOnBehalf(e)}
                                disabled={uploading || !selectedFile}
                                className="flex-1 py-2.5 bg-industrial text-white hover:bg-industrial/90 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Clock className="w-4 h-4 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Subir Ahora
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && docToApprove && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-emerald-500">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl text-slate-800 mb-2">¿Aprobar Documento?</h3>
                            <p className="text-sm text-slate-500">
                                El documento pasará a estado <span className="text-emerald-600 font-bold">OK</span> y se considerará válido para la certificación.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="flex-1 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors border border-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmApprove}
                                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md transition-all hover:scale-[1.02]"
                            >
                                Sí, Aprobar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedDoc && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border-t-4 border-red-500">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex-shrink-0 flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Rechazar Documento</h3>
                                <p className="text-sm text-slate-500">Por favor indica el motivo del rechazo para notificar al aprendiz.</p>
                            </div>
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full h-32 p-3 border border-slate-200 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none resize-none"
                            placeholder="Ej: El documento es ilegible o está vencido..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleReview(selectedDoc.id, 'REJECTED', rejectReason)}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md transition-all hover:scale-[1.02]"
                            >
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDocumentPanel;
