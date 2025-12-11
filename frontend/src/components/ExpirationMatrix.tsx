import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import api from '../api';

interface MatrixItem {
    employee_name: string;
    document_id: string;
    course_name: string;
    issue_date: string;
    expiration_date: string;
    status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
    days_remaining: number;
}

const ExpirationMatrix: React.FC = () => {
    const [data, setData] = useState<MatrixItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMatrix();
    }, []);

    const fetchMatrix = async () => {
        try {
            const response = await api.get('/corporate/matrix');
            setData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching matrix:', error);
            setLoading(false);
        }
    };

    const filteredData = data.filter(item => {
        const matchesFilter = filter === 'ALL' || item.status === filter;
        const matchesSearch = item.employee_name.toLowerCase().includes(search.toLowerCase()) ||
            item.document_id.includes(search) ||
            item.course_name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle size={12} /> Vigente</span>;
            case 'EXPIRING_SOON':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><Clock size={12} /> Próximo a Vencer</span>;
            case 'EXPIRED':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><AlertTriangle size={12} /> Vencido</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-industrial">Matriz de Vencimientos</h2>
                    <p className="text-steel">Monitorea el estado de las certificaciones de tu personal.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-light w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            className="pl-9 pr-4 py-2 rounded-lg border border-steel-light focus:ring-2 focus:ring-accent outline-none text-sm w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-white rounded-lg border border-steel-light p-1">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'ALL' ? 'bg-slate-100 text-industrial' : 'text-steel hover:bg-slate-50'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('ACTIVE')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'text-steel hover:bg-slate-50'}`}
                        >
                            Vigentes
                        </button>
                        <button
                            onClick={() => setFilter('EXPIRING_SOON')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'EXPIRING_SOON' ? 'bg-yellow-50 text-yellow-700' : 'text-steel hover:bg-slate-50'}`}
                        >
                            Por Vencer
                        </button>
                        <button
                            onClick={() => setFilter('EXPIRED')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'EXPIRED' ? 'bg-red-50 text-red-700' : 'text-steel hover:bg-slate-50'}`}
                        >
                            Vencidos
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-premium overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Empleado</th>
                                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Certificación</th>
                                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Emisión</th>
                                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Vencimiento</th>
                                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.employee_name}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{item.document_id}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{item.course_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.issue_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(item.expiration_date).toLocaleDateString()}
                                            <span className="block text-xs text-slate-400 mt-0.5">
                                                {item.days_remaining > 0 ? `${item.days_remaining} días restantes` : `${Math.abs(item.days_remaining)} días vencido`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.status)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <p>No se encontraron registros.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpirationMatrix;
