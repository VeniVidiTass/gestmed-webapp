<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="`Aggiungi Log - ${appointmentTitle}`"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
  >
    <form @submit.prevent="handleSubmit" class="log-form">
      <div class="form-group">
        <label for="title" class="form-label">Titolo *</label>
        <InputText
          id="title"
          v-model="formData.title"
          placeholder="Inserisci il titolo del log"
          :class="{ 'p-invalid': errors.title }"
          class="form-input"
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>

      <div class="form-group">
        <label for="description" class="form-label">Descrizione *</label>
        <Textarea
          id="description"
          v-model="formData.description"
          placeholder="Inserisci la descrizione del log"
          :class="{ 'p-invalid': errors.description }"
          class="form-input"
          rows="4"
          auto-resize
        />
        <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
      </div>

      <div class="form-actions">
        <Button
          label="Annulla"
          icon="pi pi-times"
          class="p-button-text"
          @click="handleCancel"
          type="button"
        />
        <Button
          label="Salva Log"
          icon="pi pi-save"
          type="submit"
          :loading="loading"
          class="p-button-primary"
        />
      </div>
    </form>
  </Dialog>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

export default defineComponent({
  name: 'AliveLogForm',
  components: {
    Dialog,
    InputText,
    Textarea,
    Button
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    appointmentId: {
      type: Number,
      default: null
    },
    appointmentTitle: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'submit', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      title: '',
      description: ''
    })

    const errors = ref({
      title: '',
      description: ''
    })

    const validateForm = () => {
      errors.value = {
        title: '',
        description: ''
      }

      let isValid = true

      if (!formData.value.title.trim()) {
        errors.value.title = 'Il titolo è obbligatorio'
        isValid = false
      }

      if (!formData.value.description.trim()) {
        errors.value.description = 'La descrizione è obbligatoria'
        isValid = false
      }

      return isValid
    }

    const handleSubmit = () => {
      if (validateForm()) {
        emit('submit', {
          appointmentId: props.appointmentId,
          title: formData.value.title.trim(),
          description: formData.value.description.trim()
        })
      }
    }

    const handleCancel = () => {
      resetForm()
      emit('cancel')
    }

    const resetForm = () => {
      formData.value = {
        title: '',
        description: ''
      }
      errors.value = {
        title: '',
        description: ''
      }
    }

    // Reset form when dialog becomes visible
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        resetForm()
      }
    })

    return {
      formData,
      errors,
      handleSubmit,
      handleCancel,
      resetForm
    }
  }
})
</script>

<style scoped>
.log-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-200);
}

.p-error {
  color: var(--red-500);
  font-size: 0.75rem;
}
</style>
