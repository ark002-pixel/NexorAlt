import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    BarChart, Users, BookOpen, Calendar, Package, Award, Building,
    FileText, CheckCircle, HardHat, AlertTriangle, Shield, Settings,
    LogOut, ChevronLeft, ChevronRight, Search, Bell, GraduationCap
} from 'lucide-react';
import api from '../api';

import AdminDocumentPanel from './AdminDocumentPanel';
import PracticeScheduler from './PracticeScheduler';
import InventoryManager from './InventoryManager';
import Certificates from './Certificates';
import CorporateEmployees from './CorporateEmployees';
import ExpirationMatrix from './ExpirationMatrix';
import QualityPanel from './QualityPanel';
import SimulatorPanel from './SimulatorPanel';
import EmergencyPanel from './EmergencyPanel';
import RegulatoryReports from './RegulatoryReports';
import AuditLogs from './AuditLogs';
import SGCDocumentPanel from './SGCDocumentPanel';
import UserTable from './UserTable';
import CourseGrid from './CourseGrid';
import PhysicalCourseManager from './PhysicalCourseManager';
import CompanyList from './CompanyList';
import AttendanceManager from './AttendanceManager';

interface SGCDocument {
    id: string;
    title: string;
    code: string;
    version: string;
    type: string;
    url: string;
}

