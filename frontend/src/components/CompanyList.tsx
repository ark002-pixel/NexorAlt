import React from 'react';
import { Building, MapPin, Mail, CheckCircle, XCircle, MoreVertical, ExternalLink } from 'lucide-react';

interface Company {
    id: string;
    name: string;
    nit: string;
    address: string;
    contact: string;
    email: string;
    status: 'ACTIVE' | 'INACTIVE';
    employees: number;
    plan: 'BASIC' | 'ENTERPRISE' | 'PARTNER';
}

const MOCK_COMPANIES: Company[] = [
    {
        id: '1',
        name: 'TechSolutions SAS',
        nit: '900.123.456-7',
        address: 'Calle 100 # 15-20, Bogotá',
        contact: 'Ana Martinez',
        email: 'contacto@techsol.com',
        status: 'ACTIVE',
        employees: 45,
        plan: 'ENTERPRISE'
    },
    {
        id: '2',
        name: 'Construcciones YA Ltda',
        nit: '800.987.654-3',
        address: 'Av. El Dorado # 68-90, Bogotá',
        contact: 'Pedro Ramirez',
        email: 'gerencia@construya.com',
        status: 'ACTIVE',
        employees: 120,
        plan: 'PARTNER'
    },
    {
        id: '3',
        name: 'Logística Rápida',
        nit: '901.555.333-1',
        address: 'Zona Franca Fontibón',
        contact: 'Luisa Fernanda',
        email: 'rrhh@logirapid.com',
        status: 'INACTIVE',
        employees: 15,
        plan: 'BASIC'
    }
];

const CompanyList: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-display font-bold text-slate-700">Directorio de Empresas</h3>
                <button className="bg-accent text-white px-5 py-2 rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-glow text-sm">
                    + Registrar Empresa
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {MOCK_COMPANIES.map((company) => (
                    <div key={company.id} className="bg-white p-6 rounded-xl shadow-premium border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-accent/50 transition-all duration-300 group">

                        {/* Company Info */}
                        <div className="flex items-start gap-5 flex-1">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                <Building className="w-8 h-8 group-hover:text-accent transition-colors" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold text-slate-800 font-display">{company.name}</h4>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${company.plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            company.plan === 'PARTNER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {company.plan}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-mono mb-2">NIT: {company.nit}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        {company.address}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        {company.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Status */}
                        <div className="flex items-center gap-8 md:border-l md:border-slate-100 md:pl-8">
                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Empleados</p>
                                <p className="text-xl font-bold text-slate-800">{company.employees}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Estado</p>
                                <div className={`flex items-center gap-1.5 font-bold ${company.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                    {company.status === 'ACTIVE' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {company.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-accent hover:bg-slate-50 rounded-full transition-colors">
                                    <ExternalLink className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompanyList;
