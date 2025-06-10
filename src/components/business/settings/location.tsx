"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/sidebar";
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  PowerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  XIcon,
  MapPinIcon,
  LinkIcon,
  StarIcon,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { db, auth } from "@/firebase/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Branch {
  id: string;
  name: string;
  location: string;
  googleReviewLink: string;
  createdAt: string;
  isActive: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
}

interface UserPlan {
  trialActive: boolean;
  trialEndDate?: Date;
  trialDaysLeft?: number;
  plan?: string;
  subscriptionActive?: boolean;
  subscriptionEndDate?: Date;
}

export default function LocationPage() {
  const router = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: "",
    location: "",
    googleReviewLink: "",
  });
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    location: "",
    googleReviewLink: "",
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Track auth and network state
  useEffect(() => {
    let unsubscribeUserPlan: () => void;
    
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        fetchBranches(user.uid);
        
        // Set up real-time listener for user plan
        const userRef = doc(db, "users", user.uid);
        unsubscribeUserPlan = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            updateUserPlanState(userData);
          }
        });
      } else {
        setUser(null);
        setBranches([]);
        setLoading(false);
        setPlanLoading(false);
        if (unsubscribeUserPlan) unsubscribeUserPlan();
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserPlan) unsubscribeUserPlan();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update user plan state from Firestore data
  const updateUserPlanState = (userData: any) => {
    try {
      const now = new Date();
      const trialEnd = userData.trialEndDate?.toDate();
      let trialDaysLeft = 0;
      
      if (trialEnd) {
        trialDaysLeft = Math.ceil(
          (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        trialDaysLeft = trialDaysLeft > 0 ? trialDaysLeft : 0;
      }
      
      const subscriptionEnd = userData.subscriptionEndDate?.toDate();
      const subscriptionActive = subscriptionEnd && subscriptionEnd > now;
      
      setUserPlan({
        trialActive: userData.trialActive || false,
        trialEndDate: trialEnd,
        trialDaysLeft: trialDaysLeft,
        plan: userData.subscriptionPlan || null,
        subscriptionActive: subscriptionActive || false,
        subscriptionEndDate: subscriptionEnd,
      });
      setPlanLoading(false);
    } catch (error) {
      console.error("Error updating user plan:", error);
      toast.error("Failed to load subscription details");
      setPlanLoading(false);
    }
  };

  // Fetch branches from Firebase
  const fetchBranches = async (userId: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const businessInfo = userSnap.data().businessInfo || {};
        const branchesData = businessInfo.branches || [];
        const branchesWithId = branchesData.map((branch: any) => {
          return {
            ...branch,
            id: branch.id || `branch-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: branch.createdAt || new Date().toISOString(),
            isActive: branch.isActive !== undefined ? branch.isActive : true,
            googleReviewLink: branch.googleReviewLink || "",
          };
        });
        setBranches(branchesWithId);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  // Get branch limit based on plan
  const getBranchLimit = () => {
    if (!userPlan) return 0;
    
    if (userPlan.trialActive) {
      return 1; // Allow 1 branch during trial
    }
    
    if (!userPlan.subscriptionActive) return 0;
    
    switch (userPlan.plan) {
      case "plan_basic":
        return 3;
      case "plan_pro":
        return 5;
      case "plan_premium":
        return 1000; // Effectively unlimited
        case "starter":
        return 3;
      case "professional":
        return 5;
      case "custom":
        return 1000;
      default:
        return 0; // No plan selected
    }
  };

  const branchLimit = getBranchLimit();
  const canAddBranches = branches.length < branchLimit;
  const branchLimitReached = branches.length >= branchLimit;

  const generateId = () => `branch-${Math.random().toString(36).substr(2, 9)}`;

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update branches in Firebase
  const updateFirebaseBranches = async (updatedBranches: Branch[]) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        "businessInfo.branches": updatedBranches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          location: branch.location,
          googleReviewLink: branch.googleReviewLink,
          isActive: branch.isActive,
          createdAt: branch.createdAt,
        })),
      });
      return true;
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch.name.trim() || !newBranch.location.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (branchLimitReached) {
      toast.error("You've reached your branch limit. Please upgrade your plan.");
      return;
    }

    try {
      const branchToAdd = {
        id: generateId(),
        name: newBranch.name.trim(),
        location: newBranch.location.trim(),
        googleReviewLink: newBranch.googleReviewLink.trim(),
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      const updatedBranches = [...branches, branchToAdd];
      await updateFirebaseBranches(updatedBranches);
      setBranches(updatedBranches);
      setNewBranch({ name: "", location: "", googleReviewLink: "" });
      setIsAdding(false);
      toast.success("Branch added successfully");
    } catch (error) {
      toast.error("Failed to add branch");
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      const updatedBranches = branches.filter((branch) => branch.id !== id);
      await updateFirebaseBranches(updatedBranches);
      setBranches(updatedBranches);
      toast.success("Branch deleted successfully");
    } catch (error) {
      toast.error("Failed to delete branch");
    }
  };

  const toggleActiveStatus = async (id: string) => {
    try {
      const updatedBranches = branches.map((branch) =>
        branch.id === id ? { ...branch, isActive: !branch.isActive } : branch
      );

      // Optimistic update
      setBranches(updatedBranches);

      await updateFirebaseBranches(updatedBranches);
      toast.success("Branch status updated");
    } catch (error) {
      // Revert on error
      setBranches(branches);
      toast.error("Failed to update branch status");
    }
  };

  const toggleExpand = (id: string) => {
    setBranches(
      branches.map((branch) =>
        branch.id === id
          ? { ...branch, isExpanded: !branch.isExpanded }
          : branch
      )
    );
  };

  const startEditing = (branch: Branch) => {
    setEditData({
      id: branch.id,
      name: branch.name,
      location: branch.location,
      googleReviewLink: branch.googleReviewLink || "",
    });
    setBranches(
      branches.map((b) => (b.id === branch.id ? { ...b, isEditing: true } : b))
    );
  };

  const cancelEditing = (id: string) => {
    setBranches(
      branches.map((b) => (b.id === id ? { ...b, isEditing: false } : b))
    );
  };

  const saveEditing = async (id: string) => {
    if (!editData.name.trim() || !editData.location.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const updatedBranches = branches.map((branch) =>
        branch.id === id
          ? {
              ...branch,
              name: editData.name.trim(),
              location: editData.location.trim(),
              googleReviewLink: editData.googleReviewLink.trim(),
              isEditing: false,
            }
          : branch
      );
      await updateFirebaseBranches(updatedBranches);
      setBranches(updatedBranches);
      toast.success("Branch updated successfully");
    } catch (error) {
      toast.error("Failed to update branch");
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format plan name for display
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

  // Render plan details
  const renderPlanDetails = () => {
    if (!userPlan) return null;
    
    const planName = formatPlanName(userPlan.plan);
    let planDescription = "";
    let upgradeButtonText = "Upgrade Plan";
    
    switch (userPlan.plan) {
      case "none":
        planDescription = "1 branches included";
        break;
      case "plan_basic":
        planDescription = "3 branches included";
        break;
      case "plan_pro":
        planDescription = "5 branches included";
        break;
      case "plan_premium":
        planDescription = "Unlimited branches";
        break;
        case "starter":
        planDescription = "3 branches included";
        break;
        case "professional":
        planDescription = "5 branches included";
        break;
        case "custom":
        planDescription = "Unlimited branches";
        break;
      default:
        planDescription = userPlan.trialActive 
          ? "1 branch during trial" 
          : "No active plan";
    }

    // Check if subscription is active but expired
    let subscriptionStatus = "";
    if (userPlan.subscriptionEndDate && userPlan.subscriptionEndDate < new Date()) {
      subscriptionStatus = " (Expired)";
      upgradeButtonText = "Renew Plan";
    }

    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {planName} Plan{subscriptionStatus}
            </h3>
            <p className="text-gray-700">
              Branch usage: {branches.length} / {branchLimit === 1000 ? "Unlimited" : branchLimit}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {planDescription}
              {userPlan.trialActive && userPlan.trialDaysLeft !== undefined && (
                <span> - {userPlan.trialDaysLeft} days left in trial</span>
              )}
              {userPlan.subscriptionEndDate && userPlan.subscriptionActive && (
                <span> - Renews on {userPlan.subscriptionEndDate.toLocaleDateString()}</span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => router("/#pricing")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-700 hover:to-green-800"
          >
            {userPlan.subscriptionActive ? "Manage Plan" : upgradeButtonText}
          </Button>
        </div>
      </div>
    );
  };

  if (loading || planLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar/>
        <div className="flex-1 md:ml-64 p-4 md:p-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>Loading branches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to manage branches
            </p>
            <Button onClick={() => router("/login")}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-4 md:p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {!isOnline && (
            <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-sm rounded-md">
              You are currently offline. Changes will sync when you reconnect.
            </div>
          )}

          {userPlan?.trialActive && userPlan.trialDaysLeft !== undefined && userPlan.trialDaysLeft > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    You're currently on a free trial ({userPlan.trialDaysLeft} days remaining). 
                    You can upgrade now to continue uninterrupted service after your trial ends.
                  </p>
                </div>
              </div>
            </div>
          )}

          {branchLimitReached && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-5 w-5 text-orange-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    You've reached your branch limit ({branchLimit} branch{userPlan?.plan === "plan_basic" ? "" : "es"}). 
                    Upgrade your plan to add more locations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Details Card */}
          {renderPlanDetails()}

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Branches</h1>
              <p className="text-sm text-muted-foreground">
                Manage your business branches
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-accent/10 px-3 py-1 rounded-full border">
                <MapPinIcon className="h-4 w-4 mr-1.5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {branches.length}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  of {branchLimit === 1000 ? "Unlimited" : branchLimit}
                </span>
              </div>
              <Button
                onClick={() => setIsAdding(true)}
                size="sm"
                className="h-9"
                disabled={branchLimitReached}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search branches..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdding && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Add New Branch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter branch name"
                    value={newBranch.name}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Branch Location <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter full address"
                    value={newBranch.location}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Google Review Link
                  </label>
                  <Input
                    placeholder="https://g.page/review?link=..."
                    value={newBranch.googleReviewLink}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, googleReviewLink: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Optional - Add a direct link to this branch's Google reviews
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddBranch}>
                    Add Branch
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => (
                <Card key={branch.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-3">
                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${
                                branch.isActive
                                  ? "text-green-500 hover:text-green-600"
                                  : "text-red-500 hover:text-red-600"
                              }`}
                              onClick={() => toggleActiveStatus(branch.id)}
                            >
                              <PowerIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {branch.isActive
                              ? "Deactivate branch"
                              : "Activate branch"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="flex-1 min-w-0">
                        {branch.isEditing ? (
                          <Input
                            name="name"
                            value={editData.name}
                            onChange={handleEditChange}
                            className="text-base font-medium h-8"
                          />
                        ) : (
                          <CardTitle className="text-base font-medium flex items-center truncate">
                            {branch.name}
                            <Badge
                              variant={
                                branch.isActive ? "default" : "secondary"
                              }
                              className="ml-2 text-xs"
                            >
                              {branch.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                        )}
                        {branch.isEditing ? (
                          <Input
                            name="location"
                            value={editData.location}
                            onChange={handleEditChange}
                            className="text-sm mt-1 h-8"
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground truncate">
                            {branch.location.split(",")[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleExpand(branch.id)}
                            >
                              {branch.isExpanded ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {branch.isExpanded
                              ? "Collapse details"
                              : "Expand details"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {branch.isEditing ? (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-green-500 hover:text-green-600"
                                  onClick={() => saveEditing(branch.id)}
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Save changes</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600"
                                  onClick={() => cancelEditing(branch.id)}
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cancel editing</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-500 hover:text-blue-600"
                                  onClick={() => startEditing(branch)}
                                  disabled={!branch.isActive}
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {branch.isActive
                                  ? "Edit branch"
                                  : "Activate to edit"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteBranch(branch.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete branch</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </CardHeader>

                  {branch.isExpanded && (
                    <CardContent className="p-3 pt-0 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">
                            Full Address
                          </h4>
                          {branch.isEditing ? (
                            <Input
                              name="location"
                              value={editData.location}
                              onChange={handleEditChange}
                              className="text-sm h-8"
                            />
                          ) : (
                            <p className="text-sm">{branch.location}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">
                            Added On
                          </h4>
                          <p className="text-sm">
                            {formatDate(branch.createdAt)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">
                            Status
                          </h4>
                          <p className="text-sm">
                            {branch.isActive ? (
                              <span className="text-green-500">Active</span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">
                            Branch ID
                          </h4>
                          <p className="text-sm">{branch.id}</p>
                        </div>
                        
                        {/* Google Review Link Section */}
                        <div className="md:col-span-2">
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Google Review Link
                          </h4>
                          {branch.isEditing ? (
                            <Input
                              name="googleReviewLink"
                              value={editData.googleReviewLink}
                              onChange={handleEditChange}
                              className="text-sm h-8"
                              placeholder="https://g.page/review?link=..."
                            />
                          ) : branch.googleReviewLink ? (
                            <a 
                              href={branch.googleReviewLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline truncate block"
                            >
                              {branch.googleReviewLink}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No review link added</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No branches found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? "No branches match your search"
                      : "Get started by adding your first branch"}
                  </p>
                  <Button 
                    onClick={() => setIsAdding(true)}
                    disabled={branchLimitReached}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}