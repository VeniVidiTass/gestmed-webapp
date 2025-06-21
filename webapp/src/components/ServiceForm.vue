<template>
    <Dialog :visible="visible" :header="isEdit ? 'Modifica Servizio' : 'Nuovo Servizio'" modal
        :style="{ width: '600px' }" class="service-form-dialog" @update:visible="emit('update:visible', $event)"
        @hide="onDialogHide">
        <form class="service-form" @submit.prevent="handleSubmit">
            <!-- Nome del servizio -->
            <div class="form-group">
                <label for="service-name" class="required">Nome Servizio</label>
                <InputText id="service-name" v-model="formData.name" :class="{ 'p-invalid': errors.name }"
                    placeholder="Inserisci il nome del servizio" maxlength="255" required />
                <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>

            <!-- Descrizione -->
            <div class="form-group">
                <label for="service-description">Descrizione</label>
                <Textarea id="service-description" v-model="formData.description"
                    :class="{ 'p-invalid': errors.description }" placeholder="Descrizione del servizio" rows="3"
                    maxlength="500" />
                <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
            </div>

            <!-- Durata e Prezzo -->
            <div class="form-row">
                <div class="form-group">
                    <label for="service-duration" class="required">Durata (minuti)</label>
                    <InputNumber id="service-duration" v-model="formData.duration_minutes"
                        :class="{ 'p-invalid': errors.duration_minutes }" :min="5" :max="480" placeholder="30"
                        suffix=" min" :step="5" required />
                    <small v-if="errors.duration_minutes" class="p-error">{{ errors.duration_minutes }}</small>
                </div>

                <div class="form-group">
                    <label for="service-price" class="required">Prezzo (€)</label>
                    <InputNumber id="service-price" v-model="formData.price" :class="{ 'p-invalid': errors.price }"
                        :min="0" :max="9999.99" :min-fraction-digits="2" :max-fraction-digits="2" placeholder="0.00"
                        prefix="€ " required />
                    <small v-if="errors.price" class="p-error">{{ errors.price }}</small>
                </div>
            </div> <!-- Medico -->
            <div class="form-group">
                <label for="service-doctor" class="required">Medico</label>
                <Select id="service-doctor" v-model="formData.doctor_id" :options="doctors" option-label="name"
                    option-value="id" :class="{ 'p-invalid': errors.doctor_id }" placeholder="Seleziona un medico"
                    :loading="doctorsLoading" required>
                    <template #option="{ option }">
                        <div class="doctor-option">
                            <i class="pi pi-user-plus" />
                            <span>Dr. {{ option.name }}</span>
                            <small class="specialization">{{ option.specialization }}</small>
                        </div>
                    </template>
                </Select>
                <small v-if="errors.doctor_id" class="p-error">{{ errors.doctor_id }}</small>
            </div> <!-- Stato attivo -->
            <div v-if="isEdit" class="form-group">
                <div class="form-check">
                    <Checkbox id="service-active" v-model="formData.is_active" binary />
                    <label for="service-active" class="checkbox-label">Servizio attivo</label>
                </div>
                <small class="help-text">
                    I servizi disattivati non saranno disponibili per nuovi appuntamenti
                </small>
            </div>

            <!-- Prenotabilità esterna -->
            <div class="form-group">
                <div class="form-check">
                    <Checkbox id="service-external-bookable" v-model="formData.is_external_bookable" binary />
                    <label for="service-external-bookable" class="checkbox-label">Prenotabile da utenti esterni</label>
                </div>
                <small class="help-text">
                    Se attivato, il servizio sarà disponibile per la prenotazione autonoma da parte di utenti esterni
                    alla struttura
                </small>
            </div>
        </form>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Annulla" icon="pi pi-times" class="p-button-text" :disabled="isLoading"
                    @click="onCancel" />
                <Button :label="isEdit ? 'Aggiorna' : 'Crea'" :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'"
                    class="p-button-primary" :loading="isLoading" :disabled="!isFormValid" @click="handleSubmit" />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDoctorsStore } from '../stores/doctors'
import { useServicesStore } from '../stores/services'
import { useLoading } from '../composables/useLoading'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'

// Props & Emits
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    service: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:visible', 'saved'])

// Stores
const doctorsStore = useDoctorsStore()
const servicesStore = useServicesStore()
const { isLoading, setLoading } = useLoading()

// State
const formData = ref({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0.00,
    doctor_id: null,
    is_active: true,
    is_external_bookable: false
})

