const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: "rzp_test_5Liv4sRSmiSdzx",
  key_secret: "mJxbkQp1LAcblHN5ZM5vVyOU",
});

app.post("/api/payment/create-order", async (req, res) => {
  const { amount } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });
    res.json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).send("Server error");
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));