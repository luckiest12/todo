const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const { static } = require('express');
app.set('view engime', 'ejs');
app.use('/public', express.static('public'))
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
require('dotenv').config()

const http = require('http').createServer(app);
const io = require('socket.io')(http);


var db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
    if (err) return console.log(err)
    db = client.db('todoapp');

    http.listen(process.env.PORT, function () {
        console.log('listening on 8080')
    });
});




/*var db;
MongoClient.connect('mongodb+srv://newserver:lhc1991@cluster0.ryy5r.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function (에러, client) {
    if (에러) return console.log(에러)
    db = client.db('todoapp');

    app.listen(8080, function () {
        console.log('listening on 8080')
    });
});*/

//mongodb+srv://newserver:lhc1991@cluster0.ryy5r.mongodb.net/<dbname>?retryWrites=true&w=majority//

app.get('/', function (요청, 응답) {
    응답.render('index.ejs')
});

app.get('/write', function (요청, 응답) {
    응답.render('write.ejs')
});

app.post('/add', function (요청, 응답) {
    응답.send('전송완료')
    db.collection('counter').findOne({ name: '게시물 갯수' }, function (에러, 결과) {
        console.log(결과.totalPost)
        var 총게시물갯수 = 결과.totalPost;

        db.collection('post').insertOne({ _id: 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date }, function (에러, 결과) {
            console.log('저장완료');
            db.collection('counter').updateOne({ name: '게시물 갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
                if (에러) { return console.log(에러) }
            })
        });
    });

});

app.get('/list', function (요청, 응답) {
    db.collection('post').find().toArray(function (에러, 결과) {
        console.log(결과);
        응답.render('list.ejs', { posts: 결과 });
    });

});

app.delete('/delete', function (요청, 응답) {
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id);
    db.collection('post').deleteOne(요청.body, function (에러, 결과) {
        console.log('삭제완료');
        응답.status(200).send({ message: '성공했습니다' });
    })
});


app.get('/detail/:id', function (요청, 응답) {
    db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
        console.log(결과);
        응답.render('detail.ejs', { data: 결과 });
    })

});

app.get('/edit/:id', function (요청, 응답) {
    db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
        응답.render('edit.ejs', { post: 결과 })
    })

});

app.put('/edit', function (요청, 응답) {
    db.collection('post').updateOne({ _id: parseInt(요청.body.id) }, { $set: { 제목: 요청.body.title, 날짜: 요청.body.date } }, function (에러, 결과) {
        console.log('수정완료')
        응답.redirect('/list')
    })
})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', function (요청, 응답) {
    응답.render('login.ejs')
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/fail' }), function (요청, 응답) {
    응답.redirect('/mypage')
});



app.get('/mypage', 로그인했니, function (요청, 응답) {
    console.log(요청.user);
    응답.render('mypage.ejs', { 사용자: 요청.user })
})

function 로그인했니(요청, 응답, next) {
    if (요청.user) {
        next()
    } else {
        응답.send('로그인안하셨는데요?')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)
        if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

passport.serializeUser(function (user, done) {
    done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
        done(null, 결과)
    })
});

app.use('/shop', require('./routes/shop.js'))

app.use('/board/sub', require('./routes/board.js'))

let multer = require('multer');
const { Socket } = require('dgram');
var storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, './public/image')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }

});

var upload = multer({ storage: storage });


app.get('/upload', function (요청, 응답) {
    응답.render('upload.ejs')
});

app.post('/upload', upload.single('프로필'), function (요청, 응답) {
    응답.send('업로드완료')
});

app.get('/image/:이미지이름', function (요청, 응답) {
    응답.sendFile(__dirname + '/public/image' + 요청.params.이미지이름)
});

app.get('/fail', function (요청, 응답) {
    응답.render('fail.ejs')
});

app.get('/chat', function (요청, 응답) {
    응답.render('chat.ejs')

});

io.on('connection', function (socket) {
    console.log('연결되었어요');

    socket.on('인삿말', function (data) {
        console.log(data)
        io.emit('퍼트리기', data);
    });
});

var chat1 = io.of('/채팅방1');
chat1.on('connection', function (socket) {

    var 방번호 = '';
    socket.on('방들어가고픔', function (data) {
        socket.join(data);
        방번호 = data;
    })

    socket.on('인삿말', function (data) {
        console.log(data);
        chat1.to(방번호).emit('퍼트리기', data);
    });
});