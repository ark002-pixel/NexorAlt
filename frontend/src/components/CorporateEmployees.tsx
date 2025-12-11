import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Users, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

interface Employee {
    id: string;
    full_name: string;
    email: string;
    document_id: string;
    role: string;
    is_active: boolean;
}

const CorporateEmployees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ created_count: number; errors: string[] } | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            // Assuming there's an endpoint to get company employees. 
            // If not, we might need to add one or filter users by company in the backend.
            // For now, let's assume we can get them or filter them.
            // Since we don't have a specific endpoint for "my employees" yet in the plan,
            // we might need to add it or use a general user list with filter.
            // Let's check if we can use /users with a filter or add a new endpoint.
            // Given the plan, let's assume we might need to add GET /corporate/employees.
            // For this iteration, I'll assume we might need to implement it or use a placeholder.
            // Let's try to hit a hypothetical endpoint, if it fails we'll fix it.
            // Actually, looking at corporate.py, we don't have GET /corporate/employees yet.
            // I should probably add that too for completeness, but the task is Bulk Upload.
            // I'll leave the fetch empty or mock it for now to focus on Upload.
            setLoading(false);
        } catch (err) {
            console.error("Error fetching employees", err);
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadResult(null);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/corporate/employees/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadResult(response.data);
            fetchEmployees(); // Refresh list
        } catch (err: any) {
            console.error("Upload error", err);
            setError(err.response?.data?.detail || 'Error al cargar el archivo.');
        } finally {
            setUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-industrial">Mi Cuadrilla</h2>
                    <p className="text-steel">Gestiona los empleados de tu empresa.</p>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-accent-hover transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <Upload size={20} />
                        )}
                        {uploading ? 'Cargando...' : 'Carga Masiva (Excel)'}
                    </label>
                </div>
            </div>

            {/* Upload Results */}
            {uploadResult && (
                <div className={`p-4 rounded-lg border ${uploadResult.errors.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {uploadResult.errors.length > 0 ? <AlertCircle className="text-orange-500" /> : <CheckCircle className="text-green-500" />}
                        <h3 className="font-bold text-industrial">Resultado de la Carga</h3>
                    </div>
                    <p className="text-sm text-steel-dark">Usuarios creados exitosamente: <strong>{uploadResult.created_count}</strong></p>
                    {uploadResult.errors.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm font-semibold text-orange-700">Errores:</p>
                            <ul className="list-disc list-inside text-xs text-orange-600 max-h-32 overflow-y-auto">
                                {uploadResult.errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Employee List Placeholder */}
            <div className="bg-surface rounded-xl shadow-sm border border-steel-light p-6 text-center text-steel">
                <Users size={48} className="mx-auto mb-4 text-steel-light" />
                <p>La lista de empleados aparecerá aquí.</p>
                <p className="text-sm text-steel-dim mt-2">(Funcionalidad de listado pendiente de implementación)</p>
            </div>
        </div>
    );
};

export default CorporateEmployees;
