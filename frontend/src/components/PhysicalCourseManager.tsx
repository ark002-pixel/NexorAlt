import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BookOpen, MapPin, Calendar, Users, Plus, UserPlus, Check, X, FileText, Search, User, Hash, Edit, Trash, UserMinus, Edit2, Trash2, ChevronRight, History, Clock } from 'lucide-react';
import api from '../api';
import ActionBlockedModal from './ActionBlockedModal';
import CourseContentManager from './CourseContentManager';

interface Course {
    id: string;
    code?: string;
    name: string;
    description?: string;
    start_date?: string;
    location?: string;
    capacity: number;
    enrolled_count?: number;
    required_documents?: string;
    type: string;
    trainer_id?: string;
    trainer_name?: string;
    duration_days?: number;
}

interface Instructor {
    user_id: string;
    id: string;
    full_name: string;
}

interface Student {
    id: string;
    full_name: string;
    document_id: string;
}

const docTypes = [
    { id: 'ID_CARD', label: 'Cédula de Ciudadanía' },
    { id: 'SOCIAL_SECURITY', label: 'Seguridad Social (Vigente)' },
    { id: 'MEDICAL_CONCEPT', label: 'Concepto Médico Ocupacional' },
    { id: 'HEIGHTS_BASIC_CERT', label: 'Certificado Alturas Básico' },
    { id: 'HEIGHTS_ADVANCED_CERT', label: 'Certificado Alturas Avanzado' },
    { id: 'RESCUE_CERT', label: 'Certificado Rescate' },
];

