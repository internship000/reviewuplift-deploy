"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Business } from "@/lib/types"

interface CreateBusinessFormProps {
  isOpen: boolean
  onClose: () => void
  onCreateBusiness: (business: Partial<Business>) => void
}

export default function CreateBusinessForm({ isOpen, onClose, onCreateBusiness }: CreateBusinessFormProps) {
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!businessName.trim()) {
      newErrors.name = "Business name is required"
    }

    if (!businessEmail.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(businessEmail)) {
      newErrors.email = "Email is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const newBusiness: Partial<Business> = {
        id: Math.floor(Math.random() * 1000),
        name: businessName,
        users: 1,
        reviews: 0,
        avgRating: 0,
        status: "pending",
        createdAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }

      onCreateBusiness(newBusiness)
      setIsSubmitting(false)
      resetForm()
      onClose()
    }, 1000)
  }

  const resetForm = () => {
    setBusinessName("")
    setBusinessDescription("")
    setBusinessEmail("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Business</DialogTitle>
          <DialogDescription>Enter the details of the new business to add to the platform.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="business-name" className="required">
              Business Name
            </Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "business-name-error" : undefined}
            />
            {errors.name && (
              <p id="business-name-error" className="text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-email" className="required">
              Business Email
            </Label>
            <Input
              id="business-email"
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="contact@business.com"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "business-email-error" : undefined}
            />
            {errors.email && (
              <p id="business-email-error" className="text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-description">Description</Label>
            <Textarea
              id="business-description"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Brief description of the business"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Business"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
