'use client';

import { Camera } from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

interface AvatarUploadProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function AvatarUpload({ src, firstName, lastName, onUpload, disabled }: AvatarUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="relative inline-flex">
      <Avatar className="h-20 w-20">
        <AvatarImage src={src ?? undefined} />
        <AvatarFallback className="text-lg">
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      <Button
        size="icon"
        variant="secondary"
        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
        onClick={handleClick}
        disabled={disabled}
        type="button"
        aria-label="Upload avatar"
      >
        <Camera className="h-3.5 w-3.5" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
      />
    </div>
  );
}
