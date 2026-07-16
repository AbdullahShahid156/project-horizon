'use client';

import { Check, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: ['1 project', 'Basic templates', 'Community support', '1GB storage'],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Starter',
    price: '$29',
    description: 'For small businesses',
    features: ['10 projects', 'All templates', 'Email support', '10GB storage', 'Custom domain'],
    cta: 'Upgrade',
    popular: true,
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'For growing teams',
    features: ['Unlimited projects', 'All templates', 'Priority support', '100GB storage', 'Custom domains', 'Team collaboration'],
    cta: 'Upgrade',
    popular: false,
  },
];

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are currently on the Free plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-xl border p-6',
                  plan.popular && 'border-primary shadow-sm',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={plan.name === 'Free'}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment methods.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No payment method on file. You will be prompted to add one when you upgrade your plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
