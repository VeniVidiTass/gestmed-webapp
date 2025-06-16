<template>
  <div class="doctor-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="form-field">
          <label for="name" class="field-label">Nome Completo *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.name }"
            placeholder="Inserisci nome completo"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>

        <div class="form-field">
          <label for="email" class="field-label">Email *</label>
          <InputText
            id="email"
            v-model="formData.email"
            type="email"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.email }"
            placeholder="nome@email.com"
          />
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
        </div>

        <div class="form-field">
          <label for="phone" class="field-label">Telefono</label>
          <InputText
            id="phone"
            v-model="formData.phone"
            :disabled="mode === 'view'"
            placeholder="+39 123 456 7890"
          />
        </div>

        <div class="form-field">
          <label for="license_number" class="field-label">Numero Licenza *</label>
          <InputText
            id="license_number"
            v-model="formData.license_number"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.license_number }"
            placeholder="LIC001234"
          />
          <small v-if="errors.license_number" class="p-error">{{ errors.license_number }}</small>
        </div>

        <div class="form-field form-field-full">
          <label for="specialization" class="field-label">Specializzazione *</label> <Select
            id="specialization"
            v-model="formData.specialization"
            :options="specializations"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.specialization }"
            placeholder="Seleziona specializzazione"
            :editable="true"
          />
          <small v-if="errors.specialization" class="p-error">{{ errors.specialization }}</small>
        </div>

        <div class="form-field form-field-full">
          <label class="field-label">Disponibilità Settimanale</label>
          <div class="availability-grid">
            <div v-for="day in daysOfWeek" :key="day.value" class="availability-day">
              <div class="day-header">
                <Checkbox
                  :id="`${day.value}_enabled`"
                  v-model="formData.availability[day.value].enabled"
                  :disabled="mode === 'view'"
                  :binary="true"
                />
                <label :for="`${day.value}_enabled`" class="day-label">{{ day.label }}</label>
              </div>
              <div v-if="formData.availability[day.value].enabled" class="time-inputs">
                <div class="time-input-group">
                  <label class="time-label">Dalle:</label>
                  <DatePicker
                    v-model="formData.availability[day.value].start"
                    :disabled="mode === 'view'"
                    time-only
                    hour-format="24"
                    placeholder="09:00"
                  />
                </div>
                <div class="time-input-group">
                  <label class="time-label">Alle:</label>
                  <DatePicker
                    v-model="formData.availability[day.value].end"
                    :disabled="mode === 'view'"
                    time-only
                    hour-format="24"
                    placeholder="17:00"
                  />
                </div>
              </div>
            </div>
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
        <Button
          v-if="mode === 'view'"
          label="Modifica"
          icon="pi pi-pencil"
          type="button"
          @click="switchToEditMode"
        />
        <Button
          v-if="mode !== 'view'"
          :label="mode === 'create' ? 'Crea Medico' : 'Salva Modifiche'"
          :icon="mode === 'create' ? 'pi pi-plus' : 'pi pi-check'"
          type="submit"
          :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'

