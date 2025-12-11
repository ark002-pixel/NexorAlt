import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText } from 'lucide-react';
import api from '../api';

interface Document {
    id: string;
    type: string;
    file_url: string;
    status: string;
    created_at: string;
}

interface TrainerDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

const TrainerDocsModal: React.FC<TrainerDocsModalProps> = ({ isOpen, onClose, userId, userName }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    const docTypes = [
        { id: 'CV', label: 'Hoja de Vida', desc: 'Resumen profesional actualizado' },
        { id: 'SST_LICENSE', label: 'Licencia SST', desc: 'Resolución o licencia vigente' },
        { id: 'TRAINER_CERT', label: 'Cert. Entrenador', desc: 'Certificado de formación de entrenadores' },
        { id: 'ID_CARD', label: 'Documento ID', desc: 'Cédula de ciudadanía' },
    ];

    React.useEffect(() => {
        if (isOpen && userId) {
            fetchDocuments();
        }
    }, [isOpen, userId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/documents/user/${userId}`);
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (type: string, file: File) => {
        setUploading(type);
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('type', type);
        formData.append('file', file);

        try {
            await api.post('/documents/upload-on-behalf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchDocuments();
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error al subir documento.');
        } finally {
            setUploading(null);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Documentación del Entrenador</h3>
                        <p className="text-slate-500 text-sm">{userName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Cargando documentos...</div>
                    ) : (
                        <div className="grid gap-4">
                            {docTypes.map((type) => {
                                const doc = documents.find(d => d.type === type.id);
                                return (
                                    <div key={type.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-full ${doc ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700 text-sm">{type.label}</h4>
                                                <p className="text-xs text-slate-500">{type.desc}</p>
                                                {doc && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                            Cargado
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(doc.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {doc ? (
                                                <a
                                                    href={`http://localhost:8000/${doc.file_url.replace(/\\/g, '/')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Ver Archivo
                                                </a>
                                            ) : (
                                                <label className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold text-white transition-colors ${uploading === type.id ? 'bg-slate-300' : 'bg-slate-800 hover:bg-slate-700'}`}>
                                                    {uploading === type.id ? 'Subiendo...' : 'Subir'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.png,.jpg,.jpeg"
                                                        disabled={!!uploading}
                                                        onChange={(e) => e.target.files?.[0] && handleUpload(type.id, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TrainerDocsModal;
