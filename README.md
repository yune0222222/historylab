# HistoryLab MVP (정적 사이트 · 1단계 비상업)

## 실행
```
cd site && python3 -m http.server 8000   # → http://localhost:8000
```
`file://`로 열면 JSON fetch가 막히므로 반드시 로컬 서버로 여세요. 외부 의존: YouTube 임베드(youtube-nocookie)·썸네일(i.ytimg.com), (선택) OpenAI API.

## 페이지
- `index.html` 홈 (3개 영역, 탐색기 카드, 인물 검색, 데이터/스토리 모드)
- `explorer.html?region=seoul&series=price,m2,rate&mode=multi|rebase&from=2004&to=2026` 경제 지표 탐색기
- `people.html?q=대통령` 인물 검색(이름·별칭·분야) · `person.html?id=barack-obama` 인물 아카이브(전체 탭 = 모든 영상 연도별 타임라인)

## 데이터 갱신
```
export ECOS_API_KEY=발급받은_개인키      # https://ecos.bok.or.kr/api/ 에서 무료 발급
python3 scripts/ecos_fetch.py           # raw/city/ecos_*.json 갱신 (KB 서울·전국, M2, 기준금리, KOSPI)
python3 scripts/build_site_data.py      # raw/ → site/data/*.json (regions, categories, people)
python3 scripts/build_search.py         # 탐색기 검색용 site/data/search.json + regions/{c-xx,us-*,kr-*}.json (build_site_data 다음)
```
- 현재 ECOS 데이터는 **공개 sample 키**로 받은 것입니다(호출당 10행, 시연용). 전체 갱신·운영에는 **개인 ECOS 키가 필요**하며 스크립트는 환경변수 `ECOS_API_KEY`만 읽습니다. 키를 파일·코드에 넣지 마세요.
- 기타 원본(BIS bulk CSV, HM Land Registry, BoE, FHFA, Fed H.6, 국토교통성, BOJ, Insee, ECB, StatCan)은 raw/에 내려받은 파일을 그대로 씁니다. FRED 파일은 약관(저장·캐시 금지) 때문에 사이트에서 쓰지 않습니다.
- 인물 영상은 모두 검증된 것만 씁니다. 영상 ID·날짜·인용·챕터를 추정해서 넣지 마세요.
  - 머스크·라거펠트: 수동 검증 목록(raw/musk_interviews.json, raw/fashion/lagerfeld_videos.json).
  - 그 외 인물: `scripts/find_candidates.py`가 YouTube 검색 결과에서 후보 ID만 뽑고, oEmbed(제목·채널·썸네일)와 영상 페이지 메타데이터(업로드일·길이·임베드 허용·채널 구독자)로 검증·선별합니다. 기준: 제목에 인물 이름, 임베드 허용, 90초 이상, 신뢰 채널(공식·방송사·대학·노벨재단·기록관 등) 또는 구독자 2만+ 채널, 반응/패러디/하이라이트 등 제외, 채널당 최대 3개, 인물당 최대 10개.
  - 자동 선별은 후보일 뿐이라 사람이 검토해야 합니다. 잘못된 영상은 `raw/people/exclude.json`({"영문이름":["videoId",...]})에 넣고 다시 실행하세요.

## 인물 아카이브 현황 (2026-11-01)
- 10개 분야 · 56명 · 영상 451개 (모두 oEmbed로 존재·임베드 허용 확인). 이 중 **팬 업로드 45개**.
- **팬 업로드 규칙:** 공식 채널이 아니어도 인물 본인이 나오는 실제 원본 영상(인터뷰·연설·강연·기자회견·런웨이 쇼·실제 기록 클립)이면 포함합니다. 편집된 '소개/해설' 영상, 리액션, AI 음성, 내레이션을 입힌 짜깁기, 가짜·패러디, 정치적으로 편향된 제목은 넣지 않습니다. JSON에 `source_type:"fan_upload"`와 아는 경우 `original_source`(방송사·연도·행사)를 기록하고, 카드에 '팬 업로드' 배지로 표시합니다.
- 영상 362개는 업로드일이 비어 있어 '날짜 미확인'으로 표시됩니다(그대로 둠). 나중에 `scripts/enrich_meta.py`로 채울 수 있습니다.
- 수동 추가 영상은 `scripts/add_items.py <json>`로 넣습니다(oEmbed 검증). 이번 추가 목록: `raw/people/review/add_2026-11-01.json`. 주의: `find_candidates.py`를 같은 인물에 다시 돌리면 수동 추가분이 덮어써지므로, 자동 재수집은 새 인물에만 쓰세요.

