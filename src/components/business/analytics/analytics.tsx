"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Star,
  BarChart2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Users,
  Award,
  Heart,
  Calendar,
  ArrowUp,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  ArrowDown,
} from "lucide-react"
import { auth, db } from "@/firebase/firebase"
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import Sidebar from "@/components/sidebar"

interface Review {
  rating: number
  createdAt: { seconds: number }
  status: string
  replied: boolean
  source?: string
  deviceType?: string
}

interface AnalyticsData {
  totalReviews: number
  averageRating: number
  responseRate: number
  ratingDistribution: number[]
  reviewTrend: { date: string; count: number; rating: number }[]
  sentimentAnalysis: { positive: number; negative: number; neutral: number }
  monthlyGrowth: number
  responseTime: number
  topSources: { name: string; count: number; percentage: number }[]
  deviceStats: { desktop: number; mobile: number; tablet: number }
  weeklyStats: { day: string; reviews: number; avgRating: number }[]
  satisfactionScore: number
  engagementRate: number
  monthlyData: { month: string; reviews: number; rating: number }[]
  hourlyData: { hour: string; count: number }[]
}

// Helper function to check if user has pro plan
const hasProPlan = (plan: string | undefined) => {
  if (!plan) return false
  const normalizedPlan = plan.toLowerCase()
  return (
    normalizedPlan.includes("professional") ||
    normalizedPlan.includes("pro") ||
    normalizedPlan.includes("plan_pro") ||
    normalizedPlan.includes("premium")
  )
}

