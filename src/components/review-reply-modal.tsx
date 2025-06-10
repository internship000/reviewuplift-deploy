"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Review } from "@/lib/types"

interface ReviewReplyModalProps {
  review: Review | null
  onClose: () => void
  onReply: (reviewId: number, replyText: string) => void
}

export default function ReviewReplyModal({ review, onClose, onReply }: ReviewReplyModalProps) {
  const [replyText, setReplyText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!review) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyText.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      onReply(review.id, replyText)
      setIsSubmitting(false)
      setReplyText("")
      onClose()
    }, 1000)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-labelledby="reply-modal-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 id="reply-modal-title" className="text-lg font-bold mb-4">
          Reply to {review.name}
        </h3>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Original review:</p>
          <p className="text-sm bg-gray-50 p-3 rounded">{review.message}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reply" className="block text-sm font-medium mb-1">
              Your Reply
            </label>
            <Textarea
              id="reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your response here..."
              className="h-32"
              required
              aria-required="true"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !replyText.trim()}>
              {isSubmitting ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
