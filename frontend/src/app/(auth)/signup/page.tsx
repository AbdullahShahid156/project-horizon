'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/layouts';

type Step = 'details' | 'verify';

interface PasswordRule {
  label: string;
  met: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useSignUp();

  const [step, setStep] = useState<Step>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRules: PasswordRule[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passwordStrength = passwordRules.filter((r) => r.met).length;

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (usernameStatus === 'taken') {
      setError('Username is already taken');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordStrength < 5) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    try {
      await signUp.password({
        emailAddress: email,
        password,
        username,
        firstName,
        lastName,
      });

      if (signUp.status === 'missing_requirements') {
        await signUp.verifications.sendEmailCode();
        setStep('verify');
      } else if (signUp.status === 'complete') {
        await signUp.finalize();
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp.verifications.verifyEmailCode({ code: verificationCode });

      if (signUp.status === 'complete') {
        await signUp.finalize();
        router.push('/dashboard');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: 'google' | 'facebook') {
    try {
      await signUp.sso({
        strategy: `oauth_${provider}`,
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/dashboard',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign up with social provider';
      setError(message);
    }
  }

  function getPasswordStrengthColor(): string {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  return (
    <AuthLayout
      title={step === 'details' ? 'Create an account' : 'Verify your email'}
      description={step === 'details' ? 'Get started with your free account.' : `We sent a code to ${email}`}
    >
      {step === 'details' ? (
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium text-foreground/80">First Name</label>
              <Input id="firstName" type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium text-foreground/80">Last Name</label>
              <Input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground/80">Username</label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                minLength={3}
                maxLength={30}
                required
              />
              {username.length >= 3 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {usernameStatus === 'checking' && '...'}
                  {usernameStatus === 'available' && '✓'}
                  {usernameStatus === 'taken' && '✕'}
                </span>
              )}
            </div>
            {usernameStatus === 'taken' && (
              <p className="text-xs text-destructive">This username is already taken</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-xs text-green-500">Username is available</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength ? getPasswordStrengthColor() : 'bg-muted'}`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {passwordRules.map((rule) => (
                    <p key={rule.label} className={`text-xs ${rule.met ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {rule.met ? '✓' : '○'} {rule.label}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">Confirm Password</label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={loading || usernameStatus === 'taken'}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-11" onClick={() => handleSocialLogin('google')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={() => handleSocialLogin('facebook')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-foreground/80">Verification Code</label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your email</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={loading || verificationCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={async () => {
            await signUp.verifications.sendEmailCode();
          }}>
            Resend code
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('details'); setError(''); }}>
            Back to sign up
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
