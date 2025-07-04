<template>
  <div class="patient-form">
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
          <label for="codice_fiscale" class="field-label">Codice Fiscale *</label>
          <InputText
            id="codice_fiscale"
            v-model="formData.codice_fiscale"
            :disabled="mode === 'view'"
            :class="{ 'p-invalid': errors.codice_fiscale }"
            placeholder="RSSMRA80E15F205X"
            style="text-transform: uppercase"
            maxlength="16"
          />
          <small v-if="errors.codice_fiscale" class="p-error">{{ errors.codice_fiscale }}</small>
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
          <label for="date_of_birth" class="field-label">Data di Nascita</label>
          <DatePicker
            id="date_of_birth"
            v-model="formData.date_of_birth"
            :disabled="mode === 'view'"
            date-format="dd/mm/yy"
            :show-icon="true"
            placeholder="gg/mm/aaaa"
            :max-date="new Date()"
          />
        </div>

        <div class="form-field form-field-full">
          <label for="address" class="field-label">Indirizzo</label>
          <Textarea
            id="address"
            v-model="formData.address"
            :disabled="mode === 'view'"
            rows="3"
            placeholder="Inserisci indirizzo completo"
          />
        </div>

        <div class="form-field form-field-full">
          <label for="medical_history" class="field-label">Storia Medica</label>
          <Textarea
            id="medical_history"
            v-model="formData.medical_history"
            :disabled="mode === 'view'"
            rows="4"
            placeholder="Note mediche, allergie, patologie croniche..."
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="form-actions">
        <Button
          v-if="mode !== 'view'"
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
          :label="mode === 'create' ? 'Crea Paziente' : 'Salva Modifiche'"
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
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'

export default defineComponent({
  name: 'PatientForm',
  components: {
    InputText,
    Textarea,
    DatePicker,
    Button
  },
  props: {
    patient: {
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

    const formData = ref({
      name: '',
      email: '',
      codice_fiscale: '',
      phone: '',
      date_of_birth: null,
      address: '',
      medical_history: ''
    })

    // Watch for patient changes
    watch(() => props.patient, (newPatient) => {
      if (newPatient) {
        formData.value = {
          name: newPatient.name || '',
          email: newPatient.email || '',
          codice_fiscale: newPatient.codice_fiscale || '',
          phone: newPatient.phone || '',
          date_of_birth: newPatient.date_of_birth ? new Date(newPatient.date_of_birth) : null,
          address: newPatient.address || '',
          medical_history: newPatient.medical_history || ''
        }
      } else {
        // Reset form for new patient
        formData.value = {
          name: '',
          email: '',
          codice_fiscale: '',
          phone: '',
          date_of_birth: null,
          address: '',
          medical_history: ''
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

      if (!formData.value.codice_fiscale.trim()) {
        errors.value.codice_fiscale = 'Il codice fiscale è obbligatorio'
      } else {
        const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/
        if (!cfRegex.test(formData.value.codice_fiscale.toUpperCase())) {
          errors.value.codice_fiscale = 'Formato codice fiscale non valido'
        }
      }

      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        loading.value = true

        const submitData = {
          ...formData.value,
          codice_fiscale: formData.value.codice_fiscale.toUpperCase(),
          date_of_birth: formData.value.date_of_birth ?
            formData.value.date_of_birth.toISOString().split('T')[0] : null
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
      handleSubmit,
      switchToEditMode
    }
  }
})
</script>

<style scoped>
.patient-form {
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

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .form-actions .p-button {
    width: 100%;
  }
}
</style>
