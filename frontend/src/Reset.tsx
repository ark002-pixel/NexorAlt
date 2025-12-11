import React, { useEffect } from 'react';

const Reset: React.FC = () => {
    useEffect(() => {
        // Force clear everything
        console.log('PERFORMING HARD RESET...');
        localStorage.clear();
        sessionStorage.clear();

        // Unregister service workers if any
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }

        // Redirect to login after a brief delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#0F172A',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>REINICIANDO SISTEMA...</h1>
            <p style={{ fontSize: '1.5rem', color: '#94A3B8' }}>Limpiando caché y configuraciones...</p>
            <div style={{
                marginTop: '2rem',
                width: '50px',
                height: '50px',
                border: '4px solid #334155',
                borderTop: '4px solid #0EA5E9',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Reset;
