import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { auth, db, signInWithGoogle } from "../firebase/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from "@radix-ui/react-icons";
import { Eye, EyeOff } from "lucide-react"; // Added eye icons

export default function LoginForm() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trialExpired, setTrialExpired] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [accountInactive, setAccountInactive] = useState(false);
  const [externalError, setExternalError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Added password visibility state
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("uid");
    localStorage.removeItem("role");
  }, []);

  const checkAccountStatus = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    return userData.status === "Active";
  };

  const checkTrialStatus = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    const now = new Date();

    // If user has active subscription
    if (userData.subscriptionActive) return true;

    // If user is still in trial period
    if (userData.trialEndDate && userData.trialEndDate.toDate() > now)
      return true;

    // Trial expired and no active subscription
    return false;
  };

  const redirectUser = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User data not found.");
    }

    const userData = userSnap.data();

    // Check if user is admin
    if (userData.role === "ADMIN") {
      navigate("/components/admin/dashboard");
      return;
    }

    // For non-admin users, check trial status
    const hasActiveAccess = await checkTrialStatus(uid);

    if (!hasActiveAccess) {
      // Show trial expired message instead of immediately redirecting
      setTrialExpired(true);
      return;
    }

    // Proceed to business dashboard or form
    if (userData.businessFormFilled === true) {
      navigate("/components/business/dashboard");
    } else {
      navigate("/businessform");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setExternalError("");
    setTrialExpired(false);
    setAccountInactive(false);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Check account status
      const isActive = await checkAccountStatus(uid);
      if (!isActive) {
        await signOut(auth);
        setAccountInactive(true);
        return;
      }

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User data not found.");
      }

      const userData = userSnap.data();

      // Store role, email, and uid in localStorage
      localStorage.setItem("role", userData.role);
      localStorage.setItem("email", userData.email);
      localStorage.setItem("uid", uid);

      await redirectUser(uid);
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setExternalError("");
    setTrialExpired(false);
    setAccountInactive(false);

    try {
      await signInWithGoogle();
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid;
      if (!uid) throw new Error("User not authenticated");

      // Check account status
      const isActive = await checkAccountStatus(uid);
      if (!isActive) {
        await signOut(auth);
        setAccountInactive(true);
        return;
      }

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setExternalError("Account not found. Please register first.");
        return;
      }

      const userData = userSnap.data();

      // Store role, email, and uid in localStorage
      localStorage.setItem("role", userData.role);
      localStorage.setItem("email", userData.email || "");
      localStorage.setItem("uid", uid);

      await redirectUser(uid);
    } catch (err: any) {
      setExternalError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setExternalError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (accountInactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Card className="w-full max-w-md shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <RocketIcon className="h-4 w-4" />
              <AlertTitle>Account Inactive</AlertTitle>
              <AlertDescription>
                Your account is not active. Please contact support to reactivate your account.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAccountInactive(false);
                setShowEmailForm(false);
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (trialExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Card className="w-full max-w-md shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <RocketIcon className="h-4 w-4" />
              <AlertTitle>Trial Expired</AlertTitle>
              <AlertDescription>
                Your 14-day free trial has ended. Upgrade to a paid plan to
                continue using our services.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => navigate("/pricing")}
            >
              Choose a Plan
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setTrialExpired(false);
                setShowEmailForm(false);
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Card className="w-full max-w-md shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="space-y-4">
            <Alert>
              <RocketIcon className="h-4 w-4" />
              <AlertTitle>Password Reset Email Sent</AlertTitle>
              <AlertDescription>
                We've sent a password reset link to {email}. Please check your inbox.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setResetEmailSent(false);
                setShowForgotPassword(false);
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Card className="w-full max-w-md shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-600 mb-6 text-center">
              Reset Password
            </h2>
            
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Email
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowForgotPassword(false);
                setError("");
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Card className="w-full max-w-md shadow-lg rounded-2xl p-6 bg-white">
        <CardContent>
          <h2 className="text-2xl font-bold text-gray-600 mb-6 text-center">
            Sign In to Your Account
          </h2>

          <Button
            variant="outline"
            className="w-full mb-4 flex items-center justify-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-100"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FcGoogle size={20} /> Continue with Google
          </Button>

          {/* Error message below Google button */}
          {externalError && (
            <div className="mb-4">
              <Alert variant="destructive" className="w-full">
                <RocketIcon className="h-4 w-4" />
                <AlertDescription>
                  {externalError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!showEmailForm && (
            <Button
              variant="outline"
              className="w-full mb-4 border-gray-300 text-gray-700 hover:bg-orange-100"
              onClick={() => setShowEmailForm(true)}
            >
              Continue with Email
            </Button>
          )}

          {showEmailForm && (
            <>
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-300" />
                <span className="mx-4 text-gray-400 text-sm">or</span>
                <div className="flex-grow border-t border-gray-300" />
              </div>

              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-orange-600 hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-sm text-center text-gray-600">
            <p>
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-orange-600 font-medium hover:underline"
              >
                Register now
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}