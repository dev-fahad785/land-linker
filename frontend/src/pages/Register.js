import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register(name, email, password, role);
      if (user.role === 'seller') {
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
            Create Account
          </CardTitle>
          <CardDescription className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            Join our land dealing platform today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#FBEAE8] border border-[#B04A41] text-[#B04A41] px-4 py-3 rounded-lg text-sm" data-testid="register-error-message">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-[#59605D]">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]"
                data-testid="register-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#59605D]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#D1CBBF] focus:ring-1 focus:ring-[#2B4A3B]"
                data-testid="register-email-input"
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
                minLength={6}
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]"
                data-testid="register-password-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#59605D]">I want to</Label>
              <RadioGroup value={role} onValueChange={setRole} data-testid="register-role-selector">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buyer" id="buyer" data-testid="register-role-buyer" />
                  <Label htmlFor="buyer" className="text-sm font-normal cursor-pointer">Buy Land</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seller" id="seller" data-testid="register-role-seller" />
                  <Label htmlFor="seller" className="text-sm font-normal cursor-pointer">Sell Land</Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3 transition-colors duration-200 font-medium"
              data-testid="register-submit-button"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            Already have an account?{' '}
            <Link to="/login" className="text-[#2B4A3B] font-medium hover:text-[#1E3329]" data-testid="login-link">
              Sign in
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
