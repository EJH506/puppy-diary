const dbcon = require('./../database/sql')
const express = require('express');
const router = express.Router();

// 경로지정 없을시 main(오늘)페이지로 redirect
router.get('/', (req,res)=>{

  // main.ejs로 활용될 오늘날짜 가져오기 
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth()+1;
  const todayDate = today.getDate();

  res.redirect(`main/${todayYear}/${todayMonth}/${todayDate}`);
});

// get 오늘(main)페이지
router.get('/main/:year/:month/:day', async (req,res)=>{

  // 오늘날짜인 params의 날짜를 받아 화면에 뿌림
  const paramsYear = req.params.year;
  const paramsMonth = req.params.month;
  const paramsDay = req.params.day;

  // input데이터 출력을 위한 오늘날짜를 조건으로하는 데이터조회 쿼리문작성
  const conditionSql = `
    SELECT emotion, walk, bath, feed
    FROM conditionTBL
    WHERE regdate = ?;
  `;

  const healthSql = `
    SELECT health
    FROM healthTBL
    WHERE regdate = ?;
  `;

  const treatsSql = `
    SELECT treats
    FROM treatsTBL
    WHERE regdate = ?;
  `;

  // 편집/추가버튼 결정, input데이터출력할 ul생성 유무를 결정할 오늘날짜와 일치하는 데이터의 존재유무 검사
  const checkSql = `
    SELECT COUNT(regdate) as 'check' FROM conditionTBL
    WHERE regdate = ?
  `;

  // 조건절에 넣을 오늘날짜를 변수에 할당
  const paramsDate = `${paramsYear}-${paramsMonth.padStart(2, '0')}-${paramsDay}`;

  // db에 쿼리를 전송하고, 조회한 데이터를 리턴받아 변수에 할당
  const [conditionData] = await dbcon.query(conditionSql, [paramsDate]);
  const [healthData] = await dbcon.query(healthSql, [paramsDate]);
  const [treatsData] = await dbcon.query(treatsSql, [paramsDate]);

  const [check] = await dbcon.query(checkSql, `${paramsYear}-${paramsMonth}-${paramsDay}`);
  // console.log('check =', check); // check = [ { check: 1 } ]
  const checkCount = check[0].check;

  // console.log('main conditionData = ', conditionData);
  // console.log('main healthData = ', healthData);
  // console.log('main treatsData = ', treatsData);

  const mainData = {
    // a태그와 화면출력에 쓰일 날짜데이터
    paramsYear, 
    paramsMonth,
    paramsDay,

    // DB로 조회한 요청데이터
    conditionData,
    healthData,
    treatsData,

    // DB에 해당날짜데이터 유무 검사
    checkCount
  }

  res.render('main', mainData);
});

// get 기록추가페이지 (get/add하는경우 : /main-'추가' or /calendar-'기록추가')
router.get('/add/:year/:month/:day', async (req,res)=>{

  // link와 화면출력, input:hidden으로 전송할 선택날짜 추출
  const selectYear = req.params.year;
  const selectMonth = req.params.month;
  const selectDay = req.params.day;
  
  // ejs에서 보낼 데이터 객체를 변수에 할당
  const selectDate = {
    selectYear,
    selectMonth,
    selectDay
  }
  
  // DB에 해당날짜와 일치하는 데이터가 있는지 검사하기위해 count문으로 primary key인 날짜로 검사해 레코드 수를 추출
  const checkSql = `
    SELECT COUNT(regdate) as 'check' FROM conditionTBL
    WHERE regdate = ?
  `;

  // DB에 쿼리 전송 후 값을 리턴받아 변수에 할당
  const [check] = await dbcon.query(checkSql, `${selectYear}-${selectMonth}-${selectDay}`);
  // console.log('check =', check); // check = [ { check: 1 } ]
  const checkCount = check[0].check;

  // 데이터 없으면 add페이지
  if(checkCount === 0) { 
    res.render('add', selectDate);
  } else { // 있으면 edit 페이지
    res.redirect(`edit/${selectYear}/${selectMonth}/${selectDay}`);
  }
})

