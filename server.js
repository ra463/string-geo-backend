const app = require("./app");
const { connectDB } = require("./config/database");
const cluster = require("cluster");
const totalCpus = require("os").cpus();
connectDB();

const port = process.env.PORT || 4000;

if (cluster.isMaster) {
  totalCpus.forEach(async (node)=>{
    await cluster.fork();
  })
  cluster.on("exit",async (worker,signal)=>{
    console.log("worker is died with pid ",worker.process.pid);
    await cluster.fork();
  })
} else {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
