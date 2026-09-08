'use strict'

/**
 * Module dependencies.
 */

var express = require('../..');
var path = require('node:path');
var app = express();
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var site = require('./site');
var post = require('./post');
var user = require('./user');
var auth = require('./auth');
var feed = require('./feed');
var messages = require('./messages');
var video = require('./video');

module.exports = app;

// Config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* istanbul ignore next */
if (!module.parent) {
  app.use(logger('dev'));
}

app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));

// Session + flash messages

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'route-separation-secret'
}));

app.use(function(req, res, next){
  var err = req.session && req.session.error;
  delete req.session.error;
  res.locals.error = err || '';
  res.locals.user = req.session && req.session.user || null;
  next();
});

// General

app.get('/', site.index);

// Auth

app.get('/login', auth.loginForm);
app.post('/login', auth.login);
app.get('/register', auth.registerForm);
app.post('/register', auth.register);
app.get('/logout', auth.logout);

// User

app.get('/users', auth.restrict, user.list);
app.all('/user/:id{/:op}', auth.restrict, user.load);
app.get('/user/:id', auth.restrict, user.view);
app.get('/user/:id/view', auth.restrict, user.view);
app.get('/user/:id/edit', auth.restrict, user.edit);
app.put('/user/:id/edit', auth.restrict, user.update);

// Profiles (social aliases)

app.get('/u/:userId', auth.restrict, user.load, user.view);
app.post('/u/:userId/follow', auth.restrict, user.load, user.follow);

// Posts

app.get('/posts', auth.restrict, post.list);
app.all('/post/:id', auth.restrict, post.load);
app.get('/post/:id', auth.restrict, post.show);
app.get('/post/:id/view', auth.restrict, post.show);

// Feed

app.get('/feed', auth.restrict, feed.list);
app.post('/feed', auth.restrict, feed.create);
app.post('/feed/:id/like', auth.restrict, feed.like);
app.post('/feed/:id/comment', auth.restrict, feed.comment);

// Messages

app.get('/messages', auth.restrict, messages.inbox);
app.get('/messages/:userId', auth.restrict, messages.thread);
app.post('/messages/:userId', auth.restrict, messages.send);
app.get('/messages/:userId/poll', auth.restrict, messages.poll);

// Video call

app.get('/video', auth.restrict, video.lobby);
app.get('/video/room/:room', auth.restrict, video.room);
app.get('/video/:room/role', auth.restrict, video.getRole);
app.post('/video/:room/offer', auth.restrict, video.postOffer);
app.get('/video/:room/offer', auth.restrict, video.getOffer);
app.post('/video/:room/answer', auth.restrict, video.postAnswer);
app.get('/video/:room/answer', auth.restrict, video.getAnswer);
app.post('/video/:room/candidate', auth.restrict, video.postCandidate);
app.get('/video/:room/candidate', auth.restrict, video.getCandidates);

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
