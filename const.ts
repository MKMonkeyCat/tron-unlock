// 以跳過很多自建主頁的學校/組織
// 測試不穩定或回應較慢的學校/組織也已跳過
// 若有需要可發 PR 或 issue 補上
export const LEARNING_PLATFORM_DOMAINS = [
  // Home
  'tronclass.com',
  'tronclass.com.tw',
  'tronclass.com.cn',
  '*.tronclass.com',
  '*.tronclass.com.tw',
  '*.tronclass.com.cn',
  // INTACT Base ( 海外基地 )
  'intactchinese.csu.edu.tw',
  // 亞東科技大學
  'elearning.aeust.edu.tw',
  // 天主教輔仁大學
  'elearn2.fju.edu.tw',
  // 淡江大學-測試站
  'iclass-tst.tku.edu.tw',
  // 馬偕醫護管理專科學校
  'tronclass.mkc.edu.tw',
  // 弘光科技大學
  'tronclass.hk.edu.tw',
  // 實踐大學
  'tronclass.usc.edu.tw',
  // 朝陽科技大學
  'tronclass.cyut.edu.tw',
  // 元培醫事科技大學
  'tronclass.ypu.edu.tw',
  // 酷課OnO線上教室
  'ono.tp.edu.tw',
  // 台灣大學進修推廣學院
  'elearn.ntuspecs.ntu.edu.tw',
  // 雲林科技大學
  'eclass.yuntech.edu.tw',
  // 東海大學 Tunghai University (體驗網站)
  'ilearn.thu.edu.tw',
  // 长安大学
  'course-online.chd.edu.cn',
  // 靜宜大學
  'tronclass.pu.edu.tw',
  // 明新科技大學 MUST
  'tronclass.must.edu.tw',
  // “中国历代绘画大系”志愿者宣讲
  'hhdx.zj.zju.edu.cn',
  // 浙江研究生课程联盟
  'zjyjs.zj.zju.edu.cn',
  // 東吳大學
  'tronclass.scu.edu.tw',
  // 大同大學
  'ilearn.ttu.edu.tw',
  // CUMTEST
  'tctest.cityu.edu.mo',
  // 醒吾科技大學 (體驗網站)
  'iclass.hwu.edu.tw',
  // 實踐大學高雄校區
  'tronclass.kh.usc.edu.tw',
  // 邯郸职业技术学院
  'lms.hd-u.com',
  // 北京交通大学威海校区
  'tronclass.wh.bjtu.edu.cn',
  // 增能學習站
  'elearn.evs.edu.tw',
  // 亞洲大學
  'tronclass.asia.edu.tw',
  // 学在城院
  'courses.hzcu.edu.cn',
  // 長榮大學
  'tronclass.cjcu.edu.tw',
  // National Formosa University
  'ulearn.nfu.edu.tw',
  // 國立臺中科技大學 line
  'tc.nutc.edu.tw',
  // 真理大學
  'tronclass.au.edu.tw',
  // 工研院產業學院-雲端教室
  'collegeplus.itri.org.tw',
  // 金华职业技术学院
  'courses.cxjz.jhc.cn',
  // 長庚科技大學-Chang Gung of Science and Technology
  'tronclass.cgust.edu.tw',
  // 僑光科技大學/Overseas Chinese University/OCU
  'tronclass.ocu.edu.tw',
  // 樹德科技大學
  'tc.stu.edu.tw',
  // 中臺科技大學
  'tronclass.ctust.edu.tw',
  // 世新大學 / SHU
  'tronclass.shu.edu.tw',
  // 寰宇教育
  'elearning.globalchild.com.tw',
  // 上海民航职业技术学院
  'lms.shcac.edu.cn',
  // 绍兴文理学院
  'courses.usx.edu.cn',
  // 龍華科技大學
  'elearn.lhu.edu.tw',
  // 國立臺北商業大學 NTUB
  'tronclass.ntub.edu.tw',
  // 大葉大學
  'tronclass.dyu.edu.tw',
  // 崇右影藝科技大學
  'tronclass.cufa.edu.tw',
  // 亞太AI+ESG雲學院 (TAIA)
  'taia.asia',
  // 齐鲁工业大学
  'lms.qlu.edu.cn',
  // 國立彰化師範大學 NCUE
  'tronclass.ncue.edu.tw',
  // 文藻外語大學 WZU
  'elearning.wzu.edu.tw',
  // 南亞技術學院
  'tronclass.nanya.edu.tw',
  // 國立中山大學
  'elearn.nsysu.edu.tw',
  // mhesi-prod
  'mhesi-skill.org',
  // 國立空中大學_第三人生
  '3tron.nou.edu.tw',
  // 國立勤益科技大學
  'tronclass.ncut.edu.tw',
] as const;
