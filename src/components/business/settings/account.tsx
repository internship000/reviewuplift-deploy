"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Sidebar from "@/components/sidebar"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { 
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaGoogle
} from "react-icons/fa"
import { auth, db } from "@/firebase/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged, updatePassword } from "firebase/auth"

interface Branch {
  name: string;
  location: string;
}

interface BusinessData {
  businessName: string
  contactEmail: string
  contactPhone: string
  whatsapp: string
  secondaryEmail: string
  facebook: string
  instagram: string
  linkedin: string
  website: string
  description: string
  businessType: string
  branchCount: string
  customBusinessType: string
  emailVerified: boolean
  phoneVerified: boolean
  branches: Branch[]  // Changed to array of Branch objects
  googleReviewLink: string
}

export default function AccountPage() {
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditingBusiness, setIsEditingBusiness] = useState(false)
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true)
  const [isSavingBusiness, setIsSavingBusiness] = useState(false)
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    whatsapp: "",
    secondaryEmail: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    website: "",
    description: "",
    businessType: "",
    branchCount: "",
    customBusinessType: "",
    emailVerified: false,
    phoneVerified: false,
    branches: [],  // Initialize as empty array
    googleReviewLink: ""
  })

  const [originalBusinessData, setOriginalBusinessData] = useState<BusinessData>({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    whatsapp: "",
    secondaryEmail: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    website: "",
    description: "",
    businessType: "",
    branchCount: "",
    customBusinessType: "",
    emailVerified: false,
    phoneVerified: false,
    branches: [],  // Initialize as empty array
    googleReviewLink: ""
  })

  // Load business data on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadBusinessData(user.uid)
      } else {
        setIsLoadingBusiness(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const loadBusinessData = async (userId: string) => {
    setIsLoadingBusiness(true);
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const businessInfo = userDocSnap.data().businessInfo || {};
        setBusinessData({
          ...businessInfo,
          branches: businessInfo.branches || [],  // Ensure branches array exists
          emailVerified: auth.currentUser?.emailVerified || false,
          phoneVerified: !!businessInfo.contactPhone
        });
        setOriginalBusinessData({
          ...businessInfo,
          branches: businessInfo.branches || [],
          emailVerified: auth.currentUser?.emailVerified || false,
          phoneVerified: !!businessInfo.contactPhone
        });
      } else {
        toast({
          title: "Warning",
          description: "No business data found",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading business data:", error);
      toast({
        title: "Error",
        description: "Failed to load business data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBusiness(false);
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleBusinessChange = (name: string, value: string) => {
    setBusinessData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validatePasswords = () => {
    let isValid = true
    const newErrors = {
      newPassword: '',
      confirmPassword: ''
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
      isValid = false
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
      isValid = false
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
      isValid = false
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswords()) {
      return
    }

    setIsUpdating(true)
    
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Update password directly without reauthentication
      await updatePassword(user, passwordData.newPassword)
      
      toast({
        title: "Success",
        description: "Password updated successfully",
        variant: "default",
      })

      // Reset form
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      let errorMessage = "Failed to update password"
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please login again to change your password"
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBusinessSave = async () => {
    if (!validateBusinessData()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBusiness(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const userDocRef = doc(db, "users", user.uid);
      const finalBusinessType = businessData.businessType === "Other" 
        ? businessData.customBusinessType 
        : businessData.businessType;

      await updateDoc(userDocRef, {
        businessInfo: {
          ...businessData,
          businessType: finalBusinessType,
          branches: businessData.branches  // Ensure branches are saved
        }
      });
      
      setOriginalBusinessData(businessData);
      setIsEditingBusiness(false);
      toast({
        title: "Success",
        description: "Business information updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating business data:", error);
      toast({
        title: "Error",
        description: "Failed to update business information",
        variant: "destructive",
      });
    } finally {
      setIsSavingBusiness(false);
    }
  }

  const handleBusinessCancel = () => {
    setBusinessData(originalBusinessData)
    setIsEditingBusiness(false)
  }

  const validateBusinessData = () => {
    return businessData.businessName.trim() && 
           businessData.contactEmail.trim() && 
           businessData.contactPhone.trim() &&
           businessData.businessType.trim() &&
           businessData.branches.every(branch => branch.name.trim() && branch.location.trim())
  }

  // Handle branch changes
  const handleBranchChange = (index: number, field: keyof Branch, value: string) => {
    const newBranches = [...businessData.branches];
    newBranches[index] = { ...newBranches[index], [field]: value };
    setBusinessData({ ...businessData, branches: newBranches });
  };

  // Add a new branch
  const addBranch = () => {
    setBusinessData({
      ...businessData,
      branches: [...businessData.branches, { name: "", location: "" }]
    });
  };

  // Remove a branch
  const removeBranch = (index: number) => {
    const newBranches = [...businessData.branches];
    newBranches.splice(index, 1);
    setBusinessData({ ...businessData, branches: newBranches });
  };

  if (isLoadingBusiness) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isAdmin={false} />
        <div className="flex-1 md:ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="animate-spin text-2xl text-gray-500" />
            <span className="ml-2 text-gray-500">Loading account information...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={false} />

      <div className="flex-1 md:ml-64 p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Account</h1>
            <p className="text-muted-foreground">Manage the settings of your account</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Business Owner</Label>
                <p className="text-sm text-muted-foreground">{businessData.contactEmail}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Business Information</CardTitle>
              <div className="flex gap-2">
                {isEditingBusiness ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBusinessCancel}
                      disabled={isSavingBusiness}
                    >
                      <FaTimes className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBusinessSave}
                      disabled={isSavingBusiness || !validateBusinessData()}
                    >
                      {isSavingBusiness ? (
                        <>
                          <FaSpinner className="animate-spin w-4 h-4 mr-1" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="w-4 h-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingBusiness(true)}
                  >
                    <FaEdit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Business Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <FaBuilding className="mr-2" />
                  Basic Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    {isEditingBusiness ? (
                      <Input
                        value={businessData.businessName}
                        onChange={(e) => handleBusinessChange('businessName', e.target.value)}
                        placeholder="Enter business name"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">{businessData.businessName || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type *</Label>
                    {isEditingBusiness ? (
                      <Select 
                        value={businessData.businessType} 
                        onValueChange={(value) => handleBusinessChange('businessType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Restaurant">Restaurant</SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                          <SelectItem value="Tech">Tech</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">
                        {businessData.businessType === "Other" ? businessData.customBusinessType : businessData.businessType || "Not provided"}
                      </p>
                    )}
                  </div>
                  {isEditingBusiness && businessData.businessType === "Other" && (
                    <div className="space-y-2">
                      <Label>Custom Business Type</Label>
                      <Input
                        value={businessData.customBusinessType}
                        onChange={(e) => handleBusinessChange('customBusinessType', e.target.value)}
                        placeholder="Specify business type"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Branch Count</Label>
                    {isEditingBusiness ? (
                      <Select 
                        value={businessData.branchCount} 
                        onValueChange={(value) => handleBusinessChange('branchCount', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6+">6+</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">{businessData.branchCount || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Branch Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  Branch Details
                </h4>
                
                {businessData.branches.length === 0 && !isEditingBusiness && (
                  <p className="text-sm p-2 border rounded-md bg-gray-50">No branches provided</p>
                )}
                
                {businessData.branches.map((branch, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium">Branch {index + 1}</h5>
                      {isEditingBusiness && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeBranch(index)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Branch Name *</Label>
                        {isEditingBusiness ? (
                          <Input
                            value={branch.name}
                            onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                            placeholder={`Branch ${index + 1} Name`}
                          />
                        ) : (
                          <p className="text-sm p-2 border rounded-md bg-white">{branch.name || "Not provided"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Location *</Label>
                        {isEditingBusiness ? (
                          <Input
                            value={branch.location}
                            onChange={(e) => handleBranchChange(index, 'location', e.target.value)}
                            placeholder={`Branch ${index + 1} Location`}
                          />
                        ) : (
                          <p className="text-sm p-2 border rounded-md bg-white">{branch.location || "Not provided"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isEditingBusiness && (
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={addBranch}
                  >
                    <FaPlus className="mr-2" />
                    Add Branch
                  </Button>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <FaPhone className="mr-2" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Contact Email *
                      {businessData.emailVerified ? (
                        <FaCheckCircle className="text-green-500 text-sm" title="Verified" />
                      ) : (
                        <FaTimesCircle className="text-red-500 text-sm" title="Not verified" />
                      )}
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="email"
                        value={businessData.contactEmail}
                        onChange={(e) => handleBusinessChange('contactEmail', e.target.value)}
                        placeholder="you@example.com"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">{businessData.contactEmail || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Contact Phone *
                      {businessData.phoneVerified ? (
                        <FaCheckCircle className="text-green-500 text-sm" title="Verified" />
                      ) : (
                        <FaTimesCircle className="text-red-500 text-sm" title="Not verified" />
                      )}
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="tel"
                        value={businessData.contactPhone}
                        onChange={(e) => handleBusinessChange('contactPhone', e.target.value)}
                        placeholder="+1 234 567 890"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">{businessData.contactPhone || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    {isEditingBusiness ? (
                      <Input
                        type="tel"
                        value={businessData.whatsapp}
                        onChange={(e) => handleBusinessChange('whatsapp', e.target.value)}
                        placeholder="+1 234 567 890"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">{businessData.whatsapp || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Email</Label>
                    {isEditingBusiness ? (
                      <Input
                        type="email"
                        value={businessData.secondaryEmail}
                        onChange={(e) => handleBusinessChange('secondaryEmail', e.target.value)}
                        placeholder="secondary@example.com"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50">{businessData.secondaryEmail || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media & Online Presence */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <FaGlobe className="mr-2" />
                  Online Presence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaGoogle className="text-blue-600" />
                      Google Review Link
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="url"
                        value={businessData.googleReviewLink}
                        onChange={(e) => handleBusinessChange('googleReviewLink', e.target.value)}
                        placeholder="https://g.page/r/Cd.../review"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50 break-all">{businessData.googleReviewLink || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaFacebook className="text-blue-600" />
                      Facebook
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="url"
                        value={businessData.facebook}
                        onChange={(e) => handleBusinessChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50 break-all">{businessData.facebook || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaInstagram className="text-pink-600" />
                      Instagram
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="url"
                        value={businessData.instagram}
                        onChange={(e) => handleBusinessChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/yourpage"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50 break-all">{businessData.instagram || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaLinkedin className="text-blue-700" />
                      LinkedIn
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="url"
                        value={businessData.linkedin}
                        onChange={(e) => handleBusinessChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/yourpage"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50 break-all">{businessData.linkedin || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaGlobe className="text-green-600" />
                      Website
                    </Label>
                    {isEditingBusiness ? (
                      <Input
                        type="url"
                        value={businessData.website}
                        onChange={(e) => handleBusinessChange('website', e.target.value)}
                        placeholder="https://yourbusiness.com"
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded-md bg-gray-50 break-all">{businessData.website || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Description */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Business Description</h4>
                <div className="space-y-2">
                  <Label>Description</Label>
                  {isEditingBusiness ? (
                    <Textarea
                      value={businessData.description}
                      onChange={(e) => handleBusinessChange('description', e.target.value)}
                      placeholder="Describe your business..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm p-3 border rounded-md bg-gray-50 min-h-[100px]">
                      {businessData.description || "No description provided"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password *</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">{errors.newPassword}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}