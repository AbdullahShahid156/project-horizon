"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;

  useEffect(() => {
    router.replace(`/content-studio/${contentId}/editor`);
  }, [contentId, router]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