const Dashboard: React.FC = () => {
    const [documents, setDocuments] = useState<SGCDocument[]>([]);
    const [expiringCerts, setExpiringCerts] = useState<any[]>([]);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    const [searchParams] = useSearchParams();
    const [activeModule, setActiveModule] = useState(searchParams.get('tab') || 'DASHBOARD');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveModule(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchSGC();
        if (role === 'ADMIN') {
            fetchExpiring();
        }
    }, [role]);

    const fetchSGC = async () => {
        try {
            const response = await api.get('/corporate/sgc');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching SGC:', error);
        }
    };

    const fetchExpiring = async () => {
        try {
            const response = await api.get('/certificates/expiring-soon?days=30');
            setExpiringCerts(response.data);
        } catch (error) {
            console.error('Error fetching expiring certs:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const menuItems = [
        { id: 'DASHBOARD', icon: BarChart, label: 'Dashboard' },
        { id: 'APPRENTICES', icon: GraduationCap, label: 'Aprendices' },
        { id: 'SYSTEM_USERS', icon: Shield, label: 'Usuarios del Sistema' },
        { id: 'PHYSICAL_COURSES', icon: Users, label: 'Gestión de Cursos' },
        { id: 'COURSES', icon: BookOpen, label: 'Cursos Virtuales' },
        { id: 'PRACTICES', icon: Calendar, label: 'Prácticas' },
        { id: 'INVENTORY', icon: Package, label: 'Inventario', role: 'ADMIN' },
        { id: 'CERTIFICATES', icon: Award, label: 'Certificados', role: 'STUDENT' },
        { id: 'COMPANIES', icon: Building, label: 'Empresas' },
        { id: 'EMPLOYEES', icon: Users, label: 'Mi Cuadrilla', role: 'COMPANY' },
        { id: 'MATRIX', icon: Calendar, label: 'Vencimientos', role: 'COMPANY' },
        { id: 'ATTENDANCE', icon: CheckCircle, label: 'Asistencia', role: 'TRAINER' },
        { id: 'VALIDATION', icon: FileText, label: 'Validación', role: 'ADMIN' },
        { id: 'QUALITY', icon: CheckCircle, label: 'Calidad' },
        { id: 'SGC', icon: FileText, label: 'Documentación' },
        { id: 'SIMULATOR', icon: HardHat, label: 'Simulador' },
        { id: 'EMERGENCIES', icon: AlertTriangle, label: 'Emergencias' },
        { id: 'REPORTS', icon: BarChart, label: 'Reportes', role: 'ADMIN' },
        { id: 'AUDIT', icon: Shield, label: 'Auditoría', role: 'ADMIN' },
        { id: 'SETTINGS', icon: Settings, label: 'Configuración' },
    ];

    // Filter menu items based on role
    const filteredMenuItems = menuItems.filter(item =>
        !item.role ||
        item.role === role ||
        (role === 'ADMIN' && item.role === 'TRAINER') // ADMIRAL FIX: Admins can see Trainer modules
    );

    const renderContent = () => {
        switch (activeModule) {
            case 'APPRENTICES':
                return (
                    <div className="p-8 fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                            <GraduationCap className="w-6 h-6 text-accent" />
                            Gestión de Aprendices
                        </h2>
                        <UserTable key="apprentices" defaultRole="STUDENT" lockRole={true} endpoint="/auth/apprentices" />
                    </div>
                );
            case 'SYSTEM_USERS':
                return (
                    <div className="p-8 fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                            <Shield className="w-6 h-6 text-accent" />
                            Usuarios del Sistema
                        </h2>
                        <UserTable key="system-users" defaultRole="ALL" lockRole={false} endpoint="/auth/system-users" />
                    </div>
                );
            case 'PHYSICAL_COURSES':
                return <PhysicalCourseManager />;
            case 'COURSES':
                return (
                    <div className="p-8 fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                            <BookOpen className="w-6 h-6 text-accent" />
                            Catálogo de Cursos
                        </h2>
                        <CourseGrid />
                    </div>
                );
            case 'PRACTICES':
                return <PracticeScheduler />;
            case 'INVENTORY':
                return <InventoryManager />;
            case 'ATTENDANCE':
                return <AttendanceManager />;
            case 'CERTIFICATES':
                return <Certificates />;
            case 'EMPLOYEES':
                return <CorporateEmployees />;
            case 'MATRIX':
                return <ExpirationMatrix />;
            case 'QUALITY':
                return <QualityPanel />;
            case 'SIMULATOR':
                return <SimulatorPanel />;
            case 'EMERGENCIES':
                return <EmergencyPanel />;
            case 'REPORTS':
                return <RegulatoryReports />;
            case 'AUDIT':
                return <AuditLogs />;
            case 'SGC':
                return <SGCDocumentPanel />;
            case 'COMPANIES':
                return (
                    <div className="p-8 fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                            <Building className="w-6 h-6 text-accent" />
                            Empresas Aliadas
                        </h2>
                        <CompanyList />
                    </div>
                );
            case 'VALIDATION':
                return <AdminDocumentPanel />;
            case 'SETTINGS':
                return (
                    <div className="p-8 fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-display">
                            <Settings className="w-6 h-6 text-accent" />
                            Configuración del Sistema
                        </h2>
                        <div className="bg-white p-6 rounded-xl shadow-premium border border-slate-200">
                            <p className="text-slate-500">Opciones de configuración global.</p>
                        </div>
                    </div>
                );
            default: // DASHBOARD
                return (
                    <div className="p-8 fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-premium border-l-4 border-accent hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Usuarios Totales</p>
                                        <h3 className="text-3xl font-bold text-slate-800 mt-1 font-display">124</h3>
                                    </div>
                                    <div className="p-3 bg-sky-50 rounded-xl text-accent shadow-glow">
                                        <Users className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-premium border-l-4 border-emerald-500 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Empresas Activas</p>
                                        <h3 className="text-3xl font-bold text-slate-800 mt-1 font-display">12</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm">
                                        <Building className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-premium border-l-4 border-violet-500 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Cursos Activos</p>
                                        <h3 className="text-3xl font-bold text-slate-800 mt-1 font-display">8</h3>
                                    </div>
                                    <div className="p-3 bg-violet-50 rounded-xl text-violet-600 shadow-sm">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-premium border-l-4 border-amber-500 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Certificados</p>
                                        <h3 className="text-3xl font-bold text-slate-800 mt-1 font-display">850</h3>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shadow-sm">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Opportunity Widget */}
                        <div className="mb-8 fade-in">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 font-display flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                </span>
                                Oportunidades de Reentrenamiento (Próximos 30 días)
                            </h2>
                            <div className="bg-white rounded-xl shadow-premium overflow-hidden border border-slate-200">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Estudiante</th>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Curso</th>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Vence</th>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {expiringCerts.map((cert) => (
                                            <tr key={cert.id} className="hover:bg-red-50 transition-colors bg-red-50/10">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-800">{cert.student_name}</div>
                                                    <div className="text-xs text-slate-500">{cert.student_document_id}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{cert.course_name}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-red-600">
                                                    {new Date(cert.expiration_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button className="text-xs font-bold bg-accent text-white px-3 py-1.5 rounded-lg shadow-glow hover:bg-accent-hover transition-colors">
                                                        Contactar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {expiringCerts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                                                        <p>No hay vencimientos próximos.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mb-6 font-display flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-400" />
                            Documentación Reciente (SGC)
                        </h2>
                        <div className="bg-white rounded-xl shadow-premium overflow-hidden border border-slate-200">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Código</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Título</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Versión</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-accent">{doc.code}</td>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-medium">{doc.title}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{doc.version}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                    {doc.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-accent transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {documents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                No hay documentos publicados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className={`
                ${sidebarOpen ? 'w-64' : 'w-20'} 
                bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-50
            `}>
                <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-center">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <img src="/assets/logo-nexor.png" alt="NexorAlturas" className="h-14 w-auto transition-all duration-300" />
                        </div>
                    ) : (
                        <img src="/assets/logo-nexor.png" alt="N" className="h-10 w-10 object-contain mx-auto transition-all duration-300" />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                    <nav className="space-y-1 px-3">
                        {filteredMenuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveModule(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                                    ${activeModule === item.id
                                        ? 'bg-accent text-white shadow-glow'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                                `}
                            >
                                <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all
                            ${!sidebarOpen && 'justify-center'}
                        `}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="mt-4 w-full flex items-center justify-center p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Topbar */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-slate-700 font-display">
                            {menuItems.find(i => i.id === activeModule)?.label}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-accent outline-none w-64 transition-all focus:w-80"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <button className="relative p-2 text-slate-400 hover:text-accent transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-slate-800">Administrador</div>
                                <div className="text-xs text-slate-500">admin@nexor.com</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-auto bg-slate-50 p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
