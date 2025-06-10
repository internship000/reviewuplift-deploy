import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

const FaqSection = () => {
  const faqs = [
    {
      question: "How does ReviewUplift collect reviews?",
      answer:
        "ReviewUplift sends automated email and SMS requests to your customers asking them to leave a review. You can customize the timing, frequency, and template of these requests to maximize your review collection efforts.",
    },
    {
      question: "Which review platforms do you support?",
      answer:
        "We support all major review platforms including Google, Facebook, Yelp, TripAdvisor, and 100+ industry-specific sites. You can connect all your profiles and monitor them in one dashboard.",
    },
    {
      question: "Can I respond to reviews from ReviewUplift?",
      answer:
        "Yes, you can respond to all reviews from our platform. We also provide AI-powered response suggestions to help you craft the perfect response to both positive and negative reviews.",
    },
    {
      question: "How do I display reviews on my website?",
      answer:
        "ReviewUplift offers customizable widgets that you can embed on your website to showcase your best reviews. You can filter by rating, platform, and more to display only the reviews you want.",
    },
    {
      question: "Do you have a mobile app?",
      answer:
        "Yes, we have mobile apps for both iOS and Android so you can manage your reviews on the go. You'll receive real-time notifications when you get new reviews and can respond directly from the app.",
    },
    {
      question: "How long is the free trial?",
      answer:
        "We offer a 14-day free trial for all paid plans. No credit card is required to start your trial, and you can cancel anytime.",
    },
    {
      question: "Can I use ReviewUplift for multiple locations?",
      answer:
        "Yes, ReviewUplift supports multi-location businesses. Our Professional plan includes up to 3 locations, and our Enterprise plan offers unlimited locations with centralized management.",
    },
    {
      question: "Is there a limit to how many review requests I can send?",
      answer:
        "Each plan has a monthly limit of review requests you can send. The Starter plan includes 100 requests/month, the Professional plan includes 500 requests/month, and the Enterprise plan offers unlimited requests.",
    },
  ];

  const [typedText, setTypedText] = useState("");
  const fullText = "Freequently Asked Questions";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setTypedText((prev) => prev + fullText.charAt(index));
      index++;
      if (index === fullText.length) clearInterval(timer);
    }, 100); // typing speed
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="faq" className="py-20 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left Column */}
          <div className="text-left">
            <p className="text-sm text-orange-600 font-semibold uppercase tracking-wider">FAQ</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900 block h-20">
              <span className="typewriter text-orange-600">{typedText}</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-md">
              Get answers to the most common questions about ReviewUplift.
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-gray-200 rounded-lg shadow-sm"
                >
                  <AccordionTrigger className="flex justify-between items-center px-5 py-4 text-left w-full text-lg font-medium text-gray-800 hover:text-orange-600 transition-colors duration-300 no-underline [&>svg]:hidden">
                    <span>{faq.question}</span>
                    <ChevronDown className="ml-2 h-5 w-5 text-gray-500 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 text-gray-600 text-base transition-all duration-500 ease-in-out animate-fade-slide">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Still have questions? Contact our support team for assistance.
          </p>
          <div className="mt-4">
            <button className="text-orange-600 font-medium hover:text-orange-700 flex items-center justify-center mx-auto transition duration-300">
              Contact Support
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .animate-fade-slide {
          animation: fadeSlide 0.4s ease-in-out;
        }

        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .typewriter {
          font-size: 2.25rem; /* 36px */
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          border-right: 0.15em solid orange;
          animation: blink-caret 0.75s step-end infinite;
        }

        @keyframes blink-caret {
          from, to {
            border-color: transparent;
          }
          50% {
            border-color: orange;
          }
        }
      `}</style>
    </section>
  );
};

export default FaqSection;
