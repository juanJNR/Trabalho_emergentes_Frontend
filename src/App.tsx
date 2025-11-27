import { Routes, Route } from 'react-router-dom';
import ProfessorPage from './pages/ProfessorPage';
import AlunoPage from './pages/AlunoPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<ProfessorPage />} />
            <Route path="/aluno/:token" element={<AlunoPage />} />
        </Routes>
    );
}

export default App;
