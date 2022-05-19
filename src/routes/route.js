const express = require("express")
const {createShortUrl,getOriginalUrl} = require("../controllers/shortUrlController")

const router = express.Router()

//Route for the first API
router.post("/url/shorten",createShortUrl)

//Route for the Second API
router.get("/:urlCode",getOriginalUrl)

module.exports = router