export default defineComponent({
  name: 'DoctorForm', components: {
    InputText,
    Select,
    DatePicker,
    Checkbox,
    Button
  },
  props: {
    doctor: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'view',
      validator: (value) => ['view', 'edit', 'create'].includes(value)
    }
  },
  emits: ['save', 'cancel', 'switch-mode'],
  setup(props, { emit }) {
    const loading = ref(false)
    const errors = ref({})

    const specializations = [
      'Cardiologia',
      'Dermatologia',
      'Endocrinologia',
      'Gastroenterologia',
      'Medicina Generale',
      'Neurologia',
      'Ortopedia',
      'Pediatria',
      'Pneumologia',
      'Psichiatria',
      'Radiologia',
      'Urologia'
    ]

    const daysOfWeek = [
      { value: 'monday', label: 'Lunedì' },
      { value: 'tuesday', label: 'Martedì' },
      { value: 'wednesday', label: 'Mercoledì' },
      { value: 'thursday', label: 'Giovedì' },
      { value: 'friday', label: 'Venerdì' },
      { value: 'saturday', label: 'Sabato' },
      { value: 'sunday', label: 'Domenica' }
    ]

    const createDefaultAvailability = () => {
      const availability = {}
      daysOfWeek.forEach(day => {
        availability[day.value] = {
          enabled: false,
          start: null,
          end: null
        }
      })
      return availability
    }

    const formData = ref({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      license_number: '',
      availability: createDefaultAvailability()
    })

    const parseTimeString = (timeStr) => {
      if (!timeStr) return null
      const [hours, minutes] = timeStr.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      return date
    }

    const formatTimeToString = (date) => {
      if (!date) return null
      return date.toTimeString().slice(0, 5)
    }

    // Watch for doctor changes
    watch(() => props.doctor, (newDoctor) => {
      if (newDoctor) {
        const availability = createDefaultAvailability()

        // Parse existing availability
        if (newDoctor.availability && typeof newDoctor.availability === 'object') {
          Object.keys(newDoctor.availability).forEach(day => {
            if (availability[day]) {
              const dayAvailability = newDoctor.availability[day]
              if (typeof dayAvailability === 'string') {
                // Format: "09:00-17:00"
                const [start, end] = dayAvailability.split('-')
                availability[day] = {
                  enabled: true,
                  start: parseTimeString(start),
                  end: parseTimeString(end)
                }
              } else if (dayAvailability && dayAvailability.start && dayAvailability.end) {
                availability[day] = {
                  enabled: true,
                  start: parseTimeString(dayAvailability.start),
                  end: parseTimeString(dayAvailability.end)
                }
              }
            }
          })
        }

        formData.value = {
          name: newDoctor.name || '',
          email: newDoctor.email || '',
          phone: newDoctor.phone || '',
          specialization: newDoctor.specialization || '',
          license_number: newDoctor.license_number || '',
          availability
        }
      } else {
        // Reset form for new doctor
        formData.value = {
          name: '',
          email: '',
          phone: '',
          specialization: '',
          license_number: '',
          availability: createDefaultAvailability()
        }
      }
      errors.value = {}
    }, { immediate: true })

    const validateForm = () => {
      errors.value = {}

      if (!formData.value.name.trim()) {
        errors.value.name = 'Il nome è obbligatorio'
      }

      if (!formData.value.email.trim()) {
        errors.value.email = 'L\'email è obbligatoria'
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.value.email)) {
          errors.value.email = 'Formato email non valido'
        }
      }

      if (!formData.value.specialization.trim()) {
        errors.value.specialization = 'La specializzazione è obbligatoria'
      }

      if (!formData.value.license_number.trim()) {
        errors.value.license_number = 'Il numero di licenza è obbligatorio'
      }

      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        loading.value = true

        // Convert availability to the expected format
        const availability = {}
        Object.keys(formData.value.availability).forEach(day => {
          const dayData = formData.value.availability[day]
          if (dayData.enabled && dayData.start && dayData.end) {
            availability[day] = `${formatTimeToString(dayData.start)}-${formatTimeToString(dayData.end)}`
          }
        })

        const submitData = {
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
          specialization: formData.value.specialization,
          license_number: formData.value.license_number,
          availability: JSON.stringify(availability)
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

    return {
      formData,
      errors,
      loading,
      specializations,
      daysOfWeek,
      handleSubmit,
      switchToEditMode
    }
  }
})
</script>

<style scoped>
.doctor-form {
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

.availability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.availability-day {
  padding: 1rem;
  border: 1px solid var(--surface-200);
  border-radius: 6px;
  background-color: var(--surface-50);
}

.day-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.day-label {
  font-weight: 600;
  color: var(--text-color);
}

.time-inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.time-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--surface-200);
}

/* Responsive design */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .availability-grid {
    grid-template-columns: 1fr;
  }

  .time-inputs {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .form-actions .p-button {
    width: 100%;
  }
}
</style>
