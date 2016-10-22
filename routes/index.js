var crypto = require('crypto'),
    Post = require('../models/post.js'),
    User = require('../models/user.js');    //crypto是nodejs核心模块，它生成散列值来加密密码

var express = require('express');
var router = express.Router();

///* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express hello where' });
//});
//
//module.exports = router;

//module.exports = function(app) {
//    app.get('/', function(req, res) {
//        res.render('index', {title:'Express is'})
//    })
//}

module.exports = function(app) {
    app.get('/', function (req, res) {
        Post.get(null, function (err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function(req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];

        //检查两次密码是否重复一致
        if (password_re != password) {
            req.flash('error', '两次输入密码不一致！');
            return res.redirect('./reg');
        }

        //生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        var newUser = new User({
            name:name,
            password:password,
            email:req.body.email
        })

        //检查用户名是否已存在
        User.get(newUser.name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            if (user) {
                req.flash('error', '用户已存在!');
                return res.redirect('/reg');
            }

            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success', '注册成功!');
                res.redirect('/');
            })
        })

        // 用户信息存入session，以后可以通过req.session.user读取
        //req.body ： 就是 POST 请求信息解析过后的对象，例如我们要访问 POST 来的表单内的 name="password" 域的值，只需访问 req.body['password'] 或 req.body.password 即可。
        //res.redirect ： 重定向功能，实现了页面的跳转，更多关于 res.redirect 的信息请查阅： http://expressjs.com/api.html#res.redirect  。
        //User ：在前面的代码中，我们直接使用了 User 对象。User 是一个描述数据的对象，即 MVC 架构中的模型。前面我们使用了许多视图和控制器，这是第一次接触到模型。与视图和控制器不同，模型是真正与数据打交道的工具，没有模型，网站就只是一个外壳，不能发挥真实的作用，因此它是框架中最根本的部分。

    })

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()});
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if (user.password != password) {
                req.flash('error', '密码错误!');
                return res.redirect('/login');//密码错误则跳转到登录页
            }
            //用户名密码都匹配后，将用户信息存入 session
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');//登陆成功后跳转到主页

            
        });
    });

    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        res.render('post', {
            title:'发表',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })

    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');//发表成功跳转到主页
        });
    })

    app.post('/logout', checkLogin);
    app.post('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    })

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');//登出成功后跳转到主页
    });
}

function checkNotLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录！');
        res.redirect('/login');
    }
    next();
}

function checkLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录！');
        res.redirect('back');
    }
    next();
}

// 1,生成一个路由实例用来捕获访问主页的get请求，导出这个路由并在app.js中通过app.use('/', routes)加载，这样，当访问主页
//时，就会调用res.render;渲染views/index.ejs模板并显示到浏览器中

// 2,这里通过routes/index.js中导出一个函数接口，在app.js中通过require加载了index.js然后通过routes(app)调用了index.js
//导出的函数

//app.get() 第一个为请求路径，第二个为处理请求的回调函数，
//res.render() 第一个参数是模板的名称，第二个是传递给模板的数据对象，用于模板翻译

// ejs
<!-- <% code %> js代码-->
<!-- <% =code %> 显示替换过HTML特殊字符的内容-->
<!-- <% -code %> 显示原始HTML内容-->
