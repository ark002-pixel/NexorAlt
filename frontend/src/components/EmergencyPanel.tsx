import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, MapPin, Clock } from 'lucide-react';
import api from '../api';

const EmergencyPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ALERTS' | 'INVENTORY'>('ALERTS');
    const [alerts, setAlerts] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'ALERTS') {
            fetchAlerts();
        } else {
            fetchInventory();
        }
    }, [activeTab]);

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/emergencies/alerts');
            setAlerts(response.data);
        } catch (error) {
            console.error("Error fetching alerts", error);
        }
    };

    const fetchInventory = async () => {
        try {
            const response = await api.get('/emergencies/rescue-inventory');
            setInventory(response.data);
        } catch (error) {
            console.error("Error fetching rescue inventory", error);
        }
    };

    return (
        <div className="p-8 fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Gestión de Emergencias
            </h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('ALERTS')}
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'ALERTS' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <AlertTriangle size={16} />
                    Alertas Activas
                    {activeTab === 'ALERTS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('INVENTORY')}
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'INVENTORY' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Package size={16} />
                    Inventario de Rescate
                    {activeTab === 'INVENTORY' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'ALERTS' ? (
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm animate-pulse-slow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase">{alert.type}</span>
                                    <h4 className="font-bold text-red-900 text-lg">Emergencia en {alert.location}</h4>
                                </div>
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(alert.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-red-800 mb-4">{alert.description}</p>
                            <div className="flex gap-2">
                                <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                                    Atender
                                </button>
                                <button className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors">
                                    Ver en Mapa
                                </button>
                            </div>
                        </div>
                    ))}
                    {alerts.length === 0 && (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="font-bold text-slate-600">Sin alertas activas</p>
                            <p className="text-sm">El sistema está monitoreando.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <Package className="w-6 h-6 text-red-600" />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1">{item.name}</h4>
                            <p className="text-xs text-slate-500 mb-4">S/N: {item.serial_number}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400">{item.type}</span>
                                <button className="text-red-600 text-sm font-bold hover:underline">Ver Detalles</button>
                            </div>
                        </div>
                    ))}
                    {inventory.length === 0 && (
                        <p className="col-span-full text-center text-slate-400 py-8">No hay equipos de rescate registrados.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmergencyPanel;
