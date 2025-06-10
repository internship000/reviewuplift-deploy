"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Calendar, RefreshCw } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { format } from "date-fns"
import { useNavigate, useParams } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import DatePicker from "react-datepicker"
import { toast } from "sonner"
import "react-datepicker/dist/react-datepicker.css"

interface SubscriptionData {
  plan: string
  status: "Active" | "Expired" | "None"
  startDate: Date | null
  endDate: Date | null
  paymentMethod: string
  businessName: string
  displayName: string
  uid: string
}

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const params = useParams<{ uid: string }>()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    plan: "",
    status: "None" as "Active" | "Expired" | "None",
    endDate: null as Date | null,
    paymentMethod: ""
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.uid) {
        setError("User ID is missing");
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", params.uid);
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const data = userDoc.data();
          const businessInfo = data.businessInfo || {};
          
          // Get business name from businessInfo or fallback
          const businessName = businessInfo.businessName || 
                              data.displayName || 
                              "Unknown Business";

          // Fetch subscription data from root document fields
          const endDate = data.subscriptionEndDate?.toDate?.() || null;
          const startDate = data.subscriptionStartDate?.toDate?.() || null;

          // Determine status based on subscriptionActive flag and dates
          let subscriptionStatus: "Active" | "Expired" | "None" = "None";
          if (data.subscriptionActive) {
            subscriptionStatus = endDate && endDate > new Date() ? "Active" : "Expired";
          }

          // Map plan IDs to names
          const planMap: Record<string, string> = {
            plan_premium: "Premium",
            plan_pro: "Pro",
            plan_basic: "Basic"
          }
          
          const subscriptionPlan = data.subscriptionPlan 
            ? planMap[data.subscriptionPlan] || data.subscriptionPlan 
            : "None"

          const subData: SubscriptionData = {
            plan: subscriptionPlan,
            status: subscriptionStatus,
            startDate,
            endDate,
            paymentMethod: "N/A",
            businessName,
            displayName: data.displayName || "Unknown Owner",
            uid: userDoc.id
          }

          setSubscription(subData)
          setFormData({
            plan: subData.plan,
            status: subData.status,
            endDate: subData.endDate,
            paymentMethod: subData.paymentMethod
          })
        } else {
          setError("User document not found")
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error)
        setError("Failed to load subscription data")
        toast.error("Failed to load subscription data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.uid])

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Premium": return "bg-purple-100 text-purple-800"
      case "Pro": return "bg-blue-100 text-blue-800"
      case "Basic": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleSave = async () => {
    if (!subscription || !params?.uid) return

    setSaving(true)
    try {
      const userDocRef = doc(db, "users", params.uid)
      const planReverseMap: Record<string, string> = {
        Premium: "plan_premium",
        Pro: "plan_pro",
        Basic: "plan_basic"
      }
      const planId = planReverseMap[formData.plan] || formData.plan

      const updateData: any = {
        subscriptionPlan: planId,
        subscriptionActive: formData.status === "Active",
      }

      if (formData.endDate) {
        updateData.subscriptionEndDate = formData.endDate
      }

      await updateDoc(userDocRef, updateData)

      toast.success("Subscription updated successfully!", {
        description: "Changes have been saved to the database."
      })

      setSubscription(prev => prev ? {
        ...prev,
        plan: formData.plan,
        status: formData.status,
        endDate: formData.endDate
      } : null)
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast.error("Failed to update subscription", {
        description: "Please try again or contact support."
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!params?.uid) return
    
    try {
      await updateDoc(doc(db, "users", params.uid), {
        subscriptionActive: false,
        subscriptionPlan: "None",
        subscriptionEndDate: null,
        subscriptionStartDate: null
      })
      
      toast.success("Subscription cancelled successfully")
      setSubscription(prev =>
        prev ? { ...prev, status: "None", plan: "None", endDate: null, startDate: null } : null
      )
      setFormData(prev => ({
        ...prev,
        status: "None",
        plan: "None",
        endDate: null
      }))
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast.error("Failed to cancel subscription")
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Subscription</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-gray-500 mt-2">User ID: {params?.uid || "Not available"}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-48" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
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

  return (
    <div className="container mx-auto p-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-gray-600 mt-2">
            Manage subscription for <span className="font-semibold">{subscription?.businessName}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Subscription Plan</label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) => setFormData({ ...formData, plan: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">No Plan</SelectItem>
                      <SelectItem value="Basic">Basic ($49/month)</SelectItem>
                      <SelectItem value="Pro">Pro ($99/month)</SelectItem>
                      <SelectItem value="Premium">Premium ($199/month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subscription Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Expired" | "None") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Renewal Date</label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    className="border px-3 py-2 rounded-md w-full"
                    minDate={new Date()}
                    placeholderText="Select renewal date"
                    disabled={formData.status === "None"}
                  />
                  {formData.status === "None" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Set status to Active to enable date selection
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Summary and Actions */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Business</span>
                  <span className="font-medium truncate max-w-[160px]">{subscription?.businessName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Current Plan</span>
                  <Badge className={getPlanColor(subscription?.plan || "")}>
                    {subscription?.plan || "None"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <Badge
                    className={
                      subscription?.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : subscription?.status === "Expired"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {subscription?.status || "None"}
                  </Badge>
                </div>
                {subscription?.endDate && subscription.status !== "None" && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Renewal Date</span>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">
                        {format(subscription.endDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Subscription Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleCancelSubscription}
                  disabled={subscription?.status === "None"}
                >
                  Cancel Subscription
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={subscription?.status !== "Active"}
                >
                  Send Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}