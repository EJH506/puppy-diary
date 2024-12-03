SHOW DATABASES;
-- DROP DATABASE puppydb;
CREATE DATABASE puppydb DEFAULT CHARACTER SET UTF8MB4;

USE puppydb;

SHOW TABLES;

-- 건강, 간식 제외 테이블
CREATE TABLE conditionTBL (
	regdate DATE PRIMARY KEY,
	emotion VARCHAR(30)	COMMENT '기분상태',
	walk VARCHAR(30) 	COMMENT '산책유무',
	bath VARCHAR(30)	COMMENT '목욕유무',
	feed VARCHAR(30)	COMMENT '사료급여'
) DEFAULT CHARACTER SET UTF8MB4;


CREATE TABLE healthTBL (
	regdate DATE NOT NULL,
	health VARCHAR(30)
) DEFAULT CHARACTER SET UTF8MB4;

CREATE TABLE treatsTBL (
	regdate DATE NOT NULL,
	treats VARCHAR(30)
) DEFAULT CHARACTER SET UTF8MB4;



-- 목업데이터
-- 건강, 간식 제외 테이블 목업데이터
INSERT INTO conditionTBL (regdate, emotion, walk, bath, feed)
VALUES ('2024-07-05', 'anxious', 'walk0', 'nobath', 'many');

INSERT INTO conditionTBL (regdate, emotion, walk, bath, feed)
VALUES ('2024-07-25', 'happy', 'walk60', 'yesbath', 'normal');


-- 건강테이블 목업
INSERT INTO healthTBL (regdate, health)
VALUES ('2024-07-05', 'ache');
INSERT INTO healthTBL (regdate, health)
VALUES ('2024-07-05', 'injury');

INSERT INTO healthTBL (regdate, health)
VALUES ('2024-07-25', 'puke');
INSERT INTO healthTBL (regdate, health)
VALUES ('2024-07-25', 'appetiteloss');
INSERT INTO healthTBL (regdate, health)
VALUES ('2024-07-25', 'injury');

-- 간식테이블 목업
INSERT INTO treatsTBL (regdate, treats)
VALUES ('2024-07-05', 'vegan');


INSERT INTO treatsTBL (regdate, treats)
VALUES ('2024-07-25', 'meat');
INSERT INTO treatsTBL (regdate, treats)
VALUES ('2024-07-25', 'gum');

SHOW tables;

SELECT * FROM conditionTBL ORDER BY regdate;
desc conditionTBL;
SELECT * FROM healthTBL ORDER BY regdate;
SELECT * FROM treatsTBL ORDER BY regdate;

DELETE FROM conditionTBL;
DELETE FROM healthTBL;
DELETE FROM treatsTBL;

SELECT DATE_FORMAT(regdate, '%Y-%m-%d') as regdate, emotion, walk, bath, feed
FROM conditionTBL;

SELECT YEAR(regdate) as 'year' FROM conditionTBL;
SELECT MONTH(regdate) as 'month' FROM conditionTBL;
SELECT DAY(regdate) as 'day' FROM conditionTBL;

SELECT DATE_FORMAT(regdate, '%Y-%m-%d') as regdate, emotion, walk, bath, feed
FROM conditionTBL
WHERE YEAR(regdate) = '2024' && MONTH(regdate) = '7'
ORDER BY regdate ASC;



SELECT COUNT(regdate) FROM conditionTBL
WHERE regdate = "2024-07-31";