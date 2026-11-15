/* =========================================================
   피부 나이 퀴즈 (quiz.html) 내용
   ---------------------------------------------------------
   - 질문, 선택지, 점수, 결과 문구, 근거 자료를 모두 이 파일에서 관리합니다.
     화면을 그리는 코드(js/quiz.js)는 문구를 바꿀 때 고치지 않아도 됩니다.
   - 실제 피부 나이를 재는 검사가 아닙니다. 근거가 없으므로
     "피부 나이 ○○세"처럼 나이 숫자를 계산해 보여 주지 않습니다.
   - 답은 방문자의 브라우저 안에서만 계산하고 저장·전송하지 않습니다.
     이름·연락처·사진을 받는 칸을 만들지 않습니다.
   - 의료광고 금지 표현(CLAUDE.md), 할인·경품 같은 참여 보상은 쓰지 않습니다.
   - 원장님이 "퀴즈 검토 끝났어"라고 하시면 reviewed 를 true 로 바꿉니다.
     (false 인 동안 화면에 [원장 검토 필요] 표시가 붙습니다)
   ========================================================= */

window.QUIZ = {
  reviewed: false,

  /* ---------- 시작 화면 ---------- */
  eyebrow: "Skin Clock Quiz",
  title: "피부 나이 퀴즈",
  lead: "내 생활 습관은 피부 시계를 어떻게 돌리고 있을까요?",
  introPoints: [
    "질문 9개, 1분 정도면 끝나요.",
    "실제 피부 나이를 재는 검사가 아니에요. 피부 노화와 관련이 알려진 생활 습관을 함께 돌아봐요.",
    "답은 이 화면 안에서만 계산하고, 어디에도 저장하거나 보내지 않아요.",
  ],
  startLabel: "퀴즈 시작하기",

  /* ---------- 습관 질문 ----------
     name: 결과 화면에서 습관을 부르는 짧은 이름
     score: 선택지 점수 (0~2, 2가 피부를 아끼는 습관)
     weight: 근거가 더 많은 습관일수록 크게 (햇빛 관리·흡연)
     good: 2점을 받은 경우 "잘하고 있는 습관"에 보이는 문장 (선택지에 good 이 있으면 그것을 씀)
     tip: 점수가 낮을 때 "먼저 챙겨 보면 좋은 습관"에 보이는 문장
     sources: 아래 sources 의 이름 (결과 화면에 근거로 표시) */
  habits: [
    {
      id: "sunscreen",
      name: "자외선 차단제",
      weight: 3,
      question: "자외선 차단제는 얼마나 자주 바르나요?",
      options: [
        { label: "거의 매일 발라요", score: 2 },
        { label: "햇빛이 강하거나 오래 나갈 때만 발라요", score: 1 },
        { label: "거의 바르지 않아요", score: 0 },
      ],
      good: "자외선 차단제를 매일 발라요.",
      tip: "매일, 외출 15분 전에 충분한 양을 고르게 바르고, 땀을 많이 흘리거나 햇빛 아래 오래 있을 때는 덧발라 주세요. 제품의 SPF·PA 표시를 보고 활동에 맞게 고르면 좋아요.",
      sources: ["mfds", "hughes", "aad"],
    },
    {
      id: "shade",
      name: "햇빛 가리기",
      weight: 2,
      question: "햇빛이 강한 날 밖에 나갈 때, 그늘·모자·선글라스를 챙기나요?",
      options: [
        { label: "대부분 챙겨요", score: 2 },
        { label: "가끔 챙겨요", score: 1 },
        { label: "거의 신경 쓰지 않아요", score: 0 },
      ],
      good: "햇빛이 강할 때 그늘·모자·선글라스를 챙겨요.",
      tip: "햇빛이 강할 때는 그늘을 찾고, 챙이 넓은 모자와 자외선을 막아 주는 선글라스를 함께 써 보세요. 선글라스는 눈을 찡그려 생기는 주름을 줄이는 데도 도움이 될 수 있어요.",
      sources: ["aad", "wong"],
    },
    {
      id: "smoking",
      name: "금연",
      weight: 3,
      question: "담배를 피우나요?",
      options: [
        { label: "피우지 않아요", score: 2 },
        { label: "피웠지만 끊었어요", score: 2, good: "담배를 끊었어요." },
        { label: "피워요", score: 0 },
      ],
      good: "담배를 피우지 않아요.",
      tip: "담배를 끊으면 피부에도 도움이 될 수 있어요. 혼자 끊기 어렵다면 금연상담전화(1544-9030)나 가까운 보건소 금연클리닉의 도움을 받아 보세요.",
      sources: ["aad", "wong", "quitline"],
    },
    {
      id: "alcohol",
      name: "술 줄이기",
      weight: 1,
      question: "술은 얼마나 자주 마시나요?",
      options: [
        { label: "거의 마시지 않아요", score: 2 },
        { label: "일주일에 1~2번", score: 1 },
        { label: "일주일에 3번 이상", score: 0 },
      ],
      good: "술을 거의 마시지 않아요.",
      tip: "술은 피부를 건조하게 만들 수 있어요. 마시는 횟수와 양을 조금씩 줄여 보세요.",
      sources: ["aad"],
    },
    {
      id: "cleansing",
      name: "순한 세안",
      weight: 1,
      question: "세안은 어떻게 하나요?",
      options: [
        { label: "하루 2번, 문지르지 않고 순하게 씻어요", score: 2 },
        { label: "하루 1번이거나, 그날그날 달라요", score: 1 },
        { label: "세게 문지르거나 스크럽을 자주 써요", score: 0 },
      ],
      good: "하루 2번 순하게 세안해요.",
      tip: "아침저녁 하루 2번, 그리고 땀을 많이 흘린 뒤에 순하게 씻어 주세요. 세게 문지르면 피부가 자극을 받을 수 있어요.",
      sources: ["aad"],
    },
    {
      id: "moisturizer",
      name: "매일 보습",
      weight: 1,
      question: "얼굴 보습제는 매일 바르나요?",
      options: [
        { label: "매일 발라요", score: 2 },
        { label: "건조할 때만 발라요", score: 1 },
        { label: "거의 바르지 않아요", score: 0 },
      ],
      good: "보습제를 매일 발라요.",
      tip: "세안 뒤 얼굴 보습제를 매일 발라 주세요. 보습제는 피부 속 수분을 붙잡아 두는 역할을 해요.",
      sources: ["aad"],
    },
    {
      id: "irritation",
      name: "자극 줄이기",
      weight: 1,
      question: "바르면 따갑거나 화끈거리는 화장품을 그대로 계속 쓰나요?",
      options: [
        { label: "그런 제품은 쓰지 않아요", score: 2 },
        { label: "가끔 참고 써요", score: 1 },
        { label: "따가워도 계속 써요", score: 0 },
      ],
      good: "따갑거나 화끈거리는 제품은 쓰지 않아요.",
      tip: "바를 때 따갑거나 화끈거리면 피부가 자극을 받고 있다는 신호예요. 그런 화장품은 쓰지 않는 게 좋아요. 처방받은 약이 따가운 경우에는 의사에게 꼭 알려 주세요.",
      sources: ["aad"],
    },
    {
      id: "exercise",
      name: "운동",
      weight: 1,
      question: "몸을 움직이는 운동은 일주일에 며칠 하나요?",
      options: [
        { label: "4일 이상", score: 2 },
        { label: "1~3일", score: 1 },
        { label: "거의 하지 않아요", score: 0 },
      ],
      good: "일주일에 여러 날 운동해요.",
      tip: "일주일에 여러 날, 가볍게라도 몸을 움직여 보세요. 몇몇 연구에서 적당한 운동이 피부에도 도움이 될 수 있다는 결과가 있어요.",
      sources: ["aad"],
    },
  ],

  /* ---------- 마지막 질문: 피부 고민 (최대 2개) ----------
     related: data/treatments.js 의 시술 name 과 똑같이 적습니다.
     시술 이름을 바꾸면 여기도 함께 바꿔 주세요. (없는 이름은 화면에 나오지 않습니다) */
  concern: {
    question: "요즘 가장 신경 쓰이는 피부 고민을 골라 주세요.",
    help: "2개까지 고를 수 있어요.",
    max: 2,
    nextLabel: "결과 보기",
    options: [
      { id: "wrinkle", label: "주름", related: ["보툴리눔 톡신", "고주파"] },
      { id: "sagging", label: "탄력·처짐", related: ["초음파", "실리프팅"] },
      { id: "pigment", label: "기미·잡티", related: ["색소 레이저"] },
      { id: "redness", label: "붉은기", related: ["혈관 레이저"] },
      { id: "pore", label: "모공·흉터", related: ["여드름흉터 레이저", "Needle RF", "서브시전 · 염증주사"] },
      { id: "acne", label: "여드름", related: ["여드름 레이저"] },
      { id: "volume", label: "꺼진 볼륨", related: ["필러"] },
      { id: "none", label: "특별히 없어요", related: [], exclusive: true },
    ],
  },

  /* ---------- 결과 화면 ---------- */
  // 습관 점수(100점 만점)에 따라 위에서부터 처음 맞는 단계를 보여 줍니다.
  tiers: [
    { min: 90, name: "느긋하게 가는 피부 시계", text: "피부를 아끼는 습관이 이미 잘 자리 잡혀 있어요. 지금처럼 꾸준히 이어 가 보세요." },
    { min: 70, name: "제 속도로 가는 피부 시계", text: "좋은 습관이 많아요. 아래에서 한두 가지만 더 챙겨 보세요." },
    { min: 50, name: "조금 서두르는 피부 시계", text: "바꾸기 쉬운 습관부터 하나씩 시작해 보세요." },
    { min: 0,  name: "바쁘게 가는 피부 시계", text: "오늘부터 하나씩 바꿔 보세요. 이미 신경 쓰이는 변화가 있어도, 생활 습관을 바꾸는 것은 도움이 될 수 있어요." },
  ],
  scoreLabel: "피부를 아끼는 습관 점수",
  scoreNote: "습관 8가지를 더한 참고용 점수예요. 근거가 더 많은 햇빛 관리와 흡연은 조금 더 크게 셌어요.",
  goodTitle: "잘하고 있는 습관",
  tipTitle: "먼저 챙겨 보면 좋은 습관",
  allGoodText: "더 챙길 습관이 없어요. 지금 습관을 그대로 이어 가세요.",
  maxTips: 3,

  concernTitle: "고민별로 미리 살펴보기",
  concernLead: "피부 상태와 생활 방식은 사람마다 달라요. 진료 때 직접 보고, 꼭 필요한 방법만 함께 정해요.",
  concernNoneText: "지금은 특별한 고민이 없으시군요. 궁금한 점이 생기면 언제든 편하게 상담해 주세요.",
  treatmentsLink: "시술 안내 전체 보기",
  // 홈페이지 시술 안내 아래 부작용 안내(index.html 의 .notice)와 같은 문구로 유지합니다.
  sideEffectNotice: "모든 시술은 개인에 따라 결과와 회복 기간이 다를 수 있으며, 붉어짐·부기·멍·색소 변화 등 부작용이 나타날 수 있습니다. 시술 여부는 반드시 의료진과 상담 후 결정하시기 바랍니다.",

  ctaTitle: "내 피부에 맞는 관리가 궁금하다면",
  ctaText: "이 퀴즈는 생활 습관만 살펴본 거예요. 피부 상태는 진료 때 직접 보고 함께 이야기해요.",
  retryLabel: "다시 하기",
  homeLabel: "홈페이지로",
  disclaimer: "이 퀴즈는 생활 습관을 돌아보기 위한 참고용 점검이며, 피부 상태를 진단하거나 시술 결과를 알려 드리지 않습니다. 답은 이 화면 안에서만 계산하고 저장하거나 보내지 않습니다.",
  sourcesTitle: "이 퀴즈의 근거 자료",

  /* ---------- 근거 자료 (2026-11-15 원문 확인) ---------- */
  sources: {
    aad: {
      tag: "미국피부과학회",
      title: "미국피부과학회(AAD), “11 ways to reduce premature skin aging” (최종 수정 2021-02-24)",
      url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/reduce-premature-aging-skin",
    },
    mfds: {
      tag: "식약처",
      title: "식품의약품안전처, 「자외선차단제, 제대로 발라야 효과↑…올바른 사용법은?」 (대한민국 정책브리핑, 2026-06-05)",
      url: "https://www.korea.kr/news/healthView.do?newsId=148965990",
    },
    hughes: {
      tag: "무작위 대조 연구(2013)",
      title: "Hughes MCB 외, “Sunscreen and prevention of skin aging: a randomized trial”, Annals of Internal Medicine 2013;158(11):781–790",
      url: "https://doi.org/10.7326/0003-4819-158-11-201306040-00002",
    },
    wong: {
      tag: "문헌고찰·메타분석(2021)",
      title: "Wong QYA, Chew FT, “Defining skin aging and its risk factors: a systematic review and meta-analysis”, Scientific Reports 2021;11:22075",
      url: "https://doi.org/10.1038/s41598-021-01573-z",
    },
    quitline: {
      tag: "금연상담전화 안내",
      title: "금연상담전화 1544-9030 (한국건강증진개발원 국가금연지원센터 운영, 인천 연수구보건소 안내)",
      url: "https://www.yeonsu.go.kr/clinic/health/promotion/nonsmoking.asp",
    },
  },
};
