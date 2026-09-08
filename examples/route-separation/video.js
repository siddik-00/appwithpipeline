'use strict'

// Minimal WebRTC signaling server.
// WebRTC media is peer-to-peer; this endpoint just passes SDP
// offers/answers and ICE candidates between the two participants
// via in-memory storage + polling.

var db = require('./data');

var rooms = {}; // room -> { offer, answer, candidates: [] }

// Lobby: pick who to call, then join/create a room
exports.lobby = function(req, res){
  var withId = req.query.with;
  var other = withId ? db.findById(withId) : null;

  res.render('video/lobby', {
    title: 'Video Call',
    me: req.session.user,
    withUser: other ? { id: other.id, name: other.name } : null,
    users: db.users
  });
};

// Room page
exports.room = function(req, res){
  var room = String(req.params.room || '').replace(/[^A-Za-z0-9\-_]/g, '');
  if (!room) return res.redirect('/video');

  rooms[room] = rooms[room] || { offerer: null, answerer: null, offer: null, answer: null, candidates: [] };

  res.render('video/room', {
    title: 'Video call room ' + room,
    me: req.session.user,
    meId: req.session.user.id,
    room: room,
    shareUrl: req.protocol + '://' + req.get('host') + req.originalUrl
  });
};

exports.getRole = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });

  if (room.offerer === null) {
    room.offerer = req.session.user.id;
    return res.json({ role: 'offerer' });
  }

  return res.json({ role: 'answerer' });
};

exports.postOffer = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });
  room.offerer = req.session.user.id;
  room.offer = req.body.desc;
  room.candidates.length = 0;
  res.json({ ok: true });
};

exports.getOffer = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });
  res.json({ offer: room.offer || null });
};

exports.postAnswer = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });
  room.answerer = req.session.user.id;
  room.answer = req.body.desc;
  res.json({ ok: true });
};

exports.getAnswer = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });
  res.json({ answer: room.answer || null });
};

exports.postCandidate = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });
  room.candidates.push({ from: req.session.user.id, candidate: req.body.candidate });
  res.json({ ok: true });
};

exports.getCandidates = function(req, res){
  var room = rooms[req.params.room];
  if (!room) return res.status(404).json({ error: 'no room' });
  var since = Number(req.query.since || 0);
  var list = room.candidates.slice(since).map(function (c) {
    return { from: c.from, candidate: c.candidate };
  });
  res.json({ candidates: list, count: room.candidates.length });
};