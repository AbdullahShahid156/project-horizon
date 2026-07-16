"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Layout, Loader2 } from "lucide-react";
import { templatesService } from "@/services/landing-pages";
import type { Template } from "@/types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await templatesService.list();
        setTemplates(data ?? []);
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUseTemplate = (template: Template) => {
    router.push(`/landing-pages/create?template=${template.slug}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/landing-pages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Start with a pre-built template and customize it.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, i) => (
            <motion.div
              key={template.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Layout className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardTitle className="mt-4">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {(template.content?.sections as string[] || ["hero", "features", "pricing", "faq"]).map(
                      (section) => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      )
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
