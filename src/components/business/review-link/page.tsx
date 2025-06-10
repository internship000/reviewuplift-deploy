"use client"

import { useState, useRef, useEffect } from "react"
import { Edit, Mountain, Star, Upload, ChevronRight, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Sidebar from "@/components/sidebar"
import ConfirmDialog from "@/components/confirm-dialog"
import { useNavigate } from "react-router-dom"
import { Textarea } from "@/components/ui/textarea"
import { auth, db, storage } from "@/firebase/firebase"
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { motion } from "framer-motion"
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner"

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
  emailVerified: boolean;
  phoneVerified: boolean;
  branches: Array<{ name: string; location: string }>;
  googleReviewLink: string;
}

const initialState = {
  businessName: "",
  previewText: "",
  previewImage: null as string | null,
  logoImage: null as string | null,
  reviewLinkUrl: "",
  isReviewGatingEnabled: true,
  rating: 0,
  welcomeTitle: "",
  welcomeText: ""
}

export default function ReviewLinkPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviewLinkUrl, setReviewLinkUrl] = useState("")
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [tempBusinessSlug, setTempBusinessSlug] = useState("")
  const [isReviewGatingEnabled, setIsReviewGatingEnabled] = useState(true)
  const [showGatingConfirm, setShowGatingConfirm] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [welcomeTitle, setWelcomeTitle] = useState("")
  const [welcomeText, setWelcomeText] = useState("")
  const [isEditingPreview, setIsEditingPreview] = useState(false)
  const [tempBusinessName, setTempBusinessName] = useState("")
  const [tempPreviewText, setTempPreviewText] = useState("")
  const [tempWelcomeTitle, setTempWelcomeTitle] = useState("")
  const [tempWelcomeText, setTempWelcomeText] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    branchname: '',
    review: ''
  })
  const [formErrors, setFormErrors] = useState({
    name: false,
    phone: false,
    email: false,
    branchname: false,
    review: false
  })
  const [submitted, setSubmitted] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [previewImageUploading, setPreviewImageUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [googleReviewLink, setGoogleReviewLink] = useState("")
  const [oldPreviewImageUrl, setOldPreviewImageUrl] = useState<string | null>(null)
  const [oldLogoImageUrl, setOldLogoImageUrl] = useState<string | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setCurrentUser(user);
      try {
        // First, load the user's business info
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let businessNameFromInfo = "";
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const businessInfoData = userData.businessInfo || {};
          setBusinessInfo(businessInfoData);
          setGoogleReviewLink(businessInfoData.googleReviewLink || "");
          
          // Get business name from businessInfo if available
          businessNameFromInfo = businessInfoData.businessName || "";
        }

        // Then load the review link config
        const docRef = doc(db, "review_link", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Use business name from businessInfo if available, otherwise from review_link
          const finalBusinessName = businessNameFromInfo || data.businessName || "";
          setBusinessName(finalBusinessName);
          setTempBusinessName(finalBusinessName);
          
          setPreviewText(data.previewText || "");
          setWelcomeTitle(data.welcomeTitle || "");
          setWelcomeText(data.welcomeText || "");
          setPreviewImage(data.previewImage || null);
          setLogoImage(data.logoImage || null);
          setIsReviewGatingEnabled(data.isReviewGatingEnabled ?? true);
          
          setOldPreviewImageUrl(data.previewImage || null);
          setOldLogoImageUrl(data.logoImage || null);
          
          let reviewUrl = data.reviewLinkUrl;
          if (!reviewUrl) {
            const slug = finalBusinessName 
              ? finalBusinessName.toLowerCase().replace(/\s+/g, '-')
              : 'your-business';
reviewUrl = `https://reviewuplift-deploy.vercel.app/${slug}`;
          }
          setReviewLinkUrl(reviewUrl);
          setTempBusinessSlug(reviewUrl.replace('https://go.reviewuplift.com/', ''));
        } else {
          // If no review_link doc exists, use business name from businessInfo if available
          const slug = businessNameFromInfo 
            ? businessNameFromInfo.toLowerCase().replace(/\s+/g, '-')
            : 'your-business';
setReviewLinkUrl(`https://reviewuplift-deploy.vercel.app/${slug}`);
          setTempBusinessSlug(slug);
          setBusinessName(businessNameFromInfo || "");
          setTempBusinessName(businessNameFromInfo || "");
        }
      } catch (error) {
        console.error("Error loading config:", error);
        toast.error("Failed to load configuration");
      } finally {
        setLoading(false);
      }
    }
  });
  
  return () => unsubscribe();
}, []);


  useEffect(() => {
    if (!currentUser || loading) return;
    
    const saveConfig = async () => {
      try {
        const config = {
          businessName,
          previewText,
          previewImage,
          logoImage,
          reviewLinkUrl,
          isReviewGatingEnabled,
          welcomeTitle,
          welcomeText,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "review_link", currentUser.uid), config, { merge: true });
      } catch (error) {
        console.error("Error saving config:", error);
        toast.error("Failed to save configuration");
      }
    };
    
    const timeoutId = setTimeout(saveConfig, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    businessName,
    previewText,
    previewImage,
    logoImage,
    reviewLinkUrl,
    isReviewGatingEnabled,
    welcomeTitle,
    welcomeText,
    currentUser,
    loading
  ]);

  const handleUrlEdit = () => {
    if (isEditingUrl) {
const newUrl = `https://reviewuplift-deploy.vercel.app/${tempBusinessSlug}`
      setReviewLinkUrl(newUrl)
    }
    setIsEditingUrl(!isEditingUrl)
  }

  const handlePreviewEdit = () => {
    if (isEditingPreview) {
      setBusinessName(tempBusinessName)
      setPreviewText(tempPreviewText)
      setWelcomeTitle(tempWelcomeTitle)
      setWelcomeText(tempWelcomeText)
    } else {
      setTempBusinessName(businessName)
      setTempPreviewText(previewText)
      setTempWelcomeTitle(welcomeTitle)
      setTempWelcomeText(welcomeText)
    }
    setIsEditingPreview(!isEditingPreview)
  }

  // Improved image upload handler
   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setPreviewImageUploading(true);
    try {
      const extension = file.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${extension}`;
      const storageRefPath = `users/${currentUser.uid}/preview-images/${uniqueFilename}`;
      const storageRefInstance = ref(storage, storageRefPath);

      await uploadBytes(storageRefInstance, file);
      const url = await getDownloadURL(storageRefInstance);
      setPreviewImage(url);
      toast.success("Preview image uploaded!");

      if (oldPreviewImageUrl) {
        try {
          const oldRef = ref(storage, oldPreviewImageUrl);
          await deleteObject(oldRef);
        } catch (err) {
          console.warn("Failed to delete old preview image", err);
        }
      }
      setOldPreviewImageUrl(storageRefPath);
    } catch (err) {
      console.error("Error uploading preview image:", err);
      toast.error("Upload failed.");
    } finally {
      setPreviewImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ✅ Upload logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid logo type. Use JPG, PNG, WEBP, or SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo too large. Max 2MB.");
      return;
    }

    setLogoUploading(true);
    try {
      const extension = file.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${extension}`;
      const storageRefPath = `users/${currentUser.uid}/logos/${uniqueFilename}`;
      const storageRefInstance = ref(storage, storageRefPath);

      await uploadBytes(storageRefInstance, file);
      const url = await getDownloadURL(storageRefInstance);
      setLogoImage(url);
      toast.success("Logo uploaded!");

      if (oldLogoImageUrl) {
        try {
          const oldRef = ref(storage, oldLogoImageUrl);
          await deleteObject(oldRef);
        } catch (err) {
          console.warn("Failed to delete old logo", err);
        }
      }
      setOldLogoImageUrl(storageRefPath);
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("Upload failed.");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };
  
  // Improved image deletion
  const handleDeleteImage = async () => {
    if (previewImage) {
      try {
        const imageRef = ref(storage, previewImage);
        await deleteObject(imageRef);
        setPreviewImage(null);
        setOldPreviewImageUrl(null);
        toast.success("Image removed successfully");
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("Failed to remove image");
      }
    } else {
      setPreviewImage(null);
    }
  }

  // Improved logo deletion
  const handleDeleteLogo = async () => {
    if (logoImage) {
      try {
        const logoRef = ref(storage, logoImage);
        await deleteObject(logoRef);
        setLogoImage(null);
        setOldLogoImageUrl(null);
        toast.success("Logo removed successfully");
      } catch (error) {
        console.error("Error deleting logo:", error);
        toast.error("Failed to remove logo");
      }
    } else {
      setLogoImage(null);
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const triggerLogoInput = () => {
    logoInputRef.current?.click()
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormErrors(prev => ({ ...prev, [name]: false }))
  }

  const validateForm = () => {
    const errors = {
      name: !formData.name.trim(),
      phone: !formData.phone.trim(),
      email: !formData.email.trim(),
      branchname: !formData.branchname.trim(),
      review: !formData.review.trim()
    }
    setFormErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  const saveNegativeReview = async () => {
    if (!currentUser) return;
    
    try {
      const reviewData = {
        ...formData,
        rating,
        businessName,
        createdAt: serverTimestamp(),
        status: 'pending',
        userId: currentUser.uid
      };
      
      // Add to user-specific reviews collection
      await addDoc(
        collection(db, "users", currentUser.uid, "reviews"), 
        reviewData
      );
      
      setSubmitted(true);
      setSubmissionMessage("We're sorry to hear about your experience. Thank you for your feedback.");
    } catch (error) {
      console.error("Error saving negative review:", error);
      setSubmissionMessage("There was an error submitting your feedback. Please try again.");
    }
  }

  const handleLeaveReview = async () => {
    if (rating === 0) return
    
    if (!isReviewGatingEnabled) {
      window.open(reviewLinkUrl, "_blank")
      return
    }

    // NEW: Use Google review link if available and rating >=4
    if (rating >= 4) {
      const url = googleReviewLink || reviewLinkUrl;
      window.open(url, "_blank")
      return
    }

    if (!showForm) {
      setShowForm(true)
      return
    }

    if (!validateForm()) return

    await saveNegativeReview();
  }

  const handleToggleReviewGating = () => {
    if (isReviewGatingEnabled) {
      setShowGatingConfirm(true)
    } else {
      setIsReviewGatingEnabled(true)
    }
  }

  const confirmDisableGating = () => {
    setIsReviewGatingEnabled(false)
    setShowGatingConfirm(false)
  }

  const navigateToPreviewPage = () => {
    navigate('/review')
  }

  const resetForm = () => {
    setRating(0)
    setShowForm(false)
    setSubmitted(false)
    setSubmissionMessage("")
    setFormData({
      name: '',
      phone: '',
      email: '',
      branchname: '',
      review: ''
    })
    setFormErrors({
      name: false,
      phone: false,
      email: false,
      branchname: false,
      review: false
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your review settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <motion.h1 
            className="text-3xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Review Link
          </motion.h1>
          <p className="text-muted-foreground mb-8">
            Customize the behavior, text, and images of your Review Link.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="border-orange-200 shadow-lg transition-all hover:shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-bold text-orange-800">Edit Review Link URL</CardTitle>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUrlEdit}
                        aria-label={isEditingUrl ? "Save URL" : "Edit URL"}
                        className="group transition-all hover:bg-orange-100"
                      >
                        <Edit className="h-4 w-4 mr-2 group-hover:text-orange-600" aria-hidden="true" />
                        {isEditingUrl ? "Save" : "Edit"}
                      </Button> */}
                    </div>
                    <CardDescription>This is the URL you'll share with customers to collect reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditingUrl ? (
                      <div className="space-y-4">
                        <div className="flex items-center">
<span className="whitespace-nowrap mr-2">https://reviewuplift-deploy.vercel.app/</span>
                          <Input
                            value={tempBusinessSlug}
                            onChange={(e) => setTempBusinessSlug(e.target.value)}
                            aria-label="Review link business slug"
                            className="flex-1 border-orange-200 focus:ring-2 focus:ring-orange-300"
                            placeholder="your-business"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{reviewLinkUrl}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild className="border-orange-200 hover:bg-orange-50">
                            <a
                              href={reviewLinkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Test review link in new window"
                            >
                              Test Link
                            </a>
                          </Button>
                         
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-orange-200 shadow-lg transition-all hover:shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold text-orange-800">Review Gating (Star Filter)</CardTitle>
                    <CardDescription>
                      When enabled, only customers with positive experiences (4-5 stars) will be directed to leave public
                      reviews. Negative reviews will be collected privately.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="review-gating">{isReviewGatingEnabled ? "Enabled" : "Disabled"}</Label>
                        {isReviewGatingEnabled ? (
                          <p className="text-sm text-muted-foreground">
                            Negative reviews will be sent to your feedback form
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            All reviews will be sent to public review sites
                          </p>
                        )}
                      </div>
                      <Switch
                        id="review-gating"
                        checked={isReviewGatingEnabled}
                        onCheckedChange={handleToggleReviewGating}
                        aria-label="Toggle review gating"
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="border-orange-200 shadow-lg transition-all hover:shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-bold text-orange-800">Preview Editor</CardTitle>
                      <Button
                        variant="outline"
                        onClick={handlePreviewEdit}
                        aria-label={isEditingPreview ? "Save preview" : "Edit preview"}
                        className="border-orange-200 hover:bg-orange-50"
                      >
                        {isEditingPreview ? "Save Preview" : "Edit Preview"}
                      </Button>
                    </div>
                    <CardDescription>Customize how your review collection page looks to customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditingPreview ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="business-name">Business Name</Label>
                          <Input
                            id="business-name"
                            value={tempBusinessName}
                            onChange={(e) => setTempBusinessName(e.target.value)}
                            aria-label="Business name"
                            placeholder="Enter your business name"
                            className="border-orange-200 focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="welcome-title">Welcome Title</Label>
                          <Input
                            id="welcome-title"
                            value={tempWelcomeTitle}
                            onChange={(e) => setTempWelcomeTitle(e.target.value)}
                            aria-label="Welcome title"
                            placeholder="Enter welcome title"
                            className="border-orange-200 focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="welcome-text">Welcome Text</Label>
                          <Textarea
                            id="welcome-text"
                            value={tempWelcomeText}
                            onChange={(e) => setTempWelcomeText(e.target.value)}
                            aria-label="Welcome text"
                            placeholder="Enter welcome message"
                            className="border-orange-200 focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preview-text">Preview Text</Label>
                          <Input
                            id="preview-text"
                            value={tempPreviewText}
                            onChange={(e) => setTempPreviewText(e.target.value)}
                            aria-label="Preview text"
                            placeholder="Enter preview text"
                            className="border-orange-200 focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="business-image">Business Image</Label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                            aria-label="Upload business image"
                          />
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              onClick={triggerFileInput}
                              disabled={previewImageUploading}
                              aria-label="Upload business image"
                              className="border-orange-200 hover:bg-orange-50"
                            >
                              {previewImageUploading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading...
                                </span>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Upload Image
                                </>
                              )}
                            </Button>
                            {previewImage && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleDeleteImage}
                                aria-label="Delete business image"
                                className="border-orange-200 hover:bg-orange-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                Remove
                              </Button>
                            )}
                          </div>
                          {previewImage && (
                            <div className="mt-2">
                              <img
                                src={previewImage}
                                alt="Current business image"
                                className="w-20 h-20 object-cover rounded-lg border border-orange-200 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="business-logo">Business Logo</Label>
                          <input
                            type="file"
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                            aria-label="Upload business logo"
                          />
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              onClick={triggerLogoInput}
                              disabled={logoUploading}
                              aria-label="Upload business logo"
                              className="border-orange-200 hover:bg-orange-50"
                            >
                              {logoUploading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading...
                                </span>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Upload Logo
                                </>
                              )}
                            </Button>
                            {logoImage && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleDeleteLogo}
                                aria-label="Delete business logo"
                                className="border-orange-200 hover:bg-orange-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                Remove
                              </Button>
                            )}
                          </div>
                          {logoImage && (
                            <div className="mt-2">
                              <img
                                src={logoImage}
                                alt="Current business logo"
                                className="w-20 h-20 object-contain rounded-lg border border-orange-200 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Click "Edit Preview" to customize your review collection page
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card className="border-orange-200 shadow-lg transition-all hover:shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
                      <CardTitle className="text-xl font-bold text-orange-800">Live Preview</CardTitle>
                      <CardDescription>How customers will see your review page</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div 
                        className="w-full bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
                        style={{ maxHeight: 'calc(100vh - 200px)' }}
                      >
                        <div 
                          ref={previewRef}
                          className="overflow-y-auto"
                        >
                          <div className="w-full bg-gradient-to-b from-orange-50 to-orange-100 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRjk4MDAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwYzExLjA0NiAwIDIwIDguOTU4IDIwIDIwSDBWMHoiLz48cGF0aCBkPSJNNDAgNDBjLTExLjA0NiAwLTIwLTguOTU0LTIwLTIwSDB2MjBjMCAxMS4wNDYgOC45NTQgMjAgMjAgMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
                            <div className="relative h-full flex flex-col justify-center items-center p-6">
                              {previewImage ? (
                                <motion.div 
                                  className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden shadow-2xl"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <img
                                    src={previewImage}
                                    alt={businessName}
                                    className="w-full h-full object-cover"
                                  />
                                </motion.div>
                              ) : (
                                <motion.div 
                                  className="w-full max-w-xs aspect-square rounded-2xl bg-white shadow-2xl flex items-center justify-center"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="text-center p-6">
                                    <Mountain className="h-16 w-16 mx-auto text-orange-500 mb-4" />
<h3 className="text-xl font-bold text-gray-800">{businessName || "Your Business"}</h3>                                  </div>
                                </motion.div>
                              )}
                              <div className="mt-6 text-center max-w-xs">
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">{welcomeTitle || "We value your opinion!"}</h3>
                                <p className="text-gray-600">
                                  {welcomeText || "Share your experience and help us improve"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="w-full bg-white p-6 flex flex-col justify-center">
                            <div className="max-w-xs mx-auto w-full">
                              {submitted ? (
                                <div className="text-center space-y-4">
                                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                    <p className="text-gray-700 font-medium">
                                      {submissionMessage}
                                    </p>
                                  </div>
                                  <Button 
                                    onClick={resetForm}
                                    variant="outline"
                                    className="border-orange-200 hover:bg-orange-50"
                                  >
                                    Leave Another Review
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  {logoImage && (
                                    <div className="flex justify-center mb-4">
                                      <img 
                                        src={logoImage} 
                                        alt={`${businessName} Logo`} 
                                        className="h-16 object-contain"
                                      />
                                    </div>
                                  )}
                                  <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Rate Your Experience</h2>
                                    <p className="text-gray-600">{previewText || "How was your experience?"}</p>
                                  </div>

                                  <div className="mb-6">
                                    <div className="flex justify-center space-x-1 mb-4">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <motion.button
                                          key={star}
                                          onClick={() => setRating(star)}
                                          onMouseEnter={() => setHoveredStar(star)}
                                          onMouseLeave={() => setHoveredStar(0)}
                                          className={`p-1 rounded-full transition-all ${
                                            star <= (hoveredStar || rating) ? 'bg-orange-50' : 'hover:bg-gray-50'
                                          }`}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <Star
                                            className={`h-8 w-8 ${
                                              star <= (hoveredStar || rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        </motion.button>
                                      ))}
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                      <span>Not satisfied</span>
                                      <span>Very satisfied</span>
                                    </div>

                                    {rating > 0 && (
                                      <motion.div 
                                        className={`mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <p className="text-gray-700 font-medium text-center flex items-center justify-center text-sm">
                                          {rating >= 4 ? (
                                            <>
                                              <ThumbsUp className="mr-2 text-green-500 h-4 w-4" />
                                              We're glad you enjoyed your meal!
                                            </>
                                          ) : (
                                            <>
                                              <ThumbsDown className="mr-2 text-orange-500 h-4 w-4" />
                                              We're sorry to hear that. We'll use your feedback to improve.
                                            </>
                                          )}
                                        </p>
                                      </motion.div>
                                    )}
                                  </div>

                                  {showForm && rating <= 3 && isReviewGatingEnabled && (
                                    <motion.div 
                                      className="mb-4 space-y-3"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <div>
                                        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                                          Your Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          id="name"
                                          name="name"
                                          value={formData.name}
                                          onChange={handleInputChange}
                                          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                            formErrors.name ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                          required
                                        />
                                        {formErrors.name && (
                                          <p className="mt-1 text-xs text-red-500">This field is required</p>
                                        )}
                                      </div>

                                      <div>
                                        <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                                          Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="tel"
                                          id="phone"
                                          name="phone"
                                          value={formData.phone}
                                          onChange={handleInputChange}
                                          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                            formErrors.phone ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                          required
                                        />
                                        {formErrors.phone && (
                                          <p className="mt-1 text-xs text-red-500">This field is required</p>
                                        )}
                                      </div>

                                      <div>
                                        <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                                          Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="email"
                                          id="email"
                                          name="email"
                                          value={formData.email}
                                          onChange={handleInputChange}
                                          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                            formErrors.email ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                          required
                                        />
                                        {formErrors.email && (
                                          <p className="mt-1 text-xs text-red-500">This field is required</p>
                                        )}
                                      </div>
                                      <div>
                                        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                                          Branch Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          id="branchname"
                                          name="branchname"
                                          value={formData.branchname}
                                          onChange={handleInputChange}
                                          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                            formErrors.branchname ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                          required
                                        />
                                        {formErrors.branchname && (
                                          <p className="mt-1 text-xs text-red-500">This field is required</p>
                                        )}
                                      </div>

                                      <div>
                                        <label htmlFor="review" className="block text-xs font-medium text-gray-700 mb-1">
                                          Your Review <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                          id="review"
                                          name="review"
                                          rows={2}
                                          value={formData.review}
                                          onChange={handleInputChange}
                                          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                            formErrors.review ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                          required
                                        ></textarea>
                                        {formErrors.review && (
                                          <p className="mt-1 text-xs text-red-500">This field is required</p>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}

                                  <motion.button
                                    onClick={handleLeaveReview}
                                    disabled={rating === 0}
                                    className={`
                                      w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center
                                      transition-all duration-300 text-sm
                                      ${rating === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                                      }
                                    `}
                                    whileHover={{ scale: rating === 0 ? 1 : 1.02 }}
                                    whileTap={{ scale: rating === 0 ? 1 : 0.98 }}
                                  >
                                    {rating > 0 ? 
                                      (rating >= 4 ? 'Continue to Review' : 
                                      (showForm ? 'Submit Your Feedback' : 'Continue to Feedback')) : 
                                      'Select a Rating to Continue'}
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                  </motion.button>
                                </>
                              )}

                              <p className="text-xs text-gray-400 mt-4 text-center">
                                Powered by <span className="font-medium">ReviewUplift</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showGatingConfirm}
        onClose={() => setShowGatingConfirm(false)}
        onConfirm={confirmDisableGating}
        title="Disable Review Gating"
        description="Are you sure you want to disable review gating? All customers will be directed to leave public reviews regardless of their rating."
        confirmText="Disable"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}