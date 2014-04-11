
/*
 * GET home page.
 */
var mysql = require('mysql');

function handleError () {
    conn = mysql.createConnection({
        host: 'localhost',
        user: 'dt',
        password: 'Dt337683',
        database: 'nodejs',
        port: 3306
    });

    //连接错误，2秒重试
    conn.connect(function (err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleError , 2000);
        }
    });

    conn.on('error', function (err) {
        console.log('db error', err);
        // 如果是连接断开，自动重新连接
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleError();
        } else {
            throw err;
        }
    });
}
handleError();

module.exports = function(app) {
	app.get('/', function(req, res){
        conn.query('select * from post',function(err,posts){
            if(err){
                req.flash('error','error!');
                res.redirect('/');
            }
            res.render('index',{
                title: '首页',
                posts: posts,
                error: req.flash('error'),
                success: req.flash('success')
            });
        });
	});

	app.get('/reg', function(req, res){
        res.render('reg', {
            title: '用户注册',
            error: req.flash('error'),
            success: req.flash('success')
        });
	});

	app.get('/u/:user', function(req, res){
        conn.query('select * from post where username = '+req.params.user,function(err,posts){
            if(err){
                req.flash('error', 'error!');
                res.redirect('/');
            }

            res.render('user',{
                title: req.params.user,
                posts: posts,
                error: req.flash('error'),
                success: req.flash('success')
            });
        });
	});

    app.post('/post', function(req, res){
        user = req.session.user;
        var time = new Date();
        if (req.body.post == ''){
            req.flash('error', '正文不能为空');
            return res.redirect('/u/'+user.username);
        }
        conn.query('insert into post(username, post, time) values("'+user.username+'","'+req.body.post+'","'+time+'");',function(err){//values()里面的值要用“”号括起来
                if(err){
                    req.flash('error', err.toString());
                    return res.redirect('/u/'+user.username);
                }
                req.flash('success', '发表成功！');
                res.redirect('/u/'+user.username);
            });  
    });
    
    app.post('/reg', function(req, res){
        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('error', '两次输入的口令不一致!');
            return res.redirect('/reg');
        }     
        if (req.body.username == ''){
            req.flash('error', '用户名不能为空!');
            return res.redirect('/reg');
        }  
        if (req.body.password == ''){
            req.flash('error', '密码不能为空!');
            return res.redirect('/reg');
        } 

        conn.query('select * from user where username = "'+req.body.username+'"',function(err,user){
            if(user[0]){
                req.flash('error', '用户名已存在!');
                return res.redirect('/reg');
            }
            conn.query('insert into user(username,password) values("'+req.body.username+'","'+req.body.password+'");',function(err){
                if(err){
                    req.flash('error', '注册失败!');
                    return res.redirect('/reg');
                }
                req.session.user = {
                    username: req.body.username,
                    password: req.body.password
                };
                req.flash('success', '注册成功！');
                res.redirect('/u/'+req.body.username);
            });    
        });
    }); 
    app.get('/login', function(req, res){
        res.render('login',{
            title: '用户登入',
            error: req.flash('error'),
            success: req.flash('success')
        })
    });
    app.post('/login', function(req, res){
        if (req.body.username == ''){
            req.flash('error', '用户名不能为空!');
            return res.redirect('/login');
        }  
        if (req.body.password == ''){
            req.flash('error', '密码不能为空!');
            return res.redirect('/login');
        } 


        var username = req.body.username;
        var password = req.body.password;
        conn.query('select * from user where username = '+username,function(err,user){
            if(err){
                req.flash('error', '登录失败!');
                res.redirect('/login');
            }
            if(!user[0]){
                req.flash('error', '用户不存在!');
                return res.redirect('/login');
            }
            if(user[0].password == password){
                req.session.user = user[0];
                req.flash('success', '登录成功!');
                res.redirect('/u/'+username);
            }else{
                req.flash('error', '密码错误!');
                res.redirect('/login');
            }
        });
    });

    app.get('/logout', function(req, res){
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    });

    app.get('/delete/:time', function(req, res){
        conn.query('delete from post where time='+'"'+req.params.time+'"',function(err){
            if(err){
                req.flash('error', err.toString());
                res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('back');
        });
    });

    app.get('/update/:time', function(req, res){
        conn.query('select * from post where time = '+'"'+req.params.time+'"',function(err,post){
            res.render('update', {
                title: '修改',
                post: post[0],
                error: req.flash('error'),
                success: req.flash('success')
            });
        });
    });

    app.post('/update/:time', function(req, res){
        conn.query('update post set post='+'"'+req.body.post+'"'+' where time = '+'"'+req.params.time+'"',function(err){
            if(err){
                req.flash('error','修改失败！');
                res.redirect('/u/'+req.session.user.username);
            }
            req.flash('success','修改成功！');
            res.redirect('/u/'+req.session.user.username);
        });

    });

    app.post('/', function(req, res){
        conn.query('select * from post where username = '+'"'+req.body.search+'"', function(err,posts){
            if(err){
                req.flash('error','error!');
                return res.redirect('/');
            }
            res.render('index',{
                title: '首页',
                posts: posts,
                error: req.flash('error'),
                success: req.flash('success')
            });
        });
    });
};