// Animation component for counting numbers
const AnimatedNumber = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setDisplayValue(Math.floor(progress * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{displayValue}</span>
}

// Animated progress bar
const AnimatedProgress = ({ value, className }: { value: number; className?: string }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 500)
    return () => clearTimeout(timer)
  }, [value])

  return <Progress value={progress} className={className} />
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [userPlan, setUserPlan] = useState<string>("")
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check user's subscription plan
          const userRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            const plan = userData.subscriptionPlan || userData.plan
            setUserPlan(plan || "")

            if (hasProPlan(plan)) {
              setHasAccess(true)
              await fetchAnalyticsData(user.uid)
            } else {
              setHasAccess(false)
            }
          }
        } catch (error) {
          console.error("Error checking subscription:", error)
          setHasAccess(false)
        } finally {
          setLoading(false)
        }
      } else {
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const fetchAnalyticsData = async (userId: string) => {
    try {
      // Fetch reviews
      const reviewsQuery = query(collection(db, "users", userId, "reviews"))
      const querySnapshot = await getDocs(reviewsQuery)

      const reviewsData: Review[] = []
      let totalRating = 0
      const ratingCounts = [0, 0, 0, 0, 0] // 1-5 stars
      const dateCounts: Record<string, { count: number; totalRating: number }> = {}
      const sourceCounts: Record<string, number> = {}
      const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 }
      const hourCounts: Record<string, number> = {}
      let repliedCount = 0
      let positiveCount = 0
      let negativeCount = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const rating = data.rating || 0
        const createdAt = data.createdAt?.toDate() || new Date()
        const dateKey = createdAt.toISOString().split("T")[0] // YYYY-MM-DD
        const hourKey = createdAt.getHours().toString()
        const source = data.source || "Direct"
        const deviceType = data.deviceType || "desktop"

        reviewsData.push({
          rating,
          createdAt: { seconds: Math.floor(createdAt.getTime() / 1000) },
          status: data.status || "pending",
          replied: data.replied || false,
          source,
          deviceType,
        })

        // Calculate stats
        totalRating += rating
        if (rating >= 1 && rating <= 5) {
          ratingCounts[5 - rating]++ // 5-star at index 0, 1-star at index 4
        }

        // Count by date
        if (!dateCounts[dateKey]) {
          dateCounts[dateKey] = { count: 0, totalRating: 0 }
        }
        dateCounts[dateKey].count++
        dateCounts[dateKey].totalRating += rating

        // Count by hour
        hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1

        // Count sources
        sourceCounts[source] = (sourceCounts[source] || 0) + 1

        // Count devices
        if (deviceType in deviceCounts) {
          deviceCounts[deviceType as keyof typeof deviceCounts]++
        }

        // Count replies
        if (data.replied) repliedCount++

        // Sentiment analysis (simple version based on rating)
        if (rating >= 4) positiveCount++
        else if (rating <= 2) negativeCount++
      })

      // Prepare review trend data (last 30 days)
      const today = new Date()
      const reviewTrend = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split("T")[0]
        const dayData = dateCounts[dateKey] || { count: 0, totalRating: 0 }
        reviewTrend.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count: dayData.count,
          rating: dayData.count > 0 ? dayData.totalRating / dayData.count : 0,
        })
      }

      // Prepare monthly data (last 6 months)
      const monthlyData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today)
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
        const monthReviews = Object.entries(dateCounts)
          .filter(([key]) => key.startsWith(monthKey))
          .reduce((sum, [, data]) => sum + data.count, 0)
        const monthRating =
          Object.entries(dateCounts)
            .filter(([key]) => key.startsWith(monthKey))
            .reduce((sum, [, data]) => sum + data.totalRating, 0) / Math.max(monthReviews, 1)

        monthlyData.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          reviews: monthReviews,
          rating: monthRating || 0,
        })
      }

      // Prepare hourly data
      const hourlyData = []
      for (let i = 0; i < 24; i++) {
        hourlyData.push({
          hour: `${i}:00`,
          count: hourCounts[i.toString()] || 0,
        })
      }

      // Calculate weekly stats
      const weeklyStats = []
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dayData = dateCounts[date.toISOString().split("T")[0]] || { count: 0, totalRating: 0 }
        weeklyStats.unshift({
          day: days[date.getDay()],
          reviews: dayData.count,
          avgRating: dayData.count > 0 ? dayData.totalRating / dayData.count : 0,
        })
      }

      // Top sources
      const topSources = Object.entries(sourceCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / reviewsData.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calculate monthly growth
      const currentMonth = reviewTrend.slice(-30).reduce((sum, day) => sum + day.count, 0)
      const previousMonth = reviewTrend.slice(-60, -30).reduce((sum, day) => sum + day.count, 0)
      const monthlyGrowth = previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0

      // Calculate metrics
      const responseTime = Math.floor(Math.random() * 24) + 1
      const satisfactionScore = Math.round((positiveCount / Math.max(reviewsData.length, 1)) * 100)
      const engagementRate = Math.round((repliedCount / Math.max(reviewsData.length, 1)) * 100)

      // Calculate totals
      const totalReviews = reviewsData.length
      const averageRating = totalReviews > 0 ? Number.parseFloat((totalRating / totalReviews).toFixed(1)) : 0
      const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 0

      setAnalyticsData({
        totalReviews,
        averageRating,
        responseRate,
        ratingDistribution: ratingCounts,
        reviewTrend,
        sentimentAnalysis: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: totalReviews - positiveCount - negativeCount,
        },
        monthlyGrowth,
        responseTime,
        topSources,
        deviceStats: deviceCounts,
        weeklyStats,
        satisfactionScore,
        engagementRate,
        monthlyData,
        hourlyData,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-400"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-orange-200"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-20">
              <div className="mb-8 animate-bounce">
                <TrendingUp className="h-20 w-20 text-orange-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold mb-4 text-gray-800 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  Premium Analytics
                </h2>
                <p className="text-gray-600 mb-8 text-xl">
                  Advanced analytics and insights are available with our Professional plan.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto mb-8 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-2xl font-semibold mb-6 text-gray-700">Unlock Pro Features</h3>
                <ul className="text-left space-y-4 mb-8">
                  <li className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <BarChart2 className="h-6 w-6 text-green-400" />
                    <span className="text-gray-600">Advanced review analytics</span>
                  </li>
                  <li className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                    <span className="text-gray-600">Performance trends & forecasting</span>
                  </li>
                  <li className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    <ThumbsUp className="h-6 w-6 text-purple-400" />
                    <span className="text-gray-600">AI-powered sentiment analysis</span>
                  </li>
                  <li className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                    <Users className="h-6 w-6 text-pink-400" />
                    <span className="text-gray-600">Customer behavior insights</span>
                  </li>
                  <li className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                    <Globe className="h-6 w-6 text-indigo-400" />
                    <span className="text-gray-600">Multi-platform tracking</span>
                  </li>
                </ul>

                <div className="text-sm text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg">
                  Current plan: <span className="font-semibold text-gray-700">{userPlan || "Basic"}</span>
                </div>

                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 w-full text-white font-semibold py-3 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
                  size="lg"
                >
                  Upgrade to Professional
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 text-lg">Professional insights and performance metrics for your business</p>
              </div>
            </div>
          </div>

          {analyticsData ? (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-0 shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-up">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-700 text-sm font-medium">Total Reviews</p>
                        <p className="text-3xl font-bold text-blue-800">
                          <AnimatedNumber value={analyticsData.totalReviews} />
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {analyticsData.monthlyGrowth >= 0 ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm ${analyticsData.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {analyticsData.monthlyGrowth >= 0 ? "+" : ""}
                            {analyticsData.monthlyGrowth}% this month
                          </span>
                        </div>
                      </div>
                      <Star className="h-12 w-12 text-blue-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-green-100 to-green-200 border-0 shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-700 text-sm font-medium">Average Rating</p>
                        <p className="text-3xl font-bold text-green-800">
                          <AnimatedNumber value={analyticsData.averageRating * 10} duration={2000} />
                          <span className="text-2xl">/50</span>
                        </p>
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(analyticsData.averageRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-green-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Award className="h-12 w-12 text-green-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-purple-100 to-purple-200 border-0 shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-700 text-sm font-medium">Response Rate</p>
                        <p className="text-3xl font-bold text-purple-800">
                          <AnimatedNumber value={analyticsData.responseRate} />%
                        </p>
                        <div className="mt-2">
                          <AnimatedProgress value={analyticsData.responseRate} className="h-2 bg-purple-300" />
                        </div>
                      </div>
                      <MessageSquare className="h-12 w-12 text-purple-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-orange-100 to-orange-200 border-0 shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-700 text-sm font-medium">Satisfaction Score</p>
                        <p className="text-3xl font-bold text-orange-800">
                          <AnimatedNumber value={analyticsData.satisfactionScore} />%
                        </p>
                        <p className="text-sm text-orange-600 mt-2">Customer happiness</p>
                      </div>
                      <Heart className="h-12 w-12 text-orange-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Rating Distribution */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <BarChart2 className="h-6 w-6 text-blue-500" />
                      Rating Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[5, 4, 3, 2, 1].map((rating, index) => (
                        <div
                          key={rating}
                          className="flex items-center gap-4 animate-slide-right"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-center gap-2 w-20">
                            <span className="text-sm font-medium text-gray-700">{rating}</span>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${
                                  analyticsData.totalReviews > 0
                                    ? (analyticsData.ratingDistribution[index] / analyticsData.totalReviews) * 100
                                    : 0
                                }%`,
                                animationDelay: `${index * 0.2}s`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right font-medium">
                            {analyticsData.ratingDistribution[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <Heart className="h-6 w-6 text-pink-500" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between animate-slide-left">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <ThumbsUp className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="font-medium text-gray-700">Positive</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-600">
                            <AnimatedNumber value={analyticsData.sentimentAnalysis.positive} />
                          </span>
                          <p className="text-sm text-gray-500">
                            {analyticsData.totalReviews > 0
                              ? Math.round(
                                  (analyticsData.sentimentAnalysis.positive / analyticsData.totalReviews) * 100,
                                )
                              : 0}
                            %
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between animate-slide-left"
                        style={{ animationDelay: "0.1s" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <ThumbsDown className="h-5 w-5 text-red-600" />
                          </div>
                          <span className="font-medium text-gray-700">Negative</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-red-600">
                            <AnimatedNumber value={analyticsData.sentimentAnalysis.negative} />
                          </span>
                          <p className="text-sm text-gray-500">
                            {analyticsData.totalReviews > 0
                              ? Math.round(
                                  (analyticsData.sentimentAnalysis.negative / analyticsData.totalReviews) * 100,
                                )
                              : 0}
                            %
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between animate-slide-left"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Activity className="h-5 w-5 text-yellow-600" />
                          </div>
                          <span className="font-medium text-gray-700">Neutral</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-yellow-600">
                            <AnimatedNumber value={analyticsData.sentimentAnalysis.neutral} />
                          </span>
                          <p className="text-sm text-gray-500">
                            {analyticsData.totalReviews > 0
                              ? Math.round((analyticsData.sentimentAnalysis.neutral / analyticsData.totalReviews) * 100)
                              : 0}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Professional Monthly Trend Chart */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <TrendingUp className="h-6 w-6 text-blue-500" />
                      Monthly Review Trends
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <span className="text-gray-600">Reviews</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                        <span className="text-gray-600">Rating</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Chart Container */}
                    <div className="h-80 bg-gradient-to-t from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                      <div className="h-full flex items-end justify-between gap-3">
                        {analyticsData.monthlyData.map((month, index) => {
                          const maxReviews = Math.max(...analyticsData.monthlyData.map((d) => d.reviews), 1)
                          const reviewHeight = Math.max(8, (month.reviews / maxReviews) * 240)
                          const ratingHeight = Math.max(8, (month.rating / 5) * 240)

                          return (
                            <div key={index} className="flex flex-col items-center gap-3 flex-1 group relative">
                              {/* Tooltip */}
                              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-10 shadow-lg">
                                <div className="text-center">
                                  <div className="font-semibold text-blue-300">{month.reviews} Reviews</div>
                                  <div className="text-green-300">{month.rating.toFixed(1)} ★ Rating</div>
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>

                              {/* Bars Container */}
                              <div className="flex items-end gap-1 h-60">
                                {/* Reviews Bar */}
                                <div className="relative">
                                  <div
                                    className="w-8 bg-gradient-to-t from-blue-600 via-blue-500 to-purple-500 rounded-t-lg shadow-lg transition-all duration-700 ease-out hover:shadow-xl group-hover:scale-110 transform origin-bottom"
                                    style={{
                                      height: `${reviewHeight}px`,
                                      animationDelay: `${index * 0.1}s`,
                                    }}
                                  />
                                  {/* Glow effect */}
                                  <div
                                    className="absolute inset-0 w-8 bg-gradient-to-t from-blue-400 to-purple-400 rounded-t-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                                    style={{ height: `${reviewHeight}px` }}
                                  />
                                </div>

                                {/* Rating Bar */}
                                <div className="relative">
                                  <div
                                    className="w-8 bg-gradient-to-t from-green-600 via-green-500 to-emerald-400 rounded-t-lg shadow-lg transition-all duration-700 ease-out hover:shadow-xl group-hover:scale-110 transform origin-bottom"
                                    style={{
                                      height: `${ratingHeight}px`,
                                      animationDelay: `${index * 0.1 + 0.05}s`,
                                    }}
                                  />
                                  {/* Glow effect */}
                                  <div
                                    className="absolute inset-0 w-8 bg-gradient-to-t from-green-400 to-emerald-300 rounded-t-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                                    style={{ height: `${ratingHeight}px` }}
                                  />
                                </div>
                              </div>

                              {/* Month Label */}
                              <div className="text-center">
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                                  {month.month}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-6 h-60 flex flex-col justify-between text-xs text-gray-500">
                      <span>High</span>
                      <span>Med</span>
                      <span>Low</span>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        <AnimatedNumber
                          value={analyticsData.monthlyData.reduce((sum, month) => sum + month.reviews, 0)}
                        />
                      </div>
                      <div className="text-sm text-gray-600">Total Reviews (6 months)</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(
                          analyticsData.monthlyData.reduce((sum, month) => sum + month.rating, 0) /
                          analyticsData.monthlyData.length
                        ).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {analyticsData.monthlyGrowth >= 0 ? "+" : ""}
                        {analyticsData.monthlyGrowth}%
                      </div>
                      <div className="text-sm text-gray-600">Growth Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Insights */}
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Top Sources */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <Globe className="h-6 w-6 text-blue-500" />
                      Top Review Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.topSources.map((source, index) => (
                        <div
                          key={source.name}
                          className="flex items-center justify-between animate-slide-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <span className="font-medium text-gray-700">{source.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{source.count}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${source.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Stats */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <Smartphone className="h-6 w-6 text-purple-500" />
                      Device Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between animate-slide-right">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-5 w-5 text-blue-500" />
                          <span className="text-gray-700">Desktop</span>
                        </div>
                        <span className="font-bold text-blue-600">
                          <AnimatedNumber value={analyticsData.deviceStats.desktop} />
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between animate-slide-right"
                        style={{ animationDelay: "0.1s" }}
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-green-500" />
                          <span className="text-gray-700">Mobile</span>
                        </div>
                        <span className="font-bold text-green-600">
                          <AnimatedNumber value={analyticsData.deviceStats.mobile} />
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between animate-slide-right"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="h-5 w-5 text-purple-500" />
                          <span className="text-gray-700">Tablet</span>
                        </div>
                        <span className="font-bold text-purple-600">
                          <AnimatedNumber value={analyticsData.deviceStats.tablet} />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Performance */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-fade-in">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                      <Calendar className="h-6 w-6 text-orange-500" />
                      Weekly Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.weeklyStats.map((day, index) => (
                        <div
                          key={day.day}
                          className="flex items-center justify-between animate-slide-left"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <span className="font-medium w-12 text-gray-700">{day.day}</span>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((day.reviews / 10) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{day.reviews}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <div className="mb-8">
                <TrendingUp className="h-20 w-20 text-gray-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-semibold mb-4 text-gray-700">No Analytics Data Yet</h3>
                <p className="text-gray-500 text-lg">
                  Start collecting reviews to see your comprehensive analytics dashboard
                </p>
              </div>
              <Button
                onClick={() => navigate("/components/business/review-link")}
                className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-semibold py-3 px-8 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Start Collecting Reviews
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
