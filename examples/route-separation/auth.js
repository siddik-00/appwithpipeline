'use strict'

// Authentication based on the shared in-memory store.
// Passwords are stored as plaintext for demo only — use bcrypt in production.

var db = require('./data');

// Protect routes — must be logged in
exports.restrict = function restrict(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    req.session.error = 'Please log in first.';
    res.redirect('/login');
  }
};

exports.loginForm = function(req, res){
  res.render('auth/login', { title: 'Log In' });
};

exports.login = function(req, res){
  if (!req.body) return res.sendStatus(400);

  var username = (req.body.username || '').trim();
  var password = (req.body.password || '').trim();

  var user = db.findByUsername(username);
  if (!user || user.password !== password) {
    req.session.error = 'Invalid username or password.';
    return res.redirect('/login');
  }

  req.session.regenerate(function(){
    req.session.user = user;
    res.redirect('/');
  });
};

exports.registerForm = function(req, res){
  res.render('auth/register', { title: 'Register' });
};

exports.register = function(req, res){
  if (!req.body) return res.sendStatus(400);

  var username = (req.body.username || '').trim();
  var name     = (req.body.name || '').trim();
  var email    = (req.body.email || '').trim();
  var password = (req.body.password || '').trim();

  if (!username || !name || !email || !password) {
    req.session.error = 'All fields are required.';
    return res.redirect('/register');
  }

  if (db.findByUsername(username)) {
    req.session.error = 'Username already taken.';
    return res.redirect('/register');
  }

  var newUser = db.addUser({ username: username, name: name, email: email, password: password });

  req.session.regenerate(function(){
    req.session.user = newUser;
    res.redirect('/');
  });
};

exports.logout = function(req, res){
  req.session.destroy(function(){
    res.redirect('/login');
  });
};