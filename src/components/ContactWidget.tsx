import { useState, useEffect } from "react";
import { FiCalendar, FiMessageCircle, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const icons = [
  { id: "message", icon: <FiMessageCircle size={28} />, label: "Message" },
  { id: "whatsapp", icon: <FaWhatsapp size={28} />, label: "WhatsApp" },
  { id: "phone", icon: <FiPhone size={28} />, label: "Call" },
];

const ContactWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const navigate = useNavigate(); // Moved to top level

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 3000); // every 3 seconds, switch icon
    return () => clearInterval(interval);
  }, []);

  const handleScheduleDemo = () => {
    setIsOpen(false);
    navigate("/demo"); // Using the navigate function from the hook
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating button with cycling icons */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 relative w-14 h-14 flex items-center justify-center transition-all"
        aria-label="Contact options"
        aria-expanded={isOpen}
        title="Contact Us"
      >
        {icons.map((item, idx) => (
          <span
            key={item.id}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
              idx === iconIndex ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            {item.icon}
          </span>
        ))}
      </button>

      {/* Popup panel */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-4 w-72 bg-white rounded-lg shadow-lg p-5">
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Contact Us</h4>

          <button
            onClick={handleScheduleDemo}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
          >
            <FiCalendar size={20} />
            Schedule a Demo
          </button>

          <a
            href="https://wa.me/YOUR_NUMBER" // Replace with actual WhatsApp number
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full text-center inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-medium transition"
          >
            <FaWhatsapp size={20} />
            Chat on WhatsApp
          </a>

          <a
            href="tel:+12345678900" // Replace with your phone number
            className="mt-3 block w-full text-center inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-md font-medium transition"
          >
            <FiPhone size={20} />
            Call Us: +1 234 567 8900
          </a>
        </div>
      )}
    </div>
  );
};

export default ContactWidget;