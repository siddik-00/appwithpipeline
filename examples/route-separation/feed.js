'use strict'

var db = require('./data');

// Build the feed for the current user: everyone's posts, newest first,
// with follow flags resolved so the view can show "From people you follow".
function buildFeed (viewerId) {
  return db.posts
    .slice()
    .sort(function (a, b) { return b.createdAt - a.createdAt })
    .map(function (post) {
      var author = db.findById(post.authorId);
      return {
        id: post.id,
        text: post.text,
        createdAt: post.createdAt,
        author: author,
        likes: post.likes,
        liked: post.likes.indexOf(viewerId) !== -1,
        following: db.isFollowing(viewerId, post.authorId),
        comments: post.comments.map(function (c) {
          return { author: db.findById(c.authorId), text: c.text, createdAt: c.createdAt };
        })
      };
    });
}

exports.list = function(req, res){
  res.render('feed', {
    title: 'Feed',
    posts: buildFeed(req.session.user.id),
    me: req.session.user
  });
};

exports.create = function(req, res){
  var text = (req.body.text || '').trim();
  if (text) db.addPost(req.session.user.id, text);
  res.redirect('/feed');
};

exports.like = function(req, res){
  var post = db.findPost(req.params.id);
  if (post) db.togglePostLike(post, req.session.user.id);
  res.redirect('/feed');
};

exports.comment = function(req, res){
  var post = db.findPost(req.params.id);
  var text = (req.body.text || '').trim();
  if (post && text) {
    post.comments.push({
      authorId: req.session.user.id,
      text: text,
      createdAt: Date.now()
    });
  }
  res.redirect('/feed');
};