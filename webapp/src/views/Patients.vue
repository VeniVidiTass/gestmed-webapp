<template>
  <DashboardLayout>
    <div class="patients-page">
      <!-- Header with search and add button -->
      <div class="page-header">
        <div class="search-section">
          <InputText
            v-model="searchQuery"
            placeholder="Cerca pazienti per nome, email o telefono"
            class="search-input"
            @input="debouncedSearch"
          />
          <Button icon="pi pi-search" class="p-button-primary" @click="searchPatients" />
        </div>
        <Button
          label="Nuovo Paziente"
          icon="pi pi-plus"
          class="p-button-primary"
          @click="openNewPatientDialog"
        />
      </div>

      <!-- Patients Table -->
      <div class="table-container custom-card">
        <DataTable
          :value="allPatients"
          :loading="isLoading"
          paginator
          :rows="pagination.limit"
          :total-records="pagination.total"
          :rows-per-page-options="[10, 25, 50]"
          lazy
          responsive-layout="scroll"
          :global-filter-fields="['name', 'email', 'phone']"
          empty-message="Nessun paziente trovato"
          class="patients-table"
          @page="onPageChange"
        >
          <Column field="name" header="Nome" sortable>
            <template #body="{ data }">
              <div class="patient-name">
                <i class="pi pi-user" />
                {{ data.name }}
              </div>
            </template>
          </Column>

          <Column field="email" header="Email" sortable>
            <template #body="{ data }">
              <a :href="`mailto:${data.email}`" class="email-link">
                {{ data.email }}
              </a>
            </template>
          </Column>

          <Column field="phone" header="Telefono" sortable>
            <template #body="{ data }">
              <span class="phone-number">{{ data.phone }}</span>
            </template>
          </Column>

          <Column field="date_of_birth" header="Data di Nascita" sortable>
            <template #body="{ data }">
              {{ formatDate(data.date_of_birth) }}
            </template>
          </Column>

          <Column header="Azioni" :exportable="false" style="min-width: 150px;">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  v-tooltip.top="'Visualizza'"
                  icon="pi pi-eye"
                  class="p-button-rounded p-button-text p-button-sm"
                  @click="viewPatient(data)"
                />
                <Button
                  v-tooltip.top="'Modifica'"
                  icon="pi pi-pencil"
                  class="p-button-rounded p-button-text p-button-sm"
                  @click="editPatient(data)"
                />
                <Button
                  v-tooltip.top="'Elimina'"
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-sm p-button-danger"
                  @click="confirmDeletePatient(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Patient Dialog -->
      <Dialog
        v-model:visible="patientDialogVisible"
        :modal="true"
        :header="dialogMode === 'create' ? 'Nuovo Paziente' : dialogMode === 'edit' ? 'Modifica Paziente' : 'Dettagli Paziente'"
        :style="{ width: '600px' }"
        :maximizable="false"
        :closable="true"
      >
        <PatientForm
          :patient="selectedPatient"
          :mode="dialogMode"
          @save="handleSavePatient"
          @cancel="closePatientDialog"
          @switch-mode="handleSwitchMode"
        />
      </Dialog>
    </div>
  </DashboardLayout>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { storeToRefs } from 'pinia'
import DashboardLayout from '../components/DashboardLayout.vue'
import PatientForm from '../components/PatientForm.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { usePatientsStore, useAppStore } from '../stores'

export default defineComponent({
  name: 'Patients',
  components: {
    DashboardLayout,
    PatientForm,
    DataTable,
    Column,
    InputText,
    Button,
    Dialog
  },
  setup() {
    const confirm = useConfirm()
    const patientsStore = usePatientsStore()
    const appStore = useAppStore()

    // Reactive refs from stores
    const { allPatients, pagination, filters } = storeToRefs(patientsStore)
    const { isLoading } = storeToRefs(appStore)

    const searchQuery = ref('')
    const patientDialogVisible = ref(false)
    const selectedPatient = ref(null)
    const dialogMode = ref('view') // 'view', 'edit', 'create'

    let searchTimeout = null

    const loadPatients = async () => {
      try {
        await patientsStore.fetchPatients()
      } catch (error) {
        console.error('Error loading patients:', error)
      }
    }

    const debouncedSearch = () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout)
      }
      searchTimeout = window.setTimeout(() => {
        patientsStore.setFilters({ search: searchQuery.value })
        loadPatients()
      }, 300)
    }

    const searchPatients = () => {
      patientsStore.setFilters({ search: searchQuery.value })
      loadPatients()
    }

    const onPageChange = (event) => {
      patientsStore.setPagination({
        page: event.page + 1,
        limit: event.rows
      })
      loadPatients()
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('it-IT')
    }

    const openNewPatientDialog = () => {
      selectedPatient.value = null
      dialogMode.value = 'create'
      patientDialogVisible.value = true
    }

    const viewPatient = (patient) => {
      selectedPatient.value = { ...patient }
      dialogMode.value = 'view'
      patientDialogVisible.value = true
    }

    const editPatient = (patient) => {
      selectedPatient.value = { ...patient }
      dialogMode.value = 'edit'
      patientDialogVisible.value = true
    }

    const confirmDeletePatient = (patient) => {
      confirm.require({
        message: `Sei sicuro di voler eliminare il paziente ${patient.name}?`,
        header: 'Conferma Eliminazione',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Elimina',
        rejectLabel: 'Annulla',
        accept: () => deletePatient(patient.id)
      })
    }

    const deletePatient = async (patientId) => {
      try {
        await patientsStore.deletePatient(patientId)
      } catch (error) {
        console.error('Error deleting patient:', error)
      }
    }

    const handleSavePatient = async (patientData) => {
      try {
        if (dialogMode.value === 'create') {
          await patientsStore.createPatient(patientData)
        } else if (dialogMode.value === 'edit') {
          await patientsStore.updatePatient(selectedPatient.value.id, patientData)
        }
        closePatientDialog()
      } catch (error) {
        console.error('Error saving patient:', error)
      }
    }

    const closePatientDialog = () => {
      patientDialogVisible.value = false
      selectedPatient.value = null
      dialogMode.value = 'view'
    }

    const handleSwitchMode = (newMode) => {
      dialogMode.value = newMode
    }

    // Watch for search query changes
    watch(searchQuery, (newValue) => {
      if (newValue !== filters.value.search) {
        debouncedSearch()
      }
    })

    onMounted(() => {
      loadPatients()
    })

    return {
      allPatients,
      pagination,
      isLoading,
      searchQuery,
      patientDialogVisible,
      selectedPatient,
      dialogMode,
      loadPatients,
      debouncedSearch,
      searchPatients,
      onPageChange,
      formatDate,
      openNewPatientDialog,
      viewPatient, editPatient,
      confirmDeletePatient,
      handleSavePatient,
      closePatientDialog,
      handleSwitchMode
    }
  }
})
</script>

<style scoped>
.patients-page {
  height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-section {
  flex: 1;
  max-width: 400px;
  display: flex;
}

.search-input {
  flex: 1;
}

.table-container {
  padding: 0;
  overflow: hidden;
}

.patients-table {
  border: none;
}

.patient-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.email-link {
  color: var(--primary-600);
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.phone-number {
  font-family: monospace;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-section {
    max-width: none;
  }

  .action-buttons {
    justify-content: center;
  }
}
</style>
