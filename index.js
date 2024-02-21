var express = require("express");
// using node-cron package
var cron = require("node-cron");
var path = require("path");
const app = express();

var bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//importing sequelize
var sequelize = require("./seqConfig").seqConfig;

// importing entity
var dirJob = require("./entity/dir");

// to sync the dbs
sequelize.sync();

// we can use below code to sync the dbs if the structured is altered

// sequelize.sync({ alter: true });

const fs = require("fs");

//api for starting/stopping the task

app.post("/", async (req, res) => {
  const { directory, findString, frequency, startStop } = req.body;

  //if the req contains start

  if (startStop == "start") {
    async function FindFiles(Directory) {
      let filesArr = [];
      fs.readdirSync(Directory).forEach((File) => {
        const Absolute = path.join(Directory, File);
        if (fs.statSync(Absolute).isDirectory()) {
          FindFiles(Absolute);
        } else {
          filesArr.push(Absolute);
        }
      });
      return filesArr;
    }

    const Directory = directory;
    const magicString = findString;
    const interval = frequency / 1000;

    async function MatchStr(str, regex) {
      let matchedStrArr = str.match(regex);
      if (matchedStrArr == null) {
        return null;
      }
      return matchedStrArr;
    }

    async function countMagicStringFunc(file, regex) {
      let count = 0;
      return new Promise(async (resolve, reject) => {
        fs.readFile(file, "utf8", async (err, data) => {
          if (err) {
            console.log(err);
          }
          await MatchStr(data, regex).then((strArr) => {
            if (strArr) {
              count = count + strArr.length;
              resolve(count);
            } else {
              count = 0;
              resolve(count);
            }
          });
        });
      });
    }

    let taskStartTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    let t = new Date();
    t.setSeconds(t.getSeconds() + interval);
    let taskEndTime = new Date(t).toISOString().slice(0, 19).replace("T", " ");
    let totalRunTime = new Date(taskEndTime) - new Date(taskStartTime);
    let filesArr = await FindFiles(Directory);

    // Insert new record

    const newRecord = await dirJob.create({
      task_start_time: taskStartTime,
      task_end_time: taskEndTime,
      task_status: "in_progress",
      task_total_time: totalRunTime,
      files_list: filesArr.toString(),
    });

    // Getting the current task id

    //let currentSeqId = newRecord.dataValues.seq_id;

    // run task in certain intervals

    const runTask = async () => {
      let addedFilesList = [];
      let deletedFilesList = [];
      let lastId;
      // manipulations to get the added/deleted files
      sequelize
        .query("select max(seq_id) as lastId from dircronjob.dirtables")
        .then((res1, err) => {
          if (err) console.log(err);
          lastId = res1[0][0].lastId;
          console.log(lastId);
          if (lastId) {
            let query = `select files_list from dircronjob.dirtables where seq_id=${lastId}`;
            sequelize.query(query).then((res2, err) => {
              if (err) console.log(err);
              lastPathStr = res2[0][0].files_list;
              lastPathArr = lastPathStr.split(",");
              console.log("----------------------Run Log---------------------");
              console.log("--------------------------------------------------");
              console.log("Interval in seconds: ", interval);
              console.log("last run files path: ", lastPathArr);
              console.log("current run files path: ", filesArr);
              deletedFilesList = lastPathArr.filter(
                (x) => !filesArr.includes(x)
              );
              console.log("Deleted Files List: ", deletedFilesList);
              addedFilesList = filesArr.filter((x) => !lastPathArr.includes(x));
              console.log("Added Files List: ", addedFilesList);
            });
          }
        });

      // calling a function to count the magic string

      let totalCount = 0;
      let filesArr = await FindFiles(Directory);
      let regex = new RegExp(`${magicString}`, "gim");
      let promises = filesArr.map(async (file) => {
        return new Promise(async (resolve, rej) => {
          await countMagicStringFunc(file, regex).then((count) => {
            resolve(count);
          });
        });
      });

      // creating a promise to count the no of magic strings present in all the files

      Promise.all(promises).then(async (result) => {
        const sum = result.reduce((partialSum, a) => partialSum + a, 0);
        totalCount = sum;
        console.log("Magic string total count: ", totalCount);
        const record = await dirJob.update(
          {
            magic_string_count: totalCount,
            files_list: filesArr.toString(),
            task_status: "success",
            files_added_paths:
              addedFilesList.length > 0 ? addedFilesList.toString() : null,
            files_deleted_paths:
              deletedFilesList.length > 0 ? deletedFilesList.toString() : null,
          },
          { where: { seq_id: lastId } }
        );
        console.log("Task start time: ", taskStartTime);
        console.log("Task end time: ", taskEndTime);
        console.log("Total run time: ", totalRunTime);
        console.log("--------------------------------------------------");
      });
    };
    cron.schedule(`*/${interval} * * * * *`, async () => {
      runTask().then(async () => {
        let taskStartTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        let t = new Date();
        t.setSeconds(t.getSeconds() + interval);
        let taskEndTime = new Date(t)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        let totalRunTime = new Date(taskEndTime) - new Date(taskStartTime);
        let filesArr = await FindFiles(Directory);

        // Insert new record

        const newRecord = await dirJob.create({
          task_start_time: taskStartTime,
          task_end_time: taskEndTime,
          task_status: "in_progress",
          task_total_time: totalRunTime,
          files_list: filesArr.toString(),
        });
      });
    });
    res.send("background task is running in scheduled interval");
  }

  // if the req contains stop

  if (startStop == "stop") {
    sequelize
      .query("select max(seq_id) as lastId from dircronjob.dirtables")
      .then((res1, err) => {
        if (err) console.log(err);
        let lastId = res1[0][0].lastId;
        let query = `select * from dircronjob.dirtables where seq_id=${lastId}`;
        sequelize.query(query).then(async (res2, err) => {
          let { task_start_time, task_status } = res2[0][0];
          if (task_status == "in_progress") {
            let taskStopTime = new Date();
            let difference = new Date(taskStopTime) - new Date(task_start_time);
            const recordUpdate = await dirJob.update(
              {
                task_status: "failed",
                task_end_time: taskStopTime
                  .toISOString()
                  .slice(0, 19)
                  .replace("T", " "),
                task_total_time: difference,
              },
              { where: { seq_id: lastId } }
            );
            if (recordUpdate) {
              res.send("task ended");
            }
          } else {
            res.send("no task is running");
          }
        });
      });
  }
});

// api for getting all the task details

app.get("/gettaskdetails", async (req, res) => {
  const tasks = await dirJob.findAll();
  res.send(tasks);
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
    var port = 3000;
    var server = app.listen(port, function (err) {
      if (err) console.log(err);
      console.log("running server on port " + port);
    });
    server.timeout = 350000;
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
