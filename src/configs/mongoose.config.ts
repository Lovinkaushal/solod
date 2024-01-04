import mongoose from 'mongoose';

let mongoURI = process.env.MONGODB_URI;
let mongoDB = process.env.DBNAME;

mongoose
  .connect( mongoURI as string, {
    dbName: mongoDB,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {/* console.log("Mongodb connected to " + process.env.MONGODB_URI) */})
  .catch((err: any) => console.log(err));

mongoose.set('useFindAndModify', true);
mongoose.connection.on("connected", function () {
  console.info("connected to " + mongoDB);
});

// If the connection throws an error
mongoose.connection.on("error", function (err: any) {
  console.info("DB connection error: " + err);
});

// When the connection is disconnected
mongoose.connection.on("disconnected", function () {
  console.info("DB connection disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});