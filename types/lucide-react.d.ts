declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    color?: string
    strokeWidth?: string | number
  }
  
  export const Coins: ComponentType<LucideProps>
  export const TrendingUp: ComponentType<LucideProps>
  export const Trophy: ComponentType<LucideProps>
  export const Target: ComponentType<LucideProps>
  export const Clock: ComponentType<LucideProps>
  export const Button: ComponentType<LucideProps>
  export const Card: ComponentType<LucideProps>
  export const ArrowLeft: ComponentType<LucideProps>
  export const Gift: ComponentType<LucideProps>
  export const Crown: ComponentType<LucideProps>
  export const Star: ComponentType<LucideProps>
  export const Package: ComponentType<LucideProps>
  export const Sparkles: ComponentType<LucideProps>
  export const ChevronLeft: ComponentType<LucideProps>
  export const ChevronRight: ComponentType<LucideProps>
  export const BarChart3: ComponentType<LucideProps>
  export const Zap: ComponentType<LucideProps>
  export const ArrowUp: ComponentType<LucideProps>
  export const User: ComponentType<LucideProps>
  export const X: ComponentType<LucideProps>
  export const Settings: ComponentType<LucideProps>
  export const Award: ComponentType<LucideProps>
  export const Home: ComponentType<LucideProps>
  export const Calendar: ComponentType<LucideProps>
  export const Wallet: ComponentType<LucideProps>
}
