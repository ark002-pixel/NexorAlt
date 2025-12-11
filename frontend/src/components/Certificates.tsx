import React, { useState, useEffect } from 'react';
import { Award, Download, Calendar, CheckCircle } from 'lucide-react';
import api from '../api';

interface Certificate {
    id: string;
    course_name: string;
    issue_date: string;
    expiration_date: string;
    certificate_code: string;
    pdf_url: string;
}

const Certificates: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const response = await api.get('/certificates/my-certificates');
            setCertificates(response.data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando certificados...</div>;

    return (
        <div className="p-8 fade-in">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
                    <Award className="w-6 h-6 text-accent" />
                    Mis Certificados
                </h2>
                <p className="text-slate-500 mt-1">Descarga tus certificados y diplomas obtenidos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                    <div key={cert.id} className="bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                <Award className="w-32 h-32" />
                            </div>
                            <h3 className="text-lg font-bold mb-1 relative z-10">{cert.course_name}</h3>
                            <p className="text-slate-300 text-sm relative z-10">Certificado de Aprobación</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Emisión
                                    </span>
                                    <span className="font-medium text-slate-700">
                                        {new Date(cert.issue_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Vencimiento
                                    </span>
                                    <span className="font-medium text-slate-700">
                                        {new Date(cert.expiration_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Código de Verificación</p>
                                    <p className="font-mono text-sm bg-slate-50 p-2 rounded text-center text-slate-600 select-all">
                                        {cert.certificate_code}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={cert.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-accent text-white text-center py-2 rounded-lg font-bold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Descargar PDF
                            </a>
                        </div>
                    </div>
                ))}

                {certificates.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">Aún no tienes certificados emitidos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Certificates;
