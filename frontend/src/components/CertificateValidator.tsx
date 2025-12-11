import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Award, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const CertificateValidator: React.FC = () => {
    const [searchType, setSearchType] = useState<'CODE' | 'DOCUMENT'>('CODE');
    const [code, setCode] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            if (searchType === 'CODE') {
                const response = await api.get(`/certificates/validate/${code}`);
                setResult(response.data);
            } else {
                const response = await api.get(`/certificates/validate/by-document/${code}`);
                if (response.data.length === 0) {
                    setError('No se encontraron certificados para este documento.');
                } else {
                    setResult(response.data);
                }
            }
        } catch (err) {
            setError(searchType === 'CODE'
                ? 'Certificado no encontrado o código inválido.'
                : 'Error al buscar por documento.'
            );
        } finally {
            setLoading(false);
        }
    };

    const renderCertificateCard = (cert: any) => (
        <div key={cert.id} className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-3 text-green-700 font-bold">
                <CheckCircle className="w-5 h-5" />
                Certificado Válido
            </div>
            <div className="space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Estudiante:</span> {cert.student_name || 'N/A'}</p>
                <p><span className="font-semibold">Documento:</span> {cert.student_document_id || 'N/A'}</p>
                <p><span className="font-semibold">Curso:</span> {cert.course_name}</p>
                <p><span className="font-semibold">Código:</span> <span className="font-mono bg-white px-1 border rounded">{cert.certificate_code}</span></p>
                <p><span className="font-semibold">Emisión:</span> {new Date(cert.issue_date).toLocaleDateString()}</p>
                <p><span className="font-semibold">Vencimiento:</span> {new Date(cert.expiration_date).toLocaleDateString()}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-industrial flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="w-full max-w-md bg-white rounded-xl shadow-premium overflow-hidden z-10 relative">
                <div className="bg-slate-900 p-6 text-center relative">
                    <Link to="/login" className="absolute left-4 top-6 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <Award className="w-12 h-12 text-accent mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-white font-display">Validación de Certificados</h1>
                    <p className="text-slate-400 text-sm">NexorAlturas Verification System</p>
                </div>

                <div className="p-8">
                    {/* Search Type Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                        <button
                            type="button"
                            onClick={() => { setSearchType('CODE'); setCode(''); setResult(null); setError(''); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${searchType === 'CODE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Por Código
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSearchType('DOCUMENT'); setCode(''); setResult(null); setError(''); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${searchType === 'DOCUMENT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Por Documento
                        </button>
                    </div>

                    <form onSubmit={handleValidate} className="mb-8">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {searchType === 'CODE' ? 'Código de Verificación' : 'Documento de Identidad (Cédula)'}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={searchType === 'CODE' ? "Ej. CERT-ABCD-1234" : "Ej. 1234567890"}
                                className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none font-mono uppercase"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-100 p-2 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                            <p className="text-slate-500 text-sm mt-2">Verificando...</p>
                        </div>
                    )}

                    {result && (
                        <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {Array.isArray(result) ? result.map(renderCertificateCard) : renderCertificateCard(result)}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in flex items-center gap-3 text-red-700">
                            <XCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        © 2024 NexorAlturas. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CertificateValidator;
