<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goTo = (path) => {
  router.push(path)
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="home-container">
    <div class="home-card">
      <button class="back-button" @click="goBack" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Kembali
      </button>
      
      <div class="home-header">
        <h1>Modul Produksi</h1>
        <p class="subtitle">Pilih peran Anda</p>
      </div>

      <div class="menu-grid">
        <button class="menu-item" @click="goTo('/production-dashboard')">
          <!-- <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg> -->
          <h3>Dashboard</h3>
        </button>

        <button class="menu-item" @click="goTo('/admin-produksi-login')">
          <h3>Admin Produksi</h3>
        </button>

        <button class="menu-item" @click="goTo('/supervisor-login')">
          <h3>Supervisor</h3>
        </button>

        <button class="menu-item" @click="goTo('/coordinator-login')">
          <h3>Koordinator</h3>
        </button>

        <button class="menu-item" @click="goTo('/production-operator')">
          <h3>Operator</h3>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: #f4f6fb;
}

.home-card {
  background: white;
  border-radius: 22px;
  box-shadow: 0 10px 32px rgba(51, 59, 95, 0.15);
  padding: 3rem;
  width: 100%;
  max-width: 720px;
  border: 1px solid rgba(51, 59, 95, 0.1);
  animation: fadeUp 0.4s ease-out;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.home-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.home-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.2rem;
  font-weight: 700;
  color: #333b5f;
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  color: #333b5f;
  opacity: 0.7;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.menu-item {
  padding: 1.75rem 1.5rem;
  border-radius: 16px;
  border: 2px solid #beceea;
  background: white;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.menu-item h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333b5f;
  position: relative;
  z-index: 1;
}

.menu-item.dashboard-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.menu-item.dashboard-item h3 {
  color: white;
}

.menu-item.dashboard-item svg {
  margin-bottom: 0.5rem;
  color: white;
}

.menu-item.dashboard-item:hover {
  border-color: #764ba2;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.menu-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(190, 206, 234, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.menu-item:hover::before {
  transform: translateX(0);
}

.menu-item:hover {
  border-color: #333b5f;
  box-shadow: 0 6px 20px rgba(51, 59, 95, 0.15);
  transform: translateY(-2px);
}

.menu-item:active {
  transform: translateY(0);
  box-shadow: none;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  margin-bottom: 1.5rem;
  background: transparent;
  border: 2px solid #beceea;
  border-radius: 8px;
  color: #333b5f;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #f8f9fa;
  border-color: #333b5f;
  transform: translateX(-2px);
}

.back-button:active {
  transform: translateX(0);
}

/* Tablet */
@media (max-width: 768px) {
  .home-card {
    padding: 2.25rem 2rem;
  }

  .back-button {
    padding: 0.5625rem 0.875rem;
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
  }

  .menu-grid {
    gap: 1.25rem;
  }

  .menu-item {
    padding: 1.5rem 1.25rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .home-card {
    padding: 1.75rem 1.5rem;
    border-radius: 18px;
  }

  .back-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }

  .back-button svg {
    width: 18px;
    height: 18px;
  }

  .home-header h1 {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .menu-item {
    padding: 1.25rem 1rem;
  }

  .menu-item h3 {
    font-size: 1.05rem;
  }
}
</style>