import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter, Route, Routes } from 'react-router';
import './index.css';
import Home from './pages/Home';
import Lists from './pages/Lists';
import WriteList from './pages/WriteList';
import CheckList from './pages/CheckList';
import Plan from './pages/Plan';
import Shop from './pages/Shop';
import Done from './pages/Done';
import Savings from './pages/Savings';

// HashRouter: works on any static host without extra server setup.
// The one-file preview build uses MemoryRouter instead (its host controls the URL).
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/new" element={<WriteList />} />
        <Route path="/list/:id/check" element={<CheckList />} />
        <Route path="/list/:id/plan" element={<Plan />} />
        <Route path="/list/:id/shop" element={<Shop />} />
        <Route path="/trip/:id" element={<Done />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  </StrictMode>,
);
