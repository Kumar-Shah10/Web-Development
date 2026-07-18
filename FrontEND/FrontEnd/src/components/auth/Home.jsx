import { useEffect } from 'react';
import { Plus, BookOpen, Search, FileText, Moon, Download, Star } from 'lucide-react';
import { useNavigate } from '../../hooks/useNavigation';
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('dashboard');
    }
  }, [navigate]);

  const features = [
    { icon: Plus, title: 'Create Notes', desc: 'Quickly capture and organize your thoughts' },
    { icon: BookOpen, title: 'Auto Save', desc: 'Your work saves automatically' },
    { icon: Search, title: 'Search Notes', desc: 'Find notes instantly with powerful search' },
    { icon: FileText, title: 'Rich Text', desc: 'Format with style and elegance' },
    { icon: Moon, title: 'Dark & Light Mode', desc: 'Switch themes to suit your preference' },
    { icon: Download, title: 'Export PDF', desc: 'Share notes as PDF files' },
  ];

  return (
    <div className="home-root">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-logo-section">
            <Star className="home-logo" size={32} fill="#d4aa64" stroke="#d4aa64" />
            <span className="home-brand-title">NoteSphere</span>
          </div>
          <nav className="home-nav">
            <button onClick={() => navigate('login')} className="home-nav-link">Login</button>
            <button onClick={() => navigate('register')} className="home-nav-link signup">Sign Up</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-background"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Your Notes, <em>Elevated</em>
          </h1>
          <p className="hero-subtitle">
            A sophisticated note-taking experience with all the features you need to capture, organize, and share your thoughts seamlessly.
          </p>
         
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">16+</div>
              <div className="stat-label">Features</div>
            </div>
            <div className="stat">
              <div className="stat-number">∞</div>
              <div className="stat-label">Notes Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="features-header">
          <h2>Powerful Features</h2>
          <p>Everything you need to manage your notes beautifully</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <Icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <h2>Ready to Transform Your Note-Taking?</h2>
        <p>Join thousands of users who trust NoteSphere</p>
       
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Star size={24} fill="#d4aa64" stroke="#d4aa64" />
            <span>NoteSphere</span>
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <p className="footer-copyright">© 2026 NoteSphere. All rights reserved.</p>
      </footer>
    </div>
  );
}