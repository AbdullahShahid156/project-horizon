"use client";

import { useState, useCallback } from "react";
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
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface Section {
  id: string;
  label: string;
  enabled: boolean;
}

interface SectionReorderProps {
  sections: Section[];
  onReorder: (sections: Section[]) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}

export function SectionReorder({
  sections,
  onReorder,
  onToggle,
  onRemove,
}: SectionReorderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      onReorder(arrayMove(sections, oldIndex, newIndex));
    },
    [sections, onReorder]
  );

  const moveUp = (index: number) => {
    if (index === 0) return;
    onReorder(arrayMove(sections, index, index - 1));
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    onReorder(arrayMove(sections, index, index + 1));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sections.map((section, index) => (
            <SortableItem
              key={section.id}
              section={section}
              index={index}
              total={sections.length}
              onToggle={onToggle}
              onRemove={onRemove}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  section,
  index,
  total,
  onToggle,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: Section;
  index: number;
  total: number;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? "shadow-lg" : ""}>
        <CardContent className="flex items-center gap-2 p-3">
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex-1">
            <span className="text-sm font-medium">{section.label}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === total - 1}
              onClick={() => onMoveDown(index)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>

            <div
              className={`ml-2 h-5 w-9 cursor-pointer rounded-full transition-colors ${
                section.enabled ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => onToggle(section.id, !section.enabled)}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  section.enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onRemove(section.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
