'use strict'

var db = require('./data');

exports.list = function(req, res){
  res.render('users', {
    title: 'Users',
    users: db.users.map(function (u) {
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        followers: db.followerCount(u.id),
        followingCount: db.followingCount(u.id)
      };
    }),
    me: req.session.user
  });
};

exports.load = function(req, res, next){
  var id = req.params.id != null ? req.params.id : req.params.userId;
  var user = db.findById(id);
  if (user) {
    req.user = user;
    next();
  } else {
    var err = new Error('cannot find user ' + id);
    err.status = 404;
    next(err);
  }
};

exports.view = function(req, res){
  res.render('users/view', {
    title: 'Viewing user ' + req.user.name,
    user: req.user,
    me: req.session.user,
    following: db.isFollowing(req.session.user.id, req.user.id),
    followers: db.followerCount(req.user.id),
    followingCount: db.followingCount(req.user.id),
    posts: db.posts
      .filter(function (p) { return p.authorId === req.user.id })
      .sort(function (a, b) { return b.createdAt - a.createdAt })
  });
};

exports.follow = function(req, res){
  var me = req.session.user.id;
  var them = req.user.id;
  if (me !== them) db.toggleFollow(me, them);
  res.redirect('/u/' + them);
};

exports.edit = function(req, res){
  res.render('users/edit', {
    title: 'Editing user ' + req.user.name,
    user: req.user
  });
};

exports.update = function(req, res){
  // Normally you would handle all kinds of
  // validation and save back to the db
  var u = req.body.user;
  req.user.name = u.name;
  req.user.email = u.email;
  res.redirect(req.get('Referrer') || '/users');
};