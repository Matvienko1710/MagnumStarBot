declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe?: {
          user?: {
            id: number
            username?: string
            first_name?: string
            last_name?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        sendData: (data: string) => void
        showAlert: (message: string) => void
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void
        showPopup: (params: any, callback: (buttonId: string) => void) => void
        showScanQrPopup: (params: any, callback: (text: string) => void) => void
        closeScanQrPopup: () => void
        readTextFromClipboard: (callback: (text: string) => void) => void
        requestWriteAccess: (callback: (granted: boolean) => void) => void
        requestContact: (callback: (granted: boolean) => void) => void
        openLink: (url: string) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback: (status: string) => void) => void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive?: boolean) => void
          hideProgress: () => void
          setParams: (params: any) => void
        }
        BackButton: {
          isVisible: boolean
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        themeParams: {
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
          hint_color?: string
          bg_color?: string
          text_color?: string
        }
        colorScheme: 'light' | 'dark'
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isClosingConfirmationEnabled: boolean
        platform: string
        version: string
        isVersionAtLeast: (version: string) => boolean
        initData: string
        initDataUnsafe: any
        isVerticalSwipesEnabled: boolean
        isHorizontalSwipesEnabled: boolean
        enableClosingConfirmation: () => void
        disableClosingConfirmation: () => void
        onEvent: (eventType: string, eventHandler: () => void) => void
        offEvent: (eventType: string, eventHandler: () => void) => void
        sendEvent: (eventType: string, eventData?: any) => void
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
        showPopup: (params: any, callback?: (buttonId: string) => void) => void
        showAlert: (message: string, callback?: () => void) => void
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
        showScanQrPopup: (params: any, callback?: (text: string) => void) => void
        closeScanQrPopup: () => void
        readTextFromClipboard: (callback?: (text: string) => void) => void
        requestWriteAccess: (callback?: (granted: boolean) => void) => void
        requestContact: (callback?: (granted: boolean) => void) => void
      }
    }
  }
}

export {}
