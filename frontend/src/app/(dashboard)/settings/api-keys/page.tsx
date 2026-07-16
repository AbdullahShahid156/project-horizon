'use client';

import { Copy, Key, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';

const mockApiKeys = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'bw_prod_xxxxxxxxxxxxx',
    createdAt: new Date('2024-01-15'),
    lastUsed: new Date('2024-07-10'),
  },
  {
    id: '2',
    name: 'Development API Key',
    key: 'bw_dev_xxxxxxxxxxxxx',
    createdAt: new Date('2024-03-20'),
    lastUsed: new Date('2024-07-12'),
  },
];

export default function ApiKeysSettingsPage() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access.
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mockApiKeys.length > 0 ? (
            <div className="space-y-4">
              {mockApiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{apiKey.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {apiKey.key.slice(0, 20)}...
                      </code>
                      <span>Created {formatDate(apiKey.createdAt)}</span>
                      <span>Last used {formatDate(apiKey.lastUsed)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      aria-label="Copy API key"
                    >
                      {copiedId === apiKey.id ? (
                        <span className="text-xs text-primary">Copied!</span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Delete API key">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Key className="h-12 w-12" />}
              title="No API keys"
              description="Create your first API key to get started."
              action={
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create API Key
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
