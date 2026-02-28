<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Kiểm tra nguyên vật liệu"
    width="580px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="10">
          <el-form-item label="Sản phẩm" prop="product_id">
            <el-select v-model="form.product_id" placeholder="Chọn sản phẩm" filterable style="width:100%">
              <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="7">
          <el-form-item label="Số lượng cần SX" prop="quantity">
            <el-input-number v-model="form.quantity" :min="1" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="7">
          <el-form-item label="Kho kiểm tra" prop="warehouse_id">
            <el-select v-model="form.warehouse_id" placeholder="Chọn kho" filterable style="width:100%" :loading="loadingWh">
              <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" :icon="Search" :loading="checking" @click="handleCheck" style="margin-bottom:16px">
        Kiểm tra
      </el-button>
    </el-form>

    <!-- Result -->
    <div v-if="result !== null">
      <el-alert
        :title="result.can_produce ? '✅ Đủ nguyên vật liệu — có thể sản xuất!' : '❌ Không đủ nguyên vật liệu'"
        :type="result.can_produce ? 'success' : 'error'"
        show-icon :closable="false" class="mb-md"
      />

      <el-table :data="result.materials ?? []" stripe size="small">
        <el-table-column label="Nguyên liệu" min-width="140">
          <template #default="{ row }">{{ row.material_name ?? row.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="Cần" width="90" align="center">
          <template #default="{ row }">{{ row.required_quantity }}</template>
        </el-table-column>
        <el-table-column label="Tồn kho" width="90" align="center">
          <template #default="{ row }">{{ row.available_quantity }}</template>
        </el-table-column>
        <el-table-column label="Thiếu" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.shortage > 0 ? '#f56c6c' : '#67c23a', fontWeight: 700 }">
              {{ row.shortage > 0 ? `-${row.shortage}` : '✓' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_sufficient ? 'success' : 'danger'" size="small" effect="light">
              {{ row.is_sufficient ? 'Đủ' : 'Thiếu' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Đóng</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { checkMaterials } from '@/api/production'
import { getWarehouses } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps({
  modelValue: Boolean,
  products: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])
const { isMobile } = useResponsive()
const formRef = ref(null)
const checking = ref(false)
const loadingWh = ref(false)
const warehouses = ref([])
const result = ref(null)

const form = reactive({ product_id: null, quantity: 1, warehouse_id: null })

const rules = {
  product_id: [{ required: true, message: 'Chọn sản phẩm', trigger: 'change' }],
  quantity: [{ required: true, type: 'number', min: 1, trigger: 'blur' }],
  warehouse_id: [{ required: true, message: 'Chọn kho', trigger: 'change' }]
}

const fetchWarehouses = async () => {
  loadingWh.value = true
  try { const r = await getWarehouses({ per_page: 999 }); warehouses.value = r.data ?? [] } catch {}
  finally { loadingWh.value = false }
}

const handleCheck = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    checking.value = true
    result.value = null
    try {
      const res = await checkMaterials({ product_id: form.product_id, quantity: form.quantity, warehouse_id: form.warehouse_id })
      result.value = res.data ?? null
    } catch { ElMessage.error('Kiểm tra thất bại') }
    finally { checking.value = false }
  })
}

onMounted(fetchWarehouses)
</script>

<style scoped lang="scss">
.mb-md { margin-bottom: 16px; }
</style>
