import React, { useState } from 'react';
import { HardHat, Ruler, FileText } from 'lucide-react';
import FallCalculator from './FallCalculator';
import WorkPermitGenerator from './WorkPermitGenerator';

const SimulatorPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'PERMITS'>('CALCULATOR');

    return (
        <div className="p-8 fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                <HardHat className="w-6 h-6 text-accent" />
                Simulador Operativo
            </h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('CALCULATOR')}
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'CALCULATOR' ? 'text-accent' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Ruler size={16} />
                    Calculadora de Caída
                    {activeTab === 'CALCULATOR' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('PERMITS')}
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'PERMITS' ? 'text-accent' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText size={16} />
                    Permisos de Trabajo
                    {activeTab === 'PERMITS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>}
                </button>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto">
                {activeTab === 'CALCULATOR' ? <FallCalculator /> : <WorkPermitGenerator />}
            </div>
        </div>
    );
};

export default SimulatorPanel;
