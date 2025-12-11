import React, { useState, useEffect } from 'react';
import { Package, ClipboardCheck, AlertTriangle, CheckCircle, Search, Plus } from 'lucide-react';
import api from '../api';

interface Equipment {
    id: string;
    name: string;
    serial_number: string;
    type: string;
    status: string;
    last_inspection_date: string | null;
}

const InventoryManager: React.FC = () => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/inventory/');
            setEquipmentList(response.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInspect = async (id: string) => {
        const result = prompt("Resultado de Inspección (PASS/FAIL):");
        if (!result || (result !== 'PASS' && result !== 'FAIL')) return;

        const notes = prompt("Notas de inspección:");

        try {
            await api.post(`/inventory/${id}/inspect`, {
                equipment_id: id,
                result: result,
                notes: notes || ''
            });
            alert('Inspección registrada');
            fetchEquipment();
        } catch (error) {
            console.error('Error registering inspection:', error);
            alert('Error al registrar inspección');
        }
    };

    const handleCreate = async () => {
        // Simple prompt-based creation for MVP
        const name = prompt("Nombre del Equipo:");
        if (!name) return;
        const serial = prompt("Número de Serie:");
        if (!serial) return;
        const type = prompt("Tipo (HARNESS, HELMET, ROPE, CARABINER, OTHER):");
        if (!type) return;

        try {
            await api.post('/inventory/', {
                name,
                serial_number: serial,
                type,
                status: 'OPERATIONAL'
            });
            alert('Equipo registrado');
            fetchEquipment();
        } catch (error) {
            console.error('Error creating equipment:', error);
            alert('Error al crear equipo');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPERATIONAL': return 'bg-green-100 text-green-700';
            case 'DAMAGED': return 'bg-red-100 text-red-700';
            case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-700';
            case 'RETIRED': return 'bg-slate-200 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const filteredList = equipmentList.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.serial_number.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Cargando inventario...</div>;

    return (
        <div className="p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
                        <Package className="w-6 h-6 text-accent" />
                        Inventario de Equipos
                    </h2>
                    <p className="text-slate-500 mt-1">Gestión y trazabilidad de equipos de altura.</p>
                </div>
                {(role === 'ADMIN' || role === 'TRAINER') && (
                    <button
                        onClick={handleCreate}
                        className="bg-accent text-white px-4 py-2 rounded-lg font-bold shadow-glow hover:bg-accent-hover transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Equipo
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o serial..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                        />
                    </div>
                </div>

                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Serial</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Última Inspección</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredList.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">{item.serial_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">{item.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                    {item.last_inspection_date ? new Date(item.last_inspection_date).toLocaleDateString() : 'Nunca'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {(role === 'ADMIN' || role === 'TRAINER') && (
                                        <button
                                            onClick={() => handleInspect(item.id)}
                                            className="text-accent hover:text-accent-hover font-bold text-sm flex items-center justify-end gap-1 ml-auto"
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                            Inspeccionar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredList.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No se encontraron equipos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryManager;
