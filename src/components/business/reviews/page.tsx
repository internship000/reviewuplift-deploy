"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Check,
  FolderOpen,
  MailOpen,
  Phone,
  Search,
  Star,
  Trash2,
  MapPin,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Sidebar from "@/components/sidebar"
import ConfirmDialog from "@/components/confirm-dialog"
import type { Review } from "@/lib/types"
import { collection, query, getDocs, doc, deleteDoc, updateDoc, orderBy, limit, getDoc } from "firebase/firestore"
import { auth, db } from "@/firebase/firebase"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"

const renderStars = (rating: number) => (
  <div className="flex text-yellow-500" aria-label={`${rating} out of 5 stars`}>
    {[...Array(5)].map((_, index) =>
      index < rating ? (
        <Star
          key={index}
          className="h-4 w-4 fill-yellow-400 text-yellow-400"
          aria-hidden="true"
        />
      ) : (
        <Star
          key={index}
          className="h-4 w-4 text-gray-300"
          aria-hidden="true"
        />
      )
    )}
  </div>
)

export default function BusinessReviews() {
  const router = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("All");
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [trialInfo, setTrialInfo] = useState<any>(null);
  const [reviewsLimit, setReviewsLimit] = useState<number | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [userPlan, setUserPlan] = useState<any>(null);

  const fetchUserData = useCallback(async (user: any) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPlan(userData);
        
        if (userData.subscriptionPlan) {
          setSubscriptionPlan(userData.subscriptionPlan);
          
          switch(userData.subscriptionPlan.toLowerCase()) {
            case "starter":
            case "plan_basic":
              setReviewsLimit(100);
              break;
            case "professional":
            case "plan_pro":
              setReviewsLimit(500);
              break;
            case "enterprise":
            case "plan_premium":
            case "custom":
              setReviewsLimit(0);
              break;
            default:
              setReviewsLimit(100);
          }
        }
        
        if (userData.trialActive) {
          const now = new Date();
          const trialEnd = userData.trialEndDate?.toDate();
          const trialDaysLeft = trialEnd 
            ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) 
            : 0;
            
          setTrialInfo({
            active: true,
            daysLeft: trialDaysLeft > 0 ? trialDaysLeft : 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!currentUser || reviewsLimit === null) return;
    
    try {
      let reviewsQuery = query(
        collection(db, "users", currentUser.uid, "reviews"),
        orderBy("createdAt", "desc")
      );

      if (reviewsLimit > 0) {
        reviewsQuery = query(reviewsQuery, limit(reviewsLimit));
      }

      const querySnapshot = await getDocs(reviewsQuery);
      
      const reviewsData: Review[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt ? data.createdAt.toDate() : null;
        
        reviewsData.push({
          id: doc.id,
          name: data.name || "Anonymous",
          email: data.email || "",
          phone: data.phone || "",
          branchname: data.branchname || "",
          message: data.review || data.message || "",
          rating: data.rating || 0,
          date: createdAt ? format(createdAt, 'MMM d, yyyy') : "Unknown date",
          replied: data.replied || false,
          status: data.status || 'pending'
        });
      });
      
      setReviews(reviewsData);
      setReviewsCount(querySnapshot.size);
      
      if (reviewsLimit > 0 && querySnapshot.size >= reviewsLimit) {
        setShowUpgradePrompt(true);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [currentUser, reviewsLimit]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserData(user);
      } else {
        setCurrentUser(null);
        router('/login');
      }
    });

    return () => unsubscribe();
  }, [fetchUserData, router]);

  useEffect(() => {
    if (currentUser && reviewsLimit !== null) {
      fetchReviews();
    }
  }, [currentUser, reviewsLimit, fetchReviews]);

  const formatPlanName = (plan?: string) => {
    if (!plan) return "Free Trial";
    const planMap: Record<string, string> = {
      "plan_basic": "Basic",
      "plan_pro": "Pro",
      "plan_premium": "Premium",
      "starter": "Basic",
      "professional": "Pro",
      "custom": "Premium"
    };
    return planMap[plan] || plan;
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete || !currentUser) return;
    
    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "reviews", reviewToDelete.id)
      );
      setReviews(reviews.filter((review) => review.id !== reviewToDelete.id));
      setReviewsCount(prev => prev - 1);
      
      if (reviewsLimit && reviewsCount - 1 < reviewsLimit) {
        setShowUpgradePrompt(false);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setReviewToDelete(null);
    }
  };

  const handleToggleReply = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const reviewRef = doc(db, "users", currentUser.uid, "reviews", id);
      const review = reviews.find(r => r.id === id);
      
      if (review) {
        await updateDoc(reviewRef, {
          replied: !review.replied
        });
        
        setReviews(
          reviews.map((review) =>
            review.id === id ? { ...review, replied: !review.replied } : review
          )
        );
      }
    } catch (error) {
      console.error("Error toggling reply status:", error);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        review.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.branchname?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterOption === "All" ||
        (filterOption === "Above 3" && review.rating >= 3) ||
        (filterOption === "Below 3" && review.rating < 3) ||
        (filterOption === "Replied" && review.replied) ||
        (filterOption === "Not Replied" && !review.replied);

      return matchesSearch && matchesFilter;
    });
  }, [reviews, searchTerm, filterOption]);

  const renderPlanDetails = () => {
    if (!userPlan) return null;
    
    const planKey = userPlan.subscriptionPlan || userPlan.plan;
    const planName = formatPlanName(planKey);
    
    const usageText = reviewsLimit === 0 
      ? `Review usage: ${reviewsCount} (Unlimited)`
      : `Review usage: ${reviewsCount} / ${reviewsLimit}`;

    return (
      <motion.div 
        className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mb-6 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {planName} Plan
            </h3>
            <p className="text-gray-700">
              {usageText}
            </p>
            {trialInfo?.active && trialInfo.daysLeft !== undefined && (
              <p className="text-sm text-gray-600 mt-1">
                {trialInfo.daysLeft} days left in trial
              </p>
            )}
          </div>
          <Button 
            onClick={() => window.location.assign("/#pricing")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md transition-all"
          >
            {userPlan.subscriptionActive ? "Manage Plan" : "Upgrade Plan"}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              Customer Reviews
            </h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search reviews..."
                  className="w-full sm:w-[220px] pl-9 border-orange-200 focus:ring-2 focus:ring-orange-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterOption} onValueChange={setFilterOption}>
                <SelectTrigger className="w-[160px] border-orange-200 focus:ring-2 focus:ring-orange-300">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Reviews</SelectItem>
                  <SelectItem value="Above 3">Rating Above 3</SelectItem>
                  <SelectItem value="Below 3">Rating Below 3</SelectItem>
                  <SelectItem value="Replied">Replied</SelectItem>
                  <SelectItem value="Not Replied">Not Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {renderPlanDetails()}

          {showUpgradePrompt && (
            <motion.div 
              className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-md shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    You've reached your monthly review limit ({reviewsCount}/{reviewsLimit}). 
                    <button 
                      onClick={() => window.location.assign("/#pricing")}
                      className="ml-1 font-semibold text-orange-800 hover:underline"
                    >
                      Upgrade your plan
                    </button> to view more reviews.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <motion.div 
                className="bg-white p-8 rounded-lg border text-center shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No reviews found</h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search or filters"
                    : "Start collecting reviews from your customers"}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filteredReviews.map((review) => (
                  <motion.div
                    key={review.id}
                    className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-2 border border-orange-50 hover:shadow-md transition-all relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.005 }}
                  >
                    {review.replied && (
                      <motion.div 
                        className="absolute right-4 top-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 260,
                          damping: 20
                        }}
                      >
                        <div className="bg-green-100 p-2 rounded-full shadow-sm">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-800">{review.name}</div>
                          <div className="text-gray-500 text-sm">{review.date}</div>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    <div className="text-gray-700 py-2">{review.message}</div>

                    <div className="flex gap-3 mt-2">
                      {review.branchname && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-orange-50"
                              aria-label="View branch"
                            >
                              <MapPin className="h-4 w-4 text-gray-500 hover:text-orange-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 border border-orange-200 shadow-md">
                            <p className="text-sm">{review.branchname}</p>
                          </PopoverContent>
                        </Popover>
                      )}

                      {review.email && (
                        <Button 
                          variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-orange-50"
                              aria-label="Send email"
                              onClick={() => window.open(`mailto:${review.email}`, '_blank')}
                            >
                              <MailOpen className="h-4 w-4 text-gray-500 hover:text-orange-500" />
                            </Button>
                          )}

                          {review.phone && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-orange-50"
                              aria-label="Make phone call"
                              onClick={() => window.open(`tel:${review.phone}`, '_blank')}
                            >
                              <Phone className="h-4 w-4 text-gray-500 hover:text-orange-500" />
                            </Button>
                          )}
                        </div>
      
                        <div className="flex justify-end items-center mt-3">
                          <div className="flex gap-3 text-gray-500 text-lg items-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-orange-50"
                                  aria-label="Toggle reply status"
                                >
                                  <Check
                                    className={`h-4 w-4 ${
                                      review.replied ? "text-orange-500" : "text-gray-400"
                                    }`}
                                  />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2 border border-orange-200 shadow-md">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-500 hover:bg-orange-50"
                                  onClick={() => handleToggleReply(review.id)}
                                >
                                  {review.replied
                                    ? "Unmark as replied"
                                    : "Mark as replied"}
                                </Button>
                              </PopoverContent>
                            </Popover>
      
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-orange-50"
                                  aria-label="Delete review"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2 border border-orange-200 shadow-md">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setReviewToDelete(review)}
                                >
                                  Delete
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
      
              <ConfirmDialog
                isOpen={!!reviewToDelete}
                onClose={() => setReviewToDelete(null)}
                onConfirm={handleDeleteReview}
                title="Delete Review"
                description={`Are you sure you want to delete the review from ${reviewToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
              />
            </div>
          </div>
        </div>
      );
    }