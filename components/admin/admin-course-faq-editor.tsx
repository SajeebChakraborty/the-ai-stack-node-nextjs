"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type FaqFormRow = {
  key: string;
  question: string;
  answer: string;
};

function newKey() {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPersistedKey(key: string) {
  return !key.startsWith("k-");
}

export function emptyFaq(): FaqFormRow {
  return {
    key: newKey(),
    question: "",
    answer: ""
  };
}

export function parseFaqsFromApi(faqs: unknown): FaqFormRow[] {
  if (!Array.isArray(faqs) || faqs.length === 0) {
    return [emptyFaq()];
  }

  return faqs.map((raw) => {
    const faq = raw as { id?: string; question?: string; answer?: string };
    return {
      key: faq.id ? String(faq.id) : newKey(),
      question: String(faq.question ?? ""),
      answer: String(faq.answer ?? "")
    };
  });
}

export function faqsToApiPayload(faqs: FaqFormRow[]) {
  return faqs
    .map((faq, index) => ({
      ...(isPersistedKey(faq.key) ? { id: faq.key } : {}),
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      sortOrder: index
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
}

type Props = {
  faqs: FaqFormRow[];
  onChange: (faqs: FaqFormRow[]) => void;
};

export function AdminCourseFaqEditor({ faqs, onChange }: Props) {
  function updateFaq(faqKey: string, patch: Partial<FaqFormRow>) {
    onChange(faqs.map((faq) => (faq.key === faqKey ? { ...faq, ...patch } : faq)));
  }

  function removeFaq(faqKey: string) {
    const next = faqs.filter((faq) => faq.key !== faqKey);
    onChange(next.length ? next : [emptyFaq()]);
  }

  function addFaq() {
    onChange([...faqs, emptyFaq()]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">FAQ</p>
          <p className="text-xs text-muted-foreground">Common questions shown on the course detail page.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addFaq}>
          <Plus className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      {faqs.map((faq, index) => (
        <div key={faq.key} className="space-y-3 rounded-lg border bg-secondary/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">FAQ {index + 1}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => removeFaq(faq.key)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={`faq-question-${faq.key}`}>
              Question
            </label>
            <Input
              id={`faq-question-${faq.key}`}
              placeholder="Do I need to code?"
              value={faq.question}
              onChange={(e) => updateFaq(faq.key, { question: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={`faq-answer-${faq.key}`}>
              Answer
            </label>
            <Textarea
              id={`faq-answer-${faq.key}`}
              placeholder="No. This course is designed for non-technical builders."
              rows={3}
              value={faq.answer}
              onChange={(e) => updateFaq(faq.key, { answer: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
