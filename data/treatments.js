/* =========================================================
   시술 목록 (시술 안내 + 비급여 진료비 표가 모두 여기서 만들어집니다)
   ---------------------------------------------------------
   시술 하나의 모양:
   {
     category: "laser" | "injection" | "thread",   // 어느 탭에 들어갈지
     name: "시술 이름",
     items: [                                       // 세부 장비·부위 (가격표의 한 줄씩)
       { name: "세부 이름", price: "[가격 확정 예정]" },
     ],
     description: "2~3문장 설명",
     reviewed: false,   // 원장님 검토가 끝나면 true → [원장 검토 필요] 표시가 사라짐
   }

   ※ 의료법 준수: 효과 보장·과장·경험담·타 병원 비교 표현 금지 (CLAUDE.md 참고)
   ========================================================= */

window.CATEGORIES = [
  { id: "laser",     label: "레이저 · 에너지" },
  { id: "injection", label: "주사 시술" },
  { id: "thread",    label: "실리프팅" },
];

var TBD = "[가격 확정 예정]";

window.TREATMENTS = [
  /* ---------------- A. 레이저 · 에너지 시술 ---------------- */
  {
    category: "laser",
    name: "제모 레이저",
    items: [{ name: "제모 레이저 (부위별)", price: TBD }],
    description:
      "모낭의 색소에 반응하는 레이저 빛을 이용해 털이 자라는 부위를 관리하는 시술입니다. 털의 성장 주기에 맞춰 일정 간격으로 여러 차례 진행하는 것이 일반적이며, 필요한 횟수는 부위와 모질에 따라 다릅니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "고주파",
    items: [
      { name: "써마지", price: TBD },
      { name: "인모드", price: TBD },
    ],
    description:
      "고주파(RF) 에너지로 피부 속 진피층에 열을 전달하는 시술입니다. 피부 탄력과 처짐이 고민일 때 상담을 통해 고려해 볼 수 있으며, 장비마다 에너지 전달 방식과 시술 부위가 조금씩 다릅니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "여드름흉터 레이저",
    items: [
      { name: "울트라펄스 앙코르", price: TBD },
      { name: "피코프락셀", price: TBD },
      { name: "어븀야그", price: TBD },
    ],
    description:
      "피부에 미세한 레이저 기둥을 만들어 흉터 부위의 재생 과정을 돕는 프락셔널 방식의 시술입니다. 흉터의 깊이와 모양, 피부 상태에 따라 알맞은 장비와 강도를 정하며, 시술 후 일정 기간 붉어짐이나 딱지가 생길 수 있습니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "스킨부스터 주입",
    items: [
      { name: "미라젯", price: TBD },
      { name: "큐어젯", price: TBD },
    ],
    description:
      "바늘 대신 고압의 미세한 분사 방식으로 약물을 피부층에 전달하는 장비입니다. 주입하는 약물과 목적에 따라 시술 방법이 달라지므로, 상담 후 피부 상태에 맞게 계획합니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "초음파",
    items: [
      { name: "울쎄라", price: TBD },
      { name: "슈링크", price: TBD },
    ],
    description:
      "고강도 집속 초음파(HIFU)를 피부 깊은 층에 한 점으로 모아 열을 전달하는 리프팅 시술입니다. 피부 두께와 처짐 정도에 따라 깊이와 조사량을 조절하며, 시술 중 느껴지는 감각과 회복 과정은 개인마다 다릅니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "극초음파",
    items: [{ name: "온다", price: TBD }],
    description:
      "특정 파장의 에너지를 피부 아래 지방층과 진피층에 전달하는 장비를 이용한 시술입니다. 얼굴과 바디의 윤곽 및 탄력 고민에 사용되며, 적합 여부는 진료를 통해 판단합니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "혈관 레이저",
    items: [{ name: "브이빔 퍼펙타", price: TBD }],
    description:
      "혈관 속 붉은 색소(헤모글로빈)에 반응하는 파장의 레이저로 붉은기와 확장된 혈관을 관리하는 시술입니다. 홍조, 붉은 여드름 자국 등 증상에 따라 설정을 달리하며, 시술 후 일시적으로 붉어지거나 멍이 생길 수 있습니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "색소 레이저",
    items: [
      { name: "토닝", price: TBD },
      { name: "피코토닝", price: TBD },
      { name: "리팟", price: TBD },
    ],
    description:
      "기미, 잡티, 색소침착 등 피부 속 멜라닌 색소를 목표로 하는 레이저 시술입니다. 색소의 종류와 깊이에 따라 장비와 강도를 선택하며, 여러 차례에 걸쳐 진행하는 경우가 많습니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "재생 레이저",
    items: [
      { name: "제네시스 테크닉", price: TBD },
      { name: "티타늄 리프팅", price: TBD },
    ],
    description:
      "피부 표면의 손상을 최소화하면서 피부 속에 부드러운 열을 전달하는 레이저 시술입니다. 피부결, 붉은기, 탄력 등 전반적인 피부 컨디션 관리를 목적으로 하며, 일상생활에 비교적 부담이 적은 편입니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "여드름 레이저",
    items: [
      { name: "카프리 레이저", price: TBD },
      { name: "아그네스", price: TBD },
      { name: "골드PTT", price: TBD },
    ],
    description:
      "여드름의 원인 중 하나인 피지선과 염증 부위를 목표로 하는 시술입니다. 여드름의 종류와 피부 상태에 따라 레이저, 미세침 고주파, 광열 치료 등 방식을 선택하며, 생활 습관 관리와 함께 진행합니다.",
    reviewed: false,
  },
  {
    category: "laser",
    name: "Needle RF",
    items: [{ name: "포텐자", price: TBD }],
    description:
      "미세한 바늘을 피부에 삽입한 뒤 바늘 끝에서 고주파 에너지를 전달하는 시술입니다. 모공, 흉터, 피부결 등 고민에 따라 바늘 깊이와 에너지를 조절하며, 시술 후 일시적인 붉어짐이 있을 수 있습니다.",
    reviewed: false,
  },

  /* ---------------- B. 주사 시술 ---------------- */
  {
    category: "injection",
    name: "보툴리눔 톡신",
    items: [
      { name: "잇몸", price: TBD },
      { name: "화살코", price: TBD },
      { name: "돼지코", price: TBD },
      { name: "이마", price: TBD },
      { name: "눈가주름", price: TBD },
      { name: "스킨보톡스", price: TBD },
      { name: "사각턱", price: TBD },
    ],
    description:
      "근육의 움직임을 일시적으로 줄여 주는 약물을 필요한 부위에 소량 주입하는 시술입니다. 표정 주름이나 근육 발달로 인한 윤곽 고민에 사용되며, 효과의 지속 기간은 개인과 부위에 따라 다릅니다.",
    reviewed: false,
  },
  {
    category: "injection",
    name: "필러",
    items: [
      { name: "앞광대", price: TBD },
      { name: "입술", price: TBD },
      { name: "이마", price: TBD },
      { name: "옆볼", price: TBD },
      { name: "마리오네트", price: TBD },
      { name: "턱끝", price: TBD },
    ],
    description:
      "히알루론산 등 주입 물질로 꺼지거나 볼륨이 부족한 부위를 채우는 시술입니다. 얼굴 전체의 균형을 살펴 주입 부위와 양을 정하며, 시술 후 부기나 멍이 생길 수 있습니다.",
    reviewed: false,
  },
  {
    category: "injection",
    name: "스킨부스터",
    items: [
      { name: "리투오", price: TBD },
      { name: "쥬베룩", price: TBD },
      { name: "쥬베룩볼륨", price: TBD },
      { name: "리쥬란", price: TBD },
      { name: "쥬베룩볼륨 (눈밑)", price: TBD },
    ],
    description:
      "피부 속에 유효 성분을 주입해 피부 컨디션 관리를 돕는 시술입니다. 제품마다 성분과 목적이 다르므로, 피부 두께·탄력·수분 상태를 살펴 알맞은 제품과 주기를 상담해 드립니다.",
    reviewed: false,
  },
  {
    category: "injection",
    name: "서브시전 · 염증주사",
    items: [
      { name: "서브시전", price: TBD },
      { name: "염증주사", price: TBD },
    ],
    description:
      "서브시전은 패인 흉터 아래에서 피부를 당기고 있는 섬유 조직을 가는 바늘로 끊어 주는 시술입니다. 염증주사는 붉게 부어오른 여드름 부위에 약물을 소량 주입하는 방법으로, 두 시술 모두 피부 상태를 확인한 뒤 필요한 경우에 진행합니다.",
    reviewed: false,
  },

  /* ---------------- C. 실리프팅 ---------------- */
  {
    category: "thread",
    name: "실리프팅",
    items: [{ name: "실리프팅 (부위·개수별)", price: TBD }],
    description:
      "체내에서 서서히 흡수되는 의료용 실을 피부 아래에 삽입해 처진 부위를 당겨 고정하는 시술입니다. 처짐의 정도와 얼굴 구조에 따라 실의 종류와 개수를 정하며, 시술 후 당김이나 부기가 일정 기간 있을 수 있습니다.",
    reviewed: false,
  },
];
