<template>
  <div class="appointment-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="form-field">
          <label class="field-label">Paziente *</label> <Select
            id="patient"
            v-model="formData.patient_id"
            :options="patientOptions"
            option-label="label"
            option-value="value"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.patient_id }"
            placeholder="Seleziona paziente"
            :filter="true"
            filter-placeholder="Cerca paziente..."
          />
          <small v-if="errors.patient_id" class="p-error">{{ errors.patient_id }}</small>
        </div>

        <div class="form-field">
          <label class="field-label">Medico *</label> <Select
            id="doctor"
            v-model="formData.doctor_id"
            :options="doctorOptions"
            option-label="label"
            option-value="value"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.doctor_id }"
            placeholder="Seleziona medico"
            :filter="true"
            filter-placeholder="Cerca medico..."
          />
          <small v-if="errors.doctor_id" class="p-error">{{ errors.doctor_id }}</small>
        </div>
        <div class="form-field">
          <label class="field-label">Prestazione *</label>
          <Select
            id="service"
            v-model="formData.service_id"
            :options="serviceOptions"
            option-label="label"
            option-value="value"
            :disabled="mode === 'view' || !formData.doctor_id"
            :class="{ 'p-invalid': errors.service_id }"
            placeholder="Seleziona prestazione"
            :filter="true"
            filter-placeholder="Cerca prestazione..."
          />
          <small v-if="errors.service_id" class="p-error">{{ errors.service_id }}</small>
          <small v-if="!formData.doctor_id" class="field-help">Seleziona prima un medico</small>
        </div>

        <div class="form-field">
          <label class="field-label">Data *</label>
          <DatePicker
            id="appointment_date"
            v-model="formData.appointment_date"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.appointment_date }"
            date-format="dd/mm/yy"
            :show-icon="true"
            placeholder="Seleziona data"
            :min-date="new Date()"
          />
          <small v-if="errors.appointment_date" class="p-error">{{ errors.appointment_date }}</small>
        </div>

        <div class="form-field">
          <label class="field-label">Orario *</label>
          <DatePicker
            id="appointment_time"
            v-model="formData.appointment_time"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.appointment_time }"
            time-only
            hour-format="24"
            placeholder="Seleziona orario"
            :show-icon="true"
          />
          <small v-if="errors.appointment_time" class="p-error">{{ errors.appointment_time }}</small>
        </div>

        <div class="form-field">
          <label class="field-label">Stato</label> <Select
            id="status"
            v-model="formData.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            :disabled="mode === 'view'"
            placeholder="Seleziona stato"
          />
        </div>

        <div class="form-field form-field-full">
          <label class="field-label">Note</label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            :disabled="mode === 'view'"
            rows="4"
            placeholder="Note sull'appuntamento..."
          />
        </div>

        <!-- Prestazione (solo in visualizzazione) -->
        <div v-if="mode === 'view' && appointment?.service_name" class="form-field">
          <label class="field-label">Prestazione</label>
          <InputText
            id="service_name"
            :value="`${appointment.service_name} - ${appointment.duration_minutes || 30}min - €${appointment.price || '0.00'}`"
            disabled
          />
          <small v-if="appointment.service_description" class="field-help">{{ appointment.service_description }}</small>
        </div>

        <!-- Codice appuntamento (solo in visualizzazione) -->
        <div v-if="mode === 'view' && appointment?.code" class="form-field">
          <label class="field-label">Codice Appuntamento</label>
          <InputText
            id="appointment_code"
            :value="appointment.code"
            disabled
            class="code-field"
          />
        </div>
      </div>

      <!-- Appointment Details (if viewing) -->
      <div v-if="mode === 'view' && appointment" class="appointment-details">
        <Divider />
        <h4>Dettagli Appuntamento</h4>
        <div class="details-grid">
          <div class="detail-item">
            <label>ID Appuntamento:</label>
            <span>#{{ appointment.id }}</span>
          </div>
          <div class="detail-item">
            <label>Creato il:</label>
            <span>{{ formatDateTime(appointment.created_at) }}</span>
          </div>
          <div v-if="appointment.updated_at !== appointment.created_at" class="detail-item">
            <label>Ultima modifica:</label>
            <span>{{ formatDateTime(appointment.updated_at) }}</span>
          </div>
          <div class="detail-item">
            <label>Telefono paziente:</label>
            <span>{{ appointment.patient_phone || 'Non disponibile' }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="form-actions">
        <Button
          label="Annulla"
          icon="pi pi-times"
          class="p-button-text"
          type="button"
          @click="$emit('cancel')"
        />

        <div class="action-buttons-right">
          <Button
            v-if="mode === 'view'"
            label="Modifica"
            icon="pi pi-pencil"
            type="button"
            @click="switchToEditMode"
          />
          <Button
            v-if="mode === 'view' && appointment"
            label="Elimina"
            icon="pi pi-trash"
            class="p-button-danger"
            type="button"
            @click="confirmDelete"
          />
          <Button
            v-if="mode !== 'view'"
            :label="mode === 'create' ? 'Crea Appuntamento' : 'Salva Modifiche'"
            :icon="mode === 'create' ? 'pi pi-plus' : 'pi pi-check'"
            type="submit"
            :loading="loading"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useServicesStore } from '../stores/services'

