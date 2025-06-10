import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const auth = getAuth();
  
  // Check if current route is a registration or business form page
  const isSimplifiedNavPage = 
    location.pathname.startsWith("/register") || 
    location.pathname.startsWith("/businessform");

  // Check authentication state and user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsAdmin(userData?.role === "ADMIN");
          } else {
            console.log("User document not found");
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(false);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, location]);

  const handleNavClick = (hash: string) => {
    if (isHomePage) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${hash}`);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setIsAdmin(false);
      navigate("/");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse bg-gray-200 h-6 w-40 rounded" />
            <div className="flex space-x-4">
              <div className="animate-pulse bg-gray-200 h-9 w-24 rounded" />
              <div className="animate-pulse bg-gray-200 h-9 w-24 rounded" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Simplified navbar for registration and business form pages
  if (isSimplifiedNavPage) {
    return (
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-orange-600 font-extrabold text-xl">ReviewUplift</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <Button 
                  variant="outline" 
                  className="border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-orange-600 font-extrabold text-xl">ReviewUplift</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => handleNavClick("features")} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600">Features</button>
            <button onClick={() => handleNavClick("how-it-works")} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600">How It Works</button>
            <button onClick={() => handleNavClick("pricing")} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600">Pricing</button>
            <button onClick={() => handleNavClick("testimonials")} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600">Testimonials</button>
            <button onClick={() => handleNavClick("faq")} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600">FAQ</button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link to={isAdmin ? "/components/admin/dashboard" : "/components/business/dashboard"}>
                  <Button variant="ghost" className=" text-orange-600 hover:text-orange-700">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700">
                    Login
                  </Button>
                </Link>
                <Link to="/payment">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button onClick={() => handleNavClick("features")} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50">Features</button>
          <button onClick={() => handleNavClick("how-it-works")} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50">How It Works</button>
          <button onClick={() => handleNavClick("pricing")} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50">Pricing</button>
          <button onClick={() => handleNavClick("testimonials")} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50">Testimonials</button>
          <button onClick={() => handleNavClick("faq")} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50">FAQ</button>
          <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link to={isAdmin ? "/components/admin/dashboard" : "/components/business/dashboard"}>
                  <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:text-orange-700 hover:border-orange-700">
                    Login
                  </Button>
                </Link>
                <Link to="/payment">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;