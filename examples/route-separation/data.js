'use strict'

// Shared in-memory data store for the demo.
// Everything resets on restart.

var users = [
  { id: 0, username: 'tj',   name: 'TJ',   email: 'tj@vision-media.ca',   password: 'foobar' },
  { id: 1, username: 'tobi', name: 'Tobi', email: 'tobi@vision-media.ca',  password: 'foobar' },
  { id: 2, username: 'loki', name: 'Loki', email: 'loki@vision-media.ca',  password: 'foobar' },
  { id: 3, username: 'jane', name: 'Jane', email: 'jane@vision-media.ca',  password: 'foobar' }
];

var posts = [
  {
    id: 0,
    authorId: 1,
    text: 'Just shipped a fresh look for the dashboard — responsive cards, rounded corners and a much sleeker nav. Give it a spin!',
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    likes: [0, 3],
    comments: [
      { authorId: 0, text: 'Love the new hero section, great work!', createdAt: Date.now() - 4 * 60 * 60 * 1000 },
      { authorId: 3, text: 'The stats row looks awesome too.', createdAt: Date.now() - 3 * 60 * 60 * 1000 }
    ]
  },
  {
    id: 1,
    authorId: 0,
    text: 'Coffee + a clean codebase. This is how a great week starts.',
    createdAt: Date.now() - 8 * 60 * 60 * 1000,
    likes: [1, 2],
    comments: [
      { authorId: 2, text: 'Agreed, caffeine is a feature.', createdAt: Date.now() - 7 * 60 * 60 * 1000 }
    ]
  },
  {
    id: 2,
    authorId: 3,
    text: 'Our new authentication portal just went live. Sessions, protected routes and all.',
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
    likes: [0],
    comments: []
  },
  {
    id: 3,
    authorId: 2,
    text: 'Testing WebRTC video call rooms this week. Fingers crossed for crisp audio!',
    createdAt: Date.now() - 50 * 60 * 60 * 1000,
    likes: [1],
    comments: [
      { authorId: 1, text: 'Can’t wait to see it!', createdAt: Date.now() - 49 * 60 * 60 * 1000 }
    ]
  }
];

var messages = [];

var follows = [
  { followerId: 0, followeeId: 1 },
  { followerId: 0, followeeId: 2 },
  { followerId: 1, followeeId: 0 },
  { followerId: 3, followeeId: 0 }
];

var nextId = { user: 4, post: 4, message: 0 };

function findByUsername (username) {
  return users.find(function (u) { return u.username === username }) || null
}

function findById (id) {
  return users.find(function (u) { return u.id === Number(id) }) || null
}

function addUser (data) {
  var user = {
    id: nextId.user++,
    username: data.username,
    name: data.name,
    email: data.email,
    password: data.password
  }
  users.push(user)
  return user
}

function addPost (authorId, text) {
  var post = {
    id: nextId.post++,
    authorId: authorId,
    text: text,
    createdAt: Date.now(),
    likes: [],
    comments: []
  }
  posts.push(post)
  return post
}

function addMessage (fromId, toId, text) {
  var msg = {
    id: nextId.message++,
    fromId: fromId,
    toId: toId,
    text: text,
    createdAt: Date.now(),
    read: false
  }
  messages.push(msg)
  return msg
}

function isFollowing (followerId, followeeId) {
  return follows.some(function (f) {
    return f.followerId === followerId && f.followeeId === followeeId
  })
}

function toggleFollow (followerId, followeeId) {
  var idx = follows.findIndex(function (f) {
    return f.followerId === followerId && f.followeeId === followeeId
  })
  if (idx === -1) {
    follows.push({ followerId: followerId, followeeId: followeeId })
    return true
  }
  follows.splice(idx, 1)
  return false
}

function followerCount (id) {
  return follows.filter(function (f) { return f.followeeId === id }).length
}

function followingCount (id) {
  return follows.filter(function (f) { return f.followerId === id }).length
}

function findPost (id) {
  return posts.find(function (p) { return p.id === Number(id) }) || null
}

function togglePostLike (post, userId) {
  var idx = post.likes.indexOf(userId)
  if (idx === -1) {
    post.likes.push(userId)
    return true
  }
  post.likes.splice(idx, 1)
  return false
}

module.exports = {
  users: users,
  posts: posts,
  messages: messages,
  follows: follows,
  findByUsername: findByUsername,
  findById: findById,
  addUser: addUser,
  addPost: addPost,
  addMessage: addMessage,
  isFollowing: isFollowing,
  toggleFollow: toggleFollow,
  followerCount: followerCount,
  followingCount: followingCount,
  findPost: findPost,
  togglePostLike: togglePostLike
}