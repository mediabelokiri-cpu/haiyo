import React from "react";
import {
  BookOpen,
  Camera,
  Coffee,
  Compass,
  Dumbbell,
  Film,
  Gamepad2,
  Headphones,
  Tag,
  Trophy,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTEREST_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  coffee: Coffee,
  music: Headphones,
  travel: Compass,
  gaming: Gamepad2,
  sports: Trophy,
  reading: BookOpen,
  food: Utensils,
  movies: Film,
  photography: Camera,
  fitness: Dumbbell,
};

export function InterestIcon({
  slugOrName,
  className,
}: {
  slugOrName: string;
  className?: string;
}) {
  const normalized = slugOrName.trim().toLowerCase();
  const IconComponent = INTEREST_ICON_MAP[normalized] ?? Tag;
  return <IconComponent className={cn("w-3.5 h-3.5 shrink-0", className)} />;
}
