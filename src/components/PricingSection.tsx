import { Button } from "@/components/ui/button";
import { CheckIcon, StarIcon, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

interface UserPlan {
  trialActive: boolean;
  trialEndDate?: Date;
  trialDaysLeft?: number;
}

const PricingSection = () => {
  const navigate = useNavigate();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const now = new Date();
            const trialEnd = userData.trialEndDate?.toDate();
            const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            setUserPlan({
              trialActive: userData.trialActive || false,
              trialEndDate: trialEnd,
              trialDaysLeft: trialDaysLeft > 0 ? trialDaysLeft : 0
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleContactClick = () => {
    navigate("/contact");
  };

  const plans = [
    {
      name: "Starter",
      price: "$49",
      description:
        "Perfect for small businesses just getting started with review management.",
      features: [
        "3 Business Location",
        "100 Review Requests/Month",
        "Review Monitoring (3 Sites)",
        "Basic Review Widgets",
        "Email Support",
        "Mobile responsive dashboard",
      ],
      cta: "Start Free Trial",
      popular: false,
      monthlyLimit: 100,
    },
    {
      name: "Professional",
      price: "$99",
      description:
        "Ideal for growing businesses that need more advanced features.",
      features: [
        "5 Business Locations",
        "500 Review Requests/Month",
        "Review Monitoring (10 Sites)",
        "Advanced Review Widgets",
        "Custom Branding photos",
        "Priority Email Support",
        "Reviews",
        "Advance Analytics",
      ],
      cta: "Start Free Trial",
      popular: true,
      monthlyLimit: 500,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description:
        "For large businesses with multiple locations and advanced needs.",
      features: [
        "Unlimited Business Locations",
        "Unlimited Review Requests",
        "Review Monitoring (100+ Sites)",
        "Premium Review Widgets",
        "White-labeled Solution",
        "Dedicated Account Manager",
        "Custom Integration",
        "Advanced Analytics",
      ],
      cta: "Contact Sales",
      popular: false,
      monthlyLimit: 0, // Unlimited
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <p className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-orange-100 text-orange-600">
            <StarIcon className="mr-1 h-4 w-4" />
            Pricing Plans
          </p>
          <h2 className="mt-4 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Choose the plan that's right for your business. All plans include a 14-day free trial.
          </p>
        </div>

        {userPlan?.trialActive && userPlan.trialDaysLeft > 0 && (
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 max-w-4xl mx-auto">
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

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.popular ? "ring-2 ring-orange-500 relative transform scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              <div className="px-8 py-10">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-gray-500 ml-1">/month</span>
                  )}
                </div>
                <p className="mt-4 text-gray-500">{plan.description}</p>

                <Button
                  className={`mt-8 w-full py-6 text-lg font-semibold ${
                    plan.popular
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                  onClick={() => {
                    if (plan.cta === "Contact Sales") {
                      handleContactClick();
                    } else {
                      navigate("/payment", {
                        state: {
                          planName: plan.name,
                          price: plan.price.replace('$', ''),
                          planId: plan.name.toLowerCase(),
                          monthlyLimit: plan.monthlyLimit
                        },
                      });
                    }
                  }}
                >
                  {userPlan?.trialActive && plan.cta === "Start Free Trial" 
                    ? "Upgrade Now" 
                    : plan.cta}
                </Button>
              </div>
              <div className="px-8 pt-8 pb-10 bg-gray-50 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-md p-10 border border-orange-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">Need a custom solution?</h3>
            <p className="mt-4 text-gray-700 max-w-3xl mx-auto">
              Contact our sales team to get a custom quote for your specific needs. We offer flexible
              pricing for agencies and multi-location businesses.
            </p>
            <div className="mt-8">
              <Button 
                onClick={handleContactClick} 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 text-lg"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;