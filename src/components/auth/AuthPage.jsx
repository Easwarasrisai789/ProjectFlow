// src/components/auth/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser, loginUser } from '../../services/authService';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerUser({ name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success('Account created! Welcome.');
      } else {
        await loginUser({ email: form.email, password: form.password });
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => { setForm({ ...form, [k]: v }); setErrors({ ...errors, [k]: '' }); };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      // 🌈 Dual light color gradient (main improvement)
      background: 'linear-gradient(135deg, #e0f2fe, #f5d0fe)',

      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 50,
            height: 50,
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            margin: '0 auto 14px',
            boxShadow: '0 6px 15px rgba(0,0,0,0.1)'
          }}>
            PF
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700 }}>ProjectFlow</h1>
          <p style={{ color: '#555', fontSize: 13 }}>
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffffcc',
          backdropFilter: 'blur(10px)',

          // ✨ Rounded + soft border
          border: '1px solid #e5e7eb',
          borderRadius: 18,

          padding: 28,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}>

          {/* Toggle */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 10,
            padding: 4,
            marginBottom: 24
          }}>
            {[['login', 'Sign In'], ['register', 'Create Account']].map(([m, l]) => (
              <button key={m}
                onClick={() => { setMode(m); setErrors({}); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,

                  background: mode === m
                    ? 'linear-gradient(135deg, #3b82f6, #a855f7)'
                    : 'transparent',

                  color: mode === m ? '#fff' : '#555',
                  transition: 'all 0.2s'
                }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            
            {mode === 'register' && (
              <div className="field">
                <label>Full Name</label>
                <input type="text" placeholder="Your name" value={form.name}
                  onChange={(e) => set('name', e.target.value)} />
                {errors.name && <div className="error-msg">{errors.name}</div>}
              </div>
            )}

            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
              {errors.email && <div className="error-msg">{errors.email}</div>}
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••" value={form.password}
                onChange={(e) => set('password', e.target.value)} />
              {errors.password && <div className="error-msg">{errors.password}</div>}
            </div>

            {mode === 'register' && (
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                  <option value="member">Member — Can update task status</option>
                  <option value="admin">Admin — Can manage projects, tasks & team</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '12px',
                borderRadius: 10,
                border: 'none',

                // 🔥 Gradient button
                background: 'linear-gradient(135deg, #3b82f6, #a855f7)',

                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* Extra CSS */}
      <style>{`
        .field {
          margin-bottom: 14px;
        }

        .field label {
          display: block;
          font-size: 13px;
          margin-bottom: 5px;
          color: #444;
        }

        .field input, .field select {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
          outline: none;
          transition: 0.2s;
        }

        .field input:focus, .field select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
        }

        .error-msg {
          font-size: 12px;
          color: red;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;