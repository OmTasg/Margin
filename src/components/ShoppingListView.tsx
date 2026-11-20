"use client";

import React, { useState, useRef, useMemo } from "react";
import { Task } from "@/lib/types";
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  ListPlus,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Edit2,
  CheckCircle2,
} from "lucide-react";

interface Props {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onAddItem: (title: string, notes?: string) => Promise<any>;
  onAddBatch: (titles: string[]) => Promise<any>;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  showToast: (
    type: "success" | "error" | "info",
    message: string,
    action?: { label: string; onClick: () => void }
  ) => void;
}

export function ShoppingListView({
  tasks,
  onToggleComplete,
  onAddItem,
  onAddBatch,
  onDelete,
  onClearCompleted,
  onUpdateTitle,
  showToast,
}: Props) {
  const [quickInput, setQuickInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultiImportOpen, setIsMultiImportOpen] = useState(false);
  const [multiImportText, setMultiImportText] = useState("");
  const [isCrossedOutExpanded, setIsCrossedOutExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter shopping items
  const shoppingItems = useMemo(() => {
    return tasks.filter((t) => t.category === "shopping");
  }, [tasks]);

  const activeItems = useMemo(() => {
    return shoppingItems.filter((t) => !t.is_completed);
  }, [shoppingItems]);

  const completedItems = useMemo(() => {
    return shoppingItems.filter((t) => t.is_completed);
  }, [shoppingItems]);

  // Parse multi-import text into clean items (splits by comma and newline)
  const parsedMultiItems = useMemo(() => {
    if (!multiImportText.trim()) return [];
    return multiImportText
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [multiImportText]);

  // Handle single item quick-add
  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = quickInput.trim();
    if (!trimmed || isSubmitting) return;

    // Check if user accidentally pasted comma-separated items into the single input
    if (trimmed.includes(",") || trimmed.includes("\n")) {
      const items = trimmed
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (items.length > 1) {
        setIsSubmitting(true);
        try {
          await onAddBatch(items);
          setQuickInput("");
          showToast("success", `Added ${items.length} items to shopping list`);
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onAddItem(trimmed);
      setQuickInput("");
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle multi-import batch submission
  const handleMultiImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedMultiItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const count = parsedMultiItems.length;
      await onAddBatch(parsedMultiItems);
      setMultiImportText("");
      setIsMultiImportOpen(false);
      showToast("success", `Added ${count} items to your shopping list!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline edit handlers
  const startEditing = (item: Task) => {
    setEditingId(item.id);
    setEditingText(item.title);
  };

  const saveEditing = (id: string) => {
    const trimmed = editingText.trim();
    if (trimmed && trimmed !== editingId) {
      onUpdateTitle(id, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                Shopping List
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                {activeItems.length} to buy
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Syncs in real time across your phone and laptop.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsMultiImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition"
          >
            <ListPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Multi-Import</span>
          </button>

          {completedItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
              title="Remove all crossed-out items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Bought</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Add item (e.g. Apples, Oat milk, Sourdough bread)..."
              disabled={isSubmitting}
              className="w-full pl-3.5 pr-20 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
            />
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              Enter ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!quickInput.trim() || isSubmitting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Multi-Import Modal */}
      {isMultiImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Multi-Import Shopping Items
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiImportOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Paste or type your items separated by <strong>commas</strong> or <strong>new lines</strong>. Margin will automatically parse and add every item to your list.
            </p>

            <form onSubmit={handleMultiImportSubmit} className="space-y-3">
              <textarea
                rows={5}
                autoFocus
                value={multiImportText}
                onChange={(e) => setMultiImportText(e.target.value)}
                placeholder="Apples, Whole milk, Sourdough bread, Eggs, Butter, Olive oil, Greek yogurt"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
              />

              {/* Sample Quick-Fill Button */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <button
                  type="button"
                  onClick={() =>
                    setMultiImportText(
                      "Apples, Bananas, Oat milk, Eggs, Sourdough bread, Chicken breast, Olive oil, Spinach"
                    )
                  }
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert sample grocery list</span>
                </button>

                <span className="font-medium text-[11px]">
                  {parsedMultiItems.length} item{parsedMultiItems.length === 1 ? "" : "s"} detected
                </span>
              </div>

              {/* Live Preview Chips */}
              {parsedMultiItems.length > 0 && (
                <div className="max-h-24 overflow-y-auto p-2 bg-zinc-100/60 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-wrap gap-1.5">
                  {parsedMultiItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-800 dark:text-zinc-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMultiImportOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parsedMultiItems.length === 0 || isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  {isSubmitting
                    ? "Adding..."
                    : `Import ${parsedMultiItems.length} Item${parsedMultiItems.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Items ("To Buy") */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            To Buy ({activeItems.length})
          </span>
        </div>

        {activeItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Your shopping list is clear!
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Add individual groceries above or tap <strong>Multi-Import</strong> to paste a recipe or comma-separated ingredients list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-sm overflow-hidden">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {/* Checkbox: 44px hit-target for effortless mobile tapping */}
                <button
                  type="button"
                  onClick={() => onToggleComplete(item.id)}
                  aria-label="Cross out item"
                  className="w-8 h-8 -ml-1 flex items-center justify-center shrink-0 focus:outline-none"
                >
                  <span className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-center transition-all hover:scale-105" />
                </button>

                {/* Item text / Inline edit */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => saveEditing(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing(item.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full py-0.5 px-1.5 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => onToggleComplete(item.id)}
                      className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer select-none leading-snug break-words"
                    >
                      {item.title}
                    </span>
                  )}
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    title="Edit item name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crossed-Out / Bought Items */}
      {completedItems.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setIsCrossedOutExpanded(!isCrossedOutExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 uppercase tracking-wider transition"
            >
              {isCrossedOutExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Crossed Out ({completedItems.length})</span>
            </button>

            <button
              type="button"
              onClick={onClearCompleted}
              className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline transition font-medium"
            >
              Clear all
            </button>
          </div>

          {isCrossedOutExpanded && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-3 px-3.5 py-2.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  {/* Crossed-out checked button */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item.id)}
                    aria-label="Restore item to buy list"
                    className="w-8 h-8 -ml-1 flex items-center justify-center shrink-0 focus:outline-none"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-500 flex items-center justify-center text-white transition-all">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </button>

                  {/* Strikethrough text */}
                  <div
                    onClick={() => onToggleComplete(item.id)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 line-through select-none break-words">
                      {item.title}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
