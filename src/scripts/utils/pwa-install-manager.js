class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    this.checkInstallStatus();
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', (e) => {
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstallSuccessMessage();
    });

    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  checkInstallStatus() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone;
    
    if (isStandalone) {
      this.isInstalled = true;
    }
  }

  showInstallButton() {
    if (this.isInstalled) return;

    const existingButton = document.querySelector('.pwa-install-button');
    if (existingButton) return;

    const installButton = document.createElement('button');
    installButton.className = 'pwa-install-button';
    installButton.innerHTML = `
      <span class="install-icon">📱</span>
      <span class="install-text">Install App</span>
    `;
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      z-index: 1000;
      animation: slideInUp 0.5s ease;
    `;

    installButton.addEventListener('mouseenter', () => {
      installButton.style.transform = 'translateY(-2px)';
      installButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });

    installButton.addEventListener('mouseleave', () => {
      installButton.style.transform = 'translateY(0)';
      installButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });

    installButton.addEventListener('click', () => {
      this.promptInstall();
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(installButton);
  }

  hideInstallButton() {
    const installButton = document.querySelector('.pwa-install-button');
    if (installButton) {
      installButton.style.animation = 'slideOutDown 0.5s ease';
      setTimeout(() => {
        installButton.remove();
      }, 500);
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      return;
    }

    try {
      this.deferredPrompt.prompt();
      
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.hideInstallButton();
      }
      
      this.deferredPrompt = null;
    } catch (error) {
      
    }
  }

  showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 1001;
      animation: slideInRight 0.5s ease;
    `;
    message.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>✅</span>
        <span>App installed successfully!</span>
      </div>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.style.animation = 'slideOutRight 0.5s ease';
      setTimeout(() => {
        message.remove();
      }, 500);
    }, 3000);
  }

  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  getInstallStatus() {
    return {
      isInstalled: this.isInstalled,
      isSupported: this.isSupported(),
      canPrompt: !!this.deferredPrompt
    };
  }
}

const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100px);
      opacity: 0;
    }
  }
  
  @keyframes slideOutDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(additionalStyles);

export default PWAInstallManager;
