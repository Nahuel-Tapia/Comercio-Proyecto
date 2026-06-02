import React, { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        window.location.href = '/admin';
      } else {
        const data = await res.json();
        setError(data.error || 'Credenciales inválidas. Por favor, intentá nuevamente.');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Error de conexión. Intentá nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-brand-white border border-brand-dark/5 shadow-sm">
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-brand-dark font-light lowercase">
          acceso seguro
        </h2>
        <div className="w-8 h-[1px] bg-brand-gold/60 mx-auto mt-4 mb-4"></div>
        <p className="text-sm text-brand-dark/50 font-light">
          Ingresá tus credenciales para administrar la tienda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-800 p-3 text-xs uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-widest text-brand-dark/60 mb-2 font-medium">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none border-b border-brand-dark/15 focus:border-brand-dark transition-colors font-light"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-brand-dark/60 mb-2 font-medium">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none border-b border-brand-dark/15 focus:border-brand-dark transition-colors font-light"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-dark text-brand-white py-4 mt-4 uppercase tracking-widest text-xs font-semibold hover:bg-brand-gold transition-colors duration-300 disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
