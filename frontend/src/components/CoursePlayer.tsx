import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, CheckCircle, Lock, Clock, ChevronLeft, Menu, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import QuizComponent from './QuizComponent';

interface Module {
    id: string;
    title: string;
    content_url: string;
    min_duration_seconds: number;
    order_index: number;
    has_quiz: boolean;
}

interface Course {
    id: string;
    name: string;
    modules: Module[];
}

interface ModuleProgress {
    module_id: string;
    status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
    seconds_spent: number;
}

const CoursePlayer: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [progressMap, setProgressMap] = useState<Record<string, ModuleProgress>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        fetchCourseData();

        // Page Visibility API to pause timer
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsTimerRunning(false);
            } else {
                // Only resume if not showing quiz and time left > 0
                if (!showQuiz && timeLeft > 0) {
                    setIsTimerRunning(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [courseId]);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
                // Sync progress to backend every 10 seconds
                if (timeLeft % 10 === 0 && activeModule) {
                    syncProgress(activeModule.id, 'IN_PROGRESS', activeModule.min_duration_seconds - timeLeft);
                }
            }, 1000);
        } else if (timeLeft === 0) {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, timeLeft, activeModule]);

    const fetchCourseData = async () => {
        try {
            setError(null);
            const response = await api.get(`/courses/${courseId}/player`);
            setCourse(response.data);

            // Mock progress for now (In real app, fetch from backend)
            // For demo: First module unlocked, others locked
            const initialProgress: Record<string, ModuleProgress> = {};
            response.data.modules.forEach((m: Module, index: number) => {
                initialProgress[m.id] = {
                    module_id: m.id,
                    status: index === 0 ? 'IN_PROGRESS' : 'LOCKED',
                    seconds_spent: 0
                };
            });
            setProgressMap(initialProgress);

            if (response.data.modules.length > 0) {
                loadModule(response.data.modules[0], initialProgress);
            } else {
                setError("El curso no tiene módulos disponibles.");
            }
        } catch (error: any) {
            console.error('Error fetching course:', error);
            setError(error.response?.data?.detail || error.message || "Error al cargar el curso.");
        }
    };

    const loadModule = (module: Module, currentProgressMap = progressMap) => {
        const progress = currentProgressMap[module.id];
        if (progress.status === 'LOCKED') return;

        setActiveModule(module);
        setShowQuiz(false);

        if (progress.status === 'COMPLETED') {
            setTimeLeft(0);
            setIsTimerRunning(false);
        } else {
            const remaining = Math.max(0, module.min_duration_seconds - progress.seconds_spent);
            setTimeLeft(remaining);
            setIsTimerRunning(true);
        }
    };

    const handleTimerComplete = () => {
        setIsTimerRunning(false);
        if (activeModule) {
            // If module has quiz, show it instead of completing immediately
            if (activeModule.has_quiz) {
                setShowQuiz(true);
            } else {
                completeModule();
            }
        }
    };

    const completeModule = () => {
        if (!activeModule) return;

        syncProgress(activeModule.id, 'COMPLETED', activeModule.min_duration_seconds);

        // Update local state to unlock next module
        const nextModuleIndex = course?.modules.findIndex(m => m.id === activeModule.id)! + 1;
        if (course && nextModuleIndex < course.modules.length) {
            const nextModule = course.modules[nextModuleIndex];
            setProgressMap(prev => ({
                ...prev,
                [activeModule.id]: { ...prev[activeModule.id], status: 'COMPLETED', seconds_spent: activeModule.min_duration_seconds },
                [nextModule.id]: { ...prev[nextModule.id], status: 'IN_PROGRESS' }
            }));
        } else {
            setProgressMap(prev => ({
                ...prev,
                [activeModule.id]: { ...prev[activeModule.id], status: 'COMPLETED', seconds_spent: activeModule.min_duration_seconds }
            }));
        }
        setShowQuiz(false);
    };

    const handleQuizComplete = (passed: boolean) => {
        if (passed) {
            completeModule();
        }
        // If failed, user stays on quiz screen to retry (handled by QuizComponent)
    };

    const syncProgress = async (moduleId: string, status: string, seconds: number) => {
        try {
            await api.post(`/courses/${courseId}/modules/${moduleId}/progress`, {
                status,
                seconds_spent: seconds
            });
        } catch (error) {
            console.error('Error syncing progress:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (error) return (
        <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">
            <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Error</h3>
                <p className="text-slate-400">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700">Volver</button>
            </div>
        </div>
    );

    if (!course || !activeModule) return <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">Cargando curso...</div>;

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden`}>
                <div className="p-6 border-b border-slate-800">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" />
                        Volver al Dashboard
                    </button>
                    <h2 className="font-bold text-lg leading-tight font-display text-white">{course.name}</h2>
                    <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-accent h-1.5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">15% Completado</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {course.modules.map((module, index) => {
                        const status = progressMap[module.id]?.status || 'LOCKED';
                        const isActive = activeModule.id === module.id;

                        return (
                            <button
                                key={module.id}
                                onClick={() => loadModule(module)}
                                disabled={status === 'LOCKED'}
                                className={`w-full text-left p-4 border-b border-slate-800/50 flex items-start gap-3 transition-colors ${isActive ? 'bg-slate-800/50 border-l-4 border-l-accent' : 'hover:bg-slate-800/30'
                                    } ${status === 'LOCKED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="mt-0.5">
                                    {status === 'COMPLETED' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : status === 'LOCKED' ? (
                                        <Lock className="w-5 h-5 text-slate-600" />
                                    ) : (
                                        <PlayCircle className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        Módulo {index + 1}: {module.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {Math.floor(module.min_duration_seconds / 60)} min
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4">
                        {timeLeft > 0 ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 animate-pulse">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                                <span className="text-xs font-medium uppercase tracking-wide ml-1">Restante</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-bold text-sm">
                                    {showQuiz ? 'Evaluación Pendiente' : 'Módulo Completado'}
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Viewer */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                    {showQuiz ? (
                        <div className="w-full h-full bg-slate-100 overflow-y-auto p-8">
                            <QuizComponent moduleId={activeModule.id} onComplete={handleQuizComplete} />
                        </div>
                    ) : (
                        <>
                            {activeModule.content_url ? (
                                <iframe
                                    src={activeModule.content_url}
                                    className="w-full h-full border-0"
                                    title="Course Content"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                        <PlayCircle className="w-10 h-10 text-slate-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-300 mb-2">Contenido Simulado</h3>
                                    <p className="text-slate-500 max-w-md mx-auto">
                                        Este es un visor de demostración. En producción, aquí se cargaría el video o SCORM del módulo "{activeModule.title}".
                                    </p>
                                </div>
                            )}

                            {/* Anti-Cheat Warning Overlay */}
                            {!isTimerRunning && timeLeft > 0 && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                                    <div className="bg-slate-900 p-8 rounded-xl border border-red-500/50 max-w-md text-center shadow-2xl">
                                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">Pausa Automática</h3>
                                        <p className="text-slate-400 mb-6">
                                            El temporizador se ha detenido porque la ventana perdió el foco. Para garantizar el aprendizaje, debes mantener esta pestaña activa.
                                        </p>
                                        <button
                                            onClick={() => setIsTimerRunning(true)}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors w-full"
                                        >
                                            Reanudar Aprendizaje
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-8">
                    <button
                        className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                        disabled={course.modules.findIndex(m => m.id === activeModule.id) === 0}
                        onClick={() => {
                            const prevIndex = course.modules.findIndex(m => m.id === activeModule.id) - 1;
                            if (prevIndex >= 0) {
                                loadModule(course.modules[prevIndex]);
                            }
                        }}
                    >
                        Anterior
                    </button>

                    <button
                        className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 ${timeLeft > 0 || showQuiz
                            ? 'bg-slate-700 cursor-not-allowed opacity-50'
                            : 'bg-accent hover:bg-accent-hover shadow-glow'
                            }`}
                        disabled={timeLeft > 0 || showQuiz}
                        onClick={() => {
                            const nextIndex = course.modules.findIndex(m => m.id === activeModule.id) + 1;
                            if (nextIndex < course.modules.length) {
                                loadModule(course.modules[nextIndex]);
                            } else {
                                alert('¡Curso completado! Redirigiendo a certificación...');
                                navigate('/dashboard');
                            }
                        }}
                    >
                        {timeLeft > 0 ? `Espera ${formatTime(timeLeft)}` : showQuiz ? 'Completa la Evaluación' : 'Siguiente Módulo'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default CoursePlayer;
