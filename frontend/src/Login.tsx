import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const Login: React.FC = () => {
    const [documentId, setDocumentId] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const params = new URLSearchParams();
            params.append('username', documentId);
            params.append('password', password);

            const response = await api.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('role', response.data.role);

            if (response.data.role === 'ADMIN' || response.data.role === 'COMPANY') {
                navigate('/dashboard');
            } else {
                navigate('/compliance');
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('Credenciales inválidas o error de conexión');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-industrial relative overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="bg-surface p-8 rounded-xl shadow-premium w-full max-w-md z-10 border-t-4 border-accent relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

                <div className="text-center mb-8">
                    <img src="/assets/logo-nexor.png" alt="Nexor Alturas" className="h-16 w-auto mx-auto mb-4" />
                    <p className="text-steel text-sm mt-2 font-medium tracking-wide">PLATAFORMA DE CERTIFICACIÓN SEGURA</p>
                </div>

                {/* Role Tabs */}
                <div className="flex mb-6 border-b border-steel-light">
                    {['STUDENT', 'TRAINER', 'COMPANY'].map((r) => (
                        <button
                            key={r}
                            className={`flex-1 pb-2 text-sm font-semibold transition-colors ${role === r
                                ? 'text-accent border-b-2 border-accent'
                                : 'text-steel-dim hover:text-steel'
                                }`}
                            onClick={() => setRole(r)}
                        >
                            {r === 'STUDENT' ? 'ESTUDIANTE' : r === 'TRAINER' ? 'ENTRENADOR' : 'EMPRESA'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-industrial-light mb-1">
                            Documento de Identidad / NIT
                        </label>
                        <input
                            type="text"
                            value={documentId}
                            onChange={(e) => setDocumentId(e.target.value)}
                            className="w-full px-4 py-3 border border-steel-light rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-surface-muted text-industrial"
                            placeholder="Ej. 123456789"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-industrial-light mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-steel-light rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-surface-muted text-industrial"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-accent-hover active:bg-accent hover:shadow-glow transition-all transform active:scale-[0.99]"
                    >
                        INGRESAR AL SISTEMA
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="#" className="text-sm text-steel hover:text-accent underline transition-colors">
                        ¿Olvidó su contraseña?
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
