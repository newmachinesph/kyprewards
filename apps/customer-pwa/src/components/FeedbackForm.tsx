"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { ApiError, answerFeedback } from "@kyprewards/api";
import { BrandMark, Button } from "@kyprewards/ui";
import { Field, FormMessage, Textarea } from "@kyprewards/ui/form";

/**
 * A rating and, if they want, a sentence.
 *
 * Nothing is asked for beyond that - no account, no email, no second screen.
 * Every extra field between the question and the answer costs responses, and
 * the merchant already knows who this is from the id in the link.
 */
export function FeedbackForm({ feedbackId }: { feedbackId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState("");

  async function submit() {
    setSending(true);
    setFailed("");
    try {
      await answerFeedback(feedbackId, { rating, comment: comment.trim() });
      setDone(true);
    } catch (failure) {
      setFailed(
        failure instanceof ApiError
          ? // 409 is "already answered", which is a fine thing to have done.
            failure.message
          : "That did not send. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="phone-shell mx-auto grid min-h-[100dvh] max-w-[460px] place-items-center border-x border-[rgb(24_18_12/8%)] bg-[var(--paper)] px-5 py-10">
      <div className="w-full">
        <BrandMark label="KYP" tagline={null} />
        {done ? (
          <div
            aria-live="polite"
            className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 text-center"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--accent)]">
              <Check size={26} strokeWidth={3} />
            </span>
            <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.02em]">Thank you.</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
              That goes straight to the shop. Nothing else is needed from you.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
            <h1 className="text-2xl font-extrabold tracking-[-0.02em]">
              How was your visit?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
              One question. No account needed.
            </p>
            <div className="mt-7 flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} out of 5`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                  className={`grid size-14 place-items-center rounded-2xl border transition ${
                    value <= rating
                      ? "border-[var(--accent-strong)] bg-[var(--accent)]"
                      : "border-[var(--line-strong)] bg-[var(--paper)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Star
                    size={22}
                    strokeWidth={2.2}
                    className={value <= rating ? "fill-[var(--ink)]" : ""}
                  />
                </button>
              ))}
            </div>
            <Field label="Anything you want to add, optional" className="mt-6">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                maxLength={4000}
              />
            </Field>
            <FormMessage tone="error" className="mt-3">
              {failed}
            </FormMessage>
            <Button size="lg" disabled={rating === 0 || sending} onClick={submit} className="mt-6 w-full">
              {sending ? "Sending…" : rating === 0 ? "Pick a rating" : "Send"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
