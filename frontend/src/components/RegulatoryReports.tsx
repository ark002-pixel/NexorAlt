import React from 'react';
import { FileText, Download, BarChart2 } from 'lucide-react';
import api from '../api';

const RegulatoryReports: React.FC = () => {

    const downloadMinTrabajo = async () => {
        try {
            const response = await api.get('/reports/mintrabajo', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte_mintrabajo.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading report", error);
            alert("Error al descargar el reporte.");
        }
    };

    const downloadARL = async () => {
        try {
            const response = await api.get('/reports/arl');
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const link = document.createElement('a');
            link.href = dataStr;
            link.setAttribute('download', 'reporte_arl.json');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading report", error);
            alert("Error al descargar el reporte.");
        }
    };

    return (
        <div className="p-8 fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                <FileText className="w-6 h-6 text-accent" />
                Reportes Regulatorios
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* MinTrabajo Report */}
                <div className="bg-white p-8 rounded-xl shadow-premium border border-slate-200 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Reporte Ministerio de Trabajo</h3>
                    <p className="text-slate-500 mb-6">
                        Exporta el listado de trabajadores certificados en formato CSV compatible con la plataforma del Ministerio.
                        Incluye datos de certificación y vencimientos.
                    </p>
                    <button
                        onClick={downloadMinTrabajo}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Descargar CSV
                    </button>
                </div>

                {/* ARL Report */}
                <div className="bg-white p-8 rounded-xl shadow-premium border border-slate-200 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                        <BarChart2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Reporte ARL (Estadísticas)</h3>
                    <p className="text-slate-500 mb-6">
                        Genera un reporte estadístico de accidentalidad e incidentes reportados a través del sistema.
                        Formato JSON estructurado para análisis.
                    </p>
                    <button
                        onClick={downloadARL}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Descargar JSON
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegulatoryReports;
