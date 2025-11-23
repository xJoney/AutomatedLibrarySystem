import { createClient } from 'redis';
import { db } from "./db";
import { popularity_backup } from "./db/schema";

// const redis = createClient();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379"
});
await redis.connect();
console.log("worker: Listening for jobs..");


const interval = 3600000 // backup time set to 1 hours
let lastBackupTime = 0;

let lastPublishTime = 0
const PUBLISH_INTERVAL = 2000 // 2 seconds

while(true){
    console.log("Waiting for jobs...");
    const result = await redis.blPop("rankingQueue", 0); // blPop= blocking left pop -> listens for jobs in rakning queue, 0 blocks forever, allows worker to run 24/7
    if (!result){continue;} // this line needed to satisfy TS null err
    const job = JSON.parse(result.element);
    const query = job.query;

    
    // counter for popularity
    if (query === null || query === undefined || query.trim() === "") {
        console.log("SKIPPED EMPTY QUERY");
        continue;
    }
    await redis.zIncrBy("searchPopularity",1,query)


    //gets popularity list, reverse to get highest scores to lowest -> 0=start of index, -1=end of index
    //not working, likely because of compatability issue with bun and redis
    // const rankings = await redis.zRange("searchPopularity",0, -1, {REV: true, WITHSCORES: true} as any) ;

    const data = await redis.sendCommand([
        "ZRANGE",
        "searchPopularity",
        "0",
        "-1",
        "WITHSCORES",
        "REV"
    ]) as string[];


    let rankings = [];

    for (let i = 0; i < data.length; i += 2) {
        const value = data[i];
        const score = Number(data[i + 1]);
        rankings.push({ value, score });
    }

    // store the popularity data and publish update to Redis channel
    // NOTE: PLEASE do NOT remove serialized line. Needed to prevent Bun from corrupting the argument list
    const serialized = JSON.stringify(rankings); 
    await redis.set("popularityCache", serialized);

    // added timers so it doesn't spam broadcasts updates
    const previous = await redis.get("lastPublishedRankings")
    const now = Date.now()

    // updates the cache, and publish popularity list
    if(now - lastPublishTime >= PUBLISH_INTERVAL){
        await redis.publish("popularity", serialized)
        await redis.set("lastPublishedRankings", serialized)
        console.log("PUBLISHED popularity update:", serialized)
        lastPublishTime = now
    }


 
    // update rankings every 24 hours to the db
    const temp = Date.now()
    if(temp - lastBackupTime >= interval){
        await db.insert(popularity_backup).values({
                rankings: rankings
        })
        lastBackupTime = temp
    }
}