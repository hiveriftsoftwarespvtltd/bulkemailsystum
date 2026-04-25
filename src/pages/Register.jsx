import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, Loader2, User } from 'lucide-react';
import Swal from 'sweetalert2';

import config from '../config';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            Swal.fire({
                title: 'Missmatch!',
                text: 'Passwords do not match!',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${config.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: 'Account Created!',
                    text: data.message || 'Verification email sent, please login.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    color: '#1e293b'
                }).then(() => {
                    navigate('/login');
                });
            } else {
                Swal.fire({
                    title: 'Registration Failed!',
                    text: data.message || 'Something went wrong!',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Server Error!',
                text: 'Unable to reach the server. Please try again later.',
                icon: 'warning',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans page-animate">
            <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl shadow-primary/10/50 border border-slate-100 overflow-hidden">
                <div className="p-10 md:p-14 space-y-8">

                    {/* --- HEADER --- */}
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/10 mb-4 group hover:rotate-6 transition-transform duration-500">
                            <UserPlus className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight font-heading uppercase">Register</h1>
                        <p className="text-slate-400 font-medium">Create your high-conversion account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Vineet Kumar"
                                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Password</label>
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

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
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
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                            {isLoading ? 'Processing...' : 'Register Now'}
                        </button>
                    </form>

                    <p className="text-center text-xs font-bold text-slate-400 pt-2 border-t border-slate-50">
                        Already with us? <Link to="/login" className="text-primary hover:underline font-black uppercase tracking-widest ml-1">Sign In</Link>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Register;