// post 기록추가 요청
router.post('/add', async (req,res)=>{
  
  // DB저장에 쓰일 해당날짜 추출
  // add페이지에서 input:hidden으로 받아옴
  const selectYear = req.body.selectYear;
  const selectMonth = req.body.selectMonth;
  const selectDay = req.body.selectDay;

  // condition 데이터 INSERT
  await (async function() {
    
    // DB에 저장할 input으로 요청된 데이터 추출
    const conditionValue = {
      regdate: selectYear +'-'+ selectMonth.padStart(2, '0') +'-'+ selectDay.padStart(2, '0'),
      emotion: req.body.emotion,
      walk: req.body.walk,
      bath: req.body.bath,
      feed: req.body.feed
    }

    const conditionSql = `
    INSERT INTO conditionTBL (regdate, emotion, walk, bath, feed)
    VALUES (?, ?, ?, ?, ?);
  `;

    // 조건절에 넣을 요청받은 데이터 비구조화할당
    const {regdate, emotion, walk, bath, feed} = conditionValue;

    // DB에 쿼리전송해 input데이터를 DB에 저장
    await dbcon.query(conditionSql, [regdate, emotion, walk, bath, feed]);

    // console.log('INSERT conditionValue = ',conditionValue)
  })();
  
  // health 데이터 INSERT
  await (async function() {

    // DB에 저장할 input으로 요청된 데이터 추출
    const healthValue = {
      regdate: selectYear +'-'+ selectMonth.padStart(2, '0') +'-'+ selectDay.padStart(2, '0'),
      health: req.body.health
    }

    // console.log('INSERT healthValue =', healthValue);

    // 조건절에 넣을 요청받은 데이터 비구조화할당
    const {regdate, health} = healthValue;

    // console.log('health = ', health);
    // health =  [ 'puke', 'diarrhea', 'appetiteloss', 'ache' ] 다중입력시 배열로 담김

    // console.log('typeof health = ', typeof health);
    // typeof health =  object 타입은 object로 취급됨

    // 만약 입력받은 health 데이터가 한개(string)이 아닌 여러개(object)면 for문으로 input
    if(typeof healthValue.health === 'object') { 

      for(let h=0; h<healthValue.health.length; h++) {

        // DB로 데이터 전송
        const healthSql = `
          INSERT INTO healthTBL (regdate, health)
          VALUES (?, ?);
        `;
        
        await dbcon.query(healthSql, [regdate, health[h]]);
      }

    } else { // 아니고 string(한개)이면 for문X
      const healthSql = `
        INSERT INTO healthTBL (regdate, health)
        VALUES (?, ?);
      `;
      
      await dbcon.query(healthSql, [regdate, health]);

    }

  }) ();

  // treats 데이터 INSERT
  await (async function() {

    // DB에 저장할 input으로 요청된 데이터 추출
    const treatsValue = {
      regdate: selectYear +'-'+ selectMonth.padStart(2, '0') +'-'+ selectDay.padStart(2, '0'),
      treats: req.body.treats
    }

    // console.log('INSERT treatsValue =', treatsValue);

    // 조건절에 넣을 요청받은 데이터 비구조화할당
    const {regdate, treats} = treatsValue;

    // 만약 입력받은 treats 데이터가 한개(string)이 아닌 여러개(object)면 for문으로 input
    if(typeof treatsValue.treats === 'object') {

      for(let t=0; t<treatsValue.treats.length; t++) {

        // DB로 데이터 전송
        const treatsSql = `
          INSERT INTO treatsTBL (regdate, treats)
          VALUES (?, ?);
        `;
        
        await dbcon.query(treatsSql, [regdate, treats[t]]);

      }

    } else { // 아니고 string(한개)이면 for문X

      const treatsSql = `
        INSERT INTO treatsTBL (regdate, treats)
        VALUES (?, ?);
      `;
      
      await dbcon.query(treatsSql, [regdate, treats]);
    }

  }) ();

  // 저장(post('/add')) 후 목록으로 빠져나감
  res.redirect(`/calendar/${selectYear}/${selectMonth}`);

});

