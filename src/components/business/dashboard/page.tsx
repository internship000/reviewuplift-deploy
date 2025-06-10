"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { BarChart3, Star, LinkIcon, MessageSquare, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Sidebar from "../../sidebar"
import { auth, db } from "@/firebase/firebase"
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"

interface Review {
  id: string
  name: string
  rating: number
  review: string
  createdAt: { seconds: number }
  status: string
  branchname: string
  replied: boolean
}

const useSubscriptionStatus = () => {
  const navigate = useNavigate()

  const checkSubscription = async (userId: string) => {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) return false

    const userData = userSnap.data()
    const now = new Date()

    // If user has active subscription
    if (userData.subscriptionActive) return true

    // If user is still in trial period
    if (userData.trialEndDate && userData.trialEndDate.toDate() > now) return true

    // Trial expired and no active subscription
    return false
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const hasActiveAccess = await checkSubscription(user.uid)
        if (!hasActiveAccess) {
          navigate("/pricing")
        }
      }
    })

    return () => unsubscribe()
  }, [navigate])
}

export default function BusinessDashboard() {
  const [period, setPeriod] = useState("week")
  const [businessName, setBusinessName] = useState("")
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    linkClicks: 0,
    responseRate: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  })

  const navigate = useNavigate()

  // Check subscription status on component mount
  useSubscriptionStatus()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userRef)

          if (!userDoc.exists()) {
            navigate("/login")
            return
          }

          const userData = userDoc.data()
          const businessData = userData?.businessInfo || {}
          setBusinessName(businessData.businessName || "")

          // Get stats from businessInfo
          setStats((prev) => ({
            ...prev,
            linkClicks: businessData.linkClicks || 0,
            responseRate: businessData.responseRate || 0,
          }))

          // Get reviews from subcollection
          const reviewsQuery = query(collection(db, "users", user.uid, "reviews"))

          const querySnapshot = await getDocs(reviewsQuery)
          const reviewsData: Review[] = []
          let totalRating = 0
          const ratingCounts = [0, 0, 0, 0, 0] // [5-star, 4-star, 3-star, 2-star, 1-star]

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            const createdAt = data.createdAt
            const seconds = createdAt ? createdAt.seconds : 0

            reviewsData.push({
              id: doc.id,
              name: data.name || "Anonymous",
              rating: data.rating || 0,
              review: data.review || data.message || "",
              createdAt: { seconds },
              status: data.status || "pending",
              branchname: data.branchname || "",
              replied: data.replied || false,
            })

            // Update stats
            totalRating += data.rating
            if (data.rating >= 1 && data.rating <= 5) {
              ratingCounts[5 - data.rating]++ // 5-star at index 0, 1-star at index 4
            }
          })

          const totalReviews = reviewsData.length
          const averageRating = totalReviews > 0 ? Number.parseFloat((totalRating / totalReviews).toFixed(1)) : 0

          setReviews(reviewsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds))

          setStats((prev) => ({
            ...prev,
            totalReviews,
            averageRating,
            ratingDistribution: ratingCounts,
          }))
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setLoading(false)
        }
      } else {
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const calculatePercentage = (count: number) => {
    return stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0
  }

  const getStatusBadge = (status: string, replied: boolean) => {
    if (replied) {
      return (
        <span className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
          Replied
        </span>
      )
    }

    switch (status) {
      case "published":
        return (
          <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            Published
          </span>
        )
      case "pending":
        return (
          <span className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            Pending
          </span>
        )
      case "rejected":
        return (
          <span className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            Rejected
          </span>
        )
      default:
        return (
          <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-400"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-orange-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                {businessName ? `Welcome back, ${businessName}` : "Welcome back"}
              </p>
            </div>

            {/* Responsive Tabs */}
            <div className="w-full lg:w-auto">
              <Tabs defaultValue="week" className="w-full" onValueChange={setPeriod}>
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white shadow-md border border-orange-200">
                  <TabsTrigger
                    value="day"
                    className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                  >
                    Day
                  </TabsTrigger>
                  <TabsTrigger
                    value="week"
                    className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                  >
                    Week
                  </TabsTrigger>
                  <TabsTrigger
                    value="month"
                    className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                  >
                    Month
                  </TabsTrigger>
                  <TabsTrigger
                    value="year"
                    className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                  >
                    Year
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Reviews"
              icon={<Star className="h-5 w-5 text-orange-500" />}
              value={stats.totalReviews}
              description="All time reviews"
              gradient="from-blue-100 to-blue-200"
              textColor="text-blue-800"
              iconBg="bg-blue-100"
              delay="0ms"
            />
            <StatCard
              title="Average Rating"
              icon={<BarChart3 className="h-5 w-5 text-orange-500" />}
              value={stats.averageRating}
              description={
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(stats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              }
              gradient="from-emerald-100 to-emerald-200"
              textColor="text-emerald-800"
              iconBg="bg-emerald-100"
              delay="100ms"
            />
            <StatCard
              title="Link Clicks"
              icon={<LinkIcon className="h-5 w-5 text-orange-500" />}
              value={stats.linkClicks}
              description="Total review link clicks"
              gradient="from-purple-100 to-purple-200"
              textColor="text-purple-800"
              iconBg="bg-purple-100"
              delay="200ms"
            />
            <StatCard
              title="Response Rate"
              icon={<MessageSquare className="h-5 w-5 text-orange-500" />}
              value={`${stats.responseRate}%`}
              description="Of reviews responded to"
              gradient="from-orange-100 to-orange-200"
              textColor="text-orange-800"
              iconBg="bg-orange-100"
              delay="300ms"
            />
          </div>

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            {/* Recent Reviews with Scrolling */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <MessageSquare className="h-6 w-6 text-orange-500" />
                      Recent Reviews
                    </CardTitle>
                    <CardDescription className="text-gray-600">Latest customer feedback</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>{reviews.length} total</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Scrollable Reviews Container */}
                <div className="max-h-96 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {reviews.length > 0 ? (
                    reviews.slice(0, 10).map((review, index) => (
                      <div
                        key={review.id}
                        className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-gray-50 to-white animate-slide-up hover:scale-[1.02]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-semibold text-gray-800">{review.name}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500">{formatDate(review.createdAt.seconds)}</div>
                            {getStatusBadge(review.status, review.replied)}
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-3 line-clamp-3">{review.review}</p>
                        {review.branchname && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <p className="text-sm text-gray-600 font-medium">{review.branchname}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
                      <p className="text-gray-400 text-sm">Start collecting reviews to see them here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                  Rating Distribution
                </CardTitle>
                <CardDescription className="text-gray-600">Breakdown of your ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.ratingDistribution.map((count, index) => {
                    const stars = 5 - index
                    const percentage = calculatePercentage(count)

                    return (
                      <div
                        key={stars}
                        className="flex items-center animate-slide-right hover:scale-105 transition-transform duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-16 flex items-center">
                          <span className="font-semibold text-gray-700">{stars}</span>
                          <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                              style={{
                                width: `${percentage}%`,
                                animationDelay: `${index * 200}ms`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-sm font-semibold text-gray-700">{count}</span>
                          <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  icon,
  value,
  description,
  gradient,
  textColor,
  iconBg,
  delay,
}: {
  title: string
  icon: React.ReactNode
  value: string | number
  description: React.ReactNode
  gradient: string
  textColor: string
  iconBg: string
  delay: string
}) {
  return (
    <Card
      className={`bg-gradient-to-br ${gradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up`}
      style={{ animationDelay: delay }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-semibold ${textColor}`}>{title}</CardTitle>
        <div className={`p-2 ${iconBg} rounded-lg shadow-md`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl md:text-3xl font-bold ${textColor} mb-2`}>{value}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </CardContent>
    </Card>
  )
}
