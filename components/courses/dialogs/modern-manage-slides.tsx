"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Layers,
  ImageIcon,
  Code,
  Type,
  Eye,
  Copy,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ISlide } from "@/types/slide";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ModernManageSlidesProps {
  courseId: string;
  slides: ISlide[];
  onCreateSlide?: () => void;
  onEditSlide?: (slide: ISlide) => void;
  onDeleteSlide?: (slide: ISlide) => void;
}

export function ModernManageSlides({
  courseId,
  slides,
  onCreateSlide,
  onEditSlide,
  onDeleteSlide,
}: ModernManageSlidesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "with-code" | "with-images">(
    "all"
  );

  const filteredSlides = slides.filter((slide) => {
    const matchesSearch =
      (slide.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (slide.content || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filter === "with-code") {
      matchesFilter = !!(slide.startingCode || slide.solutionCode);
    } else if (filter === "with-images") {
      matchesFilter = !!(slide.imageUrls && slide.imageUrls.length > 0);
    }

    return matchesSearch && matchesFilter;
  });

  const handleEdit = (slide: ISlide) => {
    if (onEditSlide) {
      onEditSlide(slide);
    }
  };

  const handleDelete = (slide: ISlide) => {
    if (onDeleteSlide) {
      onDeleteSlide(slide);
    }
  };

  const handleCreateNew = () => {
    if (onCreateSlide) {
      onCreateSlide();
    }
  };

  const handleDuplicate = (slide: ISlide) => {
    // Handle slide duplication logic here
    console.log("Duplicate slide:", slide);
  };

  const getSlideTypeIcon = (slide: ISlide) => {
    if (slide.startingCode || slide.solutionCode)
      return <Code className="h-4 w-4" />;
    if (slide.imageUrls && slide.imageUrls.length > 0)
      return <ImageIcon className="h-4 w-4" />;
    return <Type className="h-4 w-4" />;
  };

  const getSlideTypeLabel = (slide: ISlide) => {
    if (slide.startingCode || slide.solutionCode) return "Code";
    if (slide.imageUrls && slide.imageUrls.length > 0) return "Image";
    return "Text";
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">
              Course Slides
            </h3>
            <p className="text-muted-foreground">
              Create and manage interactive slides for your course
            </p>
          </div>

          <Button
            onClick={handleCreateNew}
            className="h-10 rounded-full px-5 text-xs font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Slide
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search slides..."
              className="pl-10 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {["all", "with-code", "with-images"].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption as typeof filter)}
                className={cn(
                  "capitalize rounded-full",
                  filter !== filterOption && "border-border/40"
                )}
              >
                {filterOption.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SlideStatCard
            title="Total Slides"
            value={slides.length.toString()}
            icon={Layers}
            iconClass="text-primary bg-primary/10"
          />
          <SlideStatCard
            title="Code Slides"
            value={slides
              .filter((s) => s.startingCode || s.solutionCode)
              .length.toString()}
            icon={Code}
            iconClass="text-secondary bg-secondary/10"
          />
          <SlideStatCard
            title="Image Slides"
            value={slides
              .filter((s) => s.imageUrls && s.imageUrls.length > 0)
              .length.toString()}
            icon={ImageIcon}
            iconClass="text-primary bg-muted/40"
          />
        </div>
      </div>

      {/* Slides Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        <AnimatePresence>
          {filteredSlides.map((slide, index) => (
            <motion.div
              key={(slide as any)._id?.toString?.() || slide.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              layout
            >
              <ModernSlideCard
                slide={slide}
                onEdit={() => handleEdit(slide)}
                onDelete={() => handleDelete(slide)}
                onDuplicate={() => handleDuplicate(slide)}
                getSlideTypeIcon={getSlideTypeIcon}
                getSlideTypeLabel={getSlideTypeLabel}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredSlides.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">
            No slides found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first slide to get started"}
          </p>
          <Button
            onClick={handleCreateNew}
            className="h-10 rounded-full px-5 text-xs font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Slide
          </Button>
        </motion.div>
      )}
    </div>
  );
}

interface ModernSlideCardProps {
  slide: ISlide;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  getSlideTypeIcon: (slide: ISlide) => React.ReactNode;
  getSlideTypeLabel: (slide: ISlide) => string;
}

function ModernSlideCard({
  slide,
  onEdit,
  onDelete,
  onDuplicate,
  getSlideTypeIcon,
  getSlideTypeLabel,
}: ModernSlideCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/70 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Preview */}
      {slide.imageUrls && slide.imageUrls.length > 0 && (
        <div className="relative w-full h-40 bg-muted/20 flex items-center justify-center overflow-hidden border-b border-border/40">
          <img
            src={slide.imageUrls[0]}
            alt={slide.title}
            className="object-cover w-full h-full"
          />
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-none shadow transition-all"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 bg-black/70 hover:bg-red-600/90 text-white border-none shadow transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Slide Preview */}
      {!(slide.imageUrls && slide.imageUrls.length > 0) && (
        <div
          className="relative h-32 overflow-hidden"
          style={{
            backgroundColor: slide.backgroundColor || "#ffffff",
          }}
        >
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className="flex items-center gap-1 rounded-full border-border/40 bg-muted/30 text-xs"
            >
              {getSlideTypeIcon(slide)}
              {getSlideTypeLabel(slide)}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-none shadow transition-all"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 bg-black/70 hover:bg-red-600/90 text-white border-none shadow transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative p-4 space-y-3">
        <div className="space-y-1">
          <h4 className="font-medium line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {slide.title}
          </h4>
          {slide.content && (
            <p className="text-muted-foreground text-xs line-clamp-2">
              {slide.content}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="flex items-center gap-2 text-xs">
          {(slide.startingCode || slide.solutionCode) && (
            <Badge variant="outline" className="flex items-center gap-1 rounded-full border-border/40 bg-muted/30">
              <Code className="h-3 w-3" />
              Interactive
            </Badge>
          )}
          {slide.imageUrls && slide.imageUrls.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 rounded-full border-border/40 bg-muted/30">
              <ImageIcon className="h-3 w-3" />
              Media
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
          Updated {formatRelativeTime(slide.updatedAt)}
        </div>
      </div>
    </Card>
  );
}

interface SlideStatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}

function SlideStatCard({ title, value, icon: Icon, iconClass }: SlideStatCardProps) {
  return (
    <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/60">
      <div className="p-5">
        <div
          className={cn(
            "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
            iconClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </Card>
  );
}
