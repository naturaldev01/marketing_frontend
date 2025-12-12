'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, initialized, initialize, signIn, signUp, loading } = useAuthStore();
  const [isSignup, setIsSignup] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && user) {
      router.push('/dashboard');
    }
  }, [initialized, user, router]);

  const onLogin = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      toast.error((error as Error).message || 'Login failed');
    }
  };

  const onSignup = async (data: SignupFormData) => {
    try {
      await signUp(data.email, data.password, data.fullName);
      toast.success('Account created! Please check your email to verify.');
      setIsSignup(false);
    } catch (error) {
      toast.error((error as Error).message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B8C51]/20 via-slate-900 to-slate-950" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(91, 140, 81, 0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <Image
              src="/logo.webp"
              alt="Natural Clinic"
              width={280}
              height={80}
              className="object-contain w-auto h-auto max-h-20"
              priority
            />
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Powerful Email<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7ba373] to-[#5B8C51]">
              Marketing Made Simple
            </span>
          </h2>

          <p className="text-lg text-slate-400 max-w-md">
            Create stunning email campaigns, manage your contacts, and track results - all in one beautiful platform.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#5B8C51]/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-10 w-60 h-60 bg-[#47703f]/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image
              src="/logo.webp"
              alt="Natural Clinic"
              width={200}
              height={60}
              className="object-contain w-auto h-auto max-h-14"
              priority
            />
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-400">
                {isSignup
                  ? 'Start your email marketing journey'
                  : 'Sign in to continue to your dashboard'}
              </p>
            </div>

            {isSignup ? (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-4 h-4" />}
                  error={signupForm.formState.errors.fullName?.message}
                  {...signupForm.register('fullName')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  error={signupForm.formState.errors.password?.message}
                  {...signupForm.register('password')}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  error={signupForm.formState.errors.confirmPassword?.message}
                  {...signupForm.register('confirmPassword')}
                />
                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />
                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm text-slate-400 hover:text-[#7ba373] transition-colors"
              >
                {isSignup
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

