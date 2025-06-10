import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const messages = ["5-Star Reviews", "Customer Trust", "Business Growth"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false); // trigger exit animation
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setAnimate(true); // trigger enter animation
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-b from-white to-orange-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
              <span className="block mb-4">Get More</span>
              <span
                className="block text-orange-600 transition-all duration-500 ease-in-out"
                style={{
                  fontSize: "3rem",
                  fontWeight: "900",
                  height: "4rem",
                  opacity: animate ? 1 : 0,
                  transform: animate ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.5s ease-in-out",
                }}
              >
                {messages[currentIndex]}
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 sm:text-xl">
              Boost your online reputation with our automated review management platform.
              Generate positive reviews, respond to negative feedback, and grow your business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-4">
              <Link to="/payment">
                <Button className="bg-orange-600 hover:bg-orange-700 px-8 py-6 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/demo">
                <Button
                  variant="outline"
                  className="border-orange-600 text-orange-600 px-8 py-6 text-lg hover:text-orange-700 hover:border-orange-700"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 lg:mt-0 lg:col-span-6 flex justify-center items-center">
            <div className="bg-white p-5 rounded-lg shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Sarah Johnson</h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700">
                "ReviewUplift has completely transformed our customer feedback process. Our positive reviews have increased by 230% in just three months!"
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Small Business Owner</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroSection;