// get 목록페이지
router.get('/calendar/:year/:month', async (req,res)=>{
  
  // 날짜 이전다음버튼link, 화면출력, DB조회에 쓰일 해당날짜 추출
  const paramsYear = req.params.year;
  const paramsMonth = req.params.month;

  // 이전 년월
  let prevYear = paramsYear;
  let prevMonth = paramsMonth-1;

  // 다음 년월
  let nextYear = paramsYear;
  let nextMonth = parseInt(paramsMonth)+1;

  if(prevMonth === 0) {
    prevMonth = 12;
    prevYear = paramsYear - 1;
  }

  if(nextMonth === 13) {
    nextMonth = 1;
    nextYear = parseInt(paramsYear) + 1;
  }

  // 목록에 출력하기 위한 해당년월과 일치하는 input입력을 받는 모든테이블의 모든컬럼의 데이터 SELECT
  const conditionSql = `
    SELECT DATE_FORMAT(regdate, '%Y-%m-%d') as regdate, emotion, walk, bath, feed
    FROM conditionTBL
    WHERE YEAR(regdate) = ? && MONTH(regdate) = ?
    ORDER BY regdate ASC;
  `;

  const healthSql = `
    SELECT DATE_FORMAT(regdate, '%Y-%m-%d') as regdate, health
    FROM healthTBL
    WHERE YEAR(regdate) = ? && MONTH(regdate) = ?
    ORDER BY regdate ASC;
  `;

  const treatsSql = `
    SELECT DATE_FORMAT(regdate, '%Y-%m-%d') as regdate, treats
    FROM treatsTBL
    WHERE YEAR(regdate) = ? && MONTH(regdate) = ?
    ORDER BY regdate ASC;
  `;

  const [conditionData] = await dbcon.query(conditionSql, [paramsYear, paramsMonth]);
  const [healthData] = await dbcon.query(healthSql, [paramsYear, paramsMonth]);
  const [treatsData] = await dbcon.query(treatsSql, [paramsYear, paramsMonth]);

  // console.log('calendar conditionData =',conditionData);

  
  // DB에 해당년월과 일치하는 데이터가 있는지 검사
  const checkSql = `
    SELECT COUNT(regdate) as 'check' FROM conditionTBL
    WHERE regdate Like ?
  `;

  const [check] = await dbcon.query(checkSql, `${paramsYear}-${paramsMonth.padStart(2, '0')}%`);// console.log('check =', check); // check = [ { check: 1 } ]
  const checkCount = check[0].check;

  const calendarData = {
    // 페이지와 관련된 날짜데이터
    paramsYear,
    paramsMonth,
    prevYear,
    prevMonth,
    nextYear,
    nextMonth,

    // input데이터
    conditionData,
    healthData,
    treatsData,

    // DB에 해당날짜데이터 유무 검사
    checkCount
  }

  res.render('calendar', calendarData);
});


// /calendar 페이지에서 기록추가 시 form으로 선택날짜 전송
// 해당 선택날짜를 params으로 받은 /add 페이지로 redirect
router.post('/calendar', async (req,res)=>{

  const selectYear = req.body.year;
  const selectMonth = req.body.month;
  const selectDay = req.body.day;

  // DB에 해당날짜와 일치하는 데이터가 있는지 검사
  const checkSql = `
    SELECT COUNT(regdate) as 'check' FROM conditionTBL
    WHERE regdate = ?
  `;

  const [check] = await dbcon.query(checkSql, `${selectYear}-${selectMonth}-${selectDay}`);// console.log('check =', check); // check = [ { check: 1 } ]
  const checkCount = check[0].check;

  // 데이터가 없으면 /add 페이지
  if(checkCount === 0) { 
    res.redirect(`/add/${selectYear}/${selectMonth}/${selectDay}`);
  } else { // 있으면 /edit 페이지
    res.redirect(`/edit/${selectYear}/${selectMonth}/${selectDay}`);
  }
})

