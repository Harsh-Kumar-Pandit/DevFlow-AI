import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AtSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to DevFlow 🚀');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-zinc-500 text-sm">Join thousands of teams building faster with DevFlow AI</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full Name" placeholder="John Doe" icon={User} value={form.fullName} onChange={update('fullName')} required />
        <Input label="Username" placeholder="johndoe" icon={AtSign} value={form.username} onChange={update('username')} required />
        <Input label="Email" type="email" placeholder="you@example.com" icon={Mail} value={form.email} onChange={update('email')} required />
        <Input label="Password" type="password" placeholder="At least 8 characters" icon={Lock} value={form.password} onChange={update('password')} required />
        <Button type="submit" variant="gradient" size="lg" loading={loading} className="mt-2 w-full">
          Create Account
          <ArrowRight size={16} />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
