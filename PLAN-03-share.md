## 기능 계획: SNS 공유 버튼

### 목표
- "광복절을 기념합니다 🇰🇷" 문구와 함께 현재 페이지를 쉽게 공유하도록 한다.

### 사용자 시나리오
- 공유 버튼 클릭 시, 가능한 경우 네이티브 공유 시트가 표시된다.
- 미지원 환경에서는 링크가 복사되고, 복사 완료 토스트가 뜬다.

### UI/DOM
- `index.html`
  - 헤더 또는 플로팅 버튼: `<button id="shareBtn" aria-label="공유하기">공유</button>`
  - 토스트 영역: `<div id="toast" role="status" aria-live="polite" hidden></div>`

### 메타/프리뷰
- Open Graph
  - `og:title`: 태극기, 광복절을 기념합니다
  - `og:description`: 함께 광복절의 의미를 되새겨요
  - `og:image`: `Flag.png` 또는 대표 이미지
- Twitter Card: 동일 내용

### 로직(`app.js`)
- `initShare()`
  - 지원 시 `navigator.share({ title, text, url })`
  - 미지원 시 Clipboard API로 URL 복사 → 토스트 노출 → 2~3초 후 사라짐
  - 오류 시 사용자 안내(재시도)

### 접근성/UX
- 버튼 포커스/호버/활성 스타일
- 토스트 `aria-live="polite"`
- 실패 시 명확한 에러 메시지

### 테스트/검증
- 모바일 크롬/사파리 Web Share 동작 확인
- 데스크톱 브라우저 폴백(클립보드) 확인

### 수용 기준(AC)
- 지원 환경에서 네이티브 공유가 열린다.
- 미지원 환경에서 링크 복사 및 토스트 안내가 동작한다.

