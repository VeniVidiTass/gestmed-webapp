<template>
  <DashboardLayout>
    <div class="doctors-page">
      <!-- Header with search and add button -->
      <div class="page-header">
        <div class="search-section">
          <div class="p-inputgroup">
            <InputText 
              v-model="searchQuery" 
              placeholder="Cerca medici per nome, specializzazione o email..."
              @input="debouncedSearch"
              class="search-input"
            />
            <Button 
              icon="pi pi-search" 
              class="p-button-primary"
              @click="searchDoctors"
            />
          </div>
        </div>
        <Button 
          label="Nuovo Medico" 
          icon="pi pi-plus"
          class="p-button-primary"
          @click="openNewDoctorDialog"
        />
      </div>

      <!-- Doctors Table -->
      <div class="table-container custom-card">
        <DataTable 
          :value="doctors" 
          :loading="loading"
          paginator 
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          responsiveLayout="scroll"
          emptyMessage="Nessun medico trovato"
          class="doctors-table"
        >
          <Column field="name" header="Nome" sortable>
            <template #body="{ data }">
              <div class="doctor-name">
                <i class="pi pi-user-plus"></i>
                Dr. {{ data.name }}
              </div>
            </template>
          </Column>
          
          <Column field="specialization" header="Specializzazione" sortable>
            <template #body="{ data }">
              <Tag :value="data.specialization" class="specialization-tag" />
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
          
          <Column field="license_number" header="Numero Licenza" sortable>
            <template #body="{ data }">
              <code class="license-code">{{ data.license_number }}</code>
            </template>
          </Column>
          
          <Column header="Disponibilità" style="min-width: 120px;">
            <template #body="{ data }">
              <Button 
                icon="pi pi-calendar" 
                class="p-button-rounded p-button-text p-button-sm"
                @click="viewAvailability(data)"
                v-tooltip.top="'Visualizza Disponibilità'"
              />
            </template>
          </Column>
          
          <Column header="Azioni" :exportable="false" style="min-width: 150px;">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-rounded p-button-text p-button-sm"
                  @click="viewDoctor(data)"
                  v-tooltip.top="'Visualizza'"
                />
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-rounded p-button-text p-button-sm"
                  @click="editDoctor(data)"
                  v-tooltip.top="'Modifica'"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-rounded p-button-text p-button-sm p-button-danger"
                  @click="confirmDeleteDoctor(data)"
                  v-tooltip.top="'Elimina'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Doctor Dialog -->
      <Dialog 
        v-model:visible="doctorDialogVisible" 
        :modal="true"
        :header="dialogMode === 'create' ? 'Nuovo Medico' : dialogMode === 'edit' ? 'Modifica Medico' : 'Dettagli Medico'"
        :style="{ width: '700px' }"
        :maximizable="false"
        :closable="true"
      >
        <DoctorForm 
          :doctor="selectedDoctor"
          :mode="dialogMode"
          @save="handleSaveDoctor"
          @cancel="closeDoctorDialog"
        />
      </Dialog>

      <!-- Availability Dialog -->
      <Dialog 
        v-model:visible="availabilityDialogVisible" 
        :modal="true"
        header="Disponibilità Medico"
        :style="{ width: '500px' }"
        :maximizable="false"
        :closable="true"
      >
        <AvailabilityView :doctor="selectedDoctor" />
      </Dialog>
    </div>
  </DashboardLayout>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DashboardLayout from '../components/DashboardLayout.vue'
import DoctorForm from '../components/DoctorForm.vue'
import AvailabilityView from '../components/AvailabilityView.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { apiService } from '../services/api.js'

