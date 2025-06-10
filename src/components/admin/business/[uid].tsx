"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Star, FileText, Mail, Phone, Globe, MapPin, Link
} from "lucide-react"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { format } from "date-fns"
import { useNavigate, useParams } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"

interface Branch {
  name: string;
  location: string;
  googleReviewLink?: string;
}

interface BusinessInfo {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  secondaryEmail: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  website: string;
  description: string;
  businessType: string;
  branchCount: string;
  customBusinessType: string;
  googleReviewLink: string;
  branches: Branch[]; // Updated to include googleReviewLink
  lastUpdated: any;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionEndDate?: any;
}

interface BusinessDetails {
  businessInfo: BusinessInfo | null;
  displayName: string;
  email: string;
  uid: string;
  createdAt: Date;
  rating: number;
  reviewCount: number;
  status: string;
}

export default function BusinessDetailsPage() {
  const { uid } = useParams()
  const router = useNavigate()
  const [business, setBusiness] = useState<BusinessDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        if (!uid) return

        const userDocRef = doc(db, "users", uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const businessInfo = userData.businessInfo || null

          const reviewsCollection = collection(db, "users", userDoc.id, "reviews")
          const reviewsSnapshot = await getDocs(reviewsCollection)

          let totalRating = 0
          let reviewCount = 0

          reviewsSnapshot.forEach(reviewDoc => {
            const reviewData = reviewDoc.data()
            totalRating += reviewData.rating || 0
            reviewCount++
          })

          const averageRating = reviewCount > 0
            ? parseFloat((totalRating / reviewCount).toFixed(1))
            : 0

          setBusiness({
            businessInfo,
            displayName: userData.displayName || "Unknown Owner",
            email: userData.email || "No email",
            uid: userDoc.id,
            createdAt: userData.createdAt?.toDate?.() || new Date(),
            rating: averageRating,
            reviewCount,
            status: userData.status || "Pending"
          })
        } else {
          setBusiness(null)
        }
      } catch (error) {
        console.error("Error fetching business details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessDetails()
  }, [uid])

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Premium": return "bg-purple-100 text-purple-800"
      case "Pro": return "bg-blue-100 text-blue-800"
      case "Basic": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const goBack = () => {
    if (window.history.length > 1) {
      router(-1)
    } else {
      router("components/admin/businesses") // fallback
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!business || !business.businessInfo) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="outline" onClick={goBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Businesses
        </Button>
        <p>No business details available.</p>
      </div>
    )
  }

  const info = business.businessInfo

  return (
    <div className="container mx-auto p-6">
      <Button variant="outline" onClick={goBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Businesses
      </Button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{info.businessName}</h1>
          <div className="flex items-center mt-2">
            <Badge className="text-sm bg-orange-100 text-orange-800">{info.businessType}</Badge>
            <Badge className="ml-2 text-sm bg-green-100 text-green-800">
              <FileText className="h-4 w-4 mr-1" /> Form Submitted
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-500">Business Name</span>
                  <span className="font-medium">{info.businessName}</span>
                </div>
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium max-w-[70%] text-right">
                    {info.description || "No description"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-500">Google Review</span>
                  <span className="font-medium text-blue-600 hover:underline">
                    {info.googleReviewLink ? (
                      <a href={info.googleReviewLink} target="_blank" rel="noopener noreferrer">
                        View Reviews
                      </a>
                    ) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium">
                    {info.lastUpdated ? format(info.lastUpdated.toDate(), "MMM d, yyyy") : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-orange-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Primary Contact</h3>
                  <p><Mail className="inline h-4 w-4 mr-1" /> {info.contactEmail}</p>
                  <p><Phone className="inline h-4 w-4 mr-1" /> {info.contactPhone}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Secondary Contact</h3>
                  <p><Mail className="inline h-4 w-4 mr-1" /> {info.secondaryEmail || "N/A"}</p>
                  <p><Globe className="inline h-4 w-4 mr-1" /> {info.website || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branches */}
          {info.branches?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                   Branch Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {info.branches.map((branch, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-lg">{branch.name}</strong>
                          <p className="text-gray-600">{branch.location}</p>
                        </div>
                        {branch.googleReviewLink && (
                          <a 
                            href={branch.googleReviewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            <Link className="h-4 w-4 mr-1" />
                            Google Reviews
                          </a>
                        )}
                      </div>
                      {branch.googleReviewLink ? (
                        <div className="mt-2 text-sm">
                          <a 
                            href={branch.googleReviewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate block"
                          >
                            {branch.googleReviewLink}
                          </a>
                        </div>
                      ) : (
                        <div className="mt-2 text-gray-500 italic">
                          No Google Review Link added for this branch
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Star className="h-5 w-5 mr-2 text-orange-600" />
                Subscription Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                <Badge className={getPlanColor(info.subscriptionPlan || "None")}>
                  {info.subscriptionPlan || "None"}
                </Badge>
              </p>
              <p>
                Status:{" "}
                <Badge className={
                  info.subscriptionStatus === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }>
                  {info.subscriptionStatus || "Inactive"}
                </Badge>
              </p>
              {info.subscriptionEndDate && (
                <p className="mt-2">Renewal: {format(info.subscriptionEndDate.toDate(), "MMM d, yyyy")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                <span>
                  {business.rating} ⭐ ({business.reviewCount} reviews)
                </span>
              </div>
              <p className="mt-2">Status: {business.status}</p>
              <p className="mt-2">Owner: {business.displayName}</p>
              <p className="mt-2">Joined: {format(business.createdAt, "MMM d, yyyy")}</p>
              <p className="mt-2">Branches: {info.branches?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}