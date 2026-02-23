import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  LayoutDashboard, Users, CheckCircle, ArrowDownCircle, ArrowUpCircle, 
  MessageCircle, BarChart3, Settings, Shield, Megaphone, Ban, Wrench,
  TrendingUp, Target, ChevronDown, ChevronRight, ArrowLeft, BookOpen,
  HelpCircle, AlertTriangle, Info
} from 'lucide-react';

interface ManualSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  details: {
    description: string;
    features: string[];
    howTo: string[];
    tips?: string[];
    warnings?: string[];
  };
}

const sections: ManualSection[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: '대시보드',
    summary: '전체 플랫폼 현황을 한눈에 확인할 수 있는 메인 화면입니다.',
    details: {
      description: '대시보드는 플랫폼의 전반적인 상태를 실시간으로 모니터링할 수 있는 관리자 메인 화면입니다. 총 회원수, 오늘의 거래량, 수익/손실 현황 등 핵심 지표를 한눈에 파악할 수 있습니다.',
      features: [
        '총 회원수 및 신규 가입자 현황',
        '오늘의 총 거래량 및 거래 건수',
        '플랫폼 전체 수익/손실 통계',
        '실시간 활성 사용자 수',
      ],
      howTo: [
        '관리자 로그인 후 좌측 메뉴에서 "대시보드"를 클릭합니다.',
        '각 통계 카드에서 실시간 수치를 확인합니다.',
        '필요한 경우 세부 항목을 클릭하여 상세 페이지로 이동합니다.',
      ],
    },
  },
  {
    id: 'users',
    icon: <Users className="w-5 h-5" />,
    title: '회원 관리',
    summary: '전체 회원 목록 조회, 잔고 조정, 개별 메시지 전송, 강제 거래 설정 등을 수행합니다.',
    details: {
      description: '모든 등록된 회원의 정보를 관리하는 핵심 기능입니다. 회원별 잔고 조정, 개인 메시지 전송, 거래 내역 확인, 계정 차단/해제 등 회원과 관련된 모든 관리 작업을 수행할 수 있습니다.',
      features: [
        '전체 회원 목록 조회 (검색/필터링 가능)',
        '회원별 잔고 수동 조정 (충전/차감)',
        '개별 회원에게 메시지 전송',
        '회원별 거래 내역 상세 조회',
        '회원 계정 차단/해제',
        '회원별 강제 거래(배팅) 방향 설정',
      ],
      howTo: [
        '좌측 메뉴에서 "회원관리"를 클릭합니다.',
        '검색창에 아이디를 입력하여 특정 회원을 찾습니다.',
        '잔고 조정: 해당 회원의 "잔고" 항목 옆 버튼을 클릭하여 금액을 입력합니다.',
        '메시지 전송: 회원 옆 메시지 아이콘을 클릭하여 내용을 작성합니다.',
        '강제 거래: 회원별 LONG/SHORT 강제 방향을 설정할 수 있습니다.',
      ],
      tips: [
        '잔고 조정 시 양수(+)는 충전, 음수(-)는 차감입니다.',
        '강제 거래 설정은 해당 회원의 다음 거래부터 적용됩니다.',
      ],
      warnings: [
        '잔고 차감 시 현재 잔고보다 큰 금액을 차감하지 않도록 주의하세요.',
        '회원 차단 시 해당 회원은 즉시 거래가 불가능해집니다.',
      ],
    },
  },
  {
    id: 'approvals',
    icon: <CheckCircle className="w-5 h-5" />,
    title: '가입 승인',
    summary: '신규 회원의 가입 요청을 승인하거나 거절합니다.',
    details: {
      description: '새로 가입한 회원의 가입 신청을 검토하고 승인 또는 거절하는 기능입니다. 승인되지 않은 회원은 플랫폼 서비스를 이용할 수 없습니다.',
      features: [
        '대기 중인 가입 신청 목록 확인',
        '가입 승인/거절 처리',
        '거절 시 사유 입력 가능',
        '승인 완료된 회원 목록 확인',
      ],
      howTo: [
        '좌측 메뉴에서 "가입승인"을 클릭합니다.',
        '대기 중인 가입 신청 목록에서 회원 정보를 확인합니다.',
        '"승인" 버튼을 클릭하면 해당 회원이 플랫폼을 이용할 수 있게 됩니다.',
        '"거절" 버튼을 클릭하면 가입이 거부됩니다.',
      ],
      tips: [
        '새로운 가입 신청이 있을 때 대시보드에 알림이 표시됩니다.',
        '정기적으로 대기 목록을 확인하여 빠른 승인 처리를 권장합니다.',
      ],
    },
  },
  {
    id: 'deposits',
    icon: <ArrowDownCircle className="w-5 h-5" />,
    title: '입금 관리',
    summary: '회원의 입금 요청을 확인하고 승인/거절 처리합니다.',
    details: {
      description: '회원이 신청한 입금 요청을 관리하는 기능입니다. 입금 요청을 확인하고 실제 입금이 확인되면 승인하여 회원의 잔고에 반영합니다.',
      features: [
        '대기 중인 입금 요청 목록',
        '입금 승인 시 자동 잔고 반영',
        '입금 거절 및 사유 기록',
        '입금 이력 전체 조회',
      ],
      howTo: [
        '좌측 메뉴에서 "입금관리"를 클릭합니다.',
        '대기 중인 입금 요청을 확인합니다.',
        '실제 계좌로 입금이 확인되면 "승인" 버튼을 클릭합니다.',
        '승인 즉시 해당 회원의 잔고에 금액이 추가됩니다.',
      ],
      warnings: [
        '반드시 실제 입금을 확인한 후 승인하세요.',
        '승인된 입금은 취소할 수 없으므로 신중하게 처리하세요.',
      ],
    },
  },
  {
    id: 'withdrawals',
    icon: <ArrowUpCircle className="w-5 h-5" />,
    title: '출금 관리',
    summary: '회원의 출금 요청을 확인하고 승인/거절 처리합니다.',
    details: {
      description: '회원이 신청한 출금 요청을 관리하는 기능입니다. 출금 요청을 확인하고 실제 송금을 완료한 후 승인 처리합니다.',
      features: [
        '대기 중인 출금 요청 목록',
        '출금 승인 시 자동 잔고 차감',
        '출금 거절 및 사유 기록',
        '출금 이력 전체 조회',
      ],
      howTo: [
        '좌측 메뉴에서 "출금관리"를 클릭합니다.',
        '대기 중인 출금 요청을 확인합니다.',
        '회원이 등록한 계좌로 실제 송금을 완료합니다.',
        '송금 완료 후 "승인" 버튼을 클릭합니다.',
      ],
      warnings: [
        '반드시 실제 송금을 완료한 후 승인하세요.',
        '회원 잔고가 출금 요청 금액보다 적으면 자동으로 거절됩니다.',
      ],
    },
  },
  {
    id: 'inquiries',
    icon: <HelpCircle className="w-5 h-5" />,
    title: '문의 관리',
    summary: '회원이 보낸 문의사항을 확인하고 답변합니다.',
    details: {
      description: '회원이 고객센터를 통해 보낸 문의사항을 확인하고 답변하는 기능입니다. 빠른 응대를 통해 회원 만족도를 높일 수 있습니다.',
      features: [
        '미답변/답변완료 문의 목록 확인',
        '문의 내용 상세 확인',
        '문의에 대한 답변 작성 및 전송',
        '문의 상태 관리',
      ],
      howTo: [
        '좌측 메뉴에서 "문의관리"를 클릭합니다.',
        '미답변 문의를 우선적으로 확인합니다.',
        '문의 내용을 확인한 후 답변을 작성합니다.',
        '"답변 전송" 버튼을 클릭하면 회원에게 답변이 전달됩니다.',
      ],
      tips: [
        '미답변 문의가 있으면 대시보드에 알림이 표시됩니다.',
        '빠른 답변은 회원 신뢰도 향상에 중요합니다.',
      ],
    },
  },
  {
    id: 'bets',
    icon: <BarChart3 className="w-5 h-5" />,
    title: '거래 관리',
    summary: '모든 거래(배팅) 내역을 조회하고 관리합니다.',
    details: {
      description: '플랫폼에서 발생한 모든 거래(배팅) 내역을 조회하고 관리하는 기능입니다. 진행 중인 거래, 완료된 거래, 거래 결과 등을 확인할 수 있습니다.',
      features: [
        '전체 거래 내역 조회 (종목/상태/회원별 필터링)',
        '진행 중인 거래 실시간 모니터링',
        '거래별 상세 정보 확인 (종목, 방향, 금액, 진입가, 결과)',
        '거래 기간(1분/3분/5분) 표시',
        '남은 시간에 따른 경고 표시',
      ],
      howTo: [
        '좌측 메뉴에서 "거래관리"를 클릭합니다.',
        '상단 필터를 사용하여 특정 조건의 거래를 검색합니다.',
        '진행 중인 거래는 남은 시간과 함께 실시간으로 업데이트됩니다.',
        '완료된 거래에서 결과(승/패)와 수익/손실을 확인합니다.',
      ],
      tips: [
        '거래 마감 임박 시 경고 색상이 변경됩니다 (1분: 10초 전, 3분: 15초 전, 5분: 20초 전).',
      ],
    },
  },
  {
    id: 'round-forced',
    icon: <Target className="w-5 h-5" />,
    title: '회차별 강제 설정',
    summary: '특정 종목의 특정 회차에 대해 강제로 승/패 결과를 설정합니다.',
    details: {
      description: '특정 종목과 기간의 회차에 대해 강제로 시장 방향을 설정하는 기능입니다. 설정된 회차에서는 실제 시세와 관계없이 설정된 방향으로 결과가 결정됩니다.',
      features: [
        '종목별(달러/유로/엔화/호주달러) 강제 설정',
        '기간별(1분/3분/5분) 강제 설정',
        '현재 회차 및 남은 시간 실시간 표시',
        'LONG(매수) 또는 SHORT(매도) 방향 강제 설정',
        '설정된 강제 방향 목록 확인 및 해제',
      ],
      howTo: [
        '좌측 메뉴에서 "회차별설정"을 클릭합니다.',
        '상단에서 원하는 종목(달러/유로/엔화/호주달러)을 선택합니다.',
        '거래 기간(1분/3분/5분)을 선택합니다.',
        '현재 회차 정보와 남은 시간을 확인합니다.',
        '"LONG 설정" 또는 "SHORT 설정" 버튼을 클릭합니다.',
        '설정이 완료되면 해당 회차의 결과가 강제로 결정됩니다.',
      ],
      tips: [
        'LONG으로 설정하면: LONG 배팅 회원은 승리, SHORT 배팅 회원은 패배합니다.',
        'SHORT으로 설정하면: SHORT 배팅 회원은 승리, LONG 배팅 회원은 패배합니다.',
        '강제 설정은 해당 회차에만 적용되며, 다음 회차에는 영향을 주지 않습니다.',
      ],
      warnings: [
        '이미 종료된 회차에는 설정할 수 없습니다.',
        '강제 설정은 해당 회차의 모든 거래에 영향을 미치므로 신중하게 사용하세요.',
      ],
    },
  },
  {
    id: 'forced-bet',
    icon: <TrendingUp className="w-5 h-5" />,
    title: '강제 거래',
    summary: '특정 회원 명의로 관리자가 직접 거래를 실행합니다.',
    details: {
      description: '관리자가 특정 회원의 계정으로 직접 거래를 실행하는 기능입니다. 회원의 잔고에서 배팅 금액이 차감되며, 실제 거래와 동일하게 처리됩니다.',
      features: [
        '회원 선택 후 대신 거래 실행',
        '종목(달러/유로/엔화/호주달러) 선택',
        '거래 기간(1분/3분/5분) 선택',
        '배팅 방향(LONG/SHORT) 및 금액 지정',
        '현재 시세 기준 즉시 체결',
      ],
      howTo: [
        '좌측 메뉴에서 "강제거래"를 클릭합니다.',
        '거래를 실행할 회원을 선택합니다.',
        '종목과 거래 기간을 선택합니다.',
        '배팅 방향(LONG 또는 SHORT)을 선택합니다.',
        '배팅 금액을 입력합니다.',
        '"실행" 버튼을 클릭하면 해당 회원의 계정으로 거래가 체결됩니다.',
      ],
      warnings: [
        '회원의 실제 잔고에서 금액이 차감됩니다.',
        '잔고가 부족한 회원에게는 거래를 실행할 수 없습니다.',
        '최소 거래 금액은 10,000원입니다.',
      ],
    },
  },
  {
    id: 'messages',
    icon: <MessageCircle className="w-5 h-5" />,
    title: '메시지 관리',
    summary: '회원에게 개별 메시지를 전송하고 관리합니다.',
    details: {
      description: '개별 회원에게 메시지를 전송하는 기능입니다. 전송된 메시지는 회원이 로그인했을 때 메인 화면에 표시됩니다.',
      features: [
        '특정 회원에게 개인 메시지 전송',
        '전송된 메시지 목록 확인',
        '메시지 삭제',
      ],
      howTo: [
        '좌측 메뉴에서 "메시지"를 클릭합니다.',
        '새 메시지를 작성하려면 수신자(회원)를 선택합니다.',
        '제목과 내용을 입력합니다.',
        '"전송" 버튼을 클릭합니다.',
      ],
      tips: [
        '회원관리 탭에서 특정 회원의 메시지 아이콘을 클릭하면 바로 해당 회원에게 메시지를 보낼 수 있습니다.',
        '메시지는 회원의 메인 화면(랜딩 페이지)에 표시됩니다.',
      ],
    },
  },
  {
    id: 'affiliates',
    icon: <Users className="w-5 h-5" />,
    title: '총판 관리',
    summary: '총판(추천인) 시스템을 관리하고 커미션을 추적합니다.',
    details: {
      description: '총판(추천인/디스트리뷰터) 시스템을 관리하는 기능입니다. 총판별 추천 현황, 커미션 내역, 정산 처리 등을 수행할 수 있습니다.',
      features: [
        '총판 목록 조회 및 관리',
        '총판별 추천 회원 수 확인',
        '커미션 내역 및 정산 관리',
        '총판 코드 관리',
      ],
      howTo: [
        '좌측 메뉴에서 "총판관리"를 클릭합니다.',
        '총판 목록에서 각 총판의 추천 현황을 확인합니다.',
        '커미션 내역을 확인하고 필요 시 정산 처리합니다.',
      ],
    },
  },
  {
    id: 'announcements',
    icon: <Megaphone className="w-5 h-5" />,
    title: '공지사항',
    summary: '메인 화면에 표시되는 공지사항을 작성하고 관리합니다.',
    details: {
      description: '플랫폼 메인 화면(랜딩 페이지)에 표시되는 공지사항을 관리하는 기능입니다. 중요 안내, 이벤트, 시스템 점검 등의 정보를 회원에게 전달할 수 있습니다.',
      features: [
        '공지사항 작성/수정/삭제',
        '공지사항 활성화/비활성화',
        '상단 고정(핀) 기능',
        '게시일 설정',
      ],
      howTo: [
        '좌측 메뉴에서 "공지사항"을 클릭합니다.',
        '"새 공지사항" 버튼을 클릭하여 작성합니다.',
        '제목과 내용을 입력합니다.',
        '"활성화" 상태로 설정하면 메인 화면에 표시됩니다.',
        '"상단 고정"을 체크하면 항상 목록 최상단에 표시됩니다.',
      ],
      tips: [
        '중요한 공지는 "상단 고정"과 "활성화"를 모두 설정하세요.',
        '더 이상 필요 없는 공지는 비활성화하면 메인 화면에서 숨겨집니다.',
      ],
    },
  },
  {
    id: 'blocked-ips',
    icon: <Ban className="w-5 h-5" />,
    title: 'IP 차단',
    summary: '특정 IP 주소를 차단하여 접속을 제한합니다.',
    details: {
      description: '악의적인 접근이나 부정 사용을 방지하기 위해 특정 IP 주소를 차단하는 기능입니다. 차단된 IP에서는 플랫폼에 접속할 수 없습니다.',
      features: [
        'IP 주소 차단 등록',
        '차단된 IP 목록 조회',
        '차단 해제',
        '차단 사유 기록',
      ],
      howTo: [
        '좌측 메뉴에서 "IP차단"을 클릭합니다.',
        '차단할 IP 주소를 입력합니다.',
        '차단 사유를 입력합니다 (선택사항).',
        '"차단" 버튼을 클릭하면 해당 IP의 접속이 즉시 차단됩니다.',
        '차단 해제가 필요하면 목록에서 해당 IP의 "해제" 버튼을 클릭합니다.',
      ],
      warnings: [
        'IP 차단은 즉시 적용됩니다.',
        '잘못된 IP를 차단하면 정상 회원이 접속하지 못할 수 있으니 주의하세요.',
      ],
    },
  },
  {
    id: 'maintenance',
    icon: <Wrench className="w-5 h-5" />,
    title: '점검 모드',
    summary: '플랫폼을 점검 모드로 전환하여 일시적으로 서비스를 중단합니다.',
    details: {
      description: '시스템 점검, 업데이트, 긴급 상황 등의 이유로 플랫폼을 일시적으로 점검 모드로 전환하는 기능입니다. 점검 모드에서는 회원이 거래를 할 수 없습니다.',
      features: [
        '점검 모드 활성화/비활성화',
        '점검 안내 메시지 설정',
        '점검 중에도 관리자는 접속 가능',
      ],
      howTo: [
        '좌측 메뉴에서 "점검모드"를 클릭합니다.',
        '점검 안내 메시지를 입력합니다.',
        '"점검 모드 활성화" 버튼을 클릭합니다.',
        '점검이 완료되면 "점검 모드 해제" 버튼을 클릭합니다.',
      ],
      warnings: [
        '점검 모드 활성화 시 모든 회원의 거래가 즉시 중단됩니다.',
        '진행 중인 거래가 있는지 확인 후 점검 모드를 활성화하세요.',
      ],
    },
  },
  {
    id: 'settings',
    icon: <Settings className="w-5 h-5" />,
    title: '설정',
    summary: '플랫폼 전반의 설정을 관리합니다 (텔레그램 링크, 입금 안내 등).',
    details: {
      description: '플랫폼의 전반적인 설정을 관리하는 기능입니다. 고객센터 링크, 입금 안내문구, 배당률 등 서비스 운영에 필요한 각종 설정을 변경할 수 있습니다.',
      features: [
        '텔레그램 고객센터 링크 설정',
        '입금 안내 문구 설정',
        '배당률(승리 시 지급 배수) 설정',
        '기타 플랫폼 운영 설정',
      ],
      howTo: [
        '좌측 메뉴에서 "설정"을 클릭합니다.',
        '변경하고자 하는 설정 항목을 찾습니다.',
        '새로운 값을 입력합니다.',
        '"저장" 버튼을 클릭하여 변경사항을 적용합니다.',
      ],
      tips: [
        '텔레그램 링크는 회원이 고객센터에 접속할 때 사용됩니다.',
        '입금 안내 문구는 회원이 입금 신청 시 표시됩니다.',
        '설정 변경은 즉시 반영됩니다.',
      ],
    },
  },
];

export default function AdminManual() {
  const [, navigate] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="sticky top-0 z-50 bg-[#111111] border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-4 h-4" />
            관리자 패널로 돌아가기
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-manual-title">관리자 매뉴얼</h1>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            VALUE-OPTION 관리자 패널의 모든 기능에 대한 상세한 사용 가이드입니다.<br />
            각 항목을 클릭하면 상세 설명, 사용 방법, 주의사항 등을 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-amber-500 text-2xl font-bold">{sections.length}</div>
            <div className="text-gray-400 text-xs mt-1">전체 관리 기능</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-green-500 text-2xl font-bold">24/7</div>
            <div className="text-gray-400 text-xs mt-1">관리자 접속 가능</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-blue-500 text-2xl font-bold">실시간</div>
            <div className="text-gray-400 text-xs mt-1">데이터 업데이트</div>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <div
                key={section.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden transition-all"
                data-testid={`manual-section-${section.id}`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#222222] transition-colors text-left"
                  data-testid={`button-toggle-${section.id}`}
                >
                  <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 text-amber-500">
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{section.summary}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-800">
                    <div className="pt-4 space-y-5">
                      <div>
                        <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          기능 설명
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{section.details.description}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">주요 기능</h4>
                        <ul className="space-y-1.5">
                          {section.details.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-blue-400 mt-1 shrink-0">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">사용 방법</h4>
                        <ol className="space-y-2">
                          {section.details.howTo.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                              <span className="w-5 h-5 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {section.details.tips && section.details.tips.length > 0 && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            팁
                          </h4>
                          <ul className="space-y-1.5">
                            {section.details.tips.map((tip, i) => (
                              <li key={i} className="text-xs text-blue-300/80 flex items-start gap-2">
                                <span className="shrink-0">💡</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.details.warnings && section.details.warnings.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            주의사항
                          </h4>
                          <ul className="space-y-1.5">
                            {section.details.warnings.map((warning, i) => (
                              <li key={i} className="text-xs text-red-300/80 flex items-start gap-2">
                                <span className="shrink-0">⚠️</span>
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            관리자 계정 안내
          </h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• 관리자 계정은 최고 권한을 가지며, 모든 기능에 접근할 수 있습니다.</p>
            <p>• 관리자 비밀번호는 정기적으로 변경할 것을 권장합니다.</p>
            <p>• 관리자 작업은 모두 로그로 기록되며, 추적이 가능합니다.</p>
            <p>• 점검 모드 중에도 관리자는 정상적으로 모든 기능을 이용할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
