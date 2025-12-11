import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Download, Search } from 'lucide-react';
import api from '../api';

interface SGCDocument {
    id: string;
    title: string;
    code: string;
    version: string;
    type: string;
    url: string;
    created_at: string;
}

const SGCDocumentPanel: React.FC = () => {
    const [documents, setDocuments] = useState<SGCDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const role = localStorage.getItem('role');

    // Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [version, setVersion] = useState('1.0');
    const [type, setType] = useState('POLICY');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/sgc/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error("Error fetching SGC documents", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('code', code);
        formData.append('version', version);
        formData.append('type', type);
        formData.append('file', file);

        try {
            await api.post('/sgc/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Documento subido exitosamente');
            setTitle('');
            setCode('');
            setFile(null);
            fetchDocuments();
        } catch (error) {
            console.error("Error uploading document", error);
            alert("Error al subir el documento");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar este documento?')) return;
        try {
            await api.delete(`/sgc/documents/${id}`);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error("Error deleting document", error);
            alert("Error al eliminar el documento");
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                <FileText className="w-6 h-6 text-accent" />
                Control Documental (SGC)
            </h2>

            {role === 'ADMIN' && (
                <div className="bg-white p-6 rounded-xl shadow-premium border border-slate-200 mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Cargar Nuevo Documento</h3>
                    <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="POLICY">Política</option>
                                <option value="PROCEDURE">Procedimiento</option>
                                <option value="FORMAT">Formato</option>
                                <option value="MANUAL">Manual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Archivo</label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Subiendo...' : 'Cargar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar documentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/50 outline-none w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc) => (
                    <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                                <FileText className="w-8 h-8" />
                            </div>
                            {role === 'ADMIN' && (
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{doc.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                            <span className="bg-slate-100 px-2 py-1 rounded">{doc.code}</span>
                            <span className="bg-slate-100 px-2 py-1 rounded">v{doc.version}</span>
                            <span className="bg-slate-100 px-2 py-1 rounded">{doc.type}</span>
                        </div>
                        <a
                            href={`http://localhost:8000/${doc.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Descargar / Ver
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SGCDocumentPanel;