// get 수정페이지
router.get('/edit/:year/:month/:day', async (req,res)=>{

  const year = req.params.year;
  const month = req.params.month;
  const day = req.params.day;
  const zMonth = (month > 10) ? '0'+month : month;
  const zDay = (day > 10) ? '0'+day : day;

  // 날짜데이터 변환
  const formattedDate = `${year}-${zMonth}-${zDay}`

  // 기존에 선택된 데이터 추출
  const dbConditionSql = `
    SELECT * FROM conditionTBL where regdate = ?
  `;
  const dbHealthSql = `
    SELECT * FROM healthTBL where regdate = ?
  `;
  const dbTreatsSql = `
    SELECT * FROM treatsTBL where regdate = ?
  `;

  const [dbCondition] = await dbcon.query(dbConditionSql, formattedDate);
  const [dbHealth] = await dbcon.query(dbHealthSql, formattedDate);
  const [dbTreats] = await dbcon.query(dbTreatsSql, formattedDate);

  console.log(dbCondition[0]);
  console.log(dbHealth);
  console.log(dbTreats);

  const editData = {
    year,
    month,
    day,
    dbCondition : dbCondition[0],
    dbHealth,
    dbTreats
  }

  res.render('edit', editData)
})

// 기록 수정 요청
router.post('/edit', async (req, res)=>{
  
  // DB저장에 쓰일 해당날짜 추출
  // add페이지에서 input:hidden으로 받아옴
  const selectYear = req.body.selectYear;
  const selectMonth = req.body.selectMonth;
  const selectDay = req.body.selectDay;

  // condition 데이터 UPDATE
  await (async function() {
    
    // DB에 저장할 input으로 요청된 데이터 추출
    const conditionValue = {
      regdate: selectYear +'-'+ selectMonth.padStart(2, '0') +'-'+ selectDay.padStart(2, '0'),
      emotion: req.body.emotion,
      walk: req.body.walk,
      bath: req.body.bath,
      feed: req.body.feed
    }

    const conditionSql = `
      UPDATE conditiontbl SET
      emotion = ?,
      walk = ?,
      bath = ?,
      feed = ?
      WHERE regdate = ?;
    `;

    // 조건절에 넣을 요청받은 데이터 비구조화할당
    const {regdate, emotion, walk, bath, feed} = conditionValue;

    // DB에 쿼리전송해 input데이터를 DB에 저장
    await dbcon.query(conditionSql, [emotion, walk, bath, feed, regdate]);

    // console.log('INSERT conditionValue = ',conditionValue)
  })();
  

  // health 데이터 UPDATE
  await (async function() {

    // DB에 저장할 input으로 요청된 데이터 추출
    const healthValue = {
      regdate: selectYear +'-'+ selectMonth.padStart(2, '0') +'-'+ selectDay.padStart(2, '0'),
      health: req.body.health
    }

    // 조건절에 넣을 요청받은 데이터 비구조화할당
    const {regdate, health} = healthValue;

    // DB로 데이터 전송
    // 기존데이터 비우기
    const healthSql = `
      delete from healthTBL
      WHERE regdate = ?;
    `;
  
    await dbcon.query(healthSql, [regdate]);
      
    if(typeof healthValue.health === 'object') { 
      console.log('반복문실행');

      for(let h=0; h<healthValue.health.length; h++) {

        // DB로 데이터 전송
        const healthSql = `
          INSERT INTO healthTBL (regdate, health)
          VALUES (?, ?);
        `;
        
        await dbcon.query(healthSql, [regdate, health[h]]);
      }

    } else { // 아니고 string(한개)이면 for문X
      const healthSql = `
        INSERT INTO healthTBL (regdate, health)
        VALUES (?, ?);
      `;
      
      await dbcon.query(healthSql, [regdate, health]);

    }

  }) ();

  // treats 데이터 UPDATE
  await (async function() {

    // DB에 저장할 input으로 요청된 데이터 추출
    const treatsValue = {
      regdate: selectYear +'-'+ selectMonth.padStart(2, '0') +'-'+ selectDay.padStart(2, '0'),
      treats: req.body.treats
    }

    // 조건절에 넣을 요청받은 데이터 비구조화할당
    const {regdate, treats} = treatsValue;

    // DB로 데이터 전송
    // 기존 데이터 비우기
    const treatsSql = `
      delete from treatsTBL
      WHERE regdate = ?;
    `;
    
    await dbcon.query(treatsSql, [regdate]);

    // 만약 입력받은 treats 데이터가 한개(string)이 아닌 여러개(object)면 for문으로 input
    if(typeof treatsValue.treats === 'object') {

      for(let t=0; t<treatsValue.treats.length; t++) {

        // DB로 데이터 전송
        const treatsSql = `
          INSERT INTO treatsTBL (regdate, treats)
          VALUES (?, ?);
        `;
        
        await dbcon.query(treatsSql, [regdate, treats[t]]);

      }

    } else { // 아니고 string(한개)이면 for문X

      const treatsSql = `
        INSERT INTO treatsTBL (regdate, treats)
        VALUES (?, ?);
      `;
      
      await dbcon.query(treatsSql, [regdate, treats]);
    }

  }) ();

  // 저장(post('/add')) 후 목록으로 빠져나감
  res.redirect(`/calendar/${selectYear}/${selectMonth}`);

})

