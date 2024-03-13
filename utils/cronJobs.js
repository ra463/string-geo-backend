const cron = require("node-cron");
const Order = require("../@order_entity/order.model");
const User = require("../@user_entity/user.model");

cron.schedule("0 0 * * *", async () => {
  try {
    const expiredOrders = await Order.find({
      expiry_date: { $lte: new Date() },
      status: "Active",
    });
    await Order.updateMany(
      { _id: { $in: expiredOrders.map((order) => order._id) } },
      { status: "Expire" }
    );
    for (const order of expiredOrders) {
      const user = await User.findById(order.user);
      if (user) {
        user.device_ids = [];
        await user.save();
      }
    }
  } catch (error) {
    console.log(error);
  }
});
