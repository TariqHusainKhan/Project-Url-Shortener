const shortUrlModel = require("../models/shortUrlModel")
const mongoose = require("mongoose")
const shortid = require("short-id")
const redis = require("redis")
const{promisify} = require("util")

// Connecting to redis database with "redis-18361.c264.ap-south-1-1.ec2.cloud.redislabs.com"
// my redis connection string i.e endpoint and port no is 18361
const redisClient = redis.createClient(18361,"redis-18361.c264.ap-south-1-1.ec2.cloud.redislabs.com",{no_ready_check:true});

//My redis DB password is "Jd6s4RZoR6PtqJHKmT4AolIOJEtT1P2Q"
redisClient.auth("Jd6s4RZoR6PtqJHKmT4AolIOJEtT1P2Q",function(err){
    if(err) throw err;
});


redisClient.on("connect",async function(){
    console.log("Connected to Redis ...");
})
 
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
// ============================================================================================================================

// Creating a globel function for validation of keys
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number') return false
    return true;
}

//Checking request body is empty or not 

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}


/* Api #1 Create a short URL for an original url recieved in the request body.
The baseUrl must be the application's baseUrl. Example if the originalUrl is http://abc.com/user/images/name/2 then the shortened url should be http://localhost:3000/xyz
Return the shortened unique url. Refer this for the response
Ensure the same response is returned for an original url everytime
Return HTTP status 400 for an invalid request
*/

const createShortUrl = async function(req,res){
    try{
         let longUrl = req.body.longUrl;

         // Validation for Long URL

         // Checking Long URL is provided or NOT
          if(!longUrl)
          return res.status(400).send({status:false,message:"Please enter the Long URL"});

         // Checking Long URL is a Valid URL or NOT
         if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(longUrl.trim()))) 
         { 
            return res.status(400).send({ status: false, message: "This is NOT a Valid URL ,Please enter a valid longUrl" })
         }
        
        const baseUrl = "http://localhost:3000" 

       // Validation of Base URL: Checking Base URL is a Valid URL or NOT
       if (!(/^https?:\/\/\w/).test(baseUrl)) { 
        return res.status(400).send({ status: false, message:"This is NOT a Valid Base URL ,Please enter the valid Base Url" }) }

        let isLongUrlExist = await GET_ASYNC(`${longUrl}`);
        let isLongUrlExistInCache = JSON.parse(isLongUrlExist);

        if(isLongUrlExistInCache)
        return res.status(302).send({message:"Short Url for this long Url is already exist in Cache",url:isLongUrlExistInCache});

        let isLongUrlExistInDB = await shortUrlModel.findOne({longUrl:longUrl});

        if(isLongUrlExistInDB)
        return res.status(302).send({message:"Short Url for this long Url is already exist in Database",url:isLongUrlExistInDB});


         // Generating urlCode by using short-id generate() method
        const urlCode = shortid.generate();

        let shortUrl = baseUrl +"/" + urlCode;
        let inputData = {longUrl,shortUrl,urlCode};

        const outputData = await shortUrlModel.create(inputData);
        const finalData = {longUrl:outputData.longUrl,shortUrl:outputData.shortUrl,urlCode:outputData.urlCode};
        
        await SET_ASYNC(`${longUrl}`,JSON.stringify(finalData))
        return res.status(201).send({status:true,data:finalData});

    }
    catch(err){
            return res.status(500).send({status:false,message:err.message})
    }
}

const getOriginalUrl = async (req,res)=>{
    try{
         let urlCode = req.params.urlCode;
         let cachedUrl = await GET_ASYNC(`${urlCode}`);

         if(cachedUrl)
           return res.status(302).redirect(JSON.parse(cachedUrl));
         else
         {
            const dbUrl = await shortUrlModel.findOne({urlCode:urlCode});
            if(dbUrl)
            {
                await SET_ASYNC(`${urlCode}`,JSON.stringify(dbUrl.longUrl));
                return res.status(302).redirect(dbUrl.longUrl);
            }
            else
                return res.status(404).send({status:false,message:"Url is NOT FOUND with this UrlCode"})
         }
    }
    catch(err){
          return res.status(500).send({status:false,message:err.message})
    }
}

module.exports = {createShortUrl,getOriginalUrl}