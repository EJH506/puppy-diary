# Node.js 이미지 사용
FROM node:14

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install --production

# 소스 코드 복사
COPY . .

# 애플리케이션 포트 설정
EXPOSE 4500

# 애플리케이션 실행
CMD ["node", "index.js"]