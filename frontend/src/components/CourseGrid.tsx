import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Star, MoreHorizontal, PlayCircle } from 'lucide-react';
import api from '../api';
import PaymentButton from './PaymentButton';

interface Course {
    id: string;
    title: string;
    instructor: string;
    duration: string;
    modules: number;
    rating: number;
    students: number;
    progress?: number;
    image: string;
    category: string;
    price?: number;
}



const CourseGrid: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/');
                // Transform API data to match UI interface if needed, or update interface
                // For now, mapping basic fields. In real app, interface should match API response.
                const mappedCourses = response.data.map((c: any) => ({
                    id: c.id,
                    title: c.name,
                    instructor: 'Instructor Nexor', // Placeholder
                    duration: `${c.required_hours} Horas`,
                    modules: 5, // Placeholder or fetch count
                    rating: 4.8,
                    students: 100,
                    progress: 0, // Placeholder
                    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800', // Placeholder
                    category: c.type,
                    price: c.price
                }));
                setCourses(mappedCourses);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando cursos...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-industrial-DEFAULT text-white rounded-lg text-sm font-bold shadow-glow">Todos</button>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-industrial-DEFAULT transition-colors">Regulatorios</button>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-industrial-DEFAULT transition-colors">Emergencias</button>
                </div>
                <button className="bg-accent text-white px-5 py-2 rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-glow text-sm">
                    + Crear Curso
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        {/* Image Header */}
                        <div className="h-44 bg-slate-200 relative overflow-hidden">
                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm border border-white/20">
                                {course.category}
                            </div>
                            {course.progress === 100 && (
                                <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-glow flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    COMPLETADO
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="font-display font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 h-14 group-hover:text-accent transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-2 font-medium">
                                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {course.instructor.charAt(0)}
                                </span>
                                {course.instructor}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-500 mb-5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {course.duration}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                    {course.modules} Módulos
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    {course.rating}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {typeof course.progress === 'number' && (
                                <div className="mb-5">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-bold text-slate-600">Progreso</span>
                                        <span className="font-bold text-accent">{course.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full shadow-sm ${course.progress === 100 ? 'bg-green-500' : 'bg-accent'}`}
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                {course.progress !== undefined && course.progress > 0 ? (
                                    <button
                                        onClick={() => navigate(`/classroom/${course.id}`)}
                                        className="text-accent font-bold text-sm hover:text-accent-hover flex items-center gap-1.5 transition-colors group/btn"
                                    >
                                        <PlayCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        Continuar
                                    </button>
                                ) : (
                                    <div className="w-full">
                                        <div className="mb-2 text-lg font-bold text-slate-800">
                                            ${course.price?.toLocaleString()} COP
                                        </div>
                                        <PaymentButton
                                            courseId={course.id}
                                            amount={course.price || 0}
                                            onSuccess={() => {
                                                // Refresh courses or navigate
                                                alert("Pago exitoso! El curso se ha activado.");
                                                window.location.reload();
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseGrid;
