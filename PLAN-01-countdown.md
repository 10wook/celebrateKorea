## 기능 계획: 광복절 카운트다운 / D-Day

### 목표
- 매년 8월 15일(광복절)을 기준으로 남은 시간을 실시간으로 보여주고, 당일에는 주년 메시지를 표시한다.

### 사용자 시나리오
- 사용자가 페이지를 열면 상단 또는 태극기 하단에 남은 시간이 1초 단위로 갱신되어 보인다.
- 광복절 당일(KST 기준)에는 카운트다운 대신 "오늘은 제 N0주년 광복절입니다 🇰🇷" 메시지가 노출된다.

### UI/DOM
- `index.html`
  - 카운트다운 영역: `<div id="countdown" aria-live="polite"></div>`
  - 당일 메시지 영역: `<div id="annivMessage" hidden></div>`
- 표시 포맷: `D일 HH:MM:SS`

### 데이터/로직 명세
- 기념일: 8월 15일
- 다음 광복절 계산: 오늘 날짜가 8/15 이후면 내년 8/15, 이전/당일이면 올해 8/15
- KST 기준 계산/표시
- 주년 계산: `anniversaryYears = targetYear - 1945`
- 경계 처리: 자정 전후 스냅(깜빡임 최소화)

### 함수 설계(`app.js`)
- `getNextGwangbokjeol(now: Date, tz: 'Asia/Seoul'): Date`
- `getAnniversaryYears(target: Date): number`
- `formatRemainingTime(ms: number): string` → `D일 HH:MM:SS`
- `isTodayAnniversary(nowKst: Date): boolean`
- `initCountdown()`
  - 1초 간격 타이머로 남은 시간 업데이트
  - `visibilitychange` 시 비활성화면에서 타이머 일시 정지/재개
  - 당일 전환 감지 시 UI 스위칭(카운트다운 숨김 → 메시지 표시)

### 접근성
- 라이브 영역 `aria-live="polite"`
- 스크린리더에 과도한 갱신 방지: 1초 주기 유지, 포맷 안정적 제공

### 성능
- 타이머는 하나만 유지, 화면 비가시 상태에서 중지
- 렌더링 최소화(동일 문자열이면 DOM 업데이트 생략)

### 테스트/검증
- 날짜 고정(타임 트래블)로 다음/이전/당일 케이스 확인
- KST 기준 검증: 타임존이 다른 환경에서 표시 일치 여부 체크
- 2025-08-15 → 80주년 확인

### 수용 기준(AC)
- 1초 단위로 남은 시간이 갱신된다.
- KST 자정 이후 당일에는 주년 메시지가 표시된다.
- 주년 수치가 정확하다(현재연도 − 1945).
- 비가시 탭에서 재진입 시 타이머가 정상적으로 복구된다.

