import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

import config from '../config';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // The data we need is inside data.data based on your JSON
                localStorage.setItem('access_token', data.data.access_token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                Swal.fire({
                    title: 'Welcome Back!',
                    text: 'Login successful',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    color: '#1e293b',
                    iconColor: '#5f49e0'
                }).then(() => {
                    onLogin();
                    navigate('/');
                });
            } else {
                Swal.fire({
                    title: 'Login Failed!',
                    text: data.message || 'Invalid email or password!',
                    icon: 'error',
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#5f49e0',
                    background: '#ffffff',
                    color: '#1e293b'
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: 'Cannot connect to server. Ensure backend is running.',
                icon: 'warning',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#5f49e0'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans page-animate">
            <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl shadow-primary/10/50 border border-slate-100 overflow-hidden">
                <div className="p-10 md:p-14 space-y-10">

                    {/* --- HEADER --- */}
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/10 mb-6 group hover:rotate-6 transition-transform duration-500">
                            <Mail className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight font-heading uppercase">Sign In</h1>
                        <p className="text-slate-400 font-medium">Access your email marketing dashboard.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    placeholder="vineet@example.com"
                                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Password</label>
                                <Link to="/forgot-password" size={14} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline tracking-widest">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-primary text-white p-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/10/50 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                            {isLoading ? 'Wait...' : 'Login Now'}
                        </button>
                    </form>

                    <p className="text-center text-xs font-bold text-slate-400 pt-4 border-t border-slate-50">
                        Don't have an account? <Link to="/register" className="text-primary hover:underline font-black uppercase tracking-widest ml-1">Create One</Link>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Login;

