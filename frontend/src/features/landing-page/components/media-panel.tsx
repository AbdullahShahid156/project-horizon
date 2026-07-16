"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Upload,
  Image,
  FileText,
  Link2,
  Trash2,
  Search,
  X,
} from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "icon" | "video";
  size?: string;
}

interface MediaPanelProps {
  media: MediaItem[];
  onMediaAdd: (item: MediaItem) => void;
  onMediaRemove: (id: string) => void;
  onMediaReorder: (items: MediaItem[]) => void;
  onUrlSelect: (url: string) => void;
}

export function MediaPanel({
  media,
  onMediaAdd,
  onMediaRemove,
  onMediaReorder,
  onUrlSelect,
}: MediaPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = media.findIndex((m) => m.id === active.id);
      const newIndex = media.findIndex((m) => m.id === over.id);

      onMediaReorder(arrayMove(media, oldIndex, newIndex));
    },
    [media, onMediaReorder]
  );

  const handleFileDrop = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        onMediaAdd({
          id: `media-${Date.now()}-${Math.random()}`,
          name: file.name,
          url,
          type: "image",
          size: `${(file.size / 1024).toFixed(1)} KB`,
        });
      });
    },
    [onMediaAdd]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files);
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    onMediaAdd({
      id: `media-${Date.now()}`,
      name: urlInput.split("/").pop() || "External image",
      url: urlInput,
      type: "image",
    });
    setUrlInput("");
  };

  const filteredMedia = media.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stockImages = [
    { id: "stock-1", name: "Abstract gradient", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400", type: "image" as const },
    { id: "stock-2", name: "Mountain landscape", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", type: "image" as const },
    { id: "stock-3", name: "Ocean waves", url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400", type: "image" as const },
    { id: "stock-4", name: "City skyline", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400", type: "image" as const },
    { id: "stock-5", name: "Forest path", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", type: "image" as const },
    { id: "stock-6", name: "Sunset", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400", type: "image" as const },
  ];

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop images here, or{" "}
          <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, GIF, SVG up to 5MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFileDrop(e.target.files);
          }}
        />
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            className="pl-8"
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
          />
        </div>
        <Button size="sm" onClick={handleUrlAdd} disabled={!urlInput.trim()}>
          Add
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search media..."
          className="pl-8"
        />
      </div>

      {/* Uploaded Media */}
      {filteredMedia.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Your Media ({filteredMedia.length})
          </h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredMedia.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredMedia.map((item) => (
                  <MediaSortableItem
                    key={item.id}
                    item={item}
                    onRemove={onMediaRemove}
                    onSelect={onUrlSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Stock Images */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          Stock Images
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {stockImages.map((img) => (
            <button
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
              onClick={() => onUrlSelect(img.url)}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Use</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MediaSortableItem({
  item,
  onRemove,
  onSelect,
}: {
  item: MediaItem;
  onRemove: (id: string) => void;
  onSelect: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? "shadow-lg" : ""}>
        <CardContent className="flex items-center gap-2 p-2">
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>

          <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{item.name}</div>
            {item.size && (
              <div className="text-xs text-muted-foreground">{item.size}</div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onSelect(item.url)}
          >
            <Image className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
