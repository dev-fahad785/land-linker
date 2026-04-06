import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-[#E8E3D9] shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>
            Welcome Back
          </CardTitle>
          <CardDescription className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#FBEAE8] border border-[#B04A41] text-[#B04A41] px-4 py-3 rounded-lg text-sm" data-testid="login-error-message">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#59605D]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]"
                data-testid="login-email-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#59605D]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]"
                data-testid="login-password-input"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3 transition-colors duration-200 font-medium"
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2B4A3B] font-medium hover:text-[#1E3329]" data-testid="register-link">
              Sign up
            </Link>
          </div>
          
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-[#8A918E] hover:text-[#59605D]" data-testid="home-link">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
