import React, { useState } from 'react';
import { Ruler, AlertTriangle, ArrowDown } from 'lucide-react';

const FallCalculator: React.FC = () => {
    const [length, setLength] = useState(1.8); // Eslinga
    const [absorber, setAbsorber] = useState(1.2); // Absorbedor
    const [height, setHeight] = useState(1.7); // Estatura
    const [margin, setMargin] = useState(1.0); // Margen
    const [total, setTotal] = useState(0);

    const calculate = () => {
        const result = length + absorber + height + margin;
        setTotal(parseFloat(result.toFixed(2)));
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-premium border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Ruler className="w-6 h-6 text-accent" />
                Calculadora de Requerimiento de Claridad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Longitud de la Eslinga (m)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={length}
                            onChange={(e) => setLength(parseFloat(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Elongación del Absorbedor (m)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={absorber}
                            onChange={(e) => setAbsorber(parseFloat(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Estatura del Trabajador (m)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={height}
                            onChange={(e) => setHeight(parseFloat(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Margen de Seguridad (m)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={margin}
                            onChange={(e) => setMargin(parseFloat(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                    <button
                        onClick={calculate}
                        className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        Calcular
                    </button>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl flex flex-col items-center justify-center border border-slate-200 relative overflow-hidden">
                    {total > 0 ? (
                        <div className="text-center z-10">
                            <p className="text-sm text-slate-500 font-bold mb-2">Requerimiento Total de Claridad</p>
                            <div className="text-5xl font-display font-bold text-accent mb-2">{total} m</div>
                            <div className="flex items-center justify-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 px-3 py-1 rounded-full">
                                <AlertTriangle size={16} />
                                Altura mínima libre requerida
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400 text-center">
                            <ArrowDown size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Ingresa los datos para calcular</p>
                        </div>
                    )}

                    {/* Visual representation bars */}
                    {total > 0 && (
                        <div className="mt-8 w-full max-w-[200px] flex flex-col gap-1 text-xs text-white font-bold text-center">
                            <div className="bg-blue-500 py-1 rounded" style={{ height: `${(length / total) * 200}px` }}>Eslinga {length}m</div>
                            <div className="bg-purple-500 py-1 rounded" style={{ height: `${(absorber / total) * 200}px` }}>Absorbedor {absorber}m</div>
                            <div className="bg-green-500 py-1 rounded" style={{ height: `${(height / total) * 200}px` }}>Estatura {height}m</div>
                            <div className="bg-red-500 py-1 rounded" style={{ height: `${(margin / total) * 200}px` }}>Margen {margin}m</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FallCalculator;