## 인물 추가 (JSON만 추가하면 됨)
```
# 직접 고른 영상으로: QID + 분야 + 한글이름 + YouTube ID들 (모두 oEmbed로 검증, 실패분은 버림)
python3 scripts/add_person.py Q76 leader 버락오바마 UF8uR6Z6KLc ... --aliases "오바마|Obama"
# 자동 후보 발견: raw/people/config.tsv(분야·영문·한글·별칭·힌트)와 raw/people/qids.json에 추가 후
python3 scripts/find_candidates.py "Barack Obama"
```
분야 목록은 `scripts/people_fields.json`. 결과는 `site/data/people/<id>.json`이고 `index.json`은 자동 재생성됩니다.
- 프로필: Wikidata(CC0) 생몰일·설명 + 위키백과 링크. 영상 날짜는 **업로드일**이며 실제 발언·행사일과 다를 수 있습니다. 영상 유형(연설·인터뷰·대담·강연·기자회견·다큐·기타)은 제목 키워드 자동 분류입니다.
- 목록에 없는 이름을 검색하면 Wikidata 공개 API로 프로필만 조회해 '아카이브 준비 중'과 YouTube 검색 링크를 보여 줍니다(영상 자동 추가 없음).

## 라이선스·이용조건 (1단계 = 비상업)
- **지역 검색(탐색기):** 기본 15개 지역 외에 나라 217개(World Bank 국가 목록)와 도시 37개(미국 30개 대도시권 FHFA HPI 분기, 한국 6개 광역시+세종 한국부동산원 아파트 실거래가격지수 월)를 검색할 수 있습니다.
  - 나라: BIS 집값(분기, 58개국)·정책금리(월)·달러환율(월평균)은 미리 빌드한 JSON, **연간** GDP 성장률·물가상승률·실업률·대출금리·M2 증가율·공식환율은 브라우저가 **World Bank Indicators API**(api.worldbank.org, CORS 허용, **CC BY 4.0**, “Source: World Bank”)에서 실시간 조회합니다(키 불필요). 없는 지표는 '미제공'으로 표시.
  - 한국부동산원 지수는 ECOS(901Y089) 경유 타 기관 통계 — 출처 표기, 상업 이용조건 재확인 필요. FHFA는 CC0.
- 각 지표의 출처·이용조건은 탐색기 하단 표에 시리즈별로 표시됩니다(`data/regions.json`의 sources).
- 한국은행 작성 통계는 출처 표기 시 상업 이용 가능. KB 주택가격지수·KRX(KOSPI) 등 타 기관 통계는 **비상업·출처 표기**, 상업 이용은 작성기관 승인 필요. BOJ·BIS 등도 수익화 전 재확인 — PLAN.md 0-2 교체/허가 표 참조.
- YouTube: 공식 임베드로만 재생, 영상·자막 저장/캐시 없음, 시청에 과금 금지. [YouTube 서비스 약관](https://www.youtube.com/t/terms) · [Google 개인정보처리방침](https://policies.google.com/privacy).
- 인물 프로필: Wikidata (CC0).
- 상관계수는 인과를 뜻하지 않습니다.

## BYOK AI 인사이트
사용자가 본인 OpenAI 키를 입력하면 브라우저에서 직접 `gpt-4o-mini`를 호출합니다. 원데이터가 아닌 계산된 통계 JSON만 전송하고, 결과는 데이터 해시별로 localStorage에 캐시하며, 출력 속 숫자를 계산값과 대조해 표시합니다. 키는 기본 sessionStorage(탭 종료 시 삭제), '기억' 선택 시 localStorage. **사이트에는 어떤 키도 포함되어 있지 않습니다.** 공용 PC에서는 기억 옵션을 쓰지 말고, 지출 한도를 설정한 키를 쓰세요.
