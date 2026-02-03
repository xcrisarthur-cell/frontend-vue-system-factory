import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import ProductionMenu from '../pages/ProductionMenu.vue'
import ProductionLogin from '../pages/ProductionLogin.vue'
import ProductionKoordinator from '../pages/ProductionKoordinator.vue'
import ProductionCoordinator from '../pages/ProductionCoordinator.vue'
import ProductionSupervisor from '../pages/ProductionSupervisor.vue'
import CoordinatorLogin from '../pages/CoordinatorLogin.vue'
import SupervisorLogin from '../pages/SupervisorLogin.vue'
import AdminProduksiLogin from '../pages/AdminProduksiLogin.vue'
import ProductionAdminProduksi from '../pages/ProductionAdminProduksi.vue'
import ProductionInput from '../pages/ProductionInput.vue'
import ProductionLogs from '../pages/ProductionLogs.vue'
import ProductionLogsEdit from '../pages/ProductionLogsEdit.vue'
import ProductionTargetForm from '../pages/ProductionTargetForm.vue'
import ProductionTargetsList from '../pages/ProductionTargetsList.vue'
import AttendanceForm from '../pages/AttendanceForm.vue'
import AttendancesList from '../pages/AttendancesList.vue'
import ProductionDashboard from '../pages/ProductionDashboard.vue'
import MasterData from '../pages/MasterData.vue'
import MasterDataLogin from '../pages/MasterDataLogin.vue'
import ProductionPlansView from '../pages/ProductionPlansView.vue'

// Master Data - Divisions
import DivisionsList from '../pages/DivisionsList.vue'
import DivisionForm from '../pages/DivisionForm.vue'

// Master Data - Departments
import DepartmentsList from '../pages/DepartmentsList.vue'
import DepartmentForm from '../pages/DepartmentForm.vue'

// Master Data - Positions
import PositionsList from '../pages/PositionsList.vue'
import PositionForm from '../pages/PositionForm.vue'

// Master Data - Sub Positions
import SubPositionsList from '../pages/SubPositionsList.vue'
import SubPositionForm from '../pages/SubPositionForm.vue'

// Master Data - Workers
import WorkersList from '../pages/WorkersList.vue'
import WorkerForm from '../pages/WorkerForm.vue'

// Master Data - Shifts
import ShiftsList from '../pages/ShiftsList.vue'
import ShiftForm from '../pages/ShiftForm.vue'

// Master Data - Suppliers
import SuppliersList from '../pages/SuppliersList.vue'
import SupplierForm from '../pages/SupplierForm.vue'

// Master Data - Items
import ItemsList from '../pages/ItemsList.vue'
import ItemForm from '../pages/ItemForm.vue'

// Master Data - Problem Comments
import ProblemCommentsList from '../pages/ProblemCommentsList.vue'
import ProblemCommentForm from '../pages/ProblemCommentForm.vue'

// IT Dashboard
import ServerStatus from '../pages/ServerStatus.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/server-status', component: ServerStatus },
  { path: '/production-menu', component: ProductionMenu },
  { path: '/ProductionMenu', component: ProductionMenu }, // Backward compatibility
  { path: '/production-dashboard', component: ProductionDashboard },
  { path: '/production-login', component: ProductionLogin },
  { path: '/ProductionLogin', component: ProductionLogin }, // Backward compatibility
  { path: '/production-operator', component: ProductionLogin },
  { path: '/production-plans-view', component: ProductionPlansView },
  { path: '/coordinator-login', component: CoordinatorLogin },
  { path: '/production-coordinator', component: ProductionCoordinator },
  { path: '/ProductionKoordinator', component: ProductionKoordinator }, // Backward compatibility
  { path: '/supervisor-login', component: SupervisorLogin },
  { path: '/production-supervisor', component: ProductionSupervisor },
  { path: '/admin-produksi-login', component: AdminProduksiLogin },
  { path: '/production-admin-produksi', component: ProductionAdminProduksi },
  { path: '/production-admin', component: ProductionLogs }, // Admin sees all logs (backward compatibility)
  { path: '/ProductionInput', component: ProductionInput },
  { path: '/production-input', component: ProductionInput },
  { path: '/ProductionLogs', component: ProductionLogs }, // Backward compatibility
  { path: '/production-logs', component: ProductionLogs },
  { path: '/production-logs/create', component: ProductionLogsEdit },
  { path: '/production-logs/:id/edit', component: ProductionLogsEdit },
  { path: '/ProductionLogsEdit', component: ProductionLogsEdit }, // Keep for backward compatibility

  // Production Targets
  { path: '/production-targets', component: ProductionTargetsList },
  { path: '/production-targets/create', component: ProductionTargetForm },
  { path: '/production-targets/:id/edit', component: ProductionTargetForm },
  
  // Attendances
  { path: '/attendances', component: AttendancesList },
  { path: '/attendances/create', component: AttendanceForm },
  { path: '/attendances/:id/edit', component: AttendanceForm },
  
  // Master Data Management
  { path: '/master-data-login', component: MasterDataLogin },
  { path: '/master-data', component: MasterData },
  
  // Divisions
  { path: '/divisions', component: DivisionsList },
  { path: '/divisions/create', component: DivisionForm },
  { path: '/divisions/:id/edit', component: DivisionForm },
  
  // Departments
  { path: '/departments', component: DepartmentsList },
  { path: '/departments/create', component: DepartmentForm },
  { path: '/departments/:id/edit', component: DepartmentForm },
  
  // Positions
  { path: '/positions', component: PositionsList },
  { path: '/positions/create', component: PositionForm },
  { path: '/positions/:id/edit', component: PositionForm },
  
  // Sub Positions
  { path: '/sub-positions', component: SubPositionsList },
  { path: '/sub-positions/create', component: SubPositionForm },
  { path: '/sub-positions/:id/edit', component: SubPositionForm },
  
  // Workers
  { path: '/workers', component: WorkersList },
  { path: '/workers/create', component: WorkerForm },
  { path: '/workers/:id/edit', component: WorkerForm },
  
  // Shifts
  { path: '/shifts', component: ShiftsList },
  { path: '/shifts/create', component: ShiftForm },
  { path: '/shifts/:id/edit', component: ShiftForm },
  
  // Suppliers
  { path: '/suppliers', component: SuppliersList },
  { path: '/suppliers/create', component: SupplierForm },
  { path: '/suppliers/:id/edit', component: SupplierForm },
  
  // Items
  { path: '/items', component: ItemsList },
  { path: '/items/create', component: ItemForm },
  { path: '/items/:id/edit', component: ItemForm },
  
  // Problem Comments
  { path: '/problem-comments', component: ProblemCommentsList },
  { path: '/problem-comments/create', component: ProblemCommentForm },
  { path: '/problem-comments/:id/edit', component: ProblemCommentForm },
  
  // IT Dashboard
  // { path: '/it-dashboard', component: ITDashboard },

  { path: '/pajak', component: HomePage }, // Placeholder - bisa diganti dengan halaman pajak nanti
  { path: '/pilihan3', component: HomePage }, // Placeholder - bisa diganti dengan halaman pilihan3 nanti
  { path: '/pilihan4', component: HomePage } // Placeholder - bisa diganti dengan halaman pilihan4 nanti
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
