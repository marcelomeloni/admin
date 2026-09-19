import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, LogIn, LockKeyhole, Loader2, ImageOff } from 'lucide-react';
import './App.css';

const API_URL = 'https://teste2-beta-three.vercel.app/api/admin';

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [isLogged, setIsLogged] = useState(!!token);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputToken, setInputToken] = useState('');

  // Loading states for actions
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Preview da imagem em tela cheia
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isLogged) fetchPosts();
  }, [isLogged]);

  // Fecha o preview com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewUrl(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      // O backend já retorna ordenado do mais novo pro mais antigo
      const res = await axios.get(`${API_URL}/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data.posts);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
        setError('Token inválido ou expirado.');
      } else {
        setError(err.response?.data?.message || 'Erro ao carregar posts');
      }
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken) return;
    setToken(inputToken);
    localStorage.setItem('adminToken', inputToken);
    setIsLogged(true);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    setIsLogged(false);
    setPosts([]);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      await axios.post(`${API_URL}/${action}/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || `Erro ao ${action} post`);
    }
    setProcessingId(null);
  };

  if (!isLogged) {
    return (
      <div className="login-container">
        <div className="login-card">
          <LockKeyhole size={48} className="lock-icon" />
          <h1>Admin Panel</h1>
          <p>Digite o Access Token para continuar</p>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              placeholder="Access Token"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
            />
            <button type="submit">
              <LogIn size={20} /> Entrar
            </button>
          </form>
          {error && <p className="error-msg">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <h1>Spotted Admin <span>Unicamp</span></h1>
          <button onClick={handleLogout} className="logout-btn">Sair</button>
        </div>
      </header>

      <main className="main-content">
        <div className="section-header">
          <h2>Fila de Aprovação ({posts.length})</h2>
          <button onClick={fetchPosts} className="refresh-btn">Atualizar</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={40} />
            <p>Carregando pendências...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum post pendente de aprovação. 🎉</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                {post.image_url ? (
                  <button
                    type="button"
                    className="post-thumbnail-btn"
                    onClick={() => setPreviewUrl(post.image_url!)}
                    style={{
                      border: 'none',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'zoom-in',
                      display: 'block',
                      width: '100%',
                    }}
                    aria-label="Ver imagem em tamanho maior"
                  >
                    <img
                      src={post.image_url}
                      alt={`Imagem do post ${post.id}`}
                      className="post-thumbnail"
                      style={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                    />
                  </button>
                ) : (
                  <div
                    className="post-thumbnail-placeholder"
                    style={{
                      width: '100%',
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#9aa0a6',
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    <ImageOff size={16} /> Sem imagem
                  </div>
                )}

                <div className="post-content">
                  "{post.content}"
                </div>
                <div className="post-footer">
                  <span className="post-date">
                    {new Date(post.created_at).toLocaleString('pt-BR')}
                  </span>
                  <div className="post-actions">
                    <button
                      className="reject-btn"
                      onClick={() => handleAction(post.id, 'reject')}
                      disabled={processingId === post.id}
                    >
                      {processingId === post.id ? <Loader2 className="spinner" size={16} /> : <X size={16} />}
                      Recusar
                    </button>
                    <button
                      className="approve-btn"
                      onClick={() => handleAction(post.id, 'approve')}
                      disabled={processingId === post.id}
                    >
                      {processingId === post.id ? <Loader2 className="spinner" size={16} /> : <Check size={16} />}
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {previewUrl && (
        <div
          className="image-preview-overlay"
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
            cursor: 'zoom-out',
          }}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            aria-label="Fechar preview"
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={22} />
          </button>
          <img
            src={previewUrl}
            alt="Preview em tamanho maior"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
