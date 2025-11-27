import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function AlunoPage() {
    const { token } = useParams<{ token: string }>();
    const [nome, setNome] = useState('');
    const [mensagem, setMensagem] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const enviarPresenca = async () => {
        try {
            await axios.post(`${API_URL}/api/presencas`, { alunoNome: nome, token });
            setMensagem('Presença registrada com sucesso!');
        } catch (err: any) {
            setMensagem(err.response?.data?.error || 'Erro ao registrar presença');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">✓</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Registrar Presença</h1>
                    <p className="text-gray-600">Digite seu nome para confirmar presença</p>
                </div>

                <div className="space-y-4">
                    <input
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition text-lg"
                    />

                    <button
                        onClick={enviarPresenca}
                        disabled={!nome.trim()}
                        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        📝 Confirmar Presença
                    </button>

                    {mensagem && (
                        <div className={`p-4 rounded-lg text-center font-semibold ${mensagem.includes('sucesso')
                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                            : 'bg-red-100 text-red-800 border-2 border-red-300'
                            }`}>
                            {mensagem}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>⏰ O QR Code é válido por apenas 20 segundos</p>
                </div>
            </div>
        </div>
    );
}

export default AlunoPage;
