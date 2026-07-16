"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { imageStudioService, type ImageFolder } from "@/services/image-studio";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  FolderOpen,
  Edit,
  Loader2,
  X,
} from "lucide-react";

const FOLDER_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4"];

export default function FoldersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(FOLDER_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await imageStudioService.listFolders("ws-default");
      setFolders(data ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load folders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const handleCreate = async () => {
    if (!formName.trim()) {
      addToast({ title: "Error", description: "Folder name is required", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      await imageStudioService.createFolder({
        workspace_id: "ws-default",
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        color: formColor,
      });
      addToast({ title: "Folder created" });
      setFormName(""); setFormDesc(""); setFormColor(FOLDER_COLORS[0]);
      setShowCreate(false);
      fetchFolders();
    } catch {
      addToast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (folderId: string) => {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      await imageStudioService.updateFolder(folderId, {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        color: formColor,
      });
      addToast({ title: "Folder updated" });
      setEditingId(null);
      fetchFolders();
    } catch {
      addToast({ title: "Error", description: "Failed to update folder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (folderId: string) => {
    try {
      await imageStudioService.deleteFolder(folderId);
      addToast({ title: "Folder deleted" });
      fetchFolders();
    } catch {
      addToast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    }
  };

  const startEdit = (folder: ImageFolder) => {
    setEditingId(folder.id);
    setFormName(folder.name);
    setFormDesc(folder.description || "");
    setFormColor(folder.color || FOLDER_COLORS[0]);
    setShowCreate(false);
  };

  const cancelAll = () => {
    setShowCreate(false);
    setEditingId(null);
    setFormName(""); setFormDesc(""); setFormColor(FOLDER_COLORS[0]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Folders</h1>
            <p className="text-muted-foreground mt-1">Organize your images into folders</p>
          </div>
        </div>
        <Button onClick={() => { setShowCreate(true); setEditingId(null); }}><Plus className="mr-2 h-4 w-4" /> New Folder</Button>
      </div>

      {(showCreate || editingId) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? "Edit Folder" : "New Folder"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={cancelAll}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input placeholder="Folder name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea placeholder="Optional description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((c) => (
                  <div key={c} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${formColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setFormColor(c)} />
                ))}
              </div>
            </div>
            <Button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()} disabled={saving || !formName.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingId ? "Save Changes" : "Create Folder"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No folders yet</h3>
          <p className="text-muted-foreground mb-4">Create your first folder to organize images</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> New Folder</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <FolderOpen className="h-10 w-10 flex-shrink-0" style={{ color: folder.color || "#6366F1" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{folder.name}</p>
                  {folder.description && <p className="text-sm text-muted-foreground truncate">{folder.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{folder.image_count} images</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(folder)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDelete(folder.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