export default defineComponent({
  name: 'Doctors',
  components: {
    DashboardLayout,
    DoctorForm,
    AvailabilityView,
    DataTable,
    Column,
    InputText,
    Button,
    Dialog,
    Tag
  },
  setup() {
    const toast = useToast()
    const confirm = useConfirm()
    
    const doctors = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const doctorDialogVisible = ref(false)
    const availabilityDialogVisible = ref(false)
    const selectedDoctor = ref(null)
    const dialogMode = ref('view') // 'view', 'edit', 'create'
    
    let searchTimeout = null
    
    const loadDoctors = async (search = '') => {
      try {
        loading.value = true
        const params = search ? { search } : {}
        const data = await apiService.getDoctors(params)
        doctors.value = data
      } catch (error) {
        console.error('Error loading doctors:', error)
        toast.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore nel caricamento dei medici',
          life: 3000
        })
      } finally {
        loading.value = false
      }
    }
    
    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        loadDoctors(searchQuery.value)
      }, 300)
    }
    
    const searchDoctors = () => {
      loadDoctors(searchQuery.value)
    }
    
    const openNewDoctorDialog = () => {
      selectedDoctor.value = null
      dialogMode.value = 'create'
      doctorDialogVisible.value = true
    }
    
    const viewDoctor = (doctor) => {
      selectedDoctor.value = { ...doctor }
      dialogMode.value = 'view'
      doctorDialogVisible.value = true
    }
    
    const editDoctor = (doctor) => {
      selectedDoctor.value = { ...doctor }
      dialogMode.value = 'edit'
      doctorDialogVisible.value = true
    }
    
    const viewAvailability = (doctor) => {
      selectedDoctor.value = { ...doctor }
      availabilityDialogVisible.value = true
    }
    
    const confirmDeleteDoctor = (doctor) => {
      confirm.require({
        message: `Sei sicuro di voler eliminare il medico Dr. ${doctor.name}?`,
        header: 'Conferma Eliminazione',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Elimina',
        rejectLabel: 'Annulla',
        accept: () => deleteDoctor(doctor.id)
      })
    }
    
    const deleteDoctor = async (doctorId) => {
      try {
        await apiService.deleteDoctor(doctorId)
        doctors.value = doctors.value.filter(d => d.id !== doctorId)
        toast.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Medico eliminato con successo',
          life: 3000
        })
      } catch (error) {
        console.error('Error deleting doctor:', error)
        toast.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore nell\'eliminazione del medico',
          life: 3000
        })
      }
    }
    
    const handleSaveDoctor = async (doctorData) => {
      try {
        if (dialogMode.value === 'create') {
          const newDoctor = await apiService.createDoctor(doctorData)
          doctors.value.unshift(newDoctor)
          toast.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Medico creato con successo',
            life: 3000
          })
        } else if (dialogMode.value === 'edit') {
          const updatedDoctor = await apiService.updateDoctor(selectedDoctor.value.id, doctorData)
          const index = doctors.value.findIndex(d => d.id === selectedDoctor.value.id)
          if (index !== -1) {
            doctors.value[index] = updatedDoctor
          }
          toast.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Medico aggiornato con successo',
            life: 3000
          })
        }
        closeDoctorDialog()
      } catch (error) {
        console.error('Error saving doctor:', error)
        toast.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore nel salvataggio del medico',
          life: 3000
        })
      }
    }
    
    const closeDoctorDialog = () => {
      doctorDialogVisible.value = false
      selectedDoctor.value = null
      dialogMode.value = 'view'
    }
    
    onMounted(() => {
      loadDoctors()
    })
    
    return {
      doctors,
      loading,
      searchQuery,
      doctorDialogVisible,
      availabilityDialogVisible,
      selectedDoctor,
      dialogMode,
      loadDoctors,
      debouncedSearch,
      searchDoctors,
      openNewDoctorDialog,
      viewDoctor,
      editDoctor,
      viewAvailability,
      confirmDeleteDoctor,
      handleSaveDoctor,
      closeDoctorDialog
    }
  }
})
</script>

<style scoped>
.doctors-page {
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
}

.search-input {
  flex: 1;
}

.table-container {
  padding: 0;
  overflow: hidden;
}

.doctors-table {
  border: none;
}

.doctor-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.specialization-tag {
  background-color: var(--primary-100);
  color: var(--primary-700);
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

.license-code {
  font-family: monospace;
  background-color: var(--surface-100);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
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
