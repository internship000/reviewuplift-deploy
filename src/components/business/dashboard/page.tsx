"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Star,
  LinkIcon,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Sidebar from "../../sidebar";
import { auth, db } from "@/firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface Review {
  id: string;
  name: string;
  rating: number;
  review: string;
  createdAt: { seconds: number };
  status: string;
  branchname: string;
  replied: boolean;
}

const useSubscriptionStatus = () => {
  const navigate = useNavigate();

  const checkSubscription = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    const now = new Date();
    
    // If user has active subscription
    if (userData.subscriptionActive) return true;
    
    // If user is still in trial period
    if (userData.trialEndDate && userData.trialEndDate.toDate() > now) return true;
    
    // Trial expired and no active subscription
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const hasActiveAccess = await checkSubscription(user.uid);
        if (!hasActiveAccess) {
          navigate("/pricing");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);
};

export default function BusinessDashboard() {
  const [period, setPeriod] = useState("week");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    linkClicks: 0,
    responseRate: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });

  const navigate = useNavigate();

  // Check subscription status on component mount
  useSubscriptionStatus();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            navigate("/login");
            return;
          }

          const userData = userDoc.data();
          const businessData = userData?.businessInfo || {};
          setBusinessName(businessData.businessName || "");

          // Get stats from businessInfo
          setStats(prev => ({
            ...prev,
            linkClicks: businessData.linkClicks || 0,
            responseRate: businessData.responseRate || 0
          }));

          // Get reviews from subcollection
          const reviewsQuery = query(
            collection(db, "users", user.uid, "reviews")
          );
          
          const querySnapshot = await getDocs(reviewsQuery);
          const reviewsData: Review[] = [];
          let totalRating = 0;
          const ratingCounts = [0, 0, 0, 0, 0]; // [5-star, 4-star, 3-star, 2-star, 1-star]

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt;
            const seconds = createdAt ? createdAt.seconds : 0;
            
            reviewsData.push({
              id: doc.id,
              name: data.name || "Anonymous",
              rating: data.rating || 0,
              review: data.review || data.message || "",
              createdAt: { seconds },
              status: data.status || "pending",
              branchname: data.branchname || "",
              replied: data.replied || false
            });

            // Update stats
            totalRating += data.rating;
            if (data.rating >= 1 && data.rating <= 5) {
              ratingCounts[5 - data.rating]++; // 5-star at index 0, 1-star at index 4
            }
          });

          const totalReviews = reviewsData.length;
          const averageRating = totalReviews > 0 ? 
            parseFloat((totalRating / totalReviews).toFixed(1)) : 0;

          setReviews(
            reviewsData.sort(
              (a, b) => b.createdAt.seconds - a.createdAt.seconds
            )
          );
          
          setStats(prev => ({
            ...prev,
            totalReviews,
            averageRating,
            ratingDistribution: ratingCounts
          }));
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculatePercentage = (count: number) => {
    return stats.totalReviews > 0
      ? Math.round((count / stats.totalReviews) * 100)
      : 0;
  };

  const getStatusBadge = (status: string, replied: boolean) => {
    if (replied) {
      return (
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          Replied
        </span>
      );
    }
    
    switch (status) {
      case 'published':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Published
          </span>
        );
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            Rejected
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                {businessName
                  ? `Welcome back, ${businessName}`
                  : "Welcome back"}
              </p>
            </div>
            <Tabs
              defaultValue="week"
              className="w-[300px]"
              onValueChange={setPeriod}
            >
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Reviews"
              icon={<Star className="h-4 w-4 text-muted-foreground" />}
              value={stats.totalReviews}
              description="All time reviews"
            />
            <StatCard
              title="Average Rating"
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
              value={stats.averageRating}
              description={
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              }
            />
            <StatCard
              title="Link Clicks"
              icon={<LinkIcon className="h-4 w-4 text-muted-foreground" />}
              value={stats.linkClicks}
              description="Total review link clicks"
            />
            <StatCard
              title="Response Rate"
              icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
              value={`${stats.responseRate}%`}
              description="Of reviews responded to"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest customer feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.slice(0, 5).map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">
                            {review.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {formatDate(review.createdAt.seconds)}
                            </div>
                            {getStatusBadge(review.status, review.replied)}
                          </div>
                        </div>
                        <div className="flex mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-2">{review.review}</p>
                        {review.branchname && (
                          <p className="text-sm text-gray-500">
                            Branch: {review.branchname}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No reviews yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of your ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.ratingDistribution.map((count, index) => {
                    const stars = 5 - index;
                    const percentage = calculatePercentage(count);

                    return (
                      <div key={stars} className="flex items-center">
                        <div className="w-12 flex items-center">
                          <span className="font-medium">{stars}</span>
                          <Star className="h-4 w-4 ml-1 text-yellow-400" />
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-yellow-400 h-2.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-right text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  description,
}: {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}