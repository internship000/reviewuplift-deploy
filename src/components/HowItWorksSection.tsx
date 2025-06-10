import { Link } from "react-router-dom";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Connect Your Profiles",
      description:
        "Connect your business profiles from Google, Facebook, Yelp and 100+ review sites to monitor all reviews in one place.",
    },
    {
      number: "02",
      title: "Collect New Reviews",
      description:
        "Send automated email and SMS campaigns to your customers to collect more positive reviews on sites that matter most to your business.",
    },
    {
      number: "03",
      title: "Respond & Manage",
      description:
        "Respond to all reviews from one dashboard with AI-powered response suggestions to save time and improve customer satisfaction.",
    },
    {
      number: "04",
      title: "Showcase & Promote",
      description:
        "Display your best reviews on your website with customizable widgets and use them in your marketing materials to build trust.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <p className="text-base text-orange-600 font-semibold tracking-wide uppercase">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple steps to improve your online reputation
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our platform makes it easy to collect, manage, and leverage customer reviews to grow your business.
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-x-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="absolute flex items-center justify-center h-16 w-16 rounded-md bg-orange-600 text-white text-2xl font-bold">
                  {step.number}
                </div>
                <div className="ml-20">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-20 flex justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 pr-0 md:pr-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  See ReviewUplift in action
                </h3>
                <p className="text-gray-500 mb-6">
                  Schedule a personalized demo to see how ReviewUplift can help your business collect more reviews and improve your online reputation.
                </p>
                <Link to="/demo">
                  <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-md transition duration-300">
                    Schedule Demo
                  </button>
                </Link>
              </div>
              <div className="w-full md:w-1/2 mt-8 md:mt-0">
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Personal Tour
                  </h4>
                  <p className="text-gray-600 text-sm">
                    See all features and learn how they can be customized for your business
                  </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 mt-4 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Implementation Plan
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Get a custom implementation plan tailored to your business needs
                  </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 mt-4 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    ROI Calculation
                  </h4>
                  <p className="text-gray-600 text-sm">
                    See how much you can increase your business with more positive reviews
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
