import { createClient } from 'redis';
import { db } from "./db";
import { popularity_backup } from "./db/schema";
import { desc } from "drizzle-orm";

// const redis = createClient();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379"
});
await redis.connect();
console.log("worker: Listening for jobs..");

type Ranking = {
  value: string
  score: number
}

/*
24 hours = 86400000
1 hour = 360000
10 mins = 600000
5 mins = 300000
*/
let lastBackupTime = 0;
const interval = 300000 // backup time set to 5 mins

const latestBackup = await db.select().from(popularity_backup).orderBy(desc(popularity_backup.createdAt)).limit(1)

// this function handles the popularity ranking for when Redis server restarts/crashes
if (latestBackup.length > 0) {
    const rankings = latestBackup[0].rankings as unknown as Ranking[]
    await redis.del("searchPopularity")

    for (const item of rankings) { // Rebuild sorted set from DB

        await redis.zAdd("searchPopularity", {
            score: item.score,
            value: item.value
        })
    }
    await redis.set("popularityCache", JSON.stringify(rankings)) // Sync cache for frontend
    console.log("Redis ranking engine rebuilt from DB backup")
}

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
        "9",
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
    if(serialized != previous && now - lastPublishTime >= PUBLISH_INTERVAL){
        await redis.publish("popularity", serialized)
        await redis.set("lastPublishedRankings", serialized)
        console.log("PUBLISHED popularity update:", serialized)
        lastPublishTime = now
    }


 
    // update rankings every x millisecs to the db
    const temp = Date.now()
    if (rankings.length >= 10 && temp - lastBackupTime >= interval) {
        await db.insert(popularity_backup).values({ rankings })
        console.log("DB BACKUP WRITTEN:", rankings.length, "items")
        lastBackupTime = temp
    }
}