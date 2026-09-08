'use strict'

exports.index = function(req, res){
  res.render('index', {
    title: 'Route Separation Example',
    user: req.session && req.session.user || null
  });
};