const errors = ref({})
const doctors = ref([])
const doctorsLoading = ref(false)

// Computed
const isEdit = computed(() => !!props.service?.id)

const isFormValid = computed(() => {
    return formData.value.name &&
        formData.value.duration_minutes > 0 &&
        formData.value.price >= 0 &&
        formData.value.doctor_id &&
        Object.keys(errors.value).length === 0
})

// Methods
function resetForm() {
    formData.value = {
        name: '',
        description: '',
        duration_minutes: 30,
        price: 0.00,
        doctor_id: null,
        is_active: true,
        is_external_bookable: false
    }
    errors.value = {}
}

function loadFormData() {
    if (props.service) {
        formData.value = {
            name: props.service.name || '',
            description: props.service.description || '',
            duration_minutes: props.service.duration_minutes || 30,
            price: parseFloat(props.service.price) || 0.00,
            doctor_id: props.service.doctor_id || null,
            is_active: props.service.is_active !== undefined ? props.service.is_active : true,
            is_external_bookable: props.service.is_external_bookable !== undefined ? props.service.is_external_bookable : false
        }
    } else {
        resetForm()
    }
}

function validateForm() {
    errors.value = {}

    if (!formData.value.name?.trim()) {
        errors.value.name = 'Il nome del servizio è obbligatorio'
    } else if (formData.value.name.length > 255) {
        errors.value.name = 'Il nome non può superare i 255 caratteri'
    }

    if (formData.value.description && formData.value.description.length > 500) {
        errors.value.description = 'La descrizione non può superare i 500 caratteri'
    }

    if (!formData.value.duration_minutes || formData.value.duration_minutes < 5) {
        errors.value.duration_minutes = 'La durata deve essere almeno 5 minuti'
    } else if (formData.value.duration_minutes > 480) {
        errors.value.duration_minutes = 'La durata non può superare 8 ore (480 minuti)'
    }

    if (formData.value.price < 0) {
        errors.value.price = 'Il prezzo non può essere negativo'
    } else if (formData.value.price > 9999.99) {
        errors.value.price = 'Il prezzo non può superare €9999.99'
    }

    if (!formData.value.doctor_id) {
        errors.value.doctor_id = 'Il medico è obbligatorio'
    }

    return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
    if (!validateForm()) {
        return
    } try {
        setLoading(true);

        const serviceData = {
            name: formData.value.name.trim(),
            description: formData.value.description?.trim() || '',
            duration_minutes: formData.value.duration_minutes,
            price: formData.value.price,
            doctor_id: formData.value.doctor_id,
            is_active: formData.value.is_active,
            is_external_bookable: formData.value.is_external_bookable
        }

        if (isEdit.value) {
            await servicesStore.updateService(props.service.id, serviceData)
        } else {
            await servicesStore.createService(serviceData)
        }

        emit('saved')
        onCancel()
    } catch (error) {
        console.error('Error saving service:', error)
    } finally {
        setLoading(false)
    }
}

function onCancel() {
    emit('update:visible', false)
}

function onDialogHide() {
    window.setTimeout(() => {
        resetForm()
    }, 300)
}

async function loadDoctors() {
    try {
        doctorsLoading.value = true
        await doctorsStore.fetchDoctors()
        doctors.value = doctorsStore.allDoctors
    } catch (error) {
        console.error('Error loading doctors:', error)
    } finally {
        doctorsLoading.value = false
    }
}

// Watchers
watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadFormData()
        if (doctors.value.length === 0) {
            loadDoctors()
        }
    }
})

watch(() => props.service, () => {
    if (props.visible) {
        loadFormData()
    }
})

// Lifecycle
onMounted(() => {
    if (doctors.value.length === 0) {
        loadDoctors()
    }
})
</script>

<style scoped>
.service-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.checkbox-label {
    margin: 0;
    cursor: pointer;
    font-weight: 500;
}

.help-text {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

label {
    font-weight: 600;
    color: var(--text-color);
    font-size: 0.9rem;
}

label.required::after {
    content: ' *';
    color: var(--red-500);
}

.doctor-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.doctor-option i {
    color: var(--primary-color);
}

.doctor-option .specialization {
    margin-left: auto;
    color: var(--text-color-secondary);
    font-style: italic;
}

.dialog-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
}

.p-error {
    color: var(--red-500);
    font-size: 0.875rem;
}

.p-invalid {
    border-color: var(--red-500);
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}
</style>