export default defineComponent({
  name: 'AppointmentForm',
  components: {
    Select,
    DatePicker,
    Textarea,
    InputText,
    Button,
    Divider
  },
  props: {
    appointment: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'view',
      validator: (value) => ['view', 'edit', 'create'].includes(value)
    },
    doctors: {
      type: Array,
      default: () => []
    },
    patients: {
      type: Array,
      default: () => []
    },
    preselectedDate: {
      type: String,
      default: null
    },
    preselectedHour: {
      type: Number,
      default: null
    }
  },
  emits: ['save', 'cancel', 'delete', 'switch-mode'],
  setup(props, { emit }) {
    const confirm = useConfirm()
    const servicesStore = useServicesStore()
    const loading = ref(false)
    const errors = ref({})

    const statusOptions = [
      { label: 'Programmato', value: 'scheduled' },
      { label: 'Confermato', value: 'confirmed' },
      { label: 'Annullato', value: 'cancelled' },
      { label: 'Completato', value: 'completed' }
    ]

    const formData = ref({
      patient_id: null,
      doctor_id: null,
      service_id: null,
      appointment_date: null,
      appointment_time: null,
      status: 'scheduled',
      notes: ''
    })

    const patientOptions = computed(() =>      props.patients.map(patient => ({
        label: `${patient.name} - ${patient.email}`,
        value: patient.id
      }))
    )

    const services = ref([])
    const loadingServices = ref(false)

    const serviceOptions = computed(() =>
      services.value.map(service => ({
        label: `${service.name} - ${service.duration_minutes}min - €${service.price}`,
        value: service.id
      }))
    )

    // Load services when doctor changes
    const loadServices = async (doctorId) => {
      if (!doctorId) {
        services.value = []
        formData.value.service_id = null
        return
      }      
      loadingServices.value = true
      try {
        console.log('Loading services for doctor:', doctorId)
        const doctorServices = await servicesStore.fetchServicesByDoctor(doctorId)
        console.log('Loaded services:', doctorServices)
        services.value = doctorServices || []
      } catch (error) {
        console.error('Error loading services:', error)
        services.value = []
      } finally {
        loadingServices.value = false
      }
    }

    // Watch doctor changes
    watch(() => formData.value.doctor_id, (newDoctorId) => {
      loadServices(newDoctorId)
    })

    const doctorOptions = computed(() =>
      props.doctors.map(doctor => ({
        label: `Dr. ${doctor.name} - ${doctor.specialization}`,
        value: doctor.id
      }))
    )

    // Watch for appointment changes
    watch(() => props.appointment, (newAppointment) => {
      if (newAppointment) {
        const appointmentDate = new Date(newAppointment.appointment_date)

        formData.value = {
          patient_id: newAppointment.patient_id,
          doctor_id: newAppointment.doctor_id,
          service_id: newAppointment.service_id,
          appointment_date: appointmentDate,
          appointment_time: appointmentDate,
          status: newAppointment.status || 'scheduled',
          notes: newAppointment.notes || ''
        }
        // Load services for the doctor
        if (newAppointment.doctor_id) {
          loadServices(newAppointment.doctor_id)
        }
      } else {
        // Reset form for new appointment
        const now = new Date()
        let appointmentDate = now
        let appointmentTime = now

        // Handle preselected date and hour
        if (props.preselectedDate) {
          appointmentDate = new Date(props.preselectedDate)
        }

        if (props.preselectedHour !== null) {
          appointmentTime = new Date()
          appointmentTime.setHours(props.preselectedHour, 0, 0, 0)

          if (props.preselectedDate) {
            appointmentDate.setHours(props.preselectedHour, 0, 0, 0)
          }
        } formData.value = {
          patient_id: null,
          doctor_id: null,
          service_id: null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'scheduled',
          notes: ''
        }
      }
      errors.value = {}
    }, { immediate: true })

    const validateForm = () => {
      errors.value = {}

      if (!formData.value.patient_id) {
        errors.value.patient_id = 'Il paziente è obbligatorio'
      }
      
      if (!formData.value.doctor_id) {
        errors.value.doctor_id = 'Il medico è obbligatorio'
      }

      if (!formData.value.service_id) {
        errors.value.service_id = 'La prestazione è obbligatoria'
      }

      if (!formData.value.appointment_date) {
        errors.value.appointment_date = 'La data è obbligatoria'
      }

      if (!formData.value.appointment_time) {
        errors.value.appointment_time = 'L\'orario è obbligatorio'
      }

      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }      try {
        loading.value = true
        
        // Combine date and time
        const appointmentDateTime = new Date(formData.value.appointment_date)
        const timeComponent = new Date(formData.value.appointment_time)

        appointmentDateTime.setHours(
          timeComponent.getHours(),
          timeComponent.getMinutes(),
          0,
          0
        )

        const submitData = {
          patient_id: formData.value.patient_id,
          doctor_id: formData.value.doctor_id,
          service_id: formData.value.service_id,
          appointment_date: appointmentDateTime.toISOString(),
          status: formData.value.status,
          notes: formData.value.notes
        }

        emit('save', submitData)
      } catch (error) {
        console.error('Error in form submission:', error)
      } finally {
        loading.value = false
      }
    }

    const switchToEditMode = () => {
      emit('switch-mode', 'edit')
    }

    const confirmDelete = () => {
      confirm.require({
        message: 'Sei sicuro di voler eliminare questo appuntamento?',
        header: 'Conferma Eliminazione',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Elimina',
        rejectLabel: 'Annulla',
        accept: () => emit('delete', props.appointment.id)
      })
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      formData,
      errors,
      loading,
      statusOptions,
      patientOptions,
      doctorOptions,
      serviceOptions,
      services,
      loadingServices,
      handleSubmit,
      switchToEditMode,
      confirmDelete,
      formatDateTime
    }
  }
})
</script>

<style scoped>
.appointment-form {
  padding: 1rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 1rem;
  margin-bottom: 2rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field-full {
  grid-column: 1 / -1;
}

.field-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.appointment-details {
  margin-top: 1.5rem;
}

.appointment-details h4 {
  margin: 1rem 0;
  color: var(--text-color);
  font-size: 1.125rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.detail-item span {
  color: var(--text-color);
  font-weight: 500;
}

.appointment-code {
  background: var(--primary-100) !important;
  color: var(--primary-700) !important;
  font-family: monospace;
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
}

.code-field {
  background: var(--primary-50) !important;
  color: var(--primary-700) !important;
  font-family: monospace;
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
  border: 2px solid var(--primary-200) !important;
}

.field-help {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--surface-200);
}

.action-buttons-right {
  display: flex;
  gap: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .action-buttons-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .form-actions .p-button {
    width: 100%;
  }

  .action-buttons-right .p-button {
    flex: 1;
    min-width: 120px;
  }
}
</style>
