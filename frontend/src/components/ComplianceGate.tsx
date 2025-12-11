import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import api from '../api';

interface Document {
    id: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    file_url: string;
    rejection_reason?: string;
    created_at?: string;
}

const ComplianceGate: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    const docTypes = [
        { id: 'ID_CARD', label: 'Documento de Identidad', desc: 'Cédula de ciudadanía o extranjería (PDF/Img)' },
        { id: 'SOCIAL_SECURITY', label: 'Seguridad Social (EPS/ARL)', desc: 'Planilla de pago vigente (< 30 días)' },
        { id: 'MEDICAL_CONCEPT', label: 'Concepto Médico', desc: 'Examen ocupacional con énfasis en alturas (< 1 año)' },
    ];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents/my-status');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (type: string, file: File) => {
        setUploading(type);
        const formData = new FormData();
        formData.append('type', type);
        formData.append('file', file);

        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error al subir el documento. Verifique el formato y tamaño.');
        } finally {
            setUploading(null);
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="text-alert-green w-6 h-6" />;
            case 'REJECTED': return <AlertCircle className="text-alert-red w-6 h-6" />;
            default: return <Clock className="text-alert-yellow w-6 h-6" />;
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'APPROVED': return <span className="text-alert-green font-bold">APROBADO</span>;
            case 'REJECTED': return <span className="text-alert-red font-bold">RECHAZADO</span>;
            default: return <span className="text-alert-yellow font-bold">PENDIENTE</span>;
        }
    };

    const allApproved = docTypes.every(type =>
        documents.find(d => d.type === type.id)?.status === 'APPROVED'
    );

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-industrial-DEFAULT mb-2">Compliance Gate</h1>
                <p className="text-steel-DEFAULT mb-8">
                    Para iniciar su formación, debe cargar y validar los siguientes documentos legales.
                </p>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-12 relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    <div className="flex flex-col items-center bg-gray-50 px-4">
                        <div className="w-8 h-8 rounded-full bg-industrial-DEFAULT text-white flex items-center justify-center font-bold mb-2">1</div>
                        <span className="text-sm font-medium text-industrial-DEFAULT">Registro</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-50 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${allApproved ? 'bg-industrial-DEFAULT text-white' : 'bg-alert-yellow text-white'}`}>2</div>
                        <span className="text-sm font-medium text-industrial-DEFAULT">Documentación</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-50 px-4">
                        <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold mb-2">3</div>
                        <span className="text-sm font-medium text-gray-400">Certificación</span>
                    </div>
                </div>

                <div className="grid gap-6">
                    {docTypes.map((type) => {
                        const doc = documents.find(d => d.type === type.id);
                        return (
                            <div key={type.id} className="bg-white p-6 rounded-sm shadow-md border-l-4 border-industrial-DEFAULT flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-100 rounded-full">
                                        <FileText className="text-industrial-DEFAULT w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-industrial-DEFAULT">{type.label}</h3>
                                        <p className="text-sm text-gray-500">{type.desc}</p>
                                        {doc?.rejection_reason && (
                                            <p className="text-xs text-alert-red mt-1 font-semibold">Motivo rechazo: {doc.rejection_reason}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {doc ? (
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusText(doc.status)}
                                                {getStatusIcon(doc.status)}
                                            </div>
                                            <p className="text-xs text-gray-400">Subido: {new Date(doc.created_at || Date.now()).toLocaleDateString()}</p>
                                            {doc.status === 'REJECTED' && (
                                                <label className="cursor-pointer text-xs text-industrial-light underline mt-1">
                                                    Reintentar
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.png"
                                                        onChange={(e) => e.target.files?.[0] && handleUpload(type.id, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-sm cursor-pointer transition-colors ${uploading === type.id ? 'bg-gray-300' : 'bg-steel-DEFAULT hover:bg-industrial-light'} text-white font-medium`}>
                                            {uploading === type.id ? 'Subiendo...' : 'Subir Archivo'}
                                            <Upload className="w-4 h-4" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.png"
                                                disabled={uploading === type.id}
                                                onChange={(e) => e.target.files?.[0] && handleUpload(type.id, e.target.files[0])}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Blocking Banner */}
                <div className={`mt-8 p-4 rounded-sm text-center font-bold text-white ${allApproved ? 'bg-alert-green' : 'bg-alert-red'}`}>
                    {allApproved
                        ? 'DOCUMENTACIÓN APROBADA - PUEDE INICIAR SU FORMACIÓN'
                        : 'ACCESO BLOQUEADO - COMPLETE LA VALIDACIÓN DOCUMENTAL'}
                </div>

                {allApproved && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => window.location.href = '/courses'}
                            className="bg-industrial-DEFAULT text-white px-8 py-3 rounded-sm font-bold shadow-lg hover:bg-industrial-dark transition-transform transform hover:scale-105"
                        >
                            IR AL CURSO (LMS)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplianceGate;
