'use strict'

// Fake posts database

var posts = [
  {
    title: 'Getting Started with Express',
    excerpt: 'Learn how to scaffold your first Express application and understand the request-response lifecycle.',
    author: 'TJ',
    authorId: 0,
    date: '2026-09-01',
    category: 'Guides',
    tags: ['express', 'nodejs', 'tutorial'],
    readTime: 4,
    body: 'Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. This guide walks you through installing Express, creating your first route, and serving both HTML and JSON responses.'
  },
  {
    title: 'Understanding Middleware',
    excerpt: 'Middleware functions are the heart of Express. See how they chain together to handle requests.',
    author: 'Tobi',
    authorId: 1,
    date: '2026-08-20',
    category: 'Concepts',
    tags: ['middleware', 'express'],
    readTime: 6,
    body: 'Middleware functions are functions that have access to the request object, the response object, and the next middleware function in the application request-response cycle. Express is fundamentally a routing and middleware web framework, so learning how middleware works is key to building maintainable apps.'
  },
  {
    title: 'Rendering Templates with EJS',
    excerpt: 'Combine server-side data with clean HTML by using the EJS templating engine.',
    author: 'Jane',
    authorId: 3,
    date: '2026-08-10',
    category: 'Guides',
    tags: ['ejs', 'templating', 'html'],
    readTime: 5,
    body: 'EJS lets you generate HTML markup with plain JavaScript. In this walkthrough we render user and post pages from shared header and footer partials, pass locals to the views, and keep the markup readable and maintainable across the whole application.'
  },
  {
    title: 'Routing Best Practices',
    excerpt: 'Keep your application organised with separated route modules for users, posts and more.',
    author: 'Loki',
    authorId: 2,
    date: '2026-07-28',
    category: 'Best Practices',
    tags: ['routing', 'architecture'],
    readTime: 7,
    body: 'As your application grows, keeping every route in one file becomes unmanageable. This article shows how to split handlers into focused modules, use middleware like loaders for parameters, and structure your project so that new features are trivial to add.'
  }
];

exports.list = function(req, res){
  res.render('posts', { title: 'Posts', posts: posts });
};

exports.load = function(req, res, next){
  var id = req.params.id;
  req.post = posts[id];
  if (req.post) {
    next();
  } else {
    var err = new Error('cannot find post ' + id);
    err.status = 404;
    next(err);
  }
};

exports.show = function(req, res){
  res.render('posts/view', {
    title: req.post.title,
    post: req.post,
    index: req.params.id
  });
};
