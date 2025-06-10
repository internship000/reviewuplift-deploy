"use client"

import { useState, useEffect, useCallback } from "react"
import { SimpleAdminLayout } from "@/components/simple-admin-layout"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" 
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Star, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"

interface BusinessUser {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date;
  businessName: string;
  businessType: string;
  status: string;
  rating: number;
  reviewCount: number;
  subscriptionPlan: string;
  subscriptionStatus: 'Active' | 'Expired' | 'None';
  subscriptionEndDate: Date | null;
  businessFormFilled: boolean;
  businessInfo?: BusinessInfo;
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
  branches: Array<{ name: string; location: string }>;
  lastUpdated: any;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
}

export default function BusinessesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [businesses, setBusinesses] = useState<BusinessUser[]>([])
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const toggleRowExpansion = (uid: string) => {
    setExpandedRows((prev) =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 shadow-sm hover:shadow-green-200 transition-shadow"
      case "Pending": return "bg-yellow-100 text-yellow-800 shadow-sm hover:shadow-yellow-200 transition-shadow"
      case "Suspended": return "bg-red-100 text-red-800 shadow-sm hover:shadow-red-200 transition-shadow"
      default: return "bg-gray-100 text-gray-800 shadow-sm"
    }
  }, [])

  const getPlanColor = useCallback((plan: string) => {
    switch (plan) {
      case "Premium": return "bg-purple-100 text-purple-800"
      case "Pro": return "bg-blue-100 text-blue-800"
      case "Basic": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }, [])

  const getSubscriptionStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800"
      case "Expired": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }, [])

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "BUSER")
        )

        const usersSnapshot = await getDocs(usersQuery)
        const businessesData: BusinessUser[] = []

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data()
          const createdAt = userData.createdAt?.toDate() || new Date()
          const businessInfo = userData.businessInfo || {}
          const businessFormFilled = !!userData.businessInfo

          const reviewsCollection = collection(db, "users", userDoc.id, "reviews")
          const reviewsSnapshot = await getDocs(reviewsCollection)

          let totalRating = 0
          let reviewCount = 0

          reviewsSnapshot.forEach(reviewDoc => {
            const reviewData = reviewDoc.data()
            totalRating += reviewData.rating || 0
            reviewCount++
          })

          const averageRating = reviewCount > 0 ? 
            parseFloat((totalRating / reviewCount).toFixed(1)) : 0

          let subscriptionStatus: 'Active' | 'Expired' | 'None' = 'None'
          if (userData.subscriptionActive) {
            const endDate = userData.subscriptionEndDate?.toDate()
            subscriptionStatus = endDate && endDate > new Date() ? 'Active' : 'Expired'
          }

          const planMap: Record<string, string> = {
            'plan_premium': 'Premium',
            'plan_pro': 'Pro',
            'plan_basic': 'Basic'
          }
          const subscriptionPlan = planMap[userData.subscriptionPlan] || userData.subscriptionPlan || 'None'

          businessesData.push({
            uid: userDoc.id,
            displayName: userData.displayName || "Unknown Owner",
            email: userData.email || "No email",
            createdAt,
            businessName: businessInfo.businessName || "Unnamed Business",
            businessType: businessInfo.businessType || "Uncategorized",
            status: userData.status || "Pending",
            rating: averageRating,
            reviewCount,
            subscriptionPlan,
            subscriptionStatus,
            subscriptionEndDate: userData.subscriptionEndDate?.toDate() || null,
            businessFormFilled,
            businessInfo
          })
        }

        setBusinesses(businessesData)
      } catch (error) {
        console.error("Error fetching businesses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const filteredBusinesses = useCallback(() => {
    if (!searchQuery) return businesses
    const queryLower = searchQuery.toLowerCase()
    return businesses.filter(business =>
      business.businessName.toLowerCase().includes(queryLower) ||
      business.displayName.toLowerCase().includes(queryLower) ||
      business.businessType.toLowerCase().includes(queryLower) ||
      business.subscriptionPlan.toLowerCase().includes(queryLower)
    )
  }, [businesses, searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const formatSubscriptionDate = (date: Date | null) => {
    if (!date) return "N/A"
    return format(date, "MMM d, yyyy")
  }

  const handleViewDetails = (uid: string) => {
    navigate(`/admin/businesses/${uid}`);
  }

  const handleManageSubscription = (uid: string) => {
    navigate(`/admin/subscriptions/${uid}`);
  }

  return (
    <SimpleAdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="animate-slide-down">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Business Management
          </h1>
          <p className="text-gray-600 mt-1">Manage all registered businesses</p>
        </div>

        <Card className="border-orange-200 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-orange-50 to-white rounded-t-lg gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-orange-800">All Businesses</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {businesses.length} businesses registered • {businesses.filter(b => b.subscriptionStatus === 'Active').length} active subscriptions
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-orange-400" />
              <Input
                placeholder="Search businesses..."
                className="pl-8 border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-orange-200 h-12 w-12"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-orange-200 rounded w-64"></div>
                    <div className="h-4 bg-orange-200 rounded w-56"></div>
                  </div>
                </div>
              </div>
            ) : filteredBusinesses().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No businesses found</h3>
                <p className="max-w-md">
                  {searchQuery 
                    ? "No businesses match your search. Try different keywords." 
                    : "No businesses registered yet. New businesses will appear here once they sign up."}
                </p>
              </div>
            ) : (
              <Table className="rounded-lg overflow-hidden">
                <TableHeader className="bg-orange-50">
                  <TableRow className="hover:bg-orange-50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="font-bold text-orange-800">Business</TableHead>
                    <TableHead className="font-bold text-orange-800">Owner</TableHead>
                    <TableHead className="font-bold text-orange-800">Plan</TableHead>
                    <TableHead className="font-bold text-orange-800">Subscription</TableHead>
                    <TableHead className="font-bold text-orange-800">Rating</TableHead>
                    <TableHead className="font-bold text-orange-800">Status</TableHead>
                    <TableHead className="font-bold text-orange-800">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses().map((business) => (
                    <>
                      <TableRow 
                        key={business.uid} 
                        className="border-b border-orange-100 hover:bg-orange-50 transition-all duration-200 ease-in-out cursor-pointer"
                        onClick={() => toggleRowExpansion(business.uid)}
                      >
                        <TableCell className="py-3">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {expandedRows.includes(business.uid) ? (
                              <ChevronUp className="h-4 w-4 text-orange-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-orange-500" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium group">
                          <div>
                            <span className="group-hover:text-orange-600 transition-colors">
                              {business.businessName}
                            </span>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 text-xs">
                                {business.businessType}
                              </Badge>
                              {business.businessFormFilled ? (
                                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                                  <FileText className="h-3 w-3 mr-1" /> Form
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800 text-xs">
                                  No Form
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{business.displayName}</p>
                            <p className="text-sm text-gray-500 group-hover:text-orange-500 transition-colors truncate max-w-[160px]">
                              {business.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPlanColor(business.subscriptionPlan)} text-xs`}>
                            {business.subscriptionPlan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge className={`${getSubscriptionStatusColor(business.subscriptionStatus)} text-xs mb-1 w-fit`}>
                              {business.subscriptionStatus}
                            </Badge>
                            {business.subscriptionEndDate && (
                              <span className="text-xs text-gray-500">
                                Ends: {formatSubscriptionDate(business.subscriptionEndDate)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-semibold">{business.rating}</span>
                            <span className="text-xs text-gray-500">({business.reviewCount})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${getStatusColor(business.status)} transition-all hover:scale-105 cursor-pointer text-xs`}
                          >
                            {business.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {format(business.createdAt, "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                      
                      {expandedRows.includes(business.uid) && (
                        <TableRow className="bg-orange-25 border-b border-orange-100">
                          <TableCell colSpan={8}>
                            <div className="p-4 bg-orange-25 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Subscription Details */}
                                <div className="border border-orange-200 rounded-lg p-4 bg-white">
                                  <h3 className="font-bold text-orange-700 flex items-center">
                                    <span className="bg-orange-100 p-1 rounded mr-2">
                                      <Star className="h-4 w-4 text-orange-600" />
                                    </span>
                                    Subscription Details
                                  </h3>
                                  <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Plan:</span>
                                      <Badge className={`${getPlanColor(business.subscriptionPlan)}`}>
                                        {business.subscriptionPlan}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Status:</span>
                                      <Badge className={`${getSubscriptionStatusColor(business.subscriptionStatus)}`}>
                                        {business.subscriptionStatus}
                                      </Badge>
                                    </div>
                                    {business.subscriptionEndDate && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Renewal Date:</span>
                                        <span className="font-medium">
                                          {formatSubscriptionDate(business.subscriptionEndDate)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Business Form Preview */}
                                <div className="border border-orange-200 rounded-lg p-4 bg-white">
                                  <h3 className="font-bold text-orange-700 flex items-center">
                                    <span className="bg-orange-100 p-1 rounded mr-2">
                                      <FileText className="h-4 w-4 text-orange-600" />
                                    </span>
                                    Business Form {business.businessFormFilled ? "Details" : "Not Submitted"}
                                  </h3>
                                  
                                  {business.businessFormFilled && business.businessInfo ? (
                                    <div className="mt-3 space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Contact Email:</span>
                                        <span className="font-medium">
                                          {business.businessInfo.contactEmail || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Contact Phone:</span>
                                        <span className="font-medium">
                                          {business.businessInfo.contactPhone || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Business Type:</span>
                                        <span className="font-medium">
                                          {business.businessInfo.businessType || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Branches:</span>
                                        <span className="font-medium">
                                          {business.businessInfo.branches?.length || 0} locations
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Last Updated:</span>
                                        <span className="font-medium">
                                          {business.businessInfo.lastUpdated ? 
                                            format(business.businessInfo.lastUpdated.toDate(), "MMM d, yyyy") : 
                                            "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-3 text-gray-500 italic">
                                      This business hasn't submitted their details form yet.
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-4 flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  className="border-orange-300 text-orange-600"
                                  onClick={() => handleViewDetails(business.uid)}
                                >
                                  View Full Details
                                </Button>
                                <Button 
                                  className="bg-orange-500 hover:bg-orange-600"
                                  onClick={() => handleManageSubscription(business.uid)}
                                >
                                  Manage Subscription
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SimpleAdminLayout>
  )
}