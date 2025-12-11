import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../api';

interface Question {
    id: string;
    text: string;
    options: string; // JSON string
}

interface QuizResult {
    score: number;
    passed: boolean;
    correct_answers: number;
    total_questions: number;
}

interface QuizComponentProps {
    moduleId: string;
    onComplete: (passed: boolean) => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ moduleId, onComplete }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchQuiz();
    }, [moduleId]);

    const fetchQuiz = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/courses/modules/${moduleId}/quiz`);
            setQuestions(response.data);
            setAnswers(new Array(response.data.length).fill(-1));
            setResult(null);
            setCurrentQuestionIndex(0);
        } catch (err) {
            console.error('Error fetching quiz:', err);
            setError('Error al cargar la evaluación. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        try {
            const response = await api.post(`/courses/modules/${moduleId}/quiz`, {
                answers: answers
            });
            setResult(response.data);
            if (response.data.passed) {
                onComplete(true);
            }
        } catch (err) {
            console.error('Error submitting quiz:', err);
            setError('Error al enviar respuestas. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-700 font-medium mb-4">{error}</p>
                <button
                    onClick={fetchQuiz}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (result) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 bg-white rounded-xl shadow-sm border border-slate-100 animate-fade-in">
                {result.passed ? (
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                )}

                <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">
                    {result.passed ? '¡Felicitaciones!' : 'No aprobado'}
                </h2>

                <p className="text-slate-500 mb-8 text-center max-w-md">
                    {result.passed
                        ? `Has aprobado el módulo con un puntaje de ${result.score}%. Puedes continuar con el siguiente módulo.`
                        : `Tu puntaje fue de ${result.score}%. Necesitas aprobar para continuar. Por favor revisa el material e intenta nuevamente.`
                    }
                </p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                    <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
                        <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Aciertos</span>
                        <span className="text-xl font-bold text-slate-800">{result.correct_answers}/{result.total_questions}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
                        <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Puntaje</span>
                        <span className={`text-xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {result.score}%
                        </span>
                    </div>
                </div>

                {!result.passed && (
                    <button
                        onClick={fetchQuiz}
                        className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors shadow-glow"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Intentar Nuevamente
                    </button>
                )}
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay preguntas disponibles para este módulo.</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const options = JSON.parse(currentQuestion.options);
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const hasAnsweredCurrent = answers[currentQuestionIndex] !== -1;

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Evaluación del Módulo</span>
                <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600">
                    Pregunta {currentQuestionIndex + 1} de {questions.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5">
                <div
                    className="bg-accent h-1.5 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* Question Content */}
            <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                    {currentQuestion.text}
                </h3>

                <div className="space-y-3">
                    {options.map((option: string, index: number) => (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 group
                                ${answers[currentQuestionIndex] === index
                                    ? 'border-accent bg-accent/5'
                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                }
                            `}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                ${answers[currentQuestionIndex] === index
                                    ? 'border-accent bg-accent'
                                    : 'border-slate-300 group-hover:border-slate-400'
                                }
                            `}>
                                {answers[currentQuestionIndex] === index && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                )}
                            </div>
                            <span className={`font-medium ${answers[currentQuestionIndex] === index ? 'text-slate-800' : 'text-slate-600'}`}>
                                {option}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={!hasAnsweredCurrent || submitting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all
                        ${!hasAnsweredCurrent || submitting
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-accent text-white hover:bg-accent-hover shadow-glow'
                        }
                    `}
                >
                    {submitting ? (
                        <>Enviando...</>
                    ) : isLastQuestion ? (
                        <>Finalizar Evaluación</>
                    ) : (
                        <>Siguiente Pregunta <ArrowRight className="w-5 h-5" /></>
                    )}
                </button>
            </div>
        </div>
    );
};

export default QuizComponent;
