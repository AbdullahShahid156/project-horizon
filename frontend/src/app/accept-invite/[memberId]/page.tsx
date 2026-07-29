'use client';

import { useEffect, useState, use } from 'react';
import { Loader2, CheckCircle, XCircle, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { organizationsService } from '@/services/organizations';

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  organizationId: string;
  organizationName: string;
};

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = use(params);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await organizationsService.getInvitation(memberId);
        setInvitation(data);
        setEmail(data.email);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invitation not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId]);

  const handleAccept = async () => {
    if (!invitation || !email.trim()) return;
    setAccepting(true);
    setAcceptError('');
    try {
      await organizationsService.acceptInvitation(invitation.organizationId, memberId, email);
      setAccepted(true);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium text-center">{error}</p>
            <p className="text-sm text-muted-foreground text-center">
              This invitation may have expired or been revoked.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation?.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium text-center">Already Accepted</p>
            <p className="text-sm text-muted-foreground text-center">
              This invitation has already been accepted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium text-center">Welcome to {invitation?.organizationName}!</p>
            <p className="text-sm text-muted-foreground text-center">
              You are now a member. You can close this page and sign in to access the organization.
            </p>
            <Button onClick={() => window.location.href = '/'} className="mt-2">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">You&apos;re Invited!</CardTitle>
          <CardDescription>
            Join <strong>{invitation?.organizationName}</strong> on BuilderWeb
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation?.role}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Confirm your email to accept</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email matches the invitation — click accept below
            </p>
          </div>

          {acceptError && (
            <p className="text-sm text-destructive">{acceptError}</p>
          )}

          <Button
            onClick={handleAccept}
            disabled={accepting || email !== invitation?.email}
            className="w-full"
          >
            {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept Invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
