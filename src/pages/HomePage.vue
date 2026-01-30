<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateTo = (path) => {
  router.push(path)
}

</script>

<template>
  <div class="home-container">
    <div class="home-card">
      <div class="home-header">
        <div class="logo-container">
          <img src="/logo-massindo.png" alt="Logo Massindo" class="logo-image" />
        </div>
        <h1 class="app-name">MATRIX</h1>
        <p class="app-desc">Manufacturing, Reporting & Integrated Execution System</p>
        <p class="subtitle">Pilih modul yang ingin Anda akses</p>

      </div>

      <div class="menu-grid">
        <button class="menu-item" @click="navigateTo('/production-menu')">
          <div class="menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path
                d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z">
              </path>
            </svg>
          </div>
          <div class="menu-content">
            <h3>Produksi</h3>
            <p>Input data</p>
          </div>
          <div class="menu-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </button>

        <button class="menu-item" @click="navigateTo('/master-data-login')">
          <div class="menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="menu-content">
            <h3>Master Data</h3>
            <p>Kelola data master</p>
          </div>
          <div class="menu-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </button>

        <!-- <button class="menu-item" @click="navigateTo('/it-dashboard')">
          <div class="menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div class="menu-content">
            <h3>IT</h3>
            <p>Monitoring & Tools</p>
          </div>
          <div class="menu-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </button> -->

        <button class="menu-item" @click="navigateTo('/server-status')">
          <div class="menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div class="menu-content">
            <h3>Server Status</h3>
            <p>Monitor Resource & Services</p>
          </div>
          <div class="menu-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-name {
  margin: 0;
  font-size: 3rem;
  font-weight: 800;
  color: #333b5f;
  letter-spacing: 0.2em;
}

.app-desc {
  margin: 0.5rem 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333b5f;
  opacity: 0.65;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-desc::after {
  content: '';
  display: block;
  width: 48px;
  height: 2px;
  background: #333b5f;
  margin: 1rem auto 0;
  opacity: 0.3;
}

.subtitle {
  margin-top: 1.25rem;
  font-size: 0.95rem;
  opacity: 0.6;
}

.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  /* background: #beceea; */
}

.home-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(51, 59, 95, 0.15);
  padding: 3rem;
  width: 100%;
  max-width: 900px;
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(51, 59, 95, 0.1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.home-header {
  text-align: center;
  margin-bottom: 3rem;
}

.logo-container {
  display: inline-block;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(51, 59, 95, 0.1);
}

.logo-image {
  height: 60px;
  width: auto;
  display: block;
  object-fit: contain;
}

.home-header h1 {
  margin: 0 0 0.75rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #333b5f;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #333b5f;
  font-size: 1rem;
  opacity: 0.7;
  font-weight: 400;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #beceea;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(190, 206, 234, 0.1);
  transition: left 0.3s ease;
}

.menu-item:hover::before {
  left: 0;
}

.menu-item:hover {
  border-color: #333b5f;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(51, 59, 95, 0.15);
}

.menu-item:active {
  transform: translateY(0);
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(190, 206, 234, 0.2);
  border-radius: 12px;
  color: #333b5f;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon {
  background: #333b5f;
  color: white;
  transform: scale(1.05);
}

.menu-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.menu-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333b5f;
  letter-spacing: 0.2px;
}

.menu-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #000;
  opacity: 0.6;
}

.menu-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333b5f;
  opacity: 0.5;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.menu-item:hover .menu-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .home-container {
    padding: 1rem 0.75rem;
  }

  .home-card {
    padding: 2rem 1.75rem;
    border-radius: 20px;
  }

  .home-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .menu-item {
    padding: 1.25rem;
  }

  .menu-icon {
    width: 48px;
    height: 48px;
  }

  .menu-content h3 {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .home-container {
    padding: 0.75rem 0.5rem;
  }

  .home-card {
    padding: 1.75rem 1.5rem;
    border-radius: 16px;
  }

  .home-header {
    margin-bottom: 2rem;
  }

  .home-header h1 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .menu-item {
    padding: 1rem;
    gap: 0.875rem;
  }

  .menu-icon {
    width: 44px;
    height: 44px;
  }

  .menu-content h3 {
    font-size: 1rem;
  }

  .menu-content p {
    font-size: 0.8125rem;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .home-card {
    max-width: 850px;
    padding: 2.5rem;
  }

  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large screens */
@media (min-width: 1025px) {
  .home-card {
    max-width: 900px;
  }
}
</style>
