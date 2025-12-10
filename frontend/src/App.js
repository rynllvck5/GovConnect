import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Services from './pages/Services';
import Forms from './pages/Forms';
import Government from './pages/Government';
import Tourism from './pages/Tourism';
import About from './pages/About';
import Projects from './pages/Projects';
import News from './pages/News';
import Forum from './pages/Forum';
import NotFound from './pages/NotFound';
import ProjectDetail from './pages/ProjectDetail';
import NewsDetail from './pages/NewsDetail';
import TourismDetail from './pages/TourismDetail';
import OfficeDetail from './pages/OfficeDetail';
import BarangayDetail from './pages/BarangayDetail';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/services" element={<Services />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/government" element={<Government />} />
            <Route path="/government/offices/:slug" element={<OfficeDetail />} />
            <Route path="/government/barangays/:id" element={<BarangayDetail />} />
            <Route path="/tourism" element={<Tourism />} />
            <Route path="/tourism/:category/:slug" element={<TourismDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
