"use client";

import React, { useState } from "react";
import { 
  X, 
  Trash2, 
  Edit3, 
  Plus, 
  RotateCcw, 
  Check, 
  Brain, 
  Sparkles, 
  Pin,
  Clock,
  Tag
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { CustomQuickPing, ThoughtCategory } from "@/types";
import { CATEGORY_METADATA } from "@/lib/utils";

interface ManageQuickPingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ["⚡", "📱", "☕", "💡", "💭", "🎮", "🍕", "🔔", "🎧", "🧘", "💬", "🚪", "📦", "😴"];
const DURATION_PRESETS = [0.5, 1, 2, 3, 5, 10, 15];

export function ManageQuickPingsModal({ isOpen, onClose }: ManageQuickPingsModalProps) {
  const { 
    customQuickPings, 
    addCustomQuickPing, 
    updateCustomQuickPing, 
    removeCustomQuickPing, 
    resetQuickPings 
  } = useStudyStore();

  const [editingPingId, setEditingPingId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for edit / create
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<ThoughtCategory>("phone_social");
  const [formMinutes, setFormMinutes] = useState<number>(2);
  const [formIcon, setFormIcon] = useState<string>("⚡");

  if (!isOpen) return null;

  const startEditing = (ping: CustomQuickPing) => {
    setEditingPingId(ping.id);
    setIsCreatingNew(false);
    setFormTitle(ping.title);
    setFormCategory(ping.category);
    setFormMinutes(ping.minutes);
    setFormIcon(ping.icon || "⚡");
  };

  const startCreating = () => {
    setEditingPingId(null);
    setIsCreatingNew(true);
    setFormTitle("");
    setFormCategory("phone_social");
    setFormMinutes(2);
    setFormIcon("💡");
  };

  const cancelForm = () => {
    setEditingPingId(null);
    setIsCreatingNew(false);
    setFormTitle("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const title = formTitle.trim() || CATEGORY_METADATA[formCategory].label;

    if (isCreatingNew) {
      addCustomQuickPing({
        title,
        category: formCategory,
        minutes: formMinutes,
        icon: formIcon,
      });
    } else if (editingPingId) {
      updateCustomQuickPing(editingPingId, {
        title,
        category: formCategory,
        minutes: formMinutes,
        icon: formIcon,
      });
    }

    cancelForm();
  };

  const handleDelete = (id: string) => {
    removeCustomQuickPing(id);
    if (editingPingId === id) {
      cancelForm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[#121215] border border-zinc-800 p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Pin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Manage 1-Tap Mind Pins
              </h2>
              <p className="text-[11px] text-zinc-400">
                Customize, edit, or delete distraction shortcuts on your focus bar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Edit or Create Form (when active) */}
        {(isCreatingNew || editingPingId) && (
          <form onSubmit={handleSave} className="my-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/80 space-y-3.5 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">
                {isCreatingNew ? "Create New 1-Tap Pin" : "Edit 1-Tap Pin"}
              </span>
              <button
                type="button"
                onClick={cancelForm}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>

            {/* Title & Icon */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Pin Title
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {formIcon}
                </span>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Phone WhatsApp, Snack craving..."
                  className="flex-1 py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Select Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormIcon(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all ${
                      formIcon === emoji
                        ? "bg-emerald-500/20 border-emerald-500 text-white"
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Distraction Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(Object.keys(CATEGORY_METADATA) as ThoughtCategory[]).map((cat) => {
                  const meta = CATEGORY_METADATA[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`p-2 rounded-lg text-left border text-xs transition-all flex items-center gap-1.5 ${
                        formCategory === cat
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.bgClass }} />
                      <span className="truncate text-[11px]">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Default Subtracted Duration
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formMinutes === 0.5 ? "30s" : `${formMinutes}m`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormMinutes(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      formMinutes === d
                        ? "bg-emerald-500 text-zinc-950 border-emerald-500 font-black"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {d === 0.5 ? "30s" : `${d}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                {isCreatingNew ? "Add Pin" : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Existing Quick Pings List */}
        <div className="space-y-2 my-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-1">
            <span>Pinned Shortcuts ({customQuickPings.length})</span>
            {!isCreatingNew && !editingPingId && (
              <button
                onClick={startCreating}
                className="text-xs text-emerald-400 hover:underline font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add New Pin</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {customQuickPings.map((ping) => {
              const meta = CATEGORY_METADATA[ping.category] || CATEGORY_METADATA.other;
              const isCurrentlyEditing = editingPingId === ping.id;

              return (
                <div
                  key={ping.id}
                  className={`p-2.5 rounded-xl bg-zinc-900/60 border transition-all flex items-center justify-between gap-3 ${
                    isCurrentlyEditing
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base flex-shrink-0">{ping.icon || "💡"}</span>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-semibold text-zinc-200 truncate">
                        {ping.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <span style={{ color: meta.bgClass }}>{meta.label}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400/90 font-bold">
                          {ping.minutes === 0.5 ? "30s" : `${ping.minutes}m`}
                        </span>
                        {ping.isCustom && (
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[9px] text-zinc-400 border border-zinc-700">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(ping)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                      title="Edit this pin"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ping.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete this pin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Reset & Done */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
          <button
            type="button"
            onClick={resetQuickPings}
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default Pins</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
