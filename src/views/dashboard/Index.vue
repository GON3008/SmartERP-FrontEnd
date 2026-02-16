<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h1 class="page-title">Tổng quan</h1>
      <p class="page-description">Chào mừng bạn đến với hệ thống quản lý SmartERP</p>
    </div>
    
    <!-- Statistics Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card stat-card-primary">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatCurrency(totalRevenue) }}</div>
              <div class="stat-label">Doanh thu tháng này</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card stat-card-success">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalOrders }}</div>
              <div class="stat-label">Đơn hàng</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card stat-card-warning">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalCustomers }}</div>
              <div class="stat-label">Khách hàng</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card stat-card-info">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalProducts }}</div>
              <div class="stat-label">Sản phẩm</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- Charts and Recent Activities -->
    <el-row :gutter="20" class="mt-lg">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Doanh thu theo tháng</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon><TrendCharts /></el-icon>
              <p>Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
              <el-text type="info" size="small">Tích hợp ECharts hoặc Chart.js để hiển thị biểu đồ</el-text>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Đơn hàng gần đây</span>
            </div>
          </template>
          <div class="recent-orders">
            <el-empty v-if="recentOrders.length === 0" description="Chưa có đơn hàng" />
            <div v-else class="order-list">
              <div v-for="order in recentOrders" :key="order.id" class="order-item">
                <div class="order-info">
                  <div class="order-code">{{ order.code }}</div>
                  <div class="order-customer">{{ order.customer }}</div>
                </div>
                <div class="order-amount">{{ formatCurrency(order.amount) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TrendCharts, Document, User, Box } from '@element-plus/icons-vue'

// Sample data - Replace with actual API calls
const totalRevenue = ref(125000000)
const totalOrders = ref(156)
const totalCustomers = ref(89)
const totalProducts = ref(234)

const recentOrders = ref([
  { id: 1, code: 'DH001', customer: 'Công ty ABC', amount: 5000000 },
  { id: 2, code: 'DH002', customer: 'Công ty XYZ', amount: 3500000 },
  { id: 3, code: 'DH003', customer: 'Khách hàng A', amount: 2000000 },
])

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}
</script>

<style scoped lang="scss">
.dashboard-container {
  .stats-row {
    margin-bottom: 24px;
  }
  
  .stat-card {
    border: none;
    box-shadow: var(--shadow-sm);
    transition: var(--transition-base);
    
    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: white;
  }
  
  .stat-card-primary .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .stat-card-success .stat-icon {
    background: linear-gradient(135deg, #67C23A 0%, #529b2e 100%);
  }
  
  .stat-card-warning .stat-icon {
    background: linear-gradient(135deg, #E6A23C 0%, #b88230 100%);
  }
  
  .stat-card-info .stat-icon {
    background: linear-gradient(135deg, #909399 0%, #73767a 100%);
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  .card-header {
    font-weight: 600;
    font-size: 16px;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .chart-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    
    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    p {
      margin-bottom: 8px;
    }
  }
  
  .recent-orders {
    max-height: 300px;
    overflow-y: auto;
  }
  
  .order-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-page);
    border-radius: var(--radius-base);
    transition: var(--transition-fast);
    
    &:hover {
      background: var(--border-extra-light);
    }
  }
  
  .order-code {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .order-customer {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .order-amount {
    font-weight: 600;
    color: var(--primary-color);
  }
}
</style>
