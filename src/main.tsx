import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { ptBR } from '@mui/material/locale';
import Rotas from './Rotas';
import { Providers } from './app/providers';
import './styles/globals.css';

const theme = createTheme({ palette: { primary: { main: '#FF4D00' }, secondary: { main: '#dee7e9' } } }, ptBR);

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Providers><Rotas /></Providers>
    </BrowserRouter>
  </ThemeProvider>,
);
