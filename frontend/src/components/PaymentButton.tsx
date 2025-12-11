import React, { useState } from 'react';
import { CreditCard, Loader } from 'lucide-react';
import api from '../api';

interface PaymentButtonProps {
    courseId: string;
    amount: number;
    onSuccess?: () => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ courseId, amount, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Initiate Payment on Backend
            const response = await api.post('/payments/initiate', {
                course_id: courseId,
                amount: amount,
                provider: 'WOMPI'
            });

            const { reference, signature, amount_in_cents, currency, public_key } = response.data;

            // 2. Open Wompi Widget (Mock for now)
            // In a real implementation, we would append the Wompi script and open the checkout.
            // For this prototype, we'll simulate the flow.

            console.log("Opening Wompi Checkout with:", { reference, signature, amount_in_cents, currency, public_key });

            // Simulate user completing payment
            setTimeout(async () => {
                // Simulate Webhook call (In dev, we might trigger it manually or have the widget redirect)
                // Here we just alert success
                alert(`Simulación: Pago iniciado. Referencia: ${reference}`);
                setLoading(false);
                if (onSuccess) onSuccess();
            }, 1000);

        } catch (error) {
            console.error("Payment initiation failed", error);
            alert("Error al iniciar el pago.");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-industrial text-white py-2 px-4 rounded-lg font-bold hover:bg-industrial-dark transition-colors flex items-center justify-center gap-2"
        >
            {loading ? <Loader className="animate-spin" size={20} /> : <CreditCard size={20} />}
            {loading ? 'Procesando...' : 'Pagar con Wompi'}
        </button>
    );
};

export default PaymentButton;
