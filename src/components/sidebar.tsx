"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  BarChart3, Settings, Star, LinkIcon, User, MapPin, Users as BusinessUsers,
  LogOut, Menu, ChevronDown, ChevronUp, AlertTriangle, Clock, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "../firebase/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

interface SubscriptionInfo {
  planName: string;
  daysLeft: number;
  endDate: Date | null;
  isActive: boolean;
}

export default function Sidebar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [trialInfo, setTrialInfo] = useState({
    daysLeft: 0,
    isTrial: false,
    trialEnded: false,
    hasSubscription: false
  })
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    planName: '',
    daysLeft: 0,
    endDate: null,
    isActive: false
  })

  const checkUserStatus = useCallback(async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        console.log("No user document found")
        return
      }

      const userData = userSnap.data()
      const now = new Date()
      
      // Check trial status
      let trialEndDate: Date | null = null
      if (userData.trialEndDate?.toDate) {
        trialEndDate = userData.trialEndDate.toDate()
      } else if (userData.trialEndDate?.seconds) {
        trialEndDate = new Date(userData.trialEndDate.seconds * 1000)
      }

      // Check subscription status
      let subscriptionEndDate: Date | null = null
      let planName = ''
      if (userData.subscriptionEndDate?.toDate) {
        subscriptionEndDate = userData.subscriptionEndDate.toDate()
      } else if (userData.subscriptionEndDate?.seconds) {
        subscriptionEndDate = new Date(userData.subscriptionEndDate.seconds * 1000)
      }
      
      if (userData.subscriptionPlan) {
        planName = userData.subscriptionPlan
      }

      if (userData.subscriptionActive && subscriptionEndDate) {
        const subDiffTime = subscriptionEndDate.getTime() - now.getTime()
        const subDiffDays = Math.ceil(subDiffTime / (1000 * 60 * 60 * 24))
        
        setSubscription({
          planName,
          daysLeft: subDiffDays,
          endDate: subscriptionEndDate,
          isActive: true
        })

        setTrialInfo({
          daysLeft: 0,
          isTrial: false,
          trialEnded: false,
          hasSubscription: true
        })
        return
      }

      // Handle trial if no active subscription
      if (trialEndDate && trialEndDate > now) {
        const diffTime = trialEndDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        setTrialInfo({
          daysLeft: diffDays,
          isTrial: true,
          trialEnded: false,
          hasSubscription: false
        })
        
        setSubscription({
          planName: '',
          daysLeft: 0,
          endDate: null,
          isActive: false
        })
        return
      }

      // No active subscription or trial
      setTrialInfo({
        daysLeft: 0,
        isTrial: false,
        trialEnded: true,
        hasSubscription: false
      })
      
      setSubscription({
        planName: '',
        daysLeft: 0,
        endDate: null,
        isActive: false
      })
    } catch (error) {
      console.error("Error checking user status:", error)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    if (location.pathname.includes("/components/business/settings")) {
      setSettingsOpen(true)
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkUserStatus(user.uid)
      }
    })

    return () => unsubscribe()
  }, [location.pathname, checkUserStatus])

  const businessLinks = useMemo(() => [
    { name: "Dashboard", href: "/components/business/dashboard", icon: BarChart3 },
    { name: "Reviews", href: "/components/business/reviews", icon: Star },
    { name: "Review Link", href: "/components/business/review-link", icon: LinkIcon },
    {
      name: "Settings",
      href: "/components/business/settings",
      icon: Settings,
      subLinks: [
        { name: "Account", href: "/components/business/settings/account", icon: User },
        { name: "Locations", href: "/components/business/settings/location", icon: MapPin },
        { name: "Business Users", href: "/components/business/settings/businessusers", icon: BusinessUsers }
      ]
    },
  ], [])

  const handleLogout = useCallback(() => {
    signOut(auth).then(() => {
      window.location.href = "/login"
    })
  }, [])

  const isSettingsActive = useCallback((pathname: string) => 
    pathname.includes("/settings"), [])

  const isSubLinkActive = useCallback((subLinkHref: string) => 
    location.pathname === subLinkHref, [location.pathname])

  const SidebarContent = useCallback(() => {
    const pathname = location.pathname
    const shouldKeepSettingsOpen = businessLinks.some(link => 
      link.subLinks?.some(subLink => 
        location.pathname === subLink.href
      )
    )
    
    useEffect(() => {
      if (shouldKeepSettingsOpen) {
        setSettingsOpen(true)
      }
    }, [shouldKeepSettingsOpen])

    return (
      <div className="h-full flex flex-col pt-12 bg-orange-50 text-orange-900 shadow-md rounded-r-xl overflow-hidden animate-fade-in">
        {/* Main Navigation Links */}
        <div className="flex-1 px-5 py-6 overflow-y-auto">
          <nav className="space-y-2" aria-label="Business navigation">
            {businessLinks.map((link, index) => {
              const isActive = pathname === link.href || (link.name === "Settings" && isSettingsActive(pathname))
              const hasSubLinks = !!link.subLinks
              const isSettingsItem = link.name === "Settings"

              // Disable links if trial has ended and no subscription
              const isDisabled = trialInfo.trialEnded && !subscription.isActive && link.name !== "Settings"

              return (
                <div key={link.name} className="space-y-1">
                  {!hasSubLinks ? (
                    <Link
                      to={isDisabled ? "#" : link.href}
                      className={cn(
                        "group flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-300 ease-in-out transform",
                        isActive
                          ? "bg-orange-500 text-white shadow-md"
                          : isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-orange-100 hover:text-orange-800 hover:translate-x-1"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault()
                          return
                        }
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <link.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        {link.name}
                      </div>
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={cn(
                          "group w-full flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-300 ease-in-out transform",
                          isActive
                            ? "bg-orange-500 text-white shadow-md"
                            : isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-orange-100 hover:text-orange-800 hover:translate-x-1"
                        )}
                        onClick={() => {
                          if (isDisabled) return
                          isSettingsItem ? setSettingsOpen(!settingsOpen) : null
                        }}
                        style={{ animationDelay: `${index * 50}ms` }}
                        disabled={isDisabled}
                      >
                        <div className="flex items-center gap-4">
                          <link.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                          {link.name}
                        </div>
                        {isSettingsItem && (settingsOpen ? (
                          <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ))}
                      </button>

                      {hasSubLinks && (isSettingsItem && (settingsOpen || shouldKeepSettingsOpen)) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {link.subLinks.map((subLink, subIndex) => {
                            const isSubActive = isSubLinkActive(subLink.href)
                            return (
                              <Link
                                key={subLink.name}
                                to={subLink.href}
                                className={cn(
                                  "group flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
                                  isSubActive
                                    ? "bg-orange-400 text-white shadow-md"
                                    : "hover:bg-orange-100 hover:text-orange-800"
                                )}
                                onClick={() => setOpen(false)}
                                style={{ animationDelay: `${(index + subIndex) * 30}ms` }}
                              >
                                <subLink.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                <span>{subLink.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Status and Logout Section */}
        <div className="p-4 space-y-4 border-t border-orange-200">
          {/* Trial Status */}
          {trialInfo.isTrial && !subscription.isActive && (
            <div className="flex items-center gap-3 p-3 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Trial Period</p>
                <p className="text-xs text-orange-700">
                  {trialInfo.daysLeft > 1 
                    ? `${trialInfo.daysLeft} days left`
                    : trialInfo.daysLeft === 1 
                      ? "Last day"
                      : "Ends today"}
                </p>
              </div>
            </div>
          )}

          {/* Subscription Status */}
          {subscription.isActive && (
            <div className="flex items-center gap-3 p-3 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {subscription.planName || 'Active Plan'}
                </p>
                <p className="text-xs text-green-700">
                  {subscription.daysLeft > 1 
                    ? `${subscription.daysLeft} days remaining`
                    : subscription.daysLeft === 1 
                      ? "Renews tomorrow"
                      : "Renews today"}
                </p>
              </div>
            </div>
          )}

          {/* Trial Ended Warning */}
          {trialInfo.trialEnded && !subscription.isActive && (
            <Alert className="bg-red-100 border-red-300">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Trial Expired</AlertTitle>
              <AlertDescription className="text-red-700">
                Please upgrade to continue using the service.
              </AlertDescription>
            </Alert>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 justify-start text-red-600 hover:text-white hover:bg-red-500 px-4 py-2 transition-all duration-300 rounded-lg"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    )
  }, [businessLinks, isSettingsActive, isSubLinkActive, location.pathname, 
      settingsOpen, handleLogout, trialInfo, subscription])

  if (!mounted) return null

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 text-orange-700 bg-white rounded-full shadow-lg border border-orange-200"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 bg-orange-50 text-orange-900 w-64 animate-slide-in-left"
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-orange-200 bg-orange-50">
        <SidebarContent />
      </div>
    </>
  )
}