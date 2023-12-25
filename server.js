const app = require("./app");
const { connectDB } = require("./config/database");
const cluster = require("cluster");
cluster.schedulingPolicy = cluster.SCHED_RR
const totalCpus = require("os").cpus();
const logger = require("./utils/Logger/Logger");

connectDB();
const port = process.env.PORT || 4000;

if (cluster.isMaster) {
  totalCpus.forEach(async (node) => {
    await cluster.fork();
  });
  cluster.on("exit", async (worker, code, signal) => {
    logger.info(`Worker ${worker.process.pid} has died!`);
    logger.error(`Worker ${worker.process.pid} has died!`);
    logger.info("Creating a new Worker");
    await cluster.fork();
  });
} else {
  app.listen(port, () => {
    logger.info(`Process ${process.pid} is online on port number ${port}`);
  });
}


