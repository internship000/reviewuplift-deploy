"use client"
import { useState, useEffect } from "react"
import { SimpleAdminLayout } from "@/components/simple-admin-layout"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, RefreshCw, MoreVertical, Trash2, User, Edit, UserPlus, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { format } from "date-fns"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth"

interface User {
  uid: string;
  displayName: string;
  email: string;
  role: "ADMIN" | "BUSER";
  status: "Active" | "Inactive" | "Deleted";
  createdAt: Date;
  businessName?: string;
  password?: string;
  confirmPassword?: string;
}

interface UserFormData {
  displayName: string;
  email: string;
  role: "ADMIN" | "BUSER" | "";
  status: "Active" | "Inactive" | "Deleted" | "";
  password?: string;
  confirmPassword?: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const auth = getAuth();
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [businessUsers, setBusinessUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    displayName: "",
    email: "",
    role: "",
    status: "Active",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setRefreshing(true)
        const usersCollection = collection(db, "users")
        const usersSnapshot = await getDocs(usersCollection)
        
        const businessData: User[] = []
        const adminData: User[] = []
        
        usersSnapshot.forEach(userDoc => {
          const userData = userDoc.data()
          const createdAt = userData.createdAt?.toDate() || new Date()
          
          const userObj = {
            uid: userDoc.id,
            displayName: userData.displayName || "No Name",
            email: userData.email || "No Email",
            role: userData.role || "BUSER",
            status: userData.status || "Active",
            createdAt,
            businessName: userData.businessInfo?.businessName,
          }
          
          if (userObj.role === "BUSER") {
            businessData.push(userObj)
          } else if (userObj.role === "ADMIN") {
            adminData.push(userObj)
          }
        })
        
        setBusinessUsers(businessData)
        setAdminUsers(adminData)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to fetch users data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
    
    fetchUsers()
    
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const updatedBusinessUsers: User[] = []
      const updatedAdminUsers: User[] = []
      
      snapshot.forEach(userDoc => {
        const userData = userDoc.data()
        const createdAt = userData.createdAt?.toDate() || new Date()
        
        const userObj = {
          uid: userDoc.id,
          displayName: userData.displayName || "No Name",
          email: userData.email || "No Email",
          role: userData.role || "BUSER",
          status: userData.status || "Active",
          createdAt,
          businessName: userData.businessInfo?.businessName,
        }
        
        if (userObj.role === "BUSER") {
          updatedBusinessUsers.push(userObj)
        } else if (userObj.role === "ADMIN") {
          updatedAdminUsers.push(userObj)
        }
      })
      
      setBusinessUsers(updatedBusinessUsers)
      setAdminUsers(updatedAdminUsers)
    }, (error) => {
      console.error("Error listening to users updates:", error)
    })
    
    return () => unsubscribe()
  }, [toast])

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { 
        status: newStatus,
        updatedAt: new Date()
      })
      
      toast({
        title: "Status Updated",
        description: "User status has been changed successfully.",
      });
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { 
        status: "Deleted",
        updatedAt: new Date()
      })
      
      toast({
        title: "User Deleted",
        description: "User has been marked as deleted.",
      });
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const filteredBusinessUsers = businessUsers.filter(
    (user) => (
      (user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.businessName && user.businessName.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (statusFilter === "all" || user.status === statusFilter)
    )
  )
  
  const filteredAdminUsers = adminUsers.filter(
    (user) => (
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:shadow-green-200 transition-shadow"
      case "Inactive":
        return "bg-gray-100 text-gray-800 hover:shadow-gray-200 transition-shadow"
      case "Deleted":
        return "bg-gray-300 text-gray-800 line-through"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      password: "",
      confirmPassword: ""
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingUser(null)
    setFormData({
      displayName: "",
      email: "",
      role: "",
      status: "Active",
      password: "",
      confirmPassword: ""
    })
    setIsDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData({
      displayName: "",
      email: "",
      role: "",
      status: "",
      password: "",
      confirmPassword: ""
    })
  }

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveUser = async () => {
    if (!formData.displayName || !formData.email || !formData.role || !formData.status) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && (!formData.password || !formData.confirmPassword)) {
      toast({
        title: "Validation Error",
        description: "Password is required for new users.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true)
      
      if (editingUser) {
        const userRef = doc(db, "users", editingUser.uid)
        await updateDoc(userRef, {
          displayName: formData.displayName,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          updatedAt: new Date()
        })

        if (formData.password) {
          const user = auth.currentUser;
          if (user && user.email === formData.email) {
            await updatePassword(user, formData.password);
          }
        }

        toast({
          title: "User Updated",
          description: "User details have been updated successfully.",
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password!
        );

        const newUserRef = doc(db, "users", userCredential.user.uid)
        await setDoc(newUserRef, {
          displayName: formData.displayName,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          createdAt: new Date(),
          updatedAt: new Date()
        })

        toast({
          title: "User Created",
          description: "New user has been added successfully.",
        });
      }
      
      closeEditDialog()
    } catch (error: any) {
      console.error("Error saving user:", error)
      let errorMessage = "Failed to save user data.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use by another account.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SimpleAdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="animate-slide-down flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage all users on the platform</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={openAddDialog}>
                <UserPlus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input 
                    placeholder="John Doe" 
                    value={formData.displayName} 
                    onChange={(e) => handleFormChange("displayName", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    placeholder="john@example.com" 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    disabled={!!editingUser}
                  />
                </div>
                
                {!editingUser && (
                  <>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => handleFormChange("password", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Confirm Password *</Label>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        value={formData.confirmPassword} 
                        onChange={(e) => handleFormChange("confirmPassword", e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleFormChange("role", value as "ADMIN" | "BUSER")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="BUSER">Business User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleFormChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      {/* <SelectItem value="Pending">Pending</SelectItem> */}
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeEditDialog} disabled={isSaving}>
                  Cancel
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700" 
                  onClick={handleSaveUser}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-orange-200 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-xl font-bold text-orange-800">Business Users</CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Select onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] border-orange-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    {/* <SelectItem value="Pending">Pending</SelectItem> */}
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-orange-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={handleRefresh}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
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
            ) : filteredBusinessUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No business users found</h3>
                <p className="max-w-md">
                  {searchQuery 
                    ? "No users match your search. Try different keywords." 
                    : "No business users registered yet."}
                </p>
              </div>
            ) : (
              <Table className="rounded-lg overflow-hidden">
                <TableHeader className="bg-orange-50">
                  <TableRow className="hover:bg-orange-50">
                    <TableHead className="font-bold text-orange-800">Name</TableHead>
                    <TableHead className="font-bold text-orange-800">Email</TableHead>
                    <TableHead className="font-bold text-orange-800">Business</TableHead>
                    <TableHead className="font-bold text-orange-800">Status</TableHead>
                    <TableHead className="font-bold text-orange-800">Joined</TableHead>
                    <TableHead className="font-bold text-orange-800 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredBusinessUsers.map((user) => (
                      <motion.tr 
                        key={user.uid}
                        className="border-b border-orange-100 hover:bg-orange-50 transition-all duration-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TableCell className="font-medium group">
                          <span className="group-hover:text-orange-600 transition-colors">
                            {user.displayName}
                          </span>
                        </TableCell>
                        <TableCell className="group">
                          <span className="group-hover:text-orange-500 transition-colors">
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.businessName ? (
                            <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                              {user.businessName}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Badge 
                                className={`${getStatusColor(user.status)} transition-all hover:scale-105 cursor-pointer`}
                              >
                                {user.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Active")}>
                                Active
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Pending")}>
                                Pending
                              </DropdownMenuItem> */}
                              <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Inactive")}>
                                Inactive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Deleted")}>
                                Deleted
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {format(user.createdAt, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.uid)}>
                                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                <span className="text-red-600">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Admin Users Section */}
        <Card className="border-blue-200 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
            <CardTitle className="text-xl font-bold text-blue-800">Admin Users</CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search admins..."
                  className="pl-8 border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={handleRefresh}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-blue-200 h-12 w-12"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-blue-200 rounded w-64"></div>
                    <div className="h-4 bg-blue-200 rounded w-56"></div>
                  </div>
                </div>
              </div>
            ) : filteredAdminUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No admin users found</h3>
                <p className="max-w-md">
                  {searchQuery 
                    ? "No admins match your search." 
                    : "Add new admins using the 'Add User' button."}
                </p>
              </div>
            ) : (
              <Table className="rounded-lg overflow-hidden">
                <TableHeader className="bg-blue-50">
                  <TableRow className="hover:bg-blue-50">
                    <TableHead className="font-bold text-blue-800">Name</TableHead>
                    <TableHead className="font-bold text-blue-800">Email</TableHead>
                    <TableHead className="font-bold text-blue-800">Status</TableHead>
                    <TableHead className="font-bold text-blue-800">Joined</TableHead>
                    <TableHead className="font-bold text-blue-800 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredAdminUsers.map((user) => (
                      <motion.tr 
                        key={user.uid}
                        className="border-b border-blue-100 hover:bg-blue-50 transition-all duration-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TableCell className="font-medium group">
                          <span className="group-hover:text-blue-600 transition-colors">
                            {user.displayName}
                          </span>
                        </TableCell>
                        <TableCell className="group">
                          <span className="group-hover:text-blue-500 transition-colors">
                            {user.email}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Badge 
                                className={`${getStatusColor(user.status)} transition-all hover:scale-105 cursor-pointer`}
                              >
                                {user.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Active")}>
                                Active
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Pending")}>
                                Pending
                              </DropdownMenuItem> */}
                              <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Inactive")}>
                                Inactive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(user.uid, "Deleted")}>
                                Deleted
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {format(user.createdAt, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.uid)}>
                                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                <span className="text-red-600">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SimpleAdminLayout>
  )
}