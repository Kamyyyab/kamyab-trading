import { createContext, useContext } from 'react'

export const LangCtx = createContext('sv')
export const useLang = () => useContext(LangCtx)
export const useT    = () => T[useContext(LangCtx)]

export const T = {
  sv: {
    // App shell
    loading:       'LADDAR...',
    logout:        'logga ut',
    swe:           'SWE',
    ny:            'NY',
    open:          'ÖPPEN',
    pre:           'PRE',
    closed:        'STÄNGD',

    // Nav
    home:          'Hem',
    calendar:      'Kalender',
    stats:         'Stats',
    risk:          'Risk',
    charts:        'Charts',
    playbook:      'Playbook',

    // TodayTrade — stat cards
    winRate:       'WIN RATE',
    totalPnl:      'TOTALT P&L',
    thisWeek:      'DENNA VECKA',
    streak:        'STREAK',
    trades:        'trades',

    // Bias
    dailyBias:     'DAGLIG BIAS',
    required:      'OBLIGATORISK',

    // Session timer
    closes:        'STÄNGER',
    opens:         'ÖPPNAR',
    sessionClosed: 'SESSION STÄNGD',

    // PDL warning
    pdlMax:        '🚨 MAX DAGLIG FÖRLUST NÅDD — SLUTA TRADEA',
    pdlPct:        (p) => `⚠ ${p}% AV DAGLIG FÖRLUSTGRÄNS`,
    pdlOf:         (a, b) => `-$${a} av $${b} PDL`,

    // Monthly summary
    monthlyTradeCount: (n) => `${n} trades`,
    wr:            'WR',

    // Lockout
    lockoutTitle:  'LOCKOUT AKTIV — INGEN TRADING',
    lockoutFall:   '2 violations denna vecka. Full vecka utan trading. Granska dina regler.',

    // Today's trades
    todaysTrades:  'DAGENS TRADES',
    noTrades:      'Inga trades loggade idag',
    todayLabel:    'Idag:',
    logBtn:        '+ LOG',
    lockoutBtn:    '🔒 LOCKOUT',

    // Pre-trade checklist
    checklistTitle:'PRE-TRADE CHECKLISTA',
    allRulesMet:   '✓ ALLA REGLER UPPFYLLDA',
    rulesBroken:   (n) => `⚠ ${n} REGEL${n>1?'ER':''} BRUTEN${n>1?'A':''} — TRADE FLAGGAS SOM VIOLATION`,
    autoTag:       'AUTO',
    tapTag:        'KLICKA',
    checklist: {
      bias:      'Bias satt för dagen',
      aplus:     'A+ setup',
      window:    'Tidsfönster 15:30–17:30 CET',
      risk:      'Risk uträknad',
      maxtrades: 'Max 2 trades idag',
      afterwin:  'Stanna efter vinst',
    },

    // Trade form
    outcome:       'OUTCOME',
    instrument:    'INSTRUMENT',
    pnlLabel:      'P&L ($)',
    setupLabel:    'SETUP',
    tradedAt:      'HANDLAD KL',
    emotionLabel:  'EMOTION',
    calm:          'Lugn ✓',
    stressed:      'Stressad ✗',
    neutral:       'Neutral',
    psyLabel:      'PSYKOLOGI',
    notesLabel:    'NOTES',
    chartImg:      'CHART SCREENSHOT',
    uploadChart:   'Ladda upp chart-bild',
    setupQuality:  'SETUP-KVALITET',
    saveBtn:       'SPARA',
    cancelBtn:     'Avbryt',
    stopDay:       'STANNA FÖR DAGEN',
    biasError:     'Sätt daglig bias innan du loggar en trade. PRO BTB-regel.',
    notesPlaceholder: 'Analys, tankar...',

    // Psych tags
    psych: {
      patient:   'Tålmodig',
      aplus:     'A+ Setup',
      setforget: 'Set & Forget',
      managed:   'Hanterat bra',
      fomo:      'FOMO',
      revenge:   'Hämndtrade',
      forced:    'Forcerat',
      slmoved:   'SL flytt',
    },

    // Statistics
    total:         'Totalt',
    thisMonth:     'Denna månad',
    thisWeekBtn:   'Denna vecka',
    csvBtn:        '↓ CSV',
    statsTab_stats:'Översikt',
    statsTab_analys:'Analys',
    statsTab_journal:'Journal',
    statsTab_ref:  'Reflektion',
    setupFilter:   'SETUP-FILTER',
    clearFilter:   '✕ Rensa',
    allTrades:     'ALLA TRADES',
    noMatch:       'Inga trades matchar',
    searchPh:      'Sök instrument, setup, notes...',
    dateCol:       'DATUM',
    instrCol:      'INST',
    outcomeCol:    'OUTCOME',
    setupCol:      'SETUP',
    pnlCol:        'P&L',
    notesCol:      'NOTES',
    emotionShort:  'E',
    rulesCol:      'REG',
    tradesShown:   (n, t) => `${n} / ${t} trades`,
    all:           'Alla',
    wins:          'Wins',
    losses:        'Loss',
    be:            'BE',
    setupQualSec:  'SETUP-KVALITET',
    noGradesYet:   'Inga trades med grade ännu — välj A+/A/B/C i formuläret',

    // Chart
    chartLabel:    'CHART',
    enterSymbol:   'MYM1!, AAPL, BTC...',
    alertsTitle:   'PRISNIVÅLARM',
    alertSymPh:    'AAPL, ETH, SPY...',
    alertPricePh:  '45 000',
    above:         '↑ Över',
    below:         '↓ Under',
    addAlert:      '+ Lägg till',
    noAlerts:      'Inga aktiva larm',
    alertFutures:  'Futures — lägg larm i TV-chartet',
    alertChecking: 'Kontrollerar...',
    tvTip:         'Högerklicka i chartet →',
    tvTipAction:   'Add Alert',
    tvTipSuffix:   'för inbyggda larm direkt i TradingView',
    alertNote:     'Aktier, index och krypto: auto-notis var 30s. Futures (MYM1! etc): använd TradingView-larmet istället.',

    // Calendar
    calNewTrade:   'NY TRADE',
    calNoTrades:   'Inga trades på denna dag',
    calAddFirst:   'Tryck + NY TRADE för att logga',
    calEditTitle:  'REDIGERA TRADE',
    calSave:       'SPARA TRADE',
    calCancel:     'Avbryt',
    calInstrument: 'INSTRUMENT',
    calSetup:      'SETUP',
    calTime:       'HANDLAD KL',
    calPnl:        'P&L ($)',
    calGrade:      'SETUP-KVALITET',
    calOutcome:    'OUTCOME',
    calEmotion:    'EMOTION',
    calPsych:      'PSYKOLOGI',
    calNotes:      'NOTES',
    calChart:      '📷 CHART SCREENSHOT',

    // RiskCalculator
    riskTitle:     'RISK CALCULATOR',
    riskAccount:   'KONTO',
    riskCategory:  'KATEGORI',
    riskContract:  'KONTRAKT',
    riskPct:       'RISK %',
    riskAccLabel:  'ACCOUNT ($)',
    riskSl:        'STOP LOSS (POINTS)',
    riskSlPh:      't.ex. 80',
  },

  en: {
    // App shell
    loading:       'LOADING...',
    logout:        'log out',
    swe:           'SWE',
    ny:            'NY',
    open:          'OPEN',
    pre:           'PRE',
    closed:        'CLOSED',

    // Nav
    home:          'Home',
    calendar:      'Calendar',
    stats:         'Stats',
    risk:          'Risk',
    charts:        'Charts',
    playbook:      'Playbook',

    // TodayTrade — stat cards
    winRate:       'WIN RATE',
    totalPnl:      'TOTAL P&L',
    thisWeek:      'THIS WEEK',
    streak:        'STREAK',
    trades:        'trades',

    // Bias
    dailyBias:     'DAILY BIAS',
    required:      'REQUIRED',

    // Session timer
    closes:        'CLOSES',
    opens:         'OPENS',
    sessionClosed: 'SESSION CLOSED',

    // PDL warning
    pdlMax:        '🚨 MAX DAILY LOSS REACHED — STOP TRADING',
    pdlPct:        (p) => `⚠ ${p}% OF DAILY LOSS LIMIT`,
    pdlOf:         (a, b) => `-$${a} of $${b} PDL`,

    // Monthly summary
    monthlyTradeCount: (n) => `${n} trades`,
    wr:            'WR',

    // Lockout
    lockoutTitle:  'LOCKOUT ACTIVE — NO TRADING',
    lockoutFall:   '2 violations this week. Full week off. Review your rules.',

    // Today's trades
    todaysTrades:  "TODAY'S TRADES",
    noTrades:      'No trades logged today',
    todayLabel:    'Today:',
    logBtn:        '+ LOG',
    lockoutBtn:    '🔒 LOCKOUT',

    // Pre-trade checklist
    checklistTitle:'PRE-TRADE CHECKLIST',
    allRulesMet:   '✓ ALL RULES MET',
    rulesBroken:   (n) => `⚠ ${n} RULE${n>1?'S':''} BROKEN — TRADE FLAGGED AS VIOLATION`,
    autoTag:       'AUTO',
    tapTag:        'TAP',
    checklist: {
      bias:      'Daily bias set',
      aplus:     'A+ setup',
      window:    'Time window 15:30–17:30 CET',
      risk:      'Risk calculated',
      maxtrades: 'Max 2 trades today',
      afterwin:  'Stop after win',
    },

    // Trade form
    outcome:       'OUTCOME',
    instrument:    'INSTRUMENT',
    pnlLabel:      'P&L ($)',
    setupLabel:    'SETUP',
    tradedAt:      'ENTRY TIME',
    emotionLabel:  'EMOTION',
    calm:          'Calm ✓',
    stressed:      'Stressed ✗',
    neutral:       'Neutral',
    psyLabel:      'PSYCHOLOGY',
    notesLabel:    'NOTES',
    chartImg:      'CHART SCREENSHOT',
    uploadChart:   'Upload chart image',
    setupQuality:  'SETUP QUALITY',
    saveBtn:       'SAVE',
    cancelBtn:     'Cancel',
    stopDay:       'STOP FOR TODAY',
    biasError:     'Set daily bias before logging a trade.',
    notesPlaceholder: 'Analysis, thoughts...',

    // Psych tags
    psych: {
      patient:   'Patient',
      aplus:     'A+ Setup',
      setforget: 'Set & Forget',
      managed:   'Managed well',
      fomo:      'FOMO',
      revenge:   'Revenge trade',
      forced:    'Forced',
      slmoved:   'SL moved',
    },

    // Statistics
    total:         'Total',
    thisMonth:     'This month',
    thisWeekBtn:   'This week',
    csvBtn:        '↓ CSV',
    statsTab_stats:'Overview',
    statsTab_analys:'Analysis',
    statsTab_journal:'Journal',
    statsTab_ref:  'Reflection',
    setupFilter:   'SETUP FILTER',
    clearFilter:   '✕ Clear',
    allTrades:     'ALL TRADES',
    noMatch:       'No trades match',
    searchPh:      'Search instrument, setup, notes...',
    dateCol:       'DATE',
    instrCol:      'INST',
    outcomeCol:    'OUTCOME',
    setupCol:      'SETUP',
    pnlCol:        'P&L',
    notesCol:      'NOTES',
    emotionShort:  'E',
    rulesCol:      'RUL',
    tradesShown:   (n, t) => `${n} / ${t} trades`,
    all:           'All',
    wins:          'Wins',
    losses:        'Loss',
    be:            'BE',
    setupQualSec:  'SETUP QUALITY',
    noGradesYet:   'No graded trades yet — select A+/A/B/C in the form',

    // Chart
    chartLabel:    'CHART',
    enterSymbol:   'MYM1!, AAPL, BTC...',
    alertsTitle:   'PRICE ALERTS',
    alertSymPh:    'AAPL, ETH, SPY...',
    alertPricePh:  '45 000',
    above:         '↑ Above',
    below:         '↓ Below',
    addAlert:      '+ Add',
    noAlerts:      'No active alerts',
    alertFutures:  'Futures — add alert in TV chart',
    alertChecking: 'Checking...',
    tvTip:         'Right-click in chart →',
    tvTipAction:   'Add Alert',
    tvTipSuffix:   'for built-in TradingView alerts',
    alertNote:     'Stocks, indices and crypto: auto-check every 30s. Futures (MYM1! etc): use TradingView alerts instead.',

    // Calendar
    calNewTrade:   'NEW TRADE',
    calNoTrades:   'No trades on this day',
    calAddFirst:   'Press + NEW TRADE to log',
    calEditTitle:  'EDIT TRADE',
    calSave:       'SAVE TRADE',
    calCancel:     'Cancel',
    calInstrument: 'INSTRUMENT',
    calSetup:      'SETUP',
    calTime:       'ENTRY TIME',
    calPnl:        'P&L ($)',
    calGrade:      'SETUP QUALITY',
    calOutcome:    'OUTCOME',
    calEmotion:    'EMOTION',
    calPsych:      'PSYCHOLOGY',
    calNotes:      'NOTES',
    calChart:      '📷 CHART SCREENSHOT',

    // RiskCalculator
    riskTitle:     'RISK CALCULATOR',
    riskAccount:   'ACCOUNT',
    riskCategory:  'CATEGORY',
    riskContract:  'CONTRACT',
    riskPct:       'RISK %',
    riskAccLabel:  'ACCOUNT ($)',
    riskSl:        'STOP LOSS (POINTS)',
    riskSlPh:      'e.g. 80',
  },
}
