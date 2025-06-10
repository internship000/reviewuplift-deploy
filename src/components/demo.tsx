import { useState, Fragment, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";

const availableTimes = [
  "09:00 AM",
  "09:15 AM",
  "09:30 AM",
  "09:45 AM",
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
  "12:30 PM",
  "12:45 PM",
  "01:00 PM",
  "01:15 PM",
  "01:30 PM",
  "01:45 PM",
  "02:00 PM",
  "02:15 PM",
  "02:30 PM",
  "02:45 PM",
  "03:00 PM",
];

const Typewriter = ({ text, delay }: { text: string; delay: number }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

const Demo = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleBookEvent = () => {
    if (!name || !email || !phone) {
      alert("Please fill in all required fields.");
      return;
    }
    
    alert(`Booking confirmed for:
Date: ${formatDate(selectedDate)}
Time: ${selectedTime}
Name: ${name}
Email: ${email}
Phone: ${phone}
Business Name: ${businessName || "(None)"}`);

    // Reset after booking
    setModalOpen(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setName("");
    setEmail("");
    setPhone("");
    setBusinessName("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4 md:p-8"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-6xl bg-white rounded-2xl shadow-xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 w-full"
      >
        {/* Left content */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-orange-700 mb-4">
            <Typewriter text="Schedule your " delay={50} />
            <span className="text-gray-900">
              <Typewriter text="15-Minute Demo" delay={50} />
            </span>
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-700 mb-6 text-base md:text-lg max-w-md"
          >
            Choose a date and time that works best for you. We'll give you a quick,
            personalized walkthrough to get you started.
          </motion.p>
          <motion.button
            whileHover={{ scale: selectedDate && selectedTime ? 1.02 : 1 }}
            whileTap={{ scale: selectedDate && selectedTime ? 0.98 : 1 }}
            onClick={() => setModalOpen(true)}
            disabled={!selectedDate || !selectedTime}
            className={`px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all ${
              selectedDate && selectedTime
                ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Schedule Demo
          </motion.button>
        </div>

        {/* Right content */}
        <div className="flex-1">
          <label className="block mb-3 font-semibold text-gray-800 text-lg">
            Select a Date
          </label>
          <div className="border rounded-xl overflow-hidden shadow-sm w-full">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              minDate={new Date()}
              inline
              calendarClassName="!border-0 custom-calendar-width"
              dayClassName={(date) => 
                date.getDate() === selectedDate?.getDate() && 
                date.getMonth() === selectedDate?.getMonth() && 
                date.getFullYear() === selectedDate?.getFullYear()
                  ? "!bg-orange-500 !text-white"
                  : "hover:bg-orange-50"
              }
              weekDayClassName={() => "text-orange-600 font-medium"}
              renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="flex items-center justify-between px-2 py-2 bg-orange-50">
                  <button
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="p-1 rounded-full hover:bg-orange-100 disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <span className="text-orange-800 font-bold">
                    {date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className="p-1 rounded-full hover:bg-orange-100 disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-orange-600"
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
              )}
            />
          </div>

          <div className="mt-8 w-full">
            <p className="font-semibold mb-3 text-gray-800 text-lg">Select a Time</p>
            {selectedDate ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 w-full"
              >
                {availableTimes.map((time) => (
                  <motion.button
                    key={time}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTime(time)}
                    className={`px-2 py-2 md:px-3 md:py-2 rounded-lg border text-center text-sm transition-all
                      ${
                        selectedTime === time
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md"
                          : "bg-white border-gray-200 hover:bg-orange-50 hover:border-orange-200"
                      }
                    `}
                  >
                    {time}
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 italic"
              >
                Please select a date first.
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-20 overflow-y-auto"
          onClose={() => setModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center bg-black bg-opacity-40 backdrop-blur-sm">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-lg p-6 my-20 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 mb-4"
                >
                  Confirm Your Demo Booking
                </Dialog.Title>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 p-4 bg-orange-50 rounded-lg"
                >
                  <p className="text-gray-700">
                    You are booking a 15-minute demo on:
                  </p>
                  <p className="mt-1 text-orange-600 font-bold text-lg">
                    {formatDate(selectedDate)} at {selectedTime}
                  </p>
                </motion.div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBookEvent();
                  }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-gray-700 font-medium mb-1" htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-gray-700 font-medium mb-1" htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-gray-700 font-medium mb-1" htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+1 234 567 890"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="businessName"
                    >
                      What Business Name to search on Google to find your Google Listing? (Optional)
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Your business name"
                    />
                  </motion.div>

                  <div className="mt-8 flex justify-end gap-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 shadow-md"
                    >
                      Book Event
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Custom CSS for wider calendar */}
      <style jsx global>{`
        .custom-calendar-width {
          width: 100% !important;
        }
        .custom-calendar-width .react-datepicker__month-container {
          width: 100% !important;
        }
        .custom-calendar-width .react-datepicker__day-names,
        .custom-calendar-width .react-datepicker__week {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
        }
        .custom-calendar-width .react-datepicker__day-name,
        .custom-calendar-width .react-datepicker__day {
          width: auto !important;
          margin: 0.2rem !important;
          padding: 0.5rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
    </motion.div>
  );
};

export default Demo;