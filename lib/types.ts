// Общие типы для всего приложения

export interface GameState {
  magnumCoins: number
  stars: number
  energy: number
  maxEnergy: number
  clickAnimating: boolean
  energyAnimating: boolean
  totalClicks: number
  lastEnergyRestore: number
  clickPower: number
  level: number
  experience: number
  experienceToNext: number
  prestigeLevel: number
  dailyStreak: number
  lastLoginDate: string
  achievements: string[]
  inventory: InventoryItem[]
  dailyRewards: DailyReward[]
  lastDailyReward: string
  autoClicker: AutoClickerState
  boosts: BoostState[]
  statistics: GameStatistics
  telegramId?: number
  username?: string
  firstName?: string
  lastName?: string
}

export interface CaseItem {
  id: string
  name: string
  price: number
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
  rewards: Array<{
    type: "coins" | "stars" | "energy" | "boost" | "item"
    min: number
    max: number
    chance: number
    itemId?: string
  }>
  image: string
  glowColor: string
  description: string
  dailyLimit?: number
  specialOffer?: boolean
  category: "standard" | "premium" | "event" | "seasonal"
  unlockLevel: number
  tags: string[]
  animation: string
}

export interface Upgrade {
  id: string
  name: string
  description: string
  price: number
  level: number
  maxLevel: number
  effect: string
  icon: string
  category: "click" | "energy" | "passive" | "special"
  unlockLevel: number
  prerequisite?: string
  multiplier: number
}

export interface HistoryItem {
  id: string
  playerName: string
  caseName: string
  reward: { type: string; amount: number; itemName?: string }
  rarity: string
  timestamp: number
  playerId: string
  location: string
  isRare: boolean
}

export interface InventoryItem {
  id: string
  name: string
  type: "boost" | "decoration" | "tool" | "collectible"
  rarity: string
  quantity: number
  description: string
  icon: string
  effects?: { [key: string]: number }
}

export interface DailyReward {
  day: number
  type: "coins" | "stars" | "energy" | "boost" | "case"
  amount: number
  claimed: boolean
  special?: boolean
}

export interface AutoClickerState {
  active: boolean
  level: number
  clicksPerSecond: number
  duration: number
  remaining: number
}

export interface BoostState {
  id: string
  name: string
  type: "click_multiplier" | "energy_regen" | "coin_rain" | "lucky_chance"
  multiplier: number
  duration: number
  remaining: number
  icon: string
}

export interface GameStatistics {
  totalEarned: number
  totalSpent: number
  casesOpened: number
  rareItemsFound: number
  daysPlayed: number
  maxClickStreak: number
  currentClickStreak: number
  prestigeCount: number
}

// Props для компонентов
export interface HomePageProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  upgrades: Upgrade[]
  setUpgrades: React.Dispatch<React.SetStateAction<Upgrade[]>>
  showProfile: boolean
  setShowProfile: (show: boolean) => void
  showUpgrades: boolean
  setShowUpgrades: (show: boolean) => void
}

export interface CasesPageProps {
  gameState: GameState
  cases: CaseItem[]
  recentDrops: HistoryItem[]
  historyScrollIndex: number
  setHistoryScrollIndex: (index: number) => void
  openCase: (caseItem: CaseItem) => void
}

export interface CaseOpeningScreenProps {
  selectedCase: CaseItem | null
  rouletteItems: any[]
  rouletteSpinning: boolean
  rouletteOffset: number
  roulettePhase: "ready" | "spinning" | "slowing" | "stopped"
  caseResult: any
  onClose: () => void
  spinRoulette: () => void
}

export interface EventsPageProps {
  gameState: GameState
}

export interface WalletPageProps {
  gameState: GameState
}
