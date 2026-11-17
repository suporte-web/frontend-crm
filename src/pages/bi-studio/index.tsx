import { Navigate } from 'react-router-dom';

// A página anterior estava vazia; reutiliza o BI disponível.
export default function BiStudioPage() { return <Navigate to='/bi' replace />; }
