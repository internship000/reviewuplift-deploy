
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CtaSection = () => {
  return (
    <section className="bg-orange-600 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to boost your online reputation?
            </h2>
            <p className="mt-4 text-lg text-orange-100 max-w-md">
              Join thousands of businesses that use ReviewUplift to collect more positive reviews and improve their online reputation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/payment">
                <Button className="bg-white text-orange-600 hover:bg-gray-100 hover:text-orange-700 px-8 py-6 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" className="border-white text-gray hover:bg-white hover:text-orange-600 px-8 py-6 text-lg">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sign up for our newsletter</h3>
              <p className="text-gray-600 mb-6">
                Get the latest tips, industry news, and updates from ReviewUplift.
              </p>
              <form className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-5 py-3 border border-gray-300 shadow-sm placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-md"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 py-3">
                    Subscribe
                  </Button>
                </div>
              </form>
              <p className="mt-3 text-sm text-gray-500">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
