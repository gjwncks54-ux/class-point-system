# 🏫 Class Point System — Firebase Hosting 배포 가이드

## 사전 준비 (한 번만)

### 1. Node.js 설치
- https://nodejs.org 에서 LTS 버전 다운로드 & 설치

### 2. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 3. Firebase 로그인
```bash
firebase login
```
→ 브라우저가 열리면 Google 계정으로 로그인

---

## 배포 (매번 코드 수정 후)

### 이 폴더에서 터미널을 열고:

```bash
# 1. 패키지 설치 (처음 한 번만)
npm install

# 2. 빌드
npm run build

# 3. 배포
npx firebase deploy --only hosting
```

### 또는 한 줄로:
```bash
npm install && npm run build && npx firebase deploy --only hosting
```

---

## 배포 후 URL

**학생 접속 URL:**
```
https://class-point-system-f3bec.web.app
```

이 URL은 Firebase 도메인이라 학교 와이파이에서도 접속 가능합니다.

---

## Firestore Rules 배포 (선택)

Rules도 함께 배포하려면:
```bash
npx firebase deploy --only firestore:rules
```

⚠️ `firestore.rules` 파일의 `PASTE_TEACHER_UID_HERE`를
실제 Teacher UID로 교체해야 합니다.

Teacher UID 확인 방법:
1. 앱에서 Teacher로 로그인
2. 브라우저 개발자 도구 (F12) → Console 탭
3. `ADMIN UID: xxxx` 에 표시된 값 복사

---

## 파일 구조

```
class-point-system/
├── src/
│   ├── App.jsx          ← 메인 앱 코드
│   └── main.jsx         ← React 진입점
├── index.html           ← HTML 템플릿
├── package.json         ← 의존성
├── vite.config.js       ← 빌드 설정
├── firebase.json        ← Firebase 호스팅 설정
├── .firebaserc          ← Firebase 프로젝트 연결
├── firestore.rules      ← Firestore 보안 규칙
└── deploy.sh            ← 원클릭 배포 스크립트
```

## 코드 수정하기

CodeSandbox 대신 아무 에디터에서 `src/App.jsx`를 수정하고
다시 `npm run build && npx firebase deploy --only hosting` 하면 됩니다.
