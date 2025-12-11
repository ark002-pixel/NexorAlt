import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Edit, Trash2, X, Save, FileText, AlertTriangle, Clock } from 'lucide-react';
import api from '../api';
import TrainerDocsModal from './TrainerDocsModal';

interface User {
    id: string;
    full_name: string;
    document_id: string;
    email: string;
    role: 'ADMIN' | 'TRAINER' | 'STUDENT' | 'COMPANY';
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    company_id?: string;
    created_at?: string;
    // New Compliance Fields
    phone?: string;
    address?: string;
    city?: string;
    birth_date?: string;
    rh_blood_type?: string;
    gender?: 'M' | 'F' | 'OTHER';
    eps?: string;
    arl?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    license_expiration?: string;
}

interface UserTableProps {
    defaultRole?: string;
    lockRole?: boolean;
    endpoint?: string;
}

const UserTable: React.FC<UserTableProps> = ({ defaultRole = 'ALL', lockRole = false, endpoint = '/auth/users' }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState(defaultRole);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        document_id: '',
        email: '',
        role: lockRole && defaultRole !== 'ALL' ? defaultRole : 'STUDENT',
        password: '',
        // Initialize new fields
        phone: '',
        address: '',
        city: '',
        birth_date: '',
        rh_blood_type: '',
        gender: '',
        eps: '',
        arl: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        license_expiration: ''
    });

    // Delete Confirmation State
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    // Trainer Docs Modal State
    const [trainerDocsUser, setTrainerDocsUser] = useState<{ id: string, name: string } | null>(null);
    const [isTrainerDocsOpen, setIsTrainerDocsOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [endpoint]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(endpoint);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                full_name: user.full_name,
                document_id: user.document_id,
                email: user.email,
                role: user.role,
                password: '', // Don't show password on edit
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                birth_date: user.birth_date ? user.birth_date.split('T')[0] : '',
                rh_blood_type: user.rh_blood_type || '',
                gender: user.gender || '',
                eps: user.eps || '',
                arl: user.arl || '',
                emergency_contact_name: user.emergency_contact_name || '',
                emergency_contact_phone: user.emergency_contact_phone || '',
                // @ts-ignore - license_expiration might be missing in User type definition on Frontend yet
                license_expiration: user.license_expiration ? user.license_expiration.split('T')[0] : ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                full_name: '',
                document_id: '',
                email: '',
                role: lockRole && defaultRole !== 'ALL' ? defaultRole : 'STUDENT',
                password: '',
                phone: '',
                address: '',
                city: '',
                birth_date: '',
                rh_blood_type: '',
                gender: '',
                eps: '',
                arl: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                license_expiration: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize payload: valid empty strings for optional dates as null
        const payload = { ...formData };
        if (payload.birth_date === '') {
            // @ts-ignore
            payload.birth_date = null;
        }
        if (payload.license_expiration === '') {
            // @ts-ignore
            payload.license_expiration = null;
        }

        try {
            if (editingUser) {
                // Edit
                await api.put(`/auth/users/${editingUser.id}`, payload);
                alert('Usuario actualizado exitosamente');
            } else {
                // Create
                await api.post('/auth/register', payload);
                alert('Usuario creado exitosamente');
            }
            fetchUsers();
            handleCloseModal();
        } catch (error: any) {
            console.error("Error saving user", error);
            alert(error.response?.data?.detail || 'Error al guardar usuario');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        setUserToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await api.delete(`/auth/users/${userToDelete}`);
            setUsers(users.filter(u => u.id !== userToDelete));
            setIsDeleteConfirmOpen(false);
            setUserToDelete(null);
            alert('Usuario eliminado correctamente');
        } catch (error: any) {
            console.error("Error deleting user", error);
            alert(error.response?.data?.detail || 'Error al eliminar usuario');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.document_id.includes(searchTerm);

        let matchesRole = true;
        if (lockRole && defaultRole !== 'ALL') {
            matchesRole = user.role === defaultRole;
        } else {
            matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        }

        return matchesSearch && matchesRole;
    });

    const getLicenseStatus = (user: User) => {
        if (user.role !== 'TRAINER' || !user.license_expiration) return null;

        const today = new Date();
        const expiration = new Date(user.license_expiration);
        const diffTime = expiration.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { color: 'text-red-600', bg: 'bg-red-100', text: 'Vencida', icon: <AlertTriangle className="w-3 h-3" /> };
        } else if (diffDays < 30) {
            return { color: 'text-amber-600', bg: 'bg-amber-100', text: 'Vence pronto', icon: <Clock className="w-3 h-3" /> };
        }
        return null;
    };

    const getRoleBadge = (user: User) => {
        const licenseStatus = getLicenseStatus(user);

        switch (user.role) {
            case 'ADMIN': return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full border border-purple-200">SUPER ADMIN</span>;
            case 'TRAINER':
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">ENTRENADOR</span>
                        {licenseStatus && (
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${licenseStatus.bg} ${licenseStatus.color} border-current/20`}>
                                {licenseStatus.icon}
                                {licenseStatus.text}
                            </span>
                        )}
                    </div>
                );
            case 'COMPANY': return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-200">EMPRESA</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full border border-gray-200">ESTUDIANTE</span>;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden relative">
            {/* Header & Filters */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o correo..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-white text-slate-700 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    {!lockRole && (
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none appearance-none bg-white text-slate-700 font-medium"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="ALL">Todos los Roles</option>
                                <option value="ADMIN">Administradores</option>
                                <option value="TRAINER">Entrenadores</option>
                                <option value="COMPANY">Empresas</option>
                                <option value="STUDENT">Estudiantes</option>
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-accent text-white px-5 py-2.5 rounded-lg font-medium hover:bg-accent-hover transition-all shadow-glow text-sm flex items-center gap-2"
                    >
                        + Nuevo {lockRole && defaultRole === 'STUDENT' ? 'Aprendiz' : 'Usuario'}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Documento</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-500">Cargando usuarios...</td></tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm ring-2 ring-white shadow-sm">
                                            {user.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{user.full_name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                    {user.document_id}
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(user)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">ACTIVO</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            className="p-1.5 text-accent hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, user.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors relative z-10 cursor-pointer"
                                            title="Eliminar"
                                            type="button"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Trainer Docs Button */}
                                        {user.role === 'TRAINER' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTrainerDocsUser({ id: user.id, name: user.full_name });
                                                    setIsTrainerDocsOpen(true);
                                                }}
                                                className="p-1.5 text-industrial hover:bg-slate-100 rounded-lg transition-colors ml-1 border-l border-slate-200"
                                                title="Documentación Entrenador"
                                                type="button"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal with Portal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative z-[10000] opacity-100 transform-none">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-lg">
                                {editingUser
                                    ? (lockRole && defaultRole === 'STUDENT' ? 'Editar Aprendiz' : 'Editar Usuario')
                                    : (lockRole && defaultRole === 'STUDENT' ? 'Nuevo Aprendiz' : 'Nuevo Usuario')
                                }
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

                            {/* Section: Basic Info */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 mb-3">Información Básica</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre Completo *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Documento ID *</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!!editingUser}
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none disabled:bg-slate-100 text-sm"
                                            value={formData.document_id}
                                            onChange={e => setFormData({ ...formData, document_id: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rol *</label>
                                        <select
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none disabled:bg-slate-100 text-sm"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            disabled={lockRole && defaultRole !== 'ALL'}
                                        >
                                            <option value="STUDENT">Estudiante (Aprendiz)</option>
                                            <option value="TRAINER">Entrenador</option>
                                            <option value="COMPANY">Empresa</option>
                                            <option value="ADMIN">Administrador</option>
                                        </select>
                                    </div>
                                    {!editingUser && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contraseña *</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Trainer Data */}
                            {formData.role === 'TRAINER' && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 mb-3">Datos de Instructor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vencimiento Licencia SST *</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                value={formData.license_expiration || ''}
                                                onChange={e => setFormData({ ...formData, license_expiration: e.target.value })}
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">Requerido para ser asignado a cursos.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono</label>
                                            <input
                                                type="tel"
                                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section: Personal Data (Only for Apprentices) */}
                            {lockRole && defaultRole === 'STUDENT' && (
                                <>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 mb-3">Datos Personales</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha Nacimiento</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.birth_date}
                                                    onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Género</label>
                                                <select
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.gender}
                                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="M">Masculino</option>
                                                    <option value="F">Femenino</option>
                                                    <option value="OTHER">Otro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Grupo Sanguíneo</label>
                                                <select
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.rh_blood_type}
                                                    onChange={e => setFormData({ ...formData, rh_blood_type: e.target.value })}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono</label>
                                                <input
                                                    type="tel"
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dirección y Ciudad</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Dirección"
                                                        className="w-2/3 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                        value={formData.address}
                                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Ciudad"
                                                        className="w-1/3 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                        value={formData.city}
                                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Social Security & Emergency */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 mb-3">Seguridad y Emergencia</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">EPS (Salud)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.eps}
                                                    onChange={e => setFormData({ ...formData, eps: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ARL (Riesgos)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.arl}
                                                    onChange={e => setFormData({ ...formData, arl: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contacto Emergencia</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre contacto"
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.emergency_contact_name}
                                                    onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono Emergencia</label>
                                                <input
                                                    type="tel"
                                                    placeholder="Teléfono contacto"
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm"
                                                    value={formData.emergency_contact_phone}
                                                    onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    Guardar Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-[10000] p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar Usuario?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            ¿Está seguro de que desea eliminar este usuario permanentemente? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Trainer Docs Modal */}
            {trainerDocsUser && (
                <TrainerDocsModal
                    isOpen={isTrainerDocsOpen}
                    onClose={() => { setIsTrainerDocsOpen(false); setTrainerDocsUser(null); }}
                    userId={trainerDocsUser.id}
                    userName={trainerDocsUser.name}
                />
            )}
        </div>
    );
};

export default UserTable;
