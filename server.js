var shortid = require('shortid');
var NodeCache = require( "node-cache" );
var cache = new NodeCache();
var spawn = require('child_process').spawn;
var ExpressMVC = require('express_mvc');

var app = new ExpressMVC.App({
    port: 80, //serve app on port 80
    access_logging: true, //turn on access logging
    parse_body: { //allow body parsing
        json: true, //json  body, okay
        urlencoded: { //urlencoded body, okay
            extended: true
        }
    } 
});

app.set('view engine', 'ejs');

var router = new ExpressMVC.Router;
    router.addRoute(new router.Route('GET', '/', function(req, res){
       res.render('index');
    }));

    router.addRoute(new router.Route('POST', '/save', function(req, res){
        var sid = req.body.sid || shortid.generate();
        cache.get(sid, function(err, revisions){
            if( err || typeof revisions === "undefined" ){
                revisions = [];
            }
            revisions.push(req.body.code);
            cache.set(sid, revisions, function(err, success){
                if( err ){
                    res.write(JSON.stringify({err: err, success: false}));
                }else{
                    var redirect = '/' + sid + (revisions.length > 1 ? ('/' + (revisions.length - 1)) : '');
                    res.write(JSON.stringify({success: true, redirect: redirect}));
                }
                res.end();
            });
        });
    }));

    router.addRoute(new router.Route('POST', '/parse', function(req, res){
        var output = {stdout: '', stderr: ''};
        var php = spawn('php', ['-r', req.body.code], {
            cwd: '/home/phpuser',
            gid: 1000,
            uid: 1000
        });
        php.stdout.on('data', function(data){
            output.stdout += data.toString();
        });
        php.stderr.on('data', function(data){
            output.stderr += data.toString();
        });
        php.on('close', function(){
            res.write(JSON.stringify(output));
            res.end();
        });
    }));
    
    router.addRoute(new router.Route('GET', '/:sid/:rid?', function(req, res){
        cache.get(req.params.sid, function(err, value){
            if( err ){
               return res.render('index', {err: err});
            }

            if( typeof value === "undefined" ){
                return res.render('index');
            }
 
            res.render('index', {code: value[req.params.rid || 0], sid: req.params.sid});
        });
    }));

app.addRouter(router);

app.listen();
