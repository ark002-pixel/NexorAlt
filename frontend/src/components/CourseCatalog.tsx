import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, DollarSign, CheckCircle } from 'lucide-react';
import api from '../api';

interface Course {
    id: string;
    name: string;
    description: string;
    required_hours: number;
    price: number;
    type: string;
}

const CourseCatalog: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses/');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId: string) => {
        try {
            await api.post(`/courses/${courseId}/enroll`);
            alert('¡Inscripción exitosa! (Simulado)');
        } catch (error) {
            console.error('Enrollment failed:', error);
            alert('Error al inscribirse. Verifique requisitos.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-industrial-DEFAULT mb-2">Catálogo de Formación</h1>
                <p className="text-steel-DEFAULT mb-8">Seleccione el curso requerido según su rol y normativa.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-sm shadow-lg overflow-hidden border-t-4 border-industrial-light hover:shadow-xl transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-industrial-DEFAULT text-white text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide">
                                        {course.type}
                                    </span>
                                    <span className="text-steel-DEFAULT font-bold flex items-center">
                                        <DollarSign className="w-4 h-4" />
                                        {course.price.toLocaleString()}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-2">{course.name}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description || 'Curso certificado bajo Resolución 4272/2021.'}</p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{course.required_hours} Horas</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        <span>Virtual + Práctico</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleEnroll(course.id)}
                                    className="w-full bg-steel-DEFAULT text-white font-bold py-2 rounded-sm hover:bg-industrial-DEFAULT transition-colors flex items-center justify-center gap-2"
                                >
                                    INSCRIBIRSE
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {courses.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        No hay cursos disponibles en este momento.
                        <br />
                        <span className="text-xs">(Nota: Cree cursos vía API /docs o SQL directo)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCatalog;
