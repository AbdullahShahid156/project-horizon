"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { emailStudioService, type EmailTemplate } from "@/services/email-studio";
import {
  ArrowLeft,
  Search,
  Plus,
  Eye,
  Trash2,
  Layout,
  Mail,
  Briefcase,
  ShoppingCart,
  Rocket,
  Building2,
  GraduationCap,
} from "lucide-react";

const CATEGORIES = [
  { value: "business", label: "Business", icon: Briefcase },
  { value: "ecommerce", label: "E-commerce", icon: ShoppingCart },
  { value: "saas", label: "SaaS", icon: Rocket },
  { value: "startup", label: "Startup", icon: Layout },
  { value: "agency", label: "Agency", icon: Building2 },
  { value: "education", label: "Education", icon: GraduationCap },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await emailStudioService.listTemplates("ws-default", {
        search,
        category: category || undefined,
      });
      setTemplates(data ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, category, addToast]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleUseTemplate = async (template: EmailTemplate) => {
    try {
      await emailStudioService.useTemplate(template.id);
      router.push(`/email-studio/create?templateId=${template.id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to use template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await emailStudioService.deleteTemplate(templateId);
      addToast({ title: "Template deleted" });
      fetchTemplates();
      setSelectedTemplate(null);
    } catch {
      addToast({ title: "Error", description: "Cannot delete system template", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground mt-1">Choose from pre-built templates or create your own</p>
          </div>
        </div>
        <Button onClick={() => router.push("/email-studio/create")}><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={category === "" ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategory("")}>All</Badge>
          {CATEGORIES.map((c) => (
            <Badge key={c.value} variant={category === c.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategory(c.value)}>
              <c.icon className="mr-1 h-3 w-3" /> {c.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`group hover:shadow-md transition-shadow cursor-pointer ${selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="h-32 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 p-4 text-xs text-muted-foreground/50 font-mono overflow-hidden">
                      <div dangerouslySetInnerHTML={{ __html: (template.html_content ?? "").slice(0, 300) }} />
                    </div>
                    {template.is_system && (
                      <Badge className="absolute top-2 right-2" variant="secondary">System</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{template.description || template.subject}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                      <Badge variant="secondary" className="text-xs">{template.email_type}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">Used {template.usage_count}x</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <Badge variant="outline">{selectedTemplate.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedTemplate.description || "No description"}</p>
                <div>
                  <p className="text-sm font-medium mb-1">Subject</p>
                  <p className="text-sm">{selectedTemplate.subject}</p>
                </div>
                {selectedTemplate.preview_text && (
                  <div>
                    <p className="text-sm font-medium mb-1">Preview Text</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.preview_text}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Preview</p>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-2 flex gap-2 border-b">
                      <Button variant={previewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("desktop")}>Desktop</Button>
                      <Button variant={previewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("mobile")}>Mobile</Button>
                    </div>
                    <div className={`bg-white ${previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""}`}>
                      <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content ?? "" }} />
                    </div>
                  </div>
                </div>
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.variables.map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleUseTemplate(selectedTemplate)}>Use Template</Button>
                  {!selectedTemplate.is_system && (
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(selectedTemplate.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a template to preview</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
