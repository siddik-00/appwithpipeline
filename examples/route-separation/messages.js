'use strict'

var db = require('./data');

function threadList (meId) {
  var otherIds = [];
  db.messages.forEach(function (m) {
    var other = m.fromId === meId ? m.toId : m.fromId;
    if (otherIds.indexOf(other) === -1) otherIds.push(other);
  });
  // Also include registered users as available contacts so the inbox
  // is usable right away, but only threads that exist or default users.
  return otherIds;
}

exports.inbox = function(req, res){
  var meId = req.session.user.id;

  var contacts = threadList(meId).map(function (otherId) {
    var other = db.findById(otherId);
    var msgs = db.messages.filter(function (m) {
      return (m.fromId === meId && m.toId === otherId) || (m.fromId === otherId && m.toId === meId);
    });
    var last = msgs[msgs.length - 1];
    return {
      id: other.id,
      name: other.name,
      lastText: last ? last.text : 'No messages yet',
      lastWhen: last ? last.createdAt : 0,
      unread: msgs.filter(function (m) { return m.fromId === otherId && !m.read }).length
    };
  }).sort(function (a, b) { return b.lastWhen - a.lastWhen });

  res.render('messages/inbox', {
    title: 'Messages',
    contacts: contacts,
    me: req.session.user,
    everyone: db.users.filter(function (u) { return u.id !== meId })
  });
};

exports.thread = function(req, res){
  var meId = req.session.user.id;
  var other = db.findById(req.params.userId);

  if (!other) return res.sendStatus(404);
  if (other.id === meId) return res.redirect('/messages');

  var msgs = db.messages.filter(function (m) {
    return (m.fromId === meId && m.toId === other.id) || (m.fromId === other.id && m.toId === meId);
  });

  // mark incoming as read
  msgs.forEach(function (m) {
    if (m.fromId === other.id) m.read = true;
  });

  res.render('messages/thread', {
    title: 'Messages with ' + other.name,
    other: other,
    me: req.session.user,
    msgs: msgs
  });
};

exports.send = function(req, res){
  var meId = req.session.user.id;
  var other = db.findById(req.params.userId);
  var text = (req.body.text || '').trim();

  if (other && other.id !== meId && text) {
    db.addMessage(meId, other.id, text);
  }

  res.redirect('/messages/' + req.params.userId);
};

// Simple polling endpoint: returns messages newer than ?after=<id>
exports.poll = function(req, res){
  var meId = req.session.user.id;
  var other = db.findById(req.params.userId);
  if (!other || other.id === meId) return res.status(404).json({ error: 'bad thread' });

  var after = Number(req.query.after || -1);
  var msgs = db.messages.filter(function (m) {
    if (m.id <= after) return false;
    return (m.fromId === meId && m.toId === other.id) || (m.fromId === other.id && m.toId === meId);
  }).map(function (m) {
    return { id: m.id, fromMe: m.fromId === meId, text: m.text, createdAt: m.createdAt };
  });

  msgs.forEach(function (m) {
    if (!m.fromMe) m.read = true;
  });

  res.set('Cache-Control', 'no-store');
  res.json(msgs);
};