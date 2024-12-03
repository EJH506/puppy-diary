// dotenv 사용 설정
const dotenv = require('dotenv');
dotenv.config();

const path = require('path');

const express = require('express');
const app = express();

const routerModule = require('./routes/router');


// ejs 사용할 때 설정
const filePath = path.resolve(__dirname, 'views');
app.set('view engine', 'ejs');
app.set('views', filePath);

// 정적파일설정
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// 요청한 form데이터에 접근하기위한 설정
app.use(express.json()); // JSON 요청을 처리할 수 있도록 설정
app.use(express.urlencoded({extended:true}));

// 포트설정
app.set('port', 4500);
 

// 라우팅
app.use('/', routerModule); 

// app.use('/project', (req,res)=>{
//   res.render('calendar')
// });

app.listen(app.get('port'), ()=>{ 
  console.log(`서버가 ${app.get('port')}에서 대기중입니다`);
});