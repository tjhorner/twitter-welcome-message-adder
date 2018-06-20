const Twit = require('twit')
const config = require('./config.json')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const bodyParser = require('body-parser')
const TwitterStrategy = require('passport-twitter').Strategy

passport.use(new TwitterStrategy({
  consumerKey: config.TWITTER_CONSUMER_KEY,
  consumerSecret: config.TWITTER_CONSUMER_SECRET,
  callbackURL: `${process.env.BASE_URL || "http://127.0.0.1:3000"}/login/callback`
}, (token, tokenSecret, profile, cb) => {
  return cb(null, { token, tokenSecret, profile })
}))

passport.serializeUser(function(user, cb) {
  cb(null, user)
})

passport.deserializeUser(function(obj, cb) {
  cb(null, obj)
})

var app = express()

app.set('view engine', 'ejs');

app.use(session({
  secret: "EEEEE"
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  if(req.user) {
    res.render("index", { user: req.user.profile })
  } else {
    res.redirect("/login")
  }
})

app.post("/", (req, res) => {
  if(req.user) {
    var twitter = new Twit({
      consumer_key: config.TWITTER_CONSUMER_KEY,
      consumer_secret: config.TWITTER_CONSUMER_SECRET,
      access_token: req.user.token,
      access_token_secret: req.user.tokenSecret
    })

    twitter.post("direct_messages/welcome_messages/new", {
      welcome_message: {
        message_data: {
          text: req.body.welcome_message
        }
      }
    }, (err, body, apiRes) => {
      twitter.post("direct_messages/welcome_messages/rules/new", {
        welcome_message_rule: {
          welcome_message_id: body.welcome_message.id
        }
      }, (err, body, apiRes) => {
        res.redirect("/")
      })
    })
  } else {
    res.redirect("/login")
  }
})

app.get("/remove", (req, res) => {
  if(req.user) {
    var twitter = new Twit({
      consumer_key: config.TWITTER_CONSUMER_KEY,
      consumer_secret: config.TWITTER_CONSUMER_SECRET,
      access_token: req.user.token,
      access_token_secret: req.user.tokenSecret
    })

    twitter.get("direct_messages/welcome_messages/rules/list", (err, body, apiRes) => {
      body.welcome_message_rules.forEach(rule => {
        twitter.delete("direct_messages/welcome_messages/rules/destroy", { id: rule.id })
        twitter.delete("direct_messages/welcome_messages/destroy", { id: rule.welcome_message_id })
      })
      res.redirect("/")
    })
  } else {
    res.redirect("/login")
  }
})

app.get("/login", passport.authenticate("twitter"))
app.get("/login/callback", passport.authenticate("twitter"), function(req, res) {
  res.redirect("/")
})

app.listen(process.env.PORT || 3000)