const PhysicalCourseManager: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    // Create/Edit State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newCapacity, setNewCapacity] = useState(20);
    const [newDurationDays, setNewDurationDays] = useState(1);
    const [selectedDocs, setSelectedDocs] = useState<string[]>(['ID_CARD', 'SOCIAL_SECURITY', 'MEDICAL_CONCEPT']);

    // Enroll Modal State
    const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [enrollSearch, setEnrollSearch] = useState('');

    // View Enrollments Modal State
    const [viewEnrollmentsCourse, setViewEnrollmentsCourse] = useState<Course | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [studentToRemove, setStudentToRemove] = useState<{ id: string, name: string } | null>(null);

    const [trainers, setTrainers] = useState<Instructor[]>([]);
    const [selectedTrainer, setSelectedTrainer] = useState('');

    // Content Manager State
    const [contentManagerCourse, setContentManagerCourse] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        fetchCourses();
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        try {
            const res = await api.get('/auth/trainers');
            setTrainers(res.data);
        } catch (error) {
            console.error("Error fetching trainers", error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/auth/apprentices');
            setStudents(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEnrolledStudents = async (courseId: string) => {
        setLoadingEnrollments(true);
        try {
            const res = await api.get(`/courses/${courseId}/enrollments`);
            setEnrolledStudents(res.data);
        } catch (error) {
            console.error("Error fetching enrollments", error);
            alert("Error al cargar la lista de inscritos.");
        } finally {
            setLoadingEnrollments(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingCourse(null);
        setNewName('');
        setNewDesc('');
        setNewStartDate('');
        setNewLocation('');
        setNewCapacity(20);
        setNewDurationDays(1);
        setSelectedTrainer('');
        setSelectedDocs(['ID_CARD', 'SOCIAL_SECURITY', 'MEDICAL_CONCEPT']);
        setShowCreateModal(true);
    };

    const handleOpenEdit = (course: Course, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCourse(course);
        setNewName(course.name);
        setNewDesc(course.description || '');
        // FIX: Slice to 10 for YYYY-MM-DD
        setNewStartDate(course.start_date ? course.start_date.slice(0, 10) : '');
        setNewLocation(course.location || '');
        setNewCapacity(course.capacity);
        setNewDurationDays(course.duration_days || 1);
        setSelectedTrainer(course.trainer_id || '');
        try {
            setSelectedDocs(course.required_documents ? JSON.parse(course.required_documents) : []);
        } catch (e) {
            setSelectedDocs([]);
        }
        setShowCreateModal(true);
    };

    // Block Modal State
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [blockInfo, setBlockInfo] = useState({ title: '', message: '', instructions: [] as string[] });

    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const courseData = {
                name: newName,
                description: newDesc,
                required_hours: 40,
                price: 0,
                type: 'PRACTICE',
                // FIX: Append T12:00:00 to avoid timezone shifts
                start_date: newStartDate ? new Date(`${newStartDate}T12:00:00`).toISOString() : null,
                location: newLocation,
                capacity: newCapacity,
                duration_days: newDurationDays,
                required_documents: JSON.stringify(selectedDocs),
                trainer_id: selectedTrainer || null
            };

            if (editingCourse) {
                await api.put(`/courses/${editingCourse.id}`, courseData);
                alert('Curso actualizado correctamente.');
            } else {
                await api.post('/courses', courseData);
                alert('Curso creado correctamente.');
            }

            setShowCreateModal(false);
            fetchCourses();
        } catch (error: any) {
            const detail = error.response?.data?.detail || 'Error al guardar el curso.';

            // Check for Trainer Compliance Error
            if ((detail.includes('License') || detail.includes('Licencia')) && detail.includes('trainer')) {
                setBlockInfo({
                    title: 'Entrenador No Apto',
                    message: `No se puede asignar este entrenador porque su documentación está incompleta o vencida. El sistema ha bloqueado la acción por seguridad.`,
                    instructions: [
                        'Diríjase al Módulo de Usuarios.',
                        'Busque al Entrenador en la lista.',
                        'Edite su perfil y actualice el campo "Vencimiento Licencia SST".',
                        'Vuelva aquí e intente asignar el curso nuevamente.'
                    ]
                });
                setBlockModalOpen(true);
            } else {
                alert(detail);
            }
        }
    };

    const handleClickDelete = (course: Course, e: React.MouseEvent) => {
        e.stopPropagation();
        setCourseToDelete(course);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteCourse = async () => {
        if (!courseToDelete) return;
        try {
            await api.delete(`/courses/${courseToDelete.id}`);
            alert('Curso eliminado.');
            fetchCourses();
            setShowDeleteConfirm(false);
            setCourseToDelete(null);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error al eliminar el curso.');
            setShowDeleteConfirm(false);
        }
    };

    const handleClickRemoveStudent = (studentId: string, studentName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setStudentToRemove({ id: studentId, name: studentName });
    };

    const [showStudentRemoveConfirm, setShowStudentRemoveConfirm] = useState(false);

    const confirmRemoveStudent = async () => {
        if (!viewEnrollmentsCourse || !studentToRemove) return;
        try {
            await api.delete(`/courses/${viewEnrollmentsCourse.id}/enrollments/${studentToRemove.id}`);
            alert('Aprendiz retirado.');
            fetchEnrolledStudents(viewEnrollmentsCourse.id);
            fetchCourses();
            setShowStudentRemoveConfirm(false);
            setStudentToRemove(null);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error al retirar aprendiz.');
            setShowStudentRemoveConfirm(false);
        }
    };

    const handleOpenEnroll = (course: Course) => {
        setEnrollCourse(course);
        if (students.length === 0) fetchStudents();
    };

    const handleOpenViewEnrollments = (course: Course) => {
        setViewEnrollmentsCourse(course);
        fetchEnrolledStudents(course.id);
    };

    const handleEnroll = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        console.log("handleEnroll Clicked", { enrollCourse: enrollCourse?.id, selectedStudent });

        if (!enrollCourse || !selectedStudent) {
            console.warn("Missing course or student selection");
            return;
        }

        try {
            console.log("Sending enrollment request...");
            await api.post(`/courses/${enrollCourse.id}/enroll-student`, {
                user_id: selectedStudent
            });
            console.log("Enrollment success");
            alert('Aprendiz inscrito correctamente.');
            setEnrollCourse(null);
            setSelectedStudent('');
            fetchCourses();
        } catch (error: any) {
            if (error.response?.status === 409 || error.response?.data?.id) {
                alert('El estudiante ya está inscrito en este curso.');
            } else {
                alert('Error al inscribir estudiante.');
            }
        }
    };

    const toggleDoc = (id: string) => {
        if (selectedDocs.includes(id)) {
            setSelectedDocs(selectedDocs.filter(d => d !== id));
        } else {
            setSelectedDocs([...selectedDocs, id]);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
        s.document_id.includes(enrollSearch)
    );

    // FILTER LOGIC:
    // Active: Start Date >= Today (Normalized to 00:00:00)
    // History: Start Date < Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredCourses = courses.filter(course => {
        if (!course.start_date) return activeTab === 'active'; // No date = active? or maybe hidden
        const cDate = new Date(course.start_date);
        cDate.setHours(0, 0, 0, 0);

        if (activeTab === 'active') {
            return cDate >= today;
        } else {
            return cDate < today;
        }
    }).sort((a, b) => {
        // Sort: Active -> Soonest first. History -> Most recent first.
        const dateA = new Date(a.start_date || 0).getTime();
        const dateB = new Date(b.start_date || 0).getTime();
        return activeTab === 'active' ? dateA - dateB : dateB - dateA;
    });

    return (
        <div className="p-8 fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-display">
                        <Users className="w-6 h-6 text-accent" />
                        Gestión de Cursos Presenciales
                    </h2>
                    <p className="text-slate-500 mt-1">Programación de cursos y gestión de cupos.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Curso
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'active' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock className="w-4 h-4" />
                    Programados / En Curso
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{courses.filter(c => !c.start_date || new Date(c.start_date) >= today).length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <History className="w-4 h-4" />
                    Historial / Finalizados
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs ml-1">{courses.filter(c => c.start_date && new Date(c.start_date) < today).length}</span>
                </button>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                    <div
                        key={course.id}
                        className={`
                            rounded-xl shadow-premium border overflow-hidden group hover:shadow-xl transition-all relative
                            ${activeTab === 'history' ? 'bg-green-50/30 border-green-200' : 'bg-white border-slate-200'}
                        `}
                    >
                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm">
                            <button
                                onClick={(e) => handleOpenEdit(course, e)}
                                className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                title="Editar Curso"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => handleClickDelete(course, e)}
                                className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
                                title="Eliminar Curso"
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>

                        <div className={`h-2 ${activeTab === 'history' ? 'bg-green-500' : 'bg-accent'}`}></div>
                        <div className="p-6">
                            <div className="mb-4 pr-16 relative z-0">
                                <h3 className={`text-lg font-bold transition-colors mb-2 ${activeTab === 'history' ? 'text-green-800' : 'text-slate-800 group-hover:text-accent'}`}>{course.name}</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase border ${activeTab === 'history' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {activeTab === 'history' ? 'FINALIZADO' : (course.type === 'PRACTICE' ? 'PRÁCTICA' : 'TEÓRICO')}
                                    </span>
                                    {course.code && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            <Hash className="w-3 h-3" />
                                            {course.code}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {course.start_date && (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Calendar className="w-4 h-4 text-accent" />
                                        {/* FIX: Display only date */}
                                        <span>{new Date(course.start_date).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {course.location && (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin className="w-4 h-4 text-accent" />
                                        <span>{course.location}</span>
                                    </div>
                                )}
                                {course.trainer_name && (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <User className="w-4 h-4 text-accent" />
                                        <span className="truncate max-w-[200px]" title={course.trainer_name}>{course.trainer_name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Users className="w-4 h-4 text-accent" />
                                    <span className="font-medium">
                                        Cupos: <span className={(course.enrolled_count || 0) >= course.capacity ? "text-red-500" : "text-green-600"}>{course.enrolled_count || 0} / {course.capacity}</span>
                                    </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${((course.enrolled_count || 0) / course.capacity) >= 1 ? 'bg-red-500' : 'bg-accent'}`}
                                        style={{ width: `${Math.min(100, ((course.enrolled_count || 0) / course.capacity) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleOpenEnroll(course)}
                                    className="flex items-center justify-center gap-2 text-sm text-white bg-slate-900 hover:bg-slate-800 py-2 rounded-lg font-medium transition-colors"
                                    disabled={(course.enrolled_count || 0) >= course.capacity || activeTab === 'history'}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {activeTab === 'history' ? 'Cerrado' : 'Inscribir'}
                                </button>
                                <button
                                    onClick={() => handleOpenViewEnrollments(course)}
                                    className="flex items-center justify-center gap-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Users className="w-4 h-4" />
                                    Inscritos
                                </button>
                                <button
                                    onClick={() => setContentManagerCourse({ id: course.id, name: course.name })}
                                    className={`col-span-2 flex items-center justify-center gap-2 text-sm border py-2 rounded-lg font-bold transition-all ${activeTab === 'history'
                                        ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
                                        : 'text-accent border-accent/20 bg-accent/5 hover:bg-accent/10'
                                        }`}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Ver Temario / Normativa
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredCourses.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        {activeTab === 'active'
                            ? 'No hay cursos programados próximamente.'
                            : 'No hay cursos en el historial.'}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal - PORTALED */}
            {showCreateModal && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{editingCourse ? 'Editar Curso' : 'Programar Nuevo Curso'}</h3>
                                <p className="text-sm text-slate-500">{editingCourse ? 'Modifique la información del curso.' : 'Complete la información para crear un nuevo curso.'}</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSaveCourse} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Curso (Normativo)</label>
                                        <select
                                            required
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none bg-white"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                        >
                                            <option value="">-- Seleccione el Curso --</option>
                                            <option value="Trabajador Autorizado (Nivel Básico)">Trabajador Autorizado (Nivel Básico)</option>
                                            <option value="Reentrenamiento Vigencia Anual">Reentrenamiento Vigencia Anual</option>
                                            <option value="Nivel Avanzado (Trabajador Autorizado)">Nivel Avanzado (Trabajador Autorizado)</option>
                                            <option value="Coordinador de Trabajo en Alturas">Coordinador de Trabajo en Alturas</option>
                                            <option value="Jefes de Área">Jefes de Área</option>
                                            <option value="Administrativo para Jefes de Área">Administrativo para Jefes de Área</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Ubicación</label>
                                        <input required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Sede Norte / Cliente" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Inicio</label>
                                        {/* FIX: Type date */}
                                        <input
                                            required
                                            type="date"
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                            value={newStartDate}
                                            onChange={e => setNewStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Cupo Máximo</label>
                                        <input required type="number" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all" value={newCapacity} onChange={e => setNewCapacity(parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Duración (Días)</label>
                                        <input required type="number" min={1} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all" value={newDurationDays} onChange={e => setNewDurationDays(parseInt(e.target.value))} />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Instructor Asignado</label>
                                    <select
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none bg-white"
                                        value={selectedTrainer}
                                        onChange={e => setSelectedTrainer(e.target.value)}
                                    >
                                        <option value="">-- Sin Asignar --</option>
                                        {trainers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Documentación Requerida para Inscripción</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        {docTypes.map(doc => (
                                            <label key={doc.id} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all select-none">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm ${selectedDocs.includes(doc.id) ? 'bg-accent border-accent text-white' : 'border-slate-300 bg-white'}`}>
                                                    {selectedDocs.includes(doc.id) && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} />
                                                <span className="text-sm text-slate-700 font-medium">{doc.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">Cancelar</button>
                                    <button type="submit" className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover shadow-lg shadow-accent/20 font-medium transition-all transform active:scale-95 flex items-center gap-2">
                                        {editingCourse ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        {editingCourse ? 'Guardar Cambios' : 'Crear Curso'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Enroll Modal - PORTALED */}
            {enrollCourse && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setEnrollCourse(null)} />
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 shrink-0 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Inscribir en {enrollCourse.name}</h3>
                            <button onClick={() => setEnrollCourse(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Buscar Aprendiz</label>
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm"
                                            placeholder="Buscar por nombre o cédula..."
                                            value={enrollSearch}
                                            onChange={e => setEnrollSearch(e.target.value)}
                                        />
                                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>

                                    <div className="mt-4 max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 custom-scrollbar shadow-inner bg-slate-50/50">
                                        {filteredStudents.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedStudent(s.id)}
                                                className={`w-full text-left p-3 hover:bg-white flex justify-between items-center transition-all ${selectedStudent === s.id ? 'bg-accent/10 text-accent font-bold ring-1 ring-inset ring-accent/20' : 'text-slate-600'}`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedStudent === s.id ? 'bg-accent text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                        {s.full_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="truncate">{s.full_name}</span>
                                                </div>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono border border-slate-200">{s.document_id}</span>
                                            </button>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <div className="p-8 text-center">
                                                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-400 text-sm">No se encontraron aprendices</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button onClick={() => setEnrollCourse(null)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">Cancelar</button>
                                    <button
                                        onClick={handleEnroll}
                                        disabled={!selectedStudent}
                                        className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover shadow-lg shadow-accent/20 font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Confirmar Inscripción
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* View Enrollments Modal - PORTALED */}
            {viewEnrollmentsCourse && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setViewEnrollmentsCourse(null)} />
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 shrink-0 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Aprendices Inscritos</h3>
                                <p className="text-sm text-slate-500">{viewEnrollmentsCourse.name}</p>
                            </div>
                            <button onClick={() => setViewEnrollmentsCourse(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto custom-scrollbar">
                            {loadingEnrollments ? (
                                <div className="p-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {enrolledStudents.map((s, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                    {s.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{s.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {s.document_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    handleClickRemoveStudent(s.id, s.full_name, e);
                                                    setShowStudentRemoveConfirm(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                                title="Retirar Aprendiz"
                                            >
                                                <UserMinus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {enrolledStudents.length === 0 && (
                                        <div className="p-12 text-center text-slate-400">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No hay aprendices inscritos aún.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center text-sm text-slate-500">
                            <span>Total inscritos: <strong>{enrolledStudents.length}</strong></span>
                            <button onClick={() => setViewEnrollmentsCourse(null)} className="text-accent font-medium hover:underline">Cerrar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Course Confirmation Modal - PORTALED */}
            {showDeleteConfirm && courseToDelete && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Curso?</h3>
                            <p className="text-slate-500 mb-6 text-sm text-left bg-red-50 p-4 rounded-lg border border-red-100">
                                <span className="block font-bold mb-2">⚠ ADVERTENCIA: Esta acción no se puede deshacer.</span>
                                Al eliminar este curso, el sistema borrará permanentemente:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Las <strong>inscripciones</strong> de todos los alumnos.</li>
                                    <li>Los registros de <strong>asistencia</strong>.</li>
                                    <li>Los <strong>certificados</strong> generados.</li>
                                </ul>
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteCourse}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 font-medium transition-colors"
                                >
                                    Sí, Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Remove Student Confirmation Modal - PORTALED */}
            {showStudentRemoveConfirm && studentToRemove && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowStudentRemoveConfirm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserMinus className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Retirar Aprendiz?</h3>
                            <p className="text-slate-500 mb-6">
                                Estás a punto de retirar a <strong>{studentToRemove.name}</strong> de este curso.
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowStudentRemoveConfirm(false)}
                                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmRemoveStudent}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-medium transition-colors"
                                >
                                    Sí, Retirar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ActionBlockedModal
                isOpen={blockModalOpen}
                onClose={() => setBlockModalOpen(false)}
                title={blockInfo.title}
                message={blockInfo.message}
                instructions={blockInfo.instructions}
                actionLabel="Ir a Usuarios"
                onAction={() => window.location.href = '/dashboard?tab=SYSTEM_USERS'}
            />

            {/* Content Manager Modal - PORTALED */}
            {contentManagerCourse && typeof document !== 'undefined' && ReactDOM.createPortal(
                <CourseContentManager
                    courseId={contentManagerCourse.id}
                    courseName={contentManagerCourse.name}
                    onClose={() => setContentManagerCourse(null)}
                />,
                document.body
            )}
        </div>
    );
};

export default PhysicalCourseManager;
