import { createClient } from 'redis';

// const redis = createClient();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379"
});
await redis.connect();

console.log("worker: Listening for jobs..");

while(true){
    const result = await redis.brPop("rankingQueue", 0); // brPop= blocking right pop -> listens for jobs in rakning queue, 0 blocks forever, allows worker to run 24/7
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
    await redis.publish("rankingUpdates", serialized);

}