import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeSlide, setFadeSlide] = useState(true);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Owner, The Beauty Spa",
      content:
        "ReviewUplift has completely transformed our customer feedback process. We've seen a 230% increase in positive reviews within just three months of using the platform.",
      image: "/placeholder.svg",
      stars: 5,
    },
    {
      name: "Michael Chen",
      role: "Director, Chen's Restaurant Group",
      content:
        "Managing reviews across our 5 restaurant locations used to be a nightmare. Now with ReviewUplift, we can monitor and respond to all reviews from one dashboard. Our overall rating has increased from 3.8 to 4.6!",
      image: "/placeholder.svg",
      stars: 5,
    },
    {
      name: "Jennifer Williams",
      role: "Marketing Manager, City Dental",
      content:
        "The automated review collection campaigns have been a game-changer for us. We're now collecting 5x more reviews than before, and our new patients frequently mention they chose us because of our stellar online reviews.",
      image: "/placeholder.svg",
      stars: 5,
    },
  ];

  const goToIndex = (index: number) => {
    setFadeSlide(false);
    setTimeout(() => {
      setActiveIndex(index);
      setFadeSlide(true);
    }, 300);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      goToIndex((activeIndex + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-16">
          <p className="text-base text-orange-600 font-semibold tracking-wide uppercase">
            Testimonials
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            What our customers are saying
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Join thousands of businesses that have improved their online reputation with ReviewUplift.
          </p>
        </div>

        <div className="relative">
          <div
            className={`transition-all duration-700 transform ${
              fadeSlide ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
          >
            <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-100 flex flex-col md:flex-row items-center">
              <div className="md:w-1/3 flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={testimonials[activeIndex].image}
                    alt={testimonials[activeIndex].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:w-2/3 mt-6 md:mt-0">
                <div className="flex mb-2">
                  {[...Array(testimonials[activeIndex].stars)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-800 text-lg italic mb-4">
                  "{testimonials[activeIndex].content}"
                </blockquote>
                <div className="font-medium">
                  <div className="text-orange-600">{testimonials[activeIndex].name}</div>
                  <div className="text-gray-500">{testimonials[activeIndex].role}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                  index === activeIndex ? "bg-orange-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-16 bg-orange-50 rounded-lg p-8 shadow-inner">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              Ready to boost your online reputation?
            </h3>
            <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
              Join thousands of businesses that use ReviewUplift to collect, manage and showcase their customer reviews.
            </p>
            <Link to="/payment">
            <Button className="mt-8 bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg">
              Get Started Free
            </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
