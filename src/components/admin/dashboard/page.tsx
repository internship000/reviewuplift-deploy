"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleAdminLayout } from "@/components/simple-admin-layout"
import { Users, Star, MessageSquare, Building2, Badge } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { format } from "date-fns"

interface BusinessUser {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date;
  businessName?: string;
  role: string;
  status: string;
}

interface Review {
  rating: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalReviews: 0,
    averageRating: 0,
    totalUsers: 0
  })
  
  const [recentLogins, setRecentLogins] = useState<BusinessUser[]>([])
  const [loading, setLoading] = useState(true)

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all users in parallel with business users
      const usersCollection = collection(db, "users")
      const [allUsersSnapshot, businessUsersSnapshot] = await Promise.all([
        getDocs(usersCollection),
        getDocs(query(usersCollection, where("role", "==", "BUSER")))
      ])

      // Process all users
      const allUsers: BusinessUser[] = allUsersSnapshot.docs.map(userDoc => {
        const userData = userDoc.data()
        return {
          uid: userDoc.id,
          displayName: userData.displayName || "Unknown",
          email: userData.email || "No email",
          createdAt: userData.createdAt?.toDate() || new Date(),
          businessName: userData.businessInfo?.businessName,
          role: userData.role || "BUSER",
          status: userData.status || "Pending"
        }
      })

      // Process business users
      const businessUsers: BusinessUser[] = businessUsersSnapshot.docs.map(userDoc => {
        const userData = userDoc.data()
        return {
          uid: userDoc.id,
          displayName: userData.displayName || "Unknown",
          email: userData.email || "No email",
          createdAt: userData.createdAt?.toDate() || new Date(),
          businessName: userData.businessInfo?.businessName,
          role: userData.role,
          status: userData.status || "Pending"
        }
      })

      // Fetch all reviews for business users in parallel
      const reviewPromises = businessUsers.map(async (user) => {
        const reviewsCollection = collection(db, "users", user.uid, "reviews")
        const reviewsSnapshot = await getDocs(reviewsCollection)
        return {
          userId: user.uid,
          reviews: reviewsSnapshot.docs.map(doc => doc.data() as Review),
          count: reviewsSnapshot.size
        }
      })

      const reviewsData = await Promise.all(reviewPromises)

      // Calculate review statistics
      let totalRating = 0
      let reviewCount = 0

      reviewsData.forEach(({ reviews }) => {
        reviewCount += reviews.length
        totalRating += reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
      })

      // Calculate stats
      const averageRating = reviewCount > 0 ? 
        parseFloat((totalRating / reviewCount).toFixed(1)) : 0

      // Sort by most recent
      const sortedUsers = [...businessUsers]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)

      setStats({
        totalBusinesses: businessUsers.length,
        totalReviews: reviewCount,
        averageRating,
        totalUsers: allUsers.length
      })
      
      setRecentLogins(sortedUsers)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <SimpleAdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </SimpleAdminLayout>
    )
  }

  const statsData = [
    { 
      title: "Total Businesses", 
      value: stats.totalBusinesses, 
      icon: Building2, 
      color: "text-orange-600", 
      bg: "bg-orange-100" 
    },
    { 
      title: "Total Reviews", 
      value: stats.totalReviews, 
      icon: MessageSquare, 
      color: "text-orange-600", 
      bg: "bg-orange-100" 
    },
    { 
      title: "Average Rating", 
      value: stats.averageRating, 
      icon: Star, 
      color: "text-orange-600", 
      bg: "bg-orange-100" 
    },
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "text-orange-600", 
      bg: "bg-orange-100" 
    },
  ]

  return (
    <SimpleAdminLayout>
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Overview of your ReviewUplift platform</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {statsData.map((stat, index) => (
            <motion.div key={index} variants={item}>
              <Card 
                className={`border border-orange-200 shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ${stat.bg}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">{stat.title}</CardTitle>
                  <div className="p-2 rounded-full bg-white shadow-sm">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800">{stat.value}</div>
                  <div className="mt-2 h-1 bg-gradient-to-r from-orange-300 to-orange-100 rounded-full"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Logins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border border-orange-200 shadow-md transition-all hover:shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
              <CardTitle className="text-xl font-bold text-orange-800">Recent Business Registerations</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {recentLogins.map((login) => (
                  <motion.div 
                    key={login.uid}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-all duration-200 border-b border-orange-100 last:border-b-0"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        login.status === "Active" ? "bg-green-500" : 
                        login.status === "Pending" ? "bg-yellow-500" : 
                        "bg-red-500"
                      }`}></div>
                      <div>
                        <p className="font-medium group">
                          <span className="group-hover:text-orange-600 transition-colors">
                            {login.businessName || "Unnamed Business"}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">{login.displayName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{login.email}</p>
                      <p className="text-xs text-orange-500 font-medium">
                        {formatTimeAgo(login.createdAt)}
                      </p>
                      <Badge className={`mt-1 ${
                        login.status === "Active" ? "bg-green-100 text-green-800" : 
                        login.status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                        "bg-red-100 text-red-800"
                      }`}>
                        {login.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SimpleAdminLayout>
  )
}