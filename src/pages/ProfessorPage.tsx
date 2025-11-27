import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { io } from 'socket.io-client';

interface Turma {
    id: number;
    nome: string;
}
interface Presenca {
    id: number;
    alunoNome: string;
    createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(API_URL);

function ProfessorPage() {
    const [turmaNome, setTurmaNome] = useState('');
    const [turma, setTurma] = useState<Turma | null>(null);
    const [token, setToken] = useState('');
    const [presencas, setPresencas] = useState<Presenca[]>([]);
    const [timer, setTimer] = useState(20);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        socket.on('novoToken', ({ token, turmaId }) => {
            if (turma && turmaId === turma.id) {
                setToken(token);
                setTimer(20);
            }
        });
        socket.on('atualizarPresenca', ({ turmaId }) => {
            if (turma && turmaId === turma.id) {
                fetchPresencas(turma.id);
            }
        });
        return () => {
            socket.off('novoToken');
            socket.off('atualizarPresenca');
        };
    }, [turma]);

    // Polling como backup - atualiza lista a cada 5 segundos
    useEffect(() => {
        if (!turma || !token) return;

        const interval = setInterval(() => {
            fetchPresencas(turma.id);
        }, 5000);

        return () => clearInterval(interval);
    }, [turma, token]);

    useEffect(() => {
        if (token && timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [token, timer]);

    const criarTurma = async () => {
        if (!turmaNome.trim()) {
            setErro('Digite o nome da turma');
            return;
        }

        try {
            setLoading(true);
            setErro('');
            const res = await axios.post(`${API_URL}/api/turmas`, { nome: turmaNome });
            setTurma(res.data);
            socket.emit('joinRoom', res.data.id);
            await fetchPresencas(res.data.id);
        } catch (error: any) {
            console.error('Erro ao criar turma:', error);
            setErro(error.response?.data?.error || 'Erro ao criar turma. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const iniciarChamada = async () => {
        if (!turma) return;

        try {
            await axios.post(`${API_URL}/api/turmas/${turma.id}/qrcode`);
        } catch (error: any) {
            console.error('Erro ao iniciar chamada:', error);
            setErro(error.response?.data?.error || 'Erro ao iniciar chamada.');
        }
    };

    const fetchPresencas = async (turmaId: number) => {
        try {
            const res = await axios.get(`${API_URL}/api/turmas/${turmaId}/presencas`);
            setPresencas(res.data);
        } catch (error: any) {
            console.error('Erro ao buscar presenças:', error);
        }
    };

    const baixarTXT = async () => {
        if (!turma) return;

        try {
            const res = await axios.get(`${API_URL}/api/turmas/${turma.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'presenca.txt');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            console.error('Erro ao baixar TXT:', error);
            setErro('Erro ao baixar arquivo.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    📋 Painel do Professor
                </h1>

                {!turma ? (
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Criar Nova Turma</h2>
                        {erro && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {erro}
                            </div>
                        )}
                        <input
                            value={turmaNome}
                            onChange={e => setTurmaNome(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && criarTurma()}
                            placeholder="Nome da turma"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition mb-4"
                            disabled={loading}
                        />
                        <button
                            onClick={criarTurma}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : 'Criar Turma'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Turma: <span className="text-primary-600">{turma.nome}</span>
                                </h2>
                                <button
                                    onClick={iniciarChamada}
                                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg"
                                >
                                    🚀 Iniciar Chamada
                                </button>
                            </div>
                        </div>

                        {token && (
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                                    QR Code de Presença
                                </h3>
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-6 rounded-xl shadow-lg border-4 border-primary-200">
                                        <QRCode value={`${window.location.origin}/aluno/${token}`} size={250} />
                                    </div>
                                    <div className="mt-6 text-center">
                                        <p className="text-lg text-gray-600 mb-2">Tempo restante para novo QR Code:</p>
                                        <p className={`text-5xl font-bold ${timer <= 5 ? 'text-red-500' : 'text-primary-600'}`}>
                                            {timer}s
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    📝 Lista de Presença ({presencas.length})
                                </h3>
                                <button
                                    onClick={baixarTXT}
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition shadow-lg"
                                >
                                    ⬇️ Baixar TXT
                                </button>
                            </div>

                            {presencas.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Nenhuma presença registrada ainda.</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {presencas.map((p, index) => (
                                        <div
                                            key={p.id}
                                            className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="font-semibold text-gray-800">{p.alunoNome}</span>
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {new Date(p.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfessorPage;