// calendar 상세보기
router.get('/calendar/detail', async (req,res)=>{
  const regdate = req.param('regdate');
  console.log(regdate);

  const clickEmotion = `
    SELECT emotion FROM conditionTBL where regdate = ?
  `;
  
  const clickWalk = `
    SELECT walk FROM conditionTBL where regdate = ?
  `;

  const clickBath = `
    SELECT bath FROM conditionTBL where regdate = ?
  `;
  
  const clickFeed = `
    SELECT feed FROM conditionTBL where regdate = ?
  `;

  const clickHealth = `
    SELECT health FROM healthTBL where regdate = ?
  `;

  const clickTreats = `
    SELECT treats FROM treatsTBL where regdate = ?
  `;

  const [emotion] = await dbcon.query(clickEmotion, regdate);
  const [walk] = await dbcon.query(clickWalk, regdate);
  const [bath] = await dbcon.query(clickBath, regdate);
  const [feed] = await dbcon.query(clickFeed, regdate);
  const [health] = await dbcon.query(clickHealth, regdate);
  const [treats] = await dbcon.query(clickTreats, regdate);
  // console.log(health);


  res.json({
    regdate,
    emotion: emotion[0],
    walk : walk[0],
    bath : bath[0],
    feed : feed[0],
    health, 
    treats}
  );
})

// calendar 기록삭제
router.post('/deleteData', async (req,res)=>{
  // 빠져나갈 기존 날짜(년월) 가져오기
  const paramsYear = req.body.year;
  const paramsMonth = req.body.month;

  // 삭제를 위해 선택한 list정보 받아오기(hidden으로 날짜데이터 받아옴)
  const selectListDate = req.body.deleteList;

  // 날짜와 일치하는 데이터 삭제
  // conditionTBL
  const deleteConditionSql = `
    DELETE FROM conditionTBL WHERE regdate = ?;
  `;
  
  // healthTBL
  const deleteHealthSql = `
    DELETE FROM healthTBL WHERE regdate = ?;
  `;
  
  // treatsTBL
  const deleteTreatsSql = `
    DELETE FROM treatsTBL WHERE regdate = ?;
  `;

  // DB에 쿼리전송해 데이터 delete
  // 배열이면
  if(Array.isArray(selectListDate)) {
    for(let i=0; i<selectListDate.length; i++) {
      await dbcon.query(deleteConditionSql, selectListDate[i]);
      await dbcon.query(deleteHealthSql, selectListDate[i]);
      await dbcon.query(deleteTreatsSql, selectListDate[i]);
    }
  } else {
    // 배열아니면
      await dbcon.query(deleteConditionSql, selectListDate);
      await dbcon.query(deleteHealthSql, selectListDate);
      await dbcon.query(deleteTreatsSql, selectListDate);

  }
  console.log("selectListDate = "+selectListDate);
  console.log("selectListDate[0] = "+selectListDate[1]);
  console.log("Array.isArray(selectListDate) = " + Array.isArray(selectListDate));

  // 저장(post('/add')) 후 목록으로 빠져나감
  res.redirect(`/calendar/${paramsYear}/${paramsMonth}`);

})





module.exports = router